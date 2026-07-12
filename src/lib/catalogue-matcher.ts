import type { AIArticle, CatalogueArticle, MatchedArticle, MissingArticle, MatchResult, SupplierCode } from "@/types/database.types";

// Category aliases — comprehensive coverage for all product types
const CATEGORY_ALIASES: Record<string, string[]> = {
  tuyau_inox:    ["tuyau", "tube", "conduite", "inox", "optipress", "pressfitting", "acier inox"],
  evacuation_pe: ["evacuation", "evac", "eaux usees", "eaux vannes", "drainage", "silent", "chute", "descente", "eu", "ev"],
  coude_sertir:  ["coude", "courbe", "90", "45", "87"],
  manchon:       ["manchon", "raccord", "jonction", "te", "tee", "reduction", "reducteur de diametre"],
  collier:       ["collier", "bride", "fixation", "support"],
  isolation:     ["isolation", "coquille", "isolant", "mousse"],
  transition:    ["transition", "adaptation", "adaptateur", "piece de transition"],
  reducteur:     ["reducteur", "detendeur", "pression", "limiteur"],
  robinetterie:  ["robinet", "vanne", "arret", "bille", "mitigeur", "melangeur", "clapet", "antiretour", "thermostatique", "retour"],
  chaudiere:     ["chaudiere", "boiler", "generateur", "condensation", "vaillant", "viessmann", "buderus", "chauffage"],
  ballon_ecs:    ["ballon", "cumulus", "chauffe-eau", "ecs", "eau chaude sanitaire", "accumulateur"],
  circulateur:   ["circulateur", "pompe", "grundfos", "wilo", "circulation"],
  radiateur:     ["radiateur", "panneau", "corps de chauffe", "chauffage", "type 11", "type 21", "type 22", "type 33"],
  nourrice:      ["nourrice", "collecteur", "distribution", "depart"],
  geberit_duofix:["duofix", "bati-support", "wc suspendu", "toilette suspendue", "geberit", "cadre", "sigma", "up320", "reservoir encastre", "plaque de commande"],
  geberit_evacuation: ["siphon", "bonde", "siphon de sol"],
  appareil_sanitaire: ["lavabo", "evier", "baignoire", "douche", "wc", "toilette", "urinoir", "vasque", "bac a douche"],
  depose:        ["depose", "demontage", "demonter", "enlevement", "retrait"],
  bouchon:       ["bouchon", "obturateur"],
  mamelon:       ["mamelon", "double mamelon"],
  autre:         [],
};

const TECHNICAL_TERMS = new Set([
  "inox", "acier", "cuivre", "pvc", "press", "sertir", "filet",
  "male", "femelle", "coude", "manchon", "tuyau", "tube", "collier",
  "isolation", "reducteur", "robinet", "transition", "bouchon",
  "raccord", "bride", "optipress", "pressfitting", "caoutchouc",
  "90", "45", "87", "compression", "jonction", "vanne", "bille",
  "mitigeur", "condensation", "ballon", "chaudiere", "radiateur",
  "circulateur", "geberit", "duofix", "evacuation", "silent",
  "suspendu", "panneau", "grundfos", "wilo", "sigma",
]);

function normalizeText(s: string): string[] {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1);
}

export function normalizeDimension(dim: string | null | undefined): string {
  if (!dim) return "";
  let n = dim.toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/o|ø/gi, "")
    .replace(/dn/gi, "")
    .replace(/mm/gi, "")
    .replace(/\s+/g, "")
    .trim();
  const m = n.match(/(\d+(?:[.,]\d+)?)/);
  if (m) n = m[1].replace(",", ".");
  return n;
}

function extractDiameterMm(dim: string | null | undefined): number | null {
  if (!dim) return null;
  const n = normalizeDimension(dim);
  if (dim.includes("\"") || dim.includes("'")) {
    if (dim.includes("1/2")) return dim.includes("1") ? 40 : 15;
    if (dim.includes("3/4")) return 20;
    if (dim.includes("2\"")) return 50;
    if (dim.includes("1\"")) return 25;
  }
  const v = parseFloat(n);
  return isNaN(v) ? null : v;
}

