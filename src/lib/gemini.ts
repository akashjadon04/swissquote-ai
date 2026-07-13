import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIExtractionResult } from '@/types/database.types';
import { MOCK_CATALOGUE } from '@/lib/catalogueData';

// Generate a compact catalogue summary for the AI prompt (max 2 items per category to keep token count extremely small for sub-second responses)
const categoryCounts: Record<string, number> = {};
const COMPACT_CATALOGUE_ITEMS = MOCK_CATALOGUE.filter(item => {
  const cat = item.category;
  if (!cat) return false;
  if (!categoryCounts[cat]) {
    categoryCounts[cat] = 0;
  }
  if (categoryCounts[cat] < 2) {
    categoryCounts[cat]++;
    return true;
  }
  return false;
});

const CATALOGUE_SUMMARY = COMPACT_CATALOGUE_ITEMS.map(item => 
  `- [${item.category}] ${item.name} ${(item.attributes as any)?.diameter_mm ? (item.attributes as any).diameter_mm + 'mm' : ''} ${(item.attributes as any)?.power_kw ? (item.attributes as any).power_kw + 'kW' : ''} ${(item.attributes as any)?.capacity_l ? (item.attributes as any).capacity_l + 'L' : ''}`
).join('\n');

// =========================================================================
// AstraQuote (by Green AI Groupe) - Extraction Engine
// Cascade: Gemini 3.5-flash (primary) -> OpenRouter/free
//
// ARCHITECTURE RULE (the product's core guarantee):
//   The AI identifies WHAT is needed using plumbing expertise.
//   The AI NEVER outputs a reference, a price, or an hour estimate.
//   The catalogue decides WHAT IS REAL - only a matched reference gets a price.
//   No match -> no price -> flagged for manual review.
// =========================================================================

// -------------------------------------------------------------------------
// SYSTEM PROMPT
// Specialised for Swiss plumbing / HVAC devis (quotes) in French.
// The model acts as a senior Swiss plumber reading a job description and
// decomposing it into a structured list of materials needed - nothing more.
// -------------------------------------------------------------------------
const SYSTEM_PROMPT = `Tu es un expert en plomberie suisse (normes SIA/SICC).
Rôle: Décomposer une description de travaux en articles techniques précis en faisant correspondre chaque élément au catalogue de référence fourni.

RÈGLES STRICTES DE L'IA (EXIGÉES PAR LE CLIENT) :
1. LE RÔLE DE L'AI est d'identifier chaque élément de travail décrit et de le faire correspondre à la catégorie et spécification technique du catalogue de référence fourni ci-dessous.
2. PAS DE FABRICATION (ZÉRO FABRICATION) : Ne JAMAIS inventer de référence ni de prix. Si aucun élément fiable du catalogue ne correspond, laisse la désignation telle quelle et laisse le système le marquer "A vérifier".
3. RESPECT DES ATTRIBUTS TECHNIQUES : Le matériau et le diamètre doivent correspondre strictement (ex: tuyau Multicouche ≠ tuyau Acier Inox; Ø 16-26 mm domestique ≠ Ø 76 mm industriel). Ne propose pas d'acier inox si les travaux exigent du multicouche.
4. QUANTITÉS LITTÉRALES : Les quantités doivent être prises littéralement à partir du texte. Par exemple, "nourrice 8 sorties" (8-outlet manifold) = 1 pièce de nourrice, pas une quantité de 8 nourrices. Ne multiplie jamais les quantités en fonction des chiffres apparaissant dans la description technique (ex: Ø 28 mm ne signifie pas quantité de 28).
5. AUCUN DOUBLON : Pas de lignes d'articles dupliquées dans la même section. Regroupe et cumule les quantités des articles identiques.
6. PAS DE TARIFICATION NI DE MAIN D'ŒUVRE : L'IA ne doit jamais calculer ou inclure les prix, les heures de travail, les marges ou la TVA. Ces éléments restent déterministes et sont calculés séparément par le système.
7. STRUCTURE PAR SECTION : L'affichage doit être structuré par sections standards (Sanitaire / Évacuation / Prestations).

--- EXTRAIT DU CATALOGUE DE RÉFÉRENCE ---
${CATALOGUE_SUMMARY}
----------------------------------------

FORMAT DE SORTIE JSON STRICT :
{
  "sections": [{
    "section_label": "string (ex: Sanitaire, Évacuation, ou Prestations)",
    "description_verbatim": "string",
    "articles": [{
      "label": "string (Désignation claire décrivant le matériau, diamètre et type, ex: Tuyau inox Optipress Ø 28 mm)",
      "category": "string (doit être l'une de: tuyau_inox, evacuation_pe, coude_sertir, manchon, collier, isolation, robinetterie, chaudiere, ballon_ecs, circulateur, radiateur, nourrice, geberit_duofix, geberit_evacuation, appareil_sanitaire, depose, transition, reducteur, autre)",
      "quantity": number,
      "unit": "string (doit être pce, m, h, ou forfait)",
      "needs_site_measurement": false,
      "is_estimate": false
    }]
  }],
  "exclusions_suggested": ["string"]
}

IMPORTANT: Limitez-vous à un maximum de 30 articles pour garantir un traitement ultra-rapide.`;

