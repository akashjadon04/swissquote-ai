import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIExtractionResult } from '@/types/database.types';
import { MOCK_CATALOGUE } from '@/lib/catalogueData';

// Generate a compact catalogue summary for the AI prompt
const CATALOGUE_SUMMARY = MOCK_CATALOGUE.map(item => `- [${item.category}] ${item.name} ${(item.attributes as any)?.diameter_mm ? (item.attributes as any).diameter_mm + 'mm' : ''} ${(item.attributes as any)?.power_kw ? (item.attributes as any).power_kw + 'kW' : ''} ${(item.attributes as any)?.capacity_l ? (item.attributes as any).capacity_l + 'L' : ''}`).join('\n');

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AstraQuote (by Green AI Groupe) â€” Extraction Engine
// Cascade: Gemini 3.5-flash (primary) â†’ OpenRouter/free (key 1 â†’ 2 â†’ 3)
//
// ARCHITECTURE RULE (the product's core guarantee):
//   The AI identifies WHAT is needed using plumbing expertise.
//   The AI NEVER outputs a reference, a price, or an hour estimate.
//   The catalogue decides WHAT IS REAL â€” only a matched reference gets a price.
//   No match â†’ no price â†’ flagged for manual review.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SYSTEM PROMPT
// Specialised for Swiss plumbing / HVAC devis (quotes) in French.
// The model acts as a senior Swiss plumber reading a job description and
// decomposing it into a structured list of materials needed â€” nothing more.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SYSTEM_PROMPT = `Tu es un expert en plomberie suisse (normes SIA/SICC).
Rôle: Décomposer une description de travaux en articles techniques précis.

RÈGLES ABSOLUES (CRITIQUE POUR LA VÉRIFICATION DU MODÈLE) :
1. HONNÊTETÉ ABSOLUE: NE JAMAIS inventer ou halluciner des quantités, des puissances, des diamètres, ou des prix qui ne sont pas explicitement mentionnés dans la description ou logiquement déductibles. Si une quantité est manquante (par exemple, "des radiateurs" sans nombre), laissez la quantité à null. Ne mettez PAS "1" par défaut.
2. UNITÉS STANDARD SEULEMENT: L'unité DOIT être l'une des suivantes : "pce", "m", "h", "forfait". NE JAMAIS utiliser d'unités sous forme de texte libre ou de phrases.
3. JAMAIS de références catalogue, d'heures ou TVA.
4. Format JSON STRICT. Aucun texte avant/après.
5. category DOIT être l'une de: tuyau_inox, evacuation_pe, coude_sertir, manchon, collier, isolation, robinetterie, chaudiere, ballon_ecs, circulateur, radiateur, nourrice, geberit_duofix, geberit_evacuation, appareil_sanitaire, depose, transition, reducteur, autre.
6. CATALOGUE OBLIGATOIRE: Tu DOIS prioriser les matériaux listés dans le CATALOGUE DISPONIBLE ci-dessous. Adapte les noms et dimensions pour qu'ils correspondent exactement à ce qui existe dans ce catalogue. Si un article demandé n'existe pas du tout dans ce catalogue, ajoute-le quand même, mais essaie toujours de trouver l'équivalent dans le catalogue d'abord.

--- CATALOGUE DISPONIBLE ---
${CATALOGUE_SUMMARY}
----------------------------

FORMAT DE SORTIE JSON:
{
  "intervention_type": "string",
  "technical_summary": "string (3 phrases max)",
  "confidence_global": 0.0 - 1.0,
  "labour_complexity": "standard" | "complexe" | "tres_complexe",
  "sections": [{
    "section_label": "string",
    "description_verbatim": "string",
    "articles": [{
      "label": "string (ex: Chaudière condensation gaz 24 kW, Bâti-support Geberit Duofix WC suspendu h=112cm, Tuyau inox Optipress Ø 28 mm)",
      "material_type": "string",
      "category": "string (utiliser les catégories listées ci-dessus)",
      "dimension": "string ou null",
      "quantity": number ou null,
      "unit": "string ou null (doit être pce, m, h, ou forfait)",
      "confidence": 0.0 - 1.0,
      "needs_site_measurement": boolean,
      "is_estimate": boolean,
      "attributes": {
        "diameter_mm": "number ou null (ex: extraire 28 de 'Ø 28')",
        "capacity_l": "number ou null (ex: extraire 200 de '200 L')",
        "power_kw": "number ou null (ex: extraire 24 de '24 kW')",
        "material": "string ou null",
        "dn": "number ou null"
      }
    }]
  }],
  "intervention_flags": ["string"],
  "exclusions_suggested": ["string"]
}

RÈGLE labour_complexity:
- "standard": appartement vide, accès facile, 1 niveau
- "complexe": immeuble occupé OU escalier étroit OU 2-3 niveaux OU cave difficile
- "tres_complexe": chantier très difficile (4+ niveaux, sans ascenseur, immeuble occupé ET étroit)

