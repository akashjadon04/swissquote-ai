import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIExtractionResult } from '@/types/database.types';

// ═══════════════════════════════════════════
// SwissQuote AI — AI Extraction Engine
// Cascade: Gemini 3.5-flash → OpenRouter/free (key 1 → 2 → 3)
// ═══════════════════════════════════════════

// ─────────────────────────────────────────
// System Prompt — strict JSON extraction only
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

RÈGLE CRITIQUE : NE JAMAIS ESTIMER DE QUANTITÉS. Si non précisé → "quantity": null et ajouter un flag de vérification manuelle.
Pour chaque article, inclure les accessoires nécessaires (raccords, colliers, isolation) avec "quantity": null si non mentionnés.
Ne retourne rien d'autre que le JSON. Aucun caractère avant ou après.`;

// ─────────────────────────────────────────
// Gemini — Primary provider
// Model: gemini-3.5-flash (from GEMINI_MODEL env, default: gemini-3.5-flash)
// ─────────────────────────────────────────

async function extractWithGemini(description: string): Promise<AIExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: description }] }],
    systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
  });

  const text = result.response.text();
  console.log(`[AI] Gemini (${modelName}) responded`);
  return parseAIResponse(text);
}

// ─────────────────────────────────────────
// OpenRouter — Fallback provider
// Model: openrouter/free (auto-selects best available free model)
// Keys: OPENROUTER_API_KEYS (comma-separated), tried in order
// ─────────────────────────────────────────

function getOpenRouterKeys(): string[] {
  // Primary: comma-separated multi-key list
  const multi = process.env.OPENROUTER_API_KEYS;
  if (multi) {
    const keys = multi.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length > 0) return keys;
  }
  // Fallback: single key
  const single = process.env.OPENROUTER_API_KEY;
  if (single?.trim()) return [single.trim()];
  return [];
}

async function extractWithOpenRouterKey(
  description: string,
  apiKey: string,
  keyIndex: number
): Promise<AIExtractionResult> {
  // openrouter/free: official OpenRouter router that picks the best free model automatically
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://swissquote-ai.vercel.app',
      'X-Title': 'SwissQuote AI',
    },
    body: JSON.stringify({
      model,
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
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`OpenRouter key ${keyIndex + 1} HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // Handle OpenRouter error response (200 with error body)
  if (data.error) {
    throw new Error(`OpenRouter key ${keyIndex + 1} error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`OpenRouter key ${keyIndex + 1} returned empty content`);

  console.log(`[AI] OpenRouter (${model}, key ${keyIndex + 1}) responded`);
  return parseAIResponse(text);
}

async function extractWithOpenRouter(description: string): Promise<AIExtractionResult> {
  const keys = getOpenRouterKeys();
  if (keys.length === 0) throw new Error('No OpenRouter API keys configured (set OPENROUTER_API_KEYS)');

  const errors: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    try {
      return await extractWithOpenRouterKey(description, keys[i], i);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`[AI] OpenRouter key ${i + 1}/${keys.length} failed: ${msg}`);
    }
  }

  throw new Error(`All ${keys.length} OpenRouter key(s) failed: ${errors.join(' | ')}`);
}

// ─────────────────────────────────────────
// Response Parser
// ─────────────────────────────────────────

function parseAIResponse(text: string): AIExtractionResult {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed.intervention_type || !parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('AI response missing required fields (intervention_type, sections)');
  }

  if (typeof parsed.confidence_global !== 'number') parsed.confidence_global = 0.5;

  for (const section of parsed.sections) {
    if (!Array.isArray(section.articles)) section.articles = [];
    for (const article of section.articles) {
      if (typeof article.confidence !== 'number') article.confidence = 0.5;
    }
  }

  if (!Array.isArray(parsed.intervention_flags)) parsed.intervention_flags = [];
  if (!Array.isArray(parsed.exclusions_suggested)) parsed.exclusions_suggested = [];

  return parsed as AIExtractionResult;
}

// ─────────────────────────────────────────
// Main Export — Cascade: Gemini → OpenRouter
// ─────────────────────────────────────────

export interface ExtractionResponse {
  extraction: AIExtractionResult;
  provider: 'gemini' | 'openrouter';
  processingTimeMs: number;
}

export async function extractFromDescription(description: string): Promise<ExtractionResponse> {
  const startTime = Date.now();

  // 1. Try Gemini first
  try {
    const extraction = await extractWithGemini(description);
    return { extraction, provider: 'gemini', processingTimeMs: Date.now() - startTime };
  } catch (geminiError) {
    const geminiMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
    console.warn(`[AI] Gemini failed (${geminiMsg}), cascading to OpenRouter...`);

    // 2. Cascade to OpenRouter (rotates through all 3 keys)
    try {
      const extraction = await extractWithOpenRouter(description);
      return { extraction, provider: 'openrouter', processingTimeMs: Date.now() - startTime };
    } catch (openrouterError) {
      const openrouterMsg = openrouterError instanceof Error ? openrouterError.message : String(openrouterError);
      throw new Error(`All AI providers failed.\nGemini: ${geminiMsg}\nOpenRouter: ${openrouterMsg}`);
    }
  }
}

export { SYSTEM_PROMPT };
