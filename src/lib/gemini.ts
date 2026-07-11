import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIExtractionResult } from '@/types/database.types';

// ═══════════════════════════════════════════
// SwissQuote AI — Gemini + OpenRouter Cascade
// ═══════════════════════════════════════════

// ─────────────────────────────────────────
// System Prompt (French — strict JSON-only)
// ─────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un moteur d'extraction sémantique spécialisé dans les travaux de plomberie suisse.

TON UNIQUE RÔLE :
- Lire une description de travaux en français
- Identifier les éléments techniques avec précision
- Retourner UNIQUEMENT un JSON structuré

RÈGLES ABSOLUES :
1. Tu ne produis JAMAIS de prix
2. Tu ne produis JAMAIS de références catalogue
3. Tu ne produis JAMAIS d'heures de travail
4. Tu ne produis JAMAIS de TVA, marge ou frais de déplacement
5. Tu ne produis JAMAIS de markdown, explications ou texte hors JSON
6. Si une quantité n'est pas clairement mentionnée, tu retournes null pour quantity
7. Si tu n'es pas certain, tu baisses le score de confiance — tu n'inventes RIEN

FORMAT DE SORTIE — JSON strict :
{
  "intervention_type": "string — ex: remplacement_canalisation, installation_robinetterie, installation_sanitaire, renovation_isolation, mise_en_pression, coupure_eau, installation_nourrice, remplacement_chauffe_eau, remplacement_colonne, depannage_urgent, autre",
  "technical_summary": "string — résumé technique en français, 2-4 phrases max",
  "confidence_global": "number — 0.0 à 1.0",
  "sections": [
    {
      "section_label": "string — ex: Distribution sous-sol",
      "description_verbatim": "string — extrait exact de la description concernée",
      "articles": [
        {
          "label": "string — description sémantique de l'article",
          "material_type": "string — ex: tuyau_inox, coude_sertir, manchon, collier, isolation, transition, reducteur, robinet, raccord, bouchon, mamelon",
          "dimension": "string ou null — ex: Ø 54 mm, DN 40, 1½\"",
          "quantity": "number ou null — null si non précisé",
          "unit": "string ou null — ex: m, p, Fr, u",
          "confidence": "number — 0.0 à 1.0 par article"
        }
      ]
    }
  ],
  "intervention_flags": ["string — points nécessitant attention du technicien"],
  "exclusions_suggested": ["string — éléments probablement hors-devis à signaler"]
}

IMPORTANT: NE JAMAIS ESTIMER DE QUANTITÉS OU DE MESURES. Si une quantité ou une mesure n'est pas explicitement mentionnée dans le texte, tu DOIS retourner "null" pour "quantity" et ajouter une note dans "intervention_flags" pour indiquer qu'une vérification manuelle de la quantité est requise. Une quantité inventée est une erreur grave.

Pour chaque article identifié, inclus TOUS les accessoires nécessaires (raccords, fixations, colliers, isolation) même s'ils ne sont pas explicitement mentionnés dans la description — un plombier les ajouterait systématiquement. S'ils ne sont pas mentionnés avec des quantités, laisse "quantity": null.

Ne retourne rien d'autre que le JSON. Aucun caractère avant ou après.`;

// ─────────────────────────────────────────
// Rate Limiting (simple in-memory for Gemini free tier)
// ─────────────────────────────────────────

const geminiUsage = {
  count: 0,
  resetDate: new Date().toDateString(),
  limit: 1400, // Leave 100 buffer under the 1500 limit
};

function checkGeminiRateLimit(): boolean {
  const today = new Date().toDateString();
  if (geminiUsage.resetDate !== today) {
    geminiUsage.count = 0;
    geminiUsage.resetDate = today;
  }
  return geminiUsage.count < geminiUsage.limit;
}

function incrementGeminiUsage() {
  geminiUsage.count++;
}

// ─────────────────────────────────────────
// Gemini Client
// ─────────────────────────────────────────

async function extractWithGemini(description: string): Promise<AIExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  if (!checkGeminiRateLimit()) {
    throw new Error('GEMINI_RATE_LIMIT_EXCEEDED');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: description }] },
    ],
    systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
  });

  incrementGeminiUsage();

  const text = result.response.text();
  return parseAIResponse(text);
}

// ─────────────────────────────────────────
// OpenRouter Multi-Key Cascade
// Each key is tried in sequence until one succeeds.
// Keys come from comma-separated OPENROUTER_API_KEYS env var,
// or fall back to single OPENROUTER_API_KEY.
// ─────────────────────────────────────────

