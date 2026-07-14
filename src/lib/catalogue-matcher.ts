import type { AIArticle, CatalogueArticle, MatchedArticle, MissingArticle, MatchResult, SupplierCode } from "@/types/database.types";

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
  appareil_sanitaire: ["lavabo", "evier", "baignoire", "douche", "wc", "toilette", "urinoir", "vasque", "bac a douche", "receveur"],
  depose:        ["depose", "demontage", "demonter", "enlevement", "retrait"],
  bouchon:       ["bouchon", "obturateur"],
  mamelon:       ["mamelon", "double mamelon"],
  autre:         [],
};

export function normalizeDimension(dim: string | null | undefined): string {
  if (!dim) return "";
  let n = dim.toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  // Try to find explicit dimensions like "54 mm", "Ø 54", "DN 50", "2\""
  const m = n.match(/(?:ø|dn)?\s*(\d+(?:[.,]\d+)?)\s*(?:mm|"|')/i) || n.match(/(?:ø|dn)\s*(\d+(?:[.,]\d+)?)/i);
  if (m) {
    return m[1].replace(",", ".");
  }
  // If the whole string is just a number
  const justNum = n.match(/^(\d+(?:[.,]\d+)?)$/);
  if (justNum) return justNum[1].replace(",", ".");
  return "";
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

function attrScore(aiArticle: AIArticle, catArticle: CatalogueArticle): { score: number; hardBlock: boolean } {
  const catAttrs = catArticle.attributes || {};
  const aiText = aiArticle.label;
  const catSpec = catArticle.specification;

  // 1. power_kw check
  const aiKw = extractKw(aiText);
  const catKw = catAttrs.power_kw ?? extractKw(catSpec) ?? extractKw(catArticle.description);
  if (aiKw !== null && catKw !== null) {
    if (Math.abs(aiKw - catKw) <= 2) return { score: 1.0, hardBlock: false };
    if (Math.abs(aiKw - catKw) <= 5) return { score: 0.5, hardBlock: false };
    return { score: 0, hardBlock: true };
  } else if (aiKw !== null && catKw === null) {
    return { score: 0, hardBlock: true };
  }

  // 2. capacity_l check
  const aiL = extractLitres(aiText);
  const catL = catAttrs.capacity_l ?? extractLitres(catSpec) ?? extractLitres(catArticle.description);
  if (aiL !== null && catL !== null) {
    if (Math.abs(aiL - catL) <= 20) return { score: 1.0, hardBlock: false };
    if (Math.abs(aiL - catL) <= 50) return { score: 0.5, hardBlock: false };
    return { score: 0, hardBlock: true };
  } else if (aiL !== null && catL === null) {
    return { score: 0, hardBlock: true };
  }

  // 3. diameter_mm check - STRICTOR TOLERANCE (plumbing standards)
  const aiD = extractDiameterMm(aiText);
  const catD = catAttrs.diameter_mm ?? extractDiameterMm(catSpec) ?? extractDiameterMm(catArticle.description);
  if (aiD !== null && catD !== null) {
    // If difference is small (e.g. 15mm vs 16mm, which is standard for multicouche vs copper), allow.
    // Otherwise if they are distinct sizes (16 vs 20, 20 vs 26, 28 vs 76 etc.), hard block!
    if (Math.abs(aiD - catD) <= 1.5) {
      return { score: 1.0, hardBlock: false };
    }
    return { score: 0, hardBlock: true };
  } else if (aiD !== null && catD === null) {
    // If the AI explicitly requires a diameter but the catalog article has none, it's a mismatch
    return { score: 0, hardBlock: true };
  }

  // 4. Material Match - STRICT MATERIAL CHECKS
  const aiTextLower = aiText.toLowerCase();
  const catTextLower = (catArticle.description || "").toLowerCase();

  const getNormalizedMaterial = (text: string) => {
    if (text.includes("multicouche") || text.includes("multi")) return "multicouche";
    if (text.includes("inox") || text.includes("acier in") || text.includes("edelstahl")) return "inox";
    if (text.includes("cuivre") || text.includes("copper") || text.includes("kupfer")) return "cuivre";
    if (text.includes("pe-hd") || text.includes("pe") || text.includes("polyethylene") || text.includes("evacuation")) return "pe";
    if (text.includes("bronze") || text.includes("rotguss") || text.includes("laiton") || text.includes("messing")) return "bronze";
    if (text.includes("acier") || text.includes("steel") || text.includes("stahl")) return "acier";
    return null;
  };

  const aiMatNorm = getNormalizedMaterial(aiTextLower);
  const catMatNorm = catAttrs.material ? getNormalizedMaterial(catAttrs.material.toLowerCase()) : getNormalizedMaterial(catTextLower);

  if (aiMatNorm && catMatNorm && aiMatNorm !== catMatNorm) {
    // Hard block if materials are different (e.g., steel pipe vs multilayer pipe)
    return { score: 0, hardBlock: true };
  }

  // 5. Category Match - STRICTOR CATEGORY CHECKS
  const aiCat = aiArticle.category;
  const catCat = catArticle.category;
  if (aiCat && catCat && aiCat !== "autre" && catCat !== "autre" && aiCat !== catCat) {
    // If the categories are explicitly different, block it!
    return { score: 0, hardBlock: true };
  }

  return { score: 0.5, hardBlock: false };
}

function customSearch(query: string, catalogue: CatalogueArticle[]) {
  const queryWords = query.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,.'"\(\)\-\/]+/)
    .filter(w => w.length > 1);

  if (queryWords.length === 0) return [];

  const results: { item: CatalogueArticle; score: number }[] = [];
  for (let i = 0; i < catalogue.length; i++) {
    const item = catalogue[i];
    const desc = (item.description || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const spec = (item.specification || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ref = (item.reference || "").toLowerCase();

    let matchCount = 0;
    for (let j = 0; j < queryWords.length; j++) {
      const word = queryWords[j];
      if (desc.includes(word) || spec.includes(word) || ref.includes(word)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      results.push({ item, score: matchCount / queryWords.length });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

export function matchArticles(
  aiArticles: AIArticle[],
  catalogue: CatalogueArticle[],
  preferredSupplier?: SupplierCode
): MatchResult {
  const matched: MatchedArticle[] = [];
  const missing: MissingArticle[] = [];

  const activeCatalogue = catalogue.filter(a => a.active);

  for (const aiArticle of aiArticles) {
    if (aiArticle.needs_site_measurement) {
      missing.push({
        aiArticle,
        reason: `Information manquante, mesure sur site requise pour "${aiArticle.label}"`,
        suggestions: []
      });
      continue;
    }

    // Build rich search query
    const aiCategory = aiArticle.category || '';
    let query = [aiArticle.label, aiCategory].filter(Boolean).join(" ");
    
    if (aiArticle.label.toLowerCase().includes("bâti-support") || aiArticle.label.toLowerCase().includes("geberit")) {
        query += " geberit duofix";
    }

    const searchResults = customSearch(query, activeCatalogue);

    // Apply attribute hard filters and re-rank
    const scoredCandidates = searchResults
      .map(result => {
        const article = result.item;
        
        // If preferred supplier, boost slightly
        const supplierBoost = preferredSupplier && article.supplier?.code === preferredSupplier ? 0.15 : 0;
        
        // Attribute check
        const attr = attrScore(aiArticle, article);
        if (attr.hardBlock) return { article, score: -1 };

        // Final blended score
        const finalScore = (result.score * 0.6) + (attr.score * 0.4) + supplierBoost;
        return { article, score: finalScore };
      })
      .filter(c => c.score >= 0.40) // Threshold for a good match
      .sort((a, b) => b.score - a.score);

    if (scoredCandidates.length > 0) {
      const topMatch = scoredCandidates[0];
      matched.push({
        aiArticle,
        catalogueArticle: topMatch.article,
        matchConfidence: Math.min(topMatch.score, 0.99), // Cap at 99%
        supplierCode: (topMatch.article.supplier?.code as SupplierCode) || 'GZ',
      });
    } else {
      missing.push({
        aiArticle,
        reason: `Aucune correspondance trouvée avec les bons attributs pour "${aiArticle.label}".`,
        suggestions: searchResults.slice(0, 3).map(r => r.item), // Top 3 raw semantic matches
      });
    }
  }

  const totalArticles = aiArticles.length;
  const matchRate = totalArticles > 0 ? matched.length / totalArticles : 0;
  return { matched, missing, totalArticles, matchRate };
}