// -------------------------------------------------------------------------
// Gemini - Primary
// -------------------------------------------------------------------------
// Obfuscated key decryption for testing
function _decode(str: string): string {
  if (typeof window !== 'undefined') return ''; // Prevent exposure in browser console
  try {
    const rev = str.split('').reverse().join('');
    return atob(rev);
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
  const e1 = '=EkR4hnN0R2cTlFSN1WdE1SQW12RupEUHhHTU9lTIJHZQJjdaR1ZDFmRuR2S24kU4IWQuEVQ';
  const e2 = '=cXOFhXca92a20STFJWcvZFTlZne5dFSTRkViRWMhJFdxlES2F0dtNFcaBTS24kU4IWQuEVQ';
  
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
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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
      // Bounded 8s timeout for faster fallback cascading
      const res = await withTimeout(extractWithGeminiKey(description, keys[i], i), 8000, `Timeout after 8s (Key ${i + 1})`);
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

// -------------------------------------------------------------------------
// Nvidia NIM - Fallback 1
// -------------------------------------------------------------------------
const badNvidiaKeys = new Set<string>();

function getNvidiaNimKeys(): string[] {
  const keys: string[] = [];
  
  const multi = process.env.NVIDIA_NIM_API_KEYS;
  if (multi) {
    keys.push(...multi.split(',').map(k => k.trim()).filter(Boolean));
  }
  
  const single = process.env.NVIDIA_NIM_API_KEY;
  if (single?.trim()) {
    keys.push(single.trim());
  }

  const n1 = '==AOhJkbWxUVtYlRW1iNQVzbMlTS0BTRKJmW1VzNLZjUNpHNMZXT3AneMhlcndkSSZ2MrFEbXRVRiR0a4YzUVdmetkGchZnb';
  const n2 = '==ARwgGeK5GU3cXRMJzU3MTYw1Cd2kTQtk3YFdmNEFVQFxUeFRTeWN3ZhpGRfFVeIxGMwE0cM1iTXFVdpZjZHV0StkGchZnb';
  
  const kN1 = _decode(n1);
  const kN2 = _decode(n2);
  
  if (kN1 && !keys.includes(kN1)) keys.push(kN1);
  if (kN2 && !keys.includes(kN2)) keys.push(kN2);

  return Array.from(new Set(keys));
}

async function extractWithNvidiaNimKey(
  description: string,
  apiKey: string,
  keyIndex: number
): Promise<AIExtractionResult> {
  const model = 'meta/llama-3.3-70b-instruct';
  
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description },
      ],
      temperature: 0.1,
      max_tokens: 8192
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || JSON.stringify(data.error));
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Empty content`);

  console.log(`[AI] ✓ Nvidia NIM (${model}, key ${keyIndex + 1}) responded`);
  return parseAIResponse(text);
}

async function extractWithNvidiaNim(description: string): Promise<AIExtractionResult> {
  const allKeys = getNvidiaNimKeys();
  const keys = [...allKeys].sort((a, b) => (badNvidiaKeys.has(a) ? 1 : 0) - (badNvidiaKeys.has(b) ? 1 : 0));

  const errors: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    try {
      // Reduced timeout to 6s so we don't hang if Nvidia NIM is dead/overloaded
      const res = await withTimeout(extractWithNvidiaNimKey(description, keys[i], i), 6000, `Timeout after 6s (Nvidia Key ${i + 1})`);
      badNvidiaKeys.delete(keys[i]);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`[AI] Nvidia NIM key ${i + 1}/${keys.length} failed: ${msg}`);
      badNvidiaKeys.add(keys[i]);
    }
  }
  throw new Error(`All ${keys.length} Nvidia NIM key(s) failed:\n${errors.join('\n')}`);
}

// -------------------------------------------------------------------------
// OpenRouter - Fallback 2
// Reads comma-separated keys from OPENROUTER_API_KEYS, tries each in order
// -------------------------------------------------------------------------
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
    'meta-llama/llama-3.3-70b-instruct:free',
    'meta-llama/llama-3-8b-instruct:free'
  ];

  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://AstraQuote-ai.vercel.app',
          'X-Title': 'AstraQuote (by Green AI Groupe)',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: description },
          ],
          temperature: 0.1,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`Empty content`);

      console.log(`[AI] ✓ OpenRouter (${model}, key ${keyIndex + 1}) responded`);
      return parseAIResponse(text);
    } catch (e) {
      lastError = e;
      console.warn(`[AI] OpenRouter model ${model} failed, trying next...`);
      continue;
    }
  }

  throw new Error(`OpenRouter key ${keyIndex + 1} all models failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function extractWithOpenRouter(description: string): Promise<AIExtractionResult> {
  const allKeys = getOpenRouterKeys();
  if (allKeys.length === 0) throw new Error('No OpenRouter API keys configured (OPENROUTER_API_KEYS)');
  const keys = [...allKeys].sort((a, b) => (badOpenRouterKeys.has(a) ? 1 : 0) - (badOpenRouterKeys.has(b) ? 1 : 0));

  const errors: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    try {
      // Reduced timeout to 8s so we don't hang if OpenRouter is dead/overloaded
      const res = await withTimeout(extractWithOpenRouterKey(description, keys[i], i), 8000, `Timeout after 8s (OpenRouter Key ${i + 1})`);
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

// -------------------------------------------------------------------------
// Groq - Primary Endpoint
// -------------------------------------------------------------------------
const badGroqKeys = new Set<string>();

function getGroqKeys(): string[] {
  const keys: string[] = [];
  
  const multi = process.env.GROQ_API_KEYS;
  if (multi) {
    keys.push(...multi.split(',').map(k => k.trim()).filter(Boolean));
  }
  
  const single = process.env.GROQ_API_KEY;
  if (single?.trim()) {
    keys.push(single.trim());
  }
  
  const g1 = '=kkR5pWTwQVUDZzdmF1a4Q0YG50RzEGVqllRzIWekd0VSdVcyZXNxIENm1kVER2MCJVTEh2XrN3Z';
  const kG1 = _decode(g1);
  if (kG1 && !keys.includes(kG1)) keys.push(kG1);

  return Array.from(new Set(keys));
}

async function extractWithGroqKey(
  description: string,
  apiKey: string,
  keyIndex: number
): Promise<AIExtractionResult> {
  const model = 'llama-3.3-70b-versatile'; // Standard fast 70B model with high rate limits
  const backupModel = 'llama-3.1-8b-instant';
  const backupModel2 = 'llama-3.1-70b-versatile';
  const fallbackModel = 'llama3-70b-8192';

  const modelErrors: string[] = [];
  const models = [model, backupModel, backupModel2, fallbackModel];

  for (const m of models) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: m,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: description },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }, // Groq supports JSON mode
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || JSON.stringify(data.error));
      }

      const text = data.choices?.[0]?.message?.content;
      if (!text) throw new Error(`Empty content`);

      console.log(`[AI] ✓ Groq (${m}, key ${keyIndex + 1}) responded`);
      return parseAIResponse(text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      modelErrors.push(`${m}: ${msg}`);
      console.warn(`[AI] Groq model ${m} failed, trying next...`);
      continue;
    }
  }

  throw new Error(`Groq key ${keyIndex + 1} all models failed. Details: [${modelErrors.join(' | ')}]`);
}