IMPORTANT: Inclure toujours raccords, colliers et isolations associés aux tuyaux.
Ajoutez des services logiques si sous-entendus (ex: 'Démontage' ou 'Pose' ou 'Test') depuis le catalogue interne.
Si la quantité n'est pas explicite (surtout pour les services, les raccords, ou longueurs de tuyau), vous POUVEZ l'estimer logiquement (ex: 2h de pose, 1 démontage) MAIS mettez IMPÉRATIVEMENT "is_estimate": true pour qu'un humain la valide. 
ATTENTION: Ne pas inventer de quantité pour des équipements physiques majeurs (radiateurs, chaudières additionnelles) sans mettre "is_estimate": true. Si vous savez qu'il y a plusieurs radiateurs mais ne connaissez pas le nombre exact, mettez "quantity": null et "needs_site_measurement": true.
Si une information vitale manque (ex: puissance en kW pour une chaudière, diamètre pour un tuyau), mettre needs_site_measurement à true.
ATTENTION EXHAUSTIVITE: Fournissez une liste pertinente, détaillée et réaliste des pièces et services principaux. Limitez-vous à un maximum de 30 articles pour garantir un temps de réponse rapide.`;

// ─────────────────────────────────────────────────────────────────────────────
// Gemini â€” Primary (gemini-1.5-flash)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Obfuscated key decryption
function _decode(str: string): string {
  if (typeof window !== 'undefined') return ''; // Prevent exposure in browser console
  try {
    const rev = str.split('').reverse().join('');
    return Buffer.from(rev, 'base64').toString('ascii');
  } catch (e) {
    return '';
  }
}

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  
  const multi = process.env.GEMINI_API_KEYS;
  if (multi) {
    keys.push(...multi.split(',').map(k => k.trim()).filter(Boolean));
  }
  
  const single = process.env.GEMINI_API_KEY;
  if (single?.trim()) {
    keys.push(single.trim());
  }
  
  // Encrypted fallbacks (Base64 + reversed)
  const e1 = '=EUThhXbjVDarJzYMR2TVRkei5Wd3hlbxQESZ5UOwcFMrpkdNhDRzdFWIt0S24kU4IWQuEVQ';
  const e2 = 'uE1QRhHdhdHO1hDWmdDeJpmeJd0Zh9FOQFkSHR2NXRFWfJFZyR3MiNTMnpXS24kU4IWQuEVQ';
  
  const k1 = _decode(e1); 
  const k2 = _decode(e2);
  if (k1 && !keys.includes(k1)) keys.push(k1);
  if (k2 && !keys.includes(k2)) keys.push(k2);

  return Array.from(new Set(keys));
}


function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage = "Timeout"): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    promise
      .then(value => { clearTimeout(timer); resolve(value); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

// Circuit breakers to remember failing keys and push them to the back of the queue
const badGeminiKeys = new Set<string>();
const badOpenRouterKeys = new Set<string>();

async function extractWithGeminiKey(description: string, apiKey: string, keyIndex: number): Promise<AIExtractionResult> {
  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1,       // Low temp -> deterministic, factual
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
  console.log(`[AI] ✓ Gemini (${modelName}, key ${keyIndex + 1}) responded`);
  return parseAIResponse(text);
}

async function extractWithGemini(description: string): Promise<AIExtractionResult> {
  const allKeys = getGeminiKeys();
  const keys = [...allKeys].sort((a, b) => (badGeminiKeys.has(a) ? 1 : 0) - (badGeminiKeys.has(b) ? 1 : 0));
  const errors: string[] = [];
  
  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await withTimeout(extractWithGeminiKey(description, keys[i], i), 25000, `Timeout after 25s (Key ${i + 1})`);
      badGeminiKeys.delete(keys[i]);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Key ${i + 1}: ${msg}`);
      console.warn(`[AI] Gemini key ${i + 1}/${keys.length} failed: ${msg}`);
      badGeminiKeys.add(keys[i]);
    }
  }
  throw new Error(`All ${keys.length} Gemini key(s) failed:\n${errors.join('\n')}`);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// OpenRouter â€” Fallback (openrouter/free)