function getOpenRouterKeys(): string[] {
  // Support multiple keys: OPENROUTER_API_KEYS="key1,key2,key3"
  const multi = process.env.OPENROUTER_API_KEYS;
  if (multi) {
    const keys = multi.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length > 0) return keys;
  }
  // Fallback to single key
  const single = process.env.OPENROUTER_API_KEY;
  if (single) return [single];
  return [];
}

async function extractWithOpenRouterKey(
  description: string,
  apiKey: string
): Promise<AIExtractionResult> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://swissquote-ai.vercel.app',
      'X-Title': 'SwissQuote AI',
    },
    body: JSON.stringify({
      // "openrouter/free" routes to the best available free model
      model: process.env.OPENROUTER_MODEL || 'openrouter/auto',
      models: [
        'google/gemini-2.5-flash',
        'google/gemini-flash-1.5',
        'meta-llama/llama-3.3-70b-instruct:free',
        'mistralai/mistral-7b-instruct:free',
      ],
      route: 'fallback',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description },
      ],
      temperature: 0.1,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error: ${response.status} — ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) throw new Error('OpenRouter returned empty response');
  return parseAIResponse(text);
}

async function extractWithOpenRouter(description: string): Promise<AIExtractionResult> {
  const keys = getOpenRouterKeys();
  if (keys.length === 0) throw new Error('No OpenRouter API keys configured');

  const errors: string[] = [];

  for (let i = 0; i < keys.length; i++) {
    try {
      console.log(`[SwissQuote AI] Trying OpenRouter key ${i + 1}/${keys.length}...`);
      return await extractWithOpenRouterKey(description, keys[i]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Key ${i + 1}: ${msg}`);
      console.warn(`[SwissQuote AI] OpenRouter key ${i + 1} failed: ${msg}`);
    }
  }

  throw new Error(`All OpenRouter keys failed: ${errors.join(' | ')}`);
}

// ─────────────────────────────────────────
// Response Parser
// ─────────────────────────────────────────

function parseAIResponse(text: string): AIExtractionResult {
  // Strip any markdown code fences the model might add
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  // Validate required fields
  if (!parsed.intervention_type || !parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid AI response structure');
  }

  // Normalize confidence values
  if (typeof parsed.confidence_global !== 'number') {
    parsed.confidence_global = 0.5;
  }

  // Ensure all sections have articles array
  for (const section of parsed.sections) {
    if (!Array.isArray(section.articles)) {
      section.articles = [];
    }
    for (const article of section.articles) {
      if (typeof article.confidence !== 'number') {
        article.confidence = 0.5;
      }
    }
  }

  // Ensure flags arrays exist
  if (!Array.isArray(parsed.intervention_flags)) {
    parsed.intervention_flags = [];
  }
  if (!Array.isArray(parsed.exclusions_suggested)) {
    parsed.exclusions_suggested = [];
  }

  return parsed as AIExtractionResult;
}

// ─────────────────────────────────────────
// Main Export: Extract with Cascade
// Order: Gemini → OpenRouter (key 1 → key 2 → key 3)
// ─────────────────────────────────────────

export interface ExtractionResponse {
  extraction: AIExtractionResult;
  provider: 'gemini' | 'openrouter';
  processingTimeMs: number;
}

export async function extractFromDescription(description: string): Promise<ExtractionResponse> {
  const startTime = Date.now();

  // Try Gemini first
  try {
    const extraction = await extractWithGemini(description);
    console.log(`[SwissQuote AI] ✓ Gemini succeeded in ${Date.now() - startTime}ms`);
    return {
      extraction,
      provider: 'gemini',
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[SwissQuote AI] Gemini failed: ${errorMessage}. Cascading to OpenRouter...`);

    // Cascade to OpenRouter (tries all 3 keys)
    try {
      const extraction = await extractWithOpenRouter(description);
      console.log(`[SwissQuote AI] ✓ OpenRouter succeeded in ${Date.now() - startTime}ms`);
      return {
        extraction,
        provider: 'openrouter',
        processingTimeMs: Date.now() - startTime,
      };
    } catch (fallbackError) {
      const fbMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(`All AI providers failed. Gemini: ${errorMessage}. OpenRouter: ${fbMessage}`);
    }
  }
}

export { SYSTEM_PROMPT };
