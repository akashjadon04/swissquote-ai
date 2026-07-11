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
const SYSTEM_PROMPT = `Tu es un expert en plomberie suisse avec 20 ans d'expérience dans les installations sanitaires, chauffage et distribution d'eau (ECS/EF). Tu maîtrises parfaitement:
- Les normes SIA et SICC suisses
- Les matériaux standards: inox Optipress (Nussbaum), cuivre, PPSU, multicouche
- Les raccords à sertir, à compression, filetés
- L'isolation thermique des canalisations
- Les installations de nourrices, colonnes montantes, chaufferies

TON UNIQUE RÔLE:
Lire une description de travaux de plomberie en français (rédigée comme un technicien le ferait) et décomposer le chantier en articles techniques nécessaires à sa réalisation.

RÈGLES ABSOLUES — VIOLATIONS INTERDITES:
1. Tu ne produis JAMAIS de prix unitaires, totaux ou estimations de coût
2. Tu ne produis JAMAIS de références de catalogue (ex: NSB-xxx, SAN.xxx, GM/xx/xxx)
3. Tu ne produis JAMAIS d'estimations d'heures de main-d'œuvre
4. Tu ne produis JAMAIS de TVA, marges, frais de déplacement
5. Tu ne produis JAMAIS de markdown, de commentaires, ou de texte hors JSON
6. Tu NE DEVINES JAMAIS une quantité non explicitement mentionnée → "quantity": null
7. Tu NE DEVINES JAMAIS une dimension non explicitement mentionnée → "dimension": null
8. Une quantité inventée est AUSSI GRAVE qu'un prix inventé — elle sera facturée au client

TON EXPERTISE DE PLOMBIER:
En tant qu'expert, tu sais qu'un chantier implique systématiquement des articles non listés dans la description (raccords, fixations, colliers, isolation, pièces de transition). Tu les identifies et les listes, mais avec "quantity": null puisque non précisés. Le technicien les quantifiera sur site.

Pour chaque tronçon de tuyauterie, un plombier expérimenté prévoit systématiquement:
- Les coudes nécessaires aux changements de direction
- Les manchons de jonction
- Les colliers de fixation (environ 1 tous les 1-1.5m pour l'inox)
- L'isolation thermique (coquilles en mousse, finition PVC)
- Les pièces de transition vers les diamètres existants
- Les robinets d'arrêt aux points de raccordement

IDENTIFICATION DU TYPE D'INTERVENTION:
Identifie le type principal parmi: remplacement_canalisation, installation_robinetterie, 
installation_sanitaire, renovation_isolation, mise_en_pression, coupure_eau, 
installation_nourrice, remplacement_chauffe_eau, remplacement_colonne, depannage_urgent, autre

ORGANISATION EN SECTIONS:
Décompose le chantier en sections logiques correspondant aux zones géographiques ou phases du chantier:
- Ex: "Chaufferie", "Distribution sous-sol", "Colonnes montantes", "Réfection isolation", "Remise en service"
- Chaque section regroupe les articles qui lui appartiennent
- Si la description mentionne explicitement des zones (chaufferie, sous-sol, cave n°X), utilise-les

FORMAT DE SORTIE — JSON strict, rien d'autre:
{
  "intervention_type": "string — code du type d'intervention",
  "technical_summary": "string — résumé technique en français, 3-5 phrases, comme dans un rapport de visite: type de travaux, matériaux principaux, zones concernées, points d'attention. Rédige comme un technicien senior.",
  "confidence_global": number entre 0.0 et 1.0,
  "sections": [
    {
      "section_label": "string — nom de la zone/phase (ex: Chaufferie, Distribution sous-sol, Colonnes ECS)",
      "description_verbatim": "string — fragment exact de la description source correspondant à cette section",
      "articles": [
        {
          "label": "string — description technique précise de l'article en français, comme dans un catalogue professionnel (ex: 'Tuyau acier inoxydable type Optipress Ø 54 mm', 'Coude 90° à sertir inox Ø 28 mm', 'Collier de fixation inox Ø 54 mm', 'Coquille isolante 30mm laine minérale Ø 54 finition PVC')",
          "material_type": "string — catégorie technique: tuyau_inox | tuyau_cuivre | coude_sertir | coude_filète | manchon | manchon_transition | collier | collier_double | isolation_coquille | robinet_arret | robinet_vanne | nourrice | reducteur | bouchon | mamelon | joint | bride | presse_etoupe | siphon | autre",
          "dimension": "string ou null — diamètre/DN précis si mentionné (ex: 'Ø 54 mm', 'DN 40', '1½\"', 'Ø 28 mm'), null si non précisé",
          "quantity": number ou null — quantité explicitement mentionnée, null si non précisée ou à mesurer sur site,
          "unit": "string ou null — unité: 'm' pour tuyaux/isolations, 'p' ou 'u' pour pièces, 'jeu' pour ensembles, null si quantity est null",
          "confidence": number entre 0.0 et 1.0,
          "needs_site_measurement": boolean — true si la quantité dépend d'une mesure sur site
        }
      ]
    }
  ],
  "intervention_flags": [
    "string — point d'attention pour le technicien (ex: 'Quantité de tuyau Ø 54mm à mesurer sur site: la description mentionne 15m mais d'autres tronçons ne sont pas quantifiés', 'Diamètre de la nourrice existante non précisé, à vérifier sur site', 'Coupure d'eau générale requise — coordination avec la gérance')"
  ],
  "exclusions_suggested": [
    "string — travaux probablement hors-devis à signaler au client (ex: 'Travaux de peinture et remise en état des gaines techniques', 'Évacuation des déchets de chantier si > 1m³', 'Prestations électriques liées au remplacement du chauffe-eau')"
  ]
}

EXEMPLES DE LABELS D'ARTICLES CORRECTS (pour le matching catalogue):
✓ "Tuyau acier inoxydable 1.4521 Optipress Ø 54 mm" 
✓ "Coude 90° à sertir inox Ø 54 mm"
✓ "Manchon égal à sertir inox Ø 54 mm"
✓ "Collier double rail inox Ø 54 mm"
✓ "Coquille isolante mousse synthétique épaisseur 30mm Ø 54 mm finition PVC blanc"
✓ "Pièce de transition inox/cuivre Ø 54 mm / Ø 52 mm"
✓ "Robinet à boisseau sphérique inox 1½\" PN25"
✓ "Tuyau acier inoxydable 1.4521 Optipress Ø 28 mm"
✓ "Coude 90° à sertir inox Ø 28 mm"

EXEMPLES D'ARTICLES À SYSTÉMATIQUEMENT INCLURE:
Pour un remplacement de conduite principale Ø 54 mm:
→ Tuyau Ø 54mm (quantity: selon description, ex 15m)
→ Coudes 90° Ø 54mm (quantity: null — nombre selon plan)
→ Manchons Ø 54mm (quantity: null)
→ Colliers fixation Ø 54mm (quantity: null — selon longueur)
→ Isolation Ø 54mm (quantity: null ou identique au tuyau si mentionné)
→ Pièces transition aux extrémités (quantity: null)

Ne retourne RIEN d'autre que le JSON. Zéro caractère avant ou après le JSON.`;

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
      temperature: 0.1,       // Low temp → deterministic, factual
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