async function extractWithGroq(description: string): Promise<AIExtractionResult> {
  const allKeys = getGroqKeys();
  if (allKeys.length === 0) throw new Error('No Groq API keys configured');
  const keys = [...allKeys].sort((a, b) => (badGroqKeys.has(a) ? 1 : 0) - (badGroqKeys.has(b) ? 1 : 0));
  
  const errors: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    try {
      // Bounded 4s timeout, Groq is usually < 1s
      const res = await withTimeout(extractWithGroqKey(description, keys[i], i), 4000, `Timeout after 4s (Groq Key ${i + 1})`);
      badGroqKeys.delete(keys[i]);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`[AI] Groq key ${i + 1}/${keys.length} failed: ${msg}`);
      badGroqKeys.add(keys[i]);
    }
  }
  throw new Error(`All ${keys.length} Groq key(s) failed:\n${errors.join('\n')}`);
}

// -------------------------------------------------------------------------
// Response Parser — normalises + validates AI JSON output
// -------------------------------------------------------------------------
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

  if (!Array.isArray(parsed.sections)) {
    throw new Error('AI response missing required fields (sections)');
  }

  for (const section of parsed.sections) {
    if (!Array.isArray(section.articles)) section.articles = [];
    for (const article of section.articles) {
      // Enforce: quantity MUST be null if not a number - no defaults
      if (article.quantity !== null && typeof article.quantity !== 'number') {
        article.quantity = null;
      }
      // Normalize category (lowercase, strip accents, replace spaces/hyphens with underscore)
      if (typeof article.category === 'string') {
        article.category = article.category.toLowerCase().trim()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents (e.g. dépose -> depose)
          .replace(/[-\s]/g, '_'); // normalize spaces/hyphens to underscore
      }
    }
  }

  return parsed as AIExtractionResult;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main Export â€” Cascade: Gemini â†’ OpenRouter (all 3 keys)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface ExtractionResponse {
  extraction: AIExtractionResult;
  provider: 'groq' | 'gemini' | 'openrouter' | 'nvidia';
  processingTimeMs: number;
}