// Reads comma-separated keys from OPENROUTER_API_KEYS, tries each in order
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getOpenRouterKeys(): string[] {
  const keys: string[] = [];
  
  const multi = process.env.OPENROUTER_API_KEYS;
  if (multi) {
    keys.push(...multi.split(',').map(k => k.trim()).filter(Boolean));
  }
  
  const single = process.env.OPENROUTER_API_KEY;
  if (single?.trim()) {
    keys.push(single.trim());
  }

  // Encrypted fallbacks
  const o1 = '==wM2IjM1IjYmJTN1EmY1YzM0UmYiZWYlJWNlVGN4EjZjlDZ0czMjFGOmdTZwkTN2QzYwMWZxcjNxUmMhNzMiZzMtEjdtI3bts2c';
  const o2 = '==gZmVGM0I2NwYWYlNmMjlTM4UTY0YjM5QmNzMWY0kDOmRWNkJjNlRzYiZWO1UTOlZTN2Y2M0gDOjZTYmZGNykDOtEjdtI3bts2c';
  const o3 = '==wMyYmZxYmZjdDNxU2MwEWMlZDO2IWNmhzNlZTMjZDN5YmZhBzN2kjYxQGNiJmNhJzM4EjMzIzN2U2M5QmN1ATYtEjdtI3bts2c';

  const decO1 = _decode(o1);
  const decO2 = _decode(o2);
  const decO3 = _decode(o3);
  
  if (decO1 && !keys.includes(decO1)) keys.push(decO1);
  if (decO2 && !keys.includes(decO2)) keys.push(decO2);
  if (decO3 && !keys.includes(decO3)) keys.push(decO3);

  return Array.from(new Set(keys));
}

async function extractWithOpenRouterKey(
  description: string,
  apiKey: string,
  keyIndex: number
): Promise<AIExtractionResult> {
  const models = [
    'openrouter/free',
    'google/gemma-4-31b-it:free',
    'liquid/lfm-2.5-1.2b-instruct:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://AstraQuote-ai.vercel.app',
      'X-Title': 'AstraQuote (by Green AI Groupe)',
    },
    body: JSON.stringify({
      models,
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
  if (data.error) {
    throw new Error(`OpenRouter key ${keyIndex + 1} API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`OpenRouter key ${keyIndex + 1} returned empty content`);

  console.log(`[AI] ✓ OpenRouter (${models[0]} fallback array, key ${keyIndex + 1}) responded`);
  return parseAIResponse(text);
}

async function extractWithOpenRouter(description: string): Promise<AIExtractionResult> {
  const allKeys = getOpenRouterKeys();
  if (allKeys.length === 0) throw new Error('No OpenRouter API keys configured (OPENROUTER_API_KEYS)');
  const keys = [...allKeys].sort((a, b) => (badOpenRouterKeys.has(a) ? 1 : 0) - (badOpenRouterKeys.has(b) ? 1 : 0));

  const errors: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await withTimeout(extractWithOpenRouterKey(description, keys[i], i), 15000, `Timeout after 15s (OpenRouter Key ${i + 1})`);
      badOpenRouterKeys.delete(keys[i]);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`[AI] OpenRouter key ${i + 1}/${keys.length} failed: ${msg}`);
      badOpenRouterKeys.add(keys[i]);
    }
  }
  throw new Error(`All ${keys.length} OpenRouter key(s) failed:\n${errors.join('\n')}`);
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Response Parser â€” normalises + validates AI JSON output
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      // Enforce: quantity MUST be null if not a number â€” no defaults
      if (article.quantity !== null && typeof article.quantity !== 'number') {
        article.quantity = null;
      }
      
      // Normalize attributes
      if (!article.attributes) {
        article.attributes = {};
      }
      const attrs = article.attributes;
      if (attrs.diameter_mm !== undefined && typeof attrs.diameter_mm !== 'number') attrs.diameter_mm = null;
      if (attrs.capacity_l !== undefined && typeof attrs.capacity_l !== 'number') attrs.capacity_l = null;
      if (attrs.power_kw !== undefined && typeof attrs.power_kw !== 'number') attrs.power_kw = null;
      if (attrs.dn !== undefined && typeof attrs.dn !== 'number') attrs.dn = null;
    }
  }

  return parsed as AIExtractionResult;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main Export â€” Cascade: Gemini â†’ OpenRouter (all 3 keys)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface ExtractionResponse {
  extraction: AIExtractionResult;
  provider: 'gemini' | 'openrouter';
  processingTimeMs: number;
}

export async function extractFromDescription(description: string): Promise<ExtractionResponse> {
  const startTime = Date.now();

  // 1. Gemini first (fastest, highest quality for French plumbing context)
  // 1. OpenRouter first (faster, free model)
  try {
    const extraction = await extractWithOpenRouter(description);
    return { extraction, provider: 'openrouter', processingTimeMs: Date.now() - startTime };
  } catch (openrouterError) {
    const orMsg = openrouterError instanceof Error ? openrouterError.message : String(openrouterError);
    console.warn(`[AI] OpenRouter failed, cascading to Gemini. Reason: ${orMsg}`);

    // 2. Gemini fallback
    try {
      const extraction = await extractWithGemini(description);
      return { extraction, provider: 'gemini', processingTimeMs: Date.now() - startTime };
    } catch (geminiError) {
      const geminiMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
      throw new Error(`All AI providers failed.\nOpenRouter: ${orMsg}\nGemini: ${geminiMsg}`);
    }
  }
}

export { SYSTEM_PROMPT };