function extractKw(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*k[ww]/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

function extractLitres(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(?:l|litres?|liters?)/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

function resolveCategory(text: string | null | undefined): string | null {
  if (!text) return null;
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [cat, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (norm.includes(cat.replace(/_/g, " "))) return cat;
    for (const alias of aliases) {
      if (norm.includes(alias)) return cat;
    }
  }
  return null;
}

function categoryMatch(aiLabel: string | null, aiMat: string | null, catCat: string | null): boolean {
  if (!catCat) return false;
  const combined = [aiLabel, aiMat].filter(Boolean).join(" ");
  const resolved = resolveCategory(combined);
  if (!resolved) return false;
  if (resolved === catCat) return true;
  // Also allow same parent family
  const resolved2 = resolveCategory(catCat.replace(/_/g, " "));
  return resolved === resolved2;
}

function descScore(catDesc: string | null | undefined, aiLabel: string | null | undefined): number {
  if (!catDesc || !aiLabel) return 0;
  const catWords = new Set(normalizeText(catDesc));
  const aiWords = normalizeText(aiLabel);
  if (!aiWords.length) return 0;
  let score = 0, total = 0;
  for (const w of aiWords) {
    const weight = TECHNICAL_TERMS.has(w) ? 3 : 1;
    total += weight;
    if (catWords.has(w)) score += weight;
  }
  return total > 0 ? score / total : 0;
}

function attrScore(aiArticle: AIArticle, catArticle: CatalogueArticle): { score: number; hardBlock: boolean } {
  const aiAttrs = aiArticle.attributes || {};
  const catAttrs = catArticle.attributes || {};
  const aiText = [aiArticle.label, aiArticle.dimension, aiArticle.material_type].filter(Boolean).join(" ");
  const catSpec = catArticle.specification;

  // power_kw
  const aiKw = aiAttrs.power_kw ?? extractKw(aiText);
  const catKw = catAttrs.power_kw ?? extractKw(catSpec);
  if (aiKw !== null && catKw !== null) {
    if (Math.abs(aiKw - catKw) <= 2) return { score: 1.0, hardBlock: false };
    if (Math.abs(aiKw - catKw) <= 5) return { score: 0.5, hardBlock: false };
    return { score: 0, hardBlock: true }; // wrong kW
  }

  // capacity_l
  const aiL = aiAttrs.capacity_l ?? extractLitres(aiText);
  const catL = catAttrs.capacity_l ?? extractLitres(catSpec);
  if (aiL !== null && catL !== null) {
    if (Math.abs(aiL - catL) <= 20) return { score: 1.0, hardBlock: false };
    if (Math.abs(aiL - catL) <= 50) return { score: 0.5, hardBlock: false };
    return { score: 0, hardBlock: true };
  }

  // diameter_mm
  const aiD = aiAttrs.diameter_mm ?? extractDiameterMm(aiArticle.dimension) ?? extractDiameterMm(aiText);
  const catD = catAttrs.diameter_mm ?? extractDiameterMm(catSpec);
  if (aiD !== null && catD !== null) {
    if (Math.abs(aiD - catD) < 2) return { score: 1.0, hardBlock: false };
    if (Math.abs(aiD - catD) < 5) return { score: 0.3, hardBlock: false };
    return { score: 0, hardBlock: true };
  }
  
  // dn
  const aiDn = aiAttrs.dn;
  const catDn = catAttrs.dn;
  if (aiDn !== null && aiDn !== undefined && catDn !== null && catDn !== undefined) {
    if (Math.abs(aiDn - catDn) < 2) return { score: 1.0, hardBlock: false };
    return { score: 0, hardBlock: true };
  }

  return { score: 0.5, hardBlock: false };
}

function scoreCandidates(aiArticle: AIArticle, candidates: CatalogueArticle[]): { article: CatalogueArticle; score: number }[] {
  return candidates
    .map(article => {
      const attr = attrScore(aiArticle, article);
      if (attr.hardBlock) return { article, score: -1 };

      const desc = descScore(article.description, aiArticle.label);
      const cat = categoryMatch(aiArticle.label, aiArticle.material_type, article.category) ? 0.3 : 0;
      return { article, score: desc * 0.5 + cat + attr.score * 0.2 };
    })
    .filter(s => s.score >= 0)
    .sort((a, b) => b.score - a.score);
}

export function matchArticles(
  aiArticles: AIArticle[],
  catalogue: CatalogueArticle[],
  preferredSupplier?: SupplierCode
): MatchResult {
  const matched: MatchedArticle[] = [];
  const missing: MissingArticle[] = [];

  for (const aiArticle of aiArticles) {
    const result = matchSingleArticle(aiArticle, catalogue, preferredSupplier);
    if (result.matched) {
      matched.push(result as MatchedArticle);
    } else {
      missing.push(result as unknown as MissingArticle);
    }
  }

  const totalArticles = aiArticles.length;
  const matchRate = totalArticles > 0 ? matched.length / totalArticles : 0;
  return { matched, missing, totalArticles, matchRate };
}

function matchSingleArticle(
  aiArticle: AIArticle,
  catalogue: CatalogueArticle[],
  preferredSupplier?: SupplierCode
): { matched: true } & MatchedArticle | { matched: false } & MissingArticle {

  const tryPool = (pool: CatalogueArticle[]) => {
    const active = pool.filter(a => a.active);
    const byCat = active.filter(a => categoryMatch(aiArticle.label, aiArticle.material_type, a.category));
    const candidates = byCat.length > 0 ? byCat : active;
    const scored = scoreCandidates(aiArticle, candidates);
    const threshold = byCat.length > 0 ? 0.2 : 0.35;
    if (scored.length > 0 && scored[0].score >= threshold) return scored;
    return null;
  };

  if (aiArticle.needs_site_measurement) {
    const suggestions = scoreCandidates(aiArticle, catalogue.filter(a => a.active)).slice(0, 3).map(s => s.article);
    return {
      matched: false,
      aiArticle,
      reason: `Information manquante, mesure sur site requise pour "${aiArticle.label}"`,
      suggestions,
    };
  }

  let scored = preferredSupplier
    ? tryPool(catalogue.filter(a => a.supplier?.code === preferredSupplier))
    : null;

  if (!scored) scored = tryPool(catalogue);

  if (!scored || scored.length === 0) {
    const suggestions = scoreCandidates(aiArticle, catalogue.filter(a => a.active)).slice(0, 3).map(s => s.article);
    return {
      matched: false,
      aiArticle,
      reason: `Aucun article correspondant pour "${aiArticle.label}"`,
      suggestions,
    };
  }

  const byCat = catalogue.filter(a => a.active && categoryMatch(aiArticle.label, aiArticle.material_type, a.category));
  const threshold = byCat.length > 0 ? 0.2 : 0.35;

  if (scored[0].score < threshold) {
    return {
      matched: false,
      aiArticle,
      reason: `Confiance insuffisante (${(scored[0].score * 100).toFixed(0)}%) pour "${aiArticle.label}"`,
      suggestions: scored.slice(0, 3).map(s => s.article),
    };
  }

  return {
    matched: true,
    aiArticle,
    catalogueArticle: scored[0].article,
    matchConfidence: Number(scored[0].score.toFixed(3)),
    supplierCode: (scored[0].article.supplier?.code || "NSB") as SupplierCode,
  };
}

export interface SupplierPriceComparison {
  aiArticle: AIArticle;
  prices: { supplierCode: SupplierCode; supplierName: string; article: CatalogueArticle; matchConfidence: number }[];
}

export function compareSupplierPrices(
  aiArticle: AIArticle,
  catalogue: CatalogueArticle[],
  supplierCodes: SupplierCode[]
): SupplierPriceComparison {
  const prices: SupplierPriceComparison["prices"] = [];
  const names: Record<string, string> = { NSB: "Nussbaum", ST: "Sanitas Troesch", GM: "Getaz Miauton", GEB: "Geberit" };

  for (const code of supplierCodes) {
    const pool = catalogue.filter(a => a.supplier?.code === code && a.active);
    const scored = scoreCandidates(aiArticle, pool);
    if (scored.length > 0 && scored[0].score >= 0.2) {
      prices.push({ supplierCode: code, supplierName: names[code] || code, article: scored[0].article, matchConfidence: Number(scored[0].score.toFixed(3)) });
    }
  }

  prices.sort((a, b) => a.article.unit_price - b.article.unit_price);
  return { aiArticle, prices };
}
