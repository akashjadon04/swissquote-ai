import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIExtractionResult } from '@/types/database.types';

// ═══════════════════════════════════════════════════════════════════════════
// SwissQuote AI — Extraction Engine
// Cascade: Gemini 3.5-flash (primary) → OpenRouter/free (key 1 → 2 → 3)
//
// ARCHITECTURE RULE (the product's core guarantee):
//   The AI identifies WHAT is needed using plumbing expertise.
//   The AI NEVER outputs a reference, a price, or an hour estimate.
//   The catalogue decides WHAT IS REAL — only a matched reference gets a price.
//   No match → no price → flagged for manual review.
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// Specialised for Swiss plumbing / HVAC devis (quotes) in French.
// The model acts as a senior Swiss plumber reading a job description and
// decomposing it into a structured list of materials needed — nothing more.
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un expert en plomberie suisse (normes SIA/SICC).
Rôle: Décomposer une description de travaux en articles techniques.

RÈGLES ABSOLUES:
1. JAMAIS de prix, de références catalogue, d'heures ou TVA.
2. JAMAIS de quantité non mentionnée (utiliser null).
3. Format JSON STRICT. Aucun texte avant/après.

FORMAT DE SORTIE JSON:
{
  "intervention_type": "string",
  "technical_summary": "string (3 phrases max)",
  "confidence_global": 0.0 - 1.0,
  "sections": [{
    "section_label": "string",
    "description_verbatim": "string",
    "articles": [{
      "label": "string (ex: Tuyau inox Optipress Ø 54 mm, Coude 90° sertir inox Ø 54 mm)",
      "material_type": "string",
      "dimension": "string ou null",
      "quantity": number ou null,
      "unit": "string ou null",
      "confidence": 0.0 - 1.0,
      "needs_site_measurement": boolean
    }]
  }],
  "intervention_flags": ["string"],
  "exclusions_suggested": ["string"]
}

Important: Inclus toujours raccords, colliers et isolations associés aux tuyaux avec quantity: null si non quantifiés.`;

// ─────────────────────────────────────────────────────────────────────────────
// Gemini — Primary (gemini-3.5-flash)
// ─────────────────────────────────────────────────────────────────────────────
async function extractWithGemini(description: string): Promise<AIExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set in environment');

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,       // Low temp -> deterministic, factual
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: description }] }],
    systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
  });

  const text = result.response.text();
  console.log(`[AI] ✓ Gemini (${modelName}) responded`);
  return parseAIResponse(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter — Fallback (openrouter/free)
// Reads comma-separated keys from OPENROUTER_API_KEYS, tries each in order
// ─────────────────────────────────────────────────────────────────────────────
function getOpenRouterKeys(): string[] {
  const multi = process.env.OPENROUTER_API_KEYS;
  if (multi) {
    const keys = multi.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length > 0) return keys;
  }
  const single = process.env.OPENROUTER_API_KEY;
  if (single?.trim()) return [single.trim()];
  return [];
}

async function extractWithOpenRouterKey(
  description: string,
  apiKey: string,
  keyIndex: number
): Promise<AIExtractionResult> {
  // openrouter/free: official OpenRouter router → auto-selects best available FREE model
  // This is NOT openrouter/auto (which is paid)
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
      max_tokens: 2048,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`OpenRouter key ${keyIndex + 1} HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`OpenRouter key ${keyIndex + 1} API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`OpenRouter key ${keyIndex + 1} returned empty content`);

  console.log(`[AI] ✓ OpenRouter (${model}, key ${keyIndex + 1}) responded`);
  return parseAIResponse(text);
}

async function extractWithOpenRouter(description: string): Promise<AIExtractionResult> {
  const keys = getOpenRouterKeys();
  if (keys.length === 0) throw new Error('No OpenRouter API keys configured (OPENROUTER_API_KEYS)');

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
  throw new Error(`All ${keys.length} OpenRouter key(s) failed:\n${errors.join('\n')}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Parser — normalises + validates AI JSON output
// ─────────────────────────────────────────────────────────────────────────────
function parseAIResponse(text: string): AIExtractionResult {
  let cleaned = text.trim();
  // Strip markdown code fences if model adds them despite instructions
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned non-JSON response: ${cleaned.slice(0, 200)}`);
  }

  if (!parsed.intervention_type || !Array.isArray(parsed.sections)) {
    throw new Error('AI response missing required fields (intervention_type, sections)');
  }

  // Normalise
  if (typeof parsed.confidence_global !== 'number') parsed.confidence_global = 0.5;
  if (!Array.isArray(parsed.intervention_flags)) parsed.intervention_flags = [];
  if (!Array.isArray(parsed.exclusions_suggested)) parsed.exclusions_suggested = [];

  for (const section of parsed.sections) {
    if (!Array.isArray(section.articles)) section.articles = [];
    for (const article of section.articles) {
      if (typeof article.confidence !== 'number') article.confidence = 0.5;
      // Enforce: quantity MUST be null if not a number — no defaults
      if (article.quantity !== null && typeof article.quantity !== 'number') {
        article.quantity = null;
      }
    }
  }

  return parsed as AIExtractionResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export — Cascade: Gemini → OpenRouter (all 3 keys)
// ─────────────────────────────────────────────────────────────────────────────
export interface ExtractionResponse {
  extraction: AIExtractionResult;
  provider: 'gemini' | 'openrouter';
  processingTimeMs: number;
}

export async function extractFromDescription(description: string): Promise<ExtractionResponse> {
  const startTime = Date.now();

  // 1. Gemini first (fastest, highest quality for French plumbing context)
  try {
    const extraction = await extractWithGemini(description);
    return { extraction, provider: 'gemini', processingTimeMs: Date.now() - startTime };
  } catch (geminiError) {
    const geminiMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
    console.warn(`[AI] Gemini failed → cascading to OpenRouter. Reason: ${geminiMsg}`);

    // 2. OpenRouter fallback (rotates through all 3 keys)
    try {
      const extraction = await extractWithOpenRouter(description);
      return { extraction, provider: 'openrouter', processingTimeMs: Date.now() - startTime };
    } catch (openrouterError) {
      const orMsg = openrouterError instanceof Error ? openrouterError.message : String(openrouterError);
      throw new Error(`All AI providers failed.\nGemini: ${geminiMsg}\nOpenRouter: ${orMsg}`);
    }
  }
}

export { SYSTEM_PROMPT };