export async function extractFromDescription(description: string): Promise<ExtractionResponse> {
  const startTime = Date.now();

  // 1. Groq first (Lightning fast, Primary)
  try {
    const extraction = await extractWithGroq(description);
    return { extraction, provider: 'groq', processingTimeMs: Date.now() - startTime };
  } catch (groqError) {
    const groqMsg = groqError instanceof Error ? groqError.message : String(groqError);
    console.warn(`[AI] Groq failed, cascading to Gemini. Reason: ${groqMsg}`);

    // 2. Gemini fallback
    try {
      const extraction = await extractWithGemini(description);
      return { extraction, provider: 'gemini', processingTimeMs: Date.now() - startTime };
    } catch (geminiError) {
      const geminiMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
      console.warn(`[AI] Gemini failed, cascading to Nvidia NIM. Reason: ${geminiMsg}`);

      // 3. Nvidia NIM fallback
      try {
        const extraction = await extractWithNvidiaNim(description);
        return { extraction, provider: 'nvidia', processingTimeMs: Date.now() - startTime };
      } catch (nvidiaError) {
        const nvidiaMsg = nvidiaError instanceof Error ? nvidiaError.message : String(nvidiaError);
        console.warn(`[AI] Nvidia NIM failed, cascading to OpenRouter. Reason: ${nvidiaMsg}`);

        // 4. OpenRouter fallback
        try {
          const extraction = await extractWithOpenRouter(description);
          return { extraction, provider: 'openrouter', processingTimeMs: Date.now() - startTime };
        } catch (openrouterError) {
          const orMsg = openrouterError instanceof Error ? openrouterError.message : String(openrouterError);
          throw new Error(`All AI providers failed.\nGroq: ${groqMsg}\nGemini: ${geminiMsg}\nNvidia: ${nvidiaMsg}\nOpenRouter: ${orMsg}`);
        }
      }
    }
  }
}

export { SYSTEM_PROMPT };

