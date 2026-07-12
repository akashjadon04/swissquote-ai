import Fuse from 'fuse.js';
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

function attrScore(aiArticle: AIArticle, catArticle: CatalogueArticle): { score: number; hardBlock: boolean } {
  const aiAttrs = aiArticle.attributes || {};
  const catAttrs = catArticle.attributes || {};
  const aiText = [aiArticle.label, aiArticle.dimension, aiArticle.material_type].filter(Boolean).join(" ");
  const catSpec = catArticle.specification;

  // power_kw
  const aiKw = aiAttrs.power_kw ?? extractKw(aiText);
  const catKw = catAttrs.power_kw ?? extractKw(catSpec) ?? extractKw(catArticle.description);
  if (aiKw !== null && catKw !== null) {
    if (Math.abs(aiKw - catKw) <= 2) return { score: 1.0, hardBlock: false };
    if (Math.abs(aiKw - catKw) <= 5) return { score: 0.5, hardBlock: false };
    return { score: 0, hardBlock: true };
  } else if (aiKw !== null && catKw === null) {
    return { score: 0, hardBlock: true }; // AI wants kW, catalogue item doesn't have it
  }

  // capacity_l
  const aiL = aiAttrs.capacity_l ?? extractLitres(aiText);
  const catL = catAttrs.capacity_l ?? extractLitres(catSpec) ?? extractLitres(catArticle.description);
  if (aiL !== null && catL !== null) {
    if (Math.abs(aiL - catL) <= 20) return { score: 1.0, hardBlock: false };
    if (Math.abs(aiL - catL) <= 50) return { score: 0.5, hardBlock: false };
    return { score: 0, hardBlock: true };
  } else if (aiL !== null && catL === null) {
    return { score: 0, hardBlock: true };
  }

  // diameter_mm
  const aiD = aiAttrs.diameter_mm ?? extractDiameterMm(aiArticle.dimension) ?? extractDiameterMm(aiText);
  const catD = catAttrs.diameter_mm ?? extractDiameterMm(catSpec) ?? extractDiameterMm(catArticle.description);
  if (aiD !== null && catD !== null) {
    if (Math.abs(aiD - catD) < 2) return { score: 1.0, hardBlock: false };
    if (Math.abs(aiD - catD) < 5) return { score: 0.3, hardBlock: false };
    return { score: 0, hardBlock: true };
  } else if (aiD !== null && catD === null) {
    // A bit more lenient with diameters, sometimes catalogs just say "1/2" instead of mm
    return { score: 0, hardBlock: false }; 
  }

  return { score: 0.5, hardBlock: false };
}

// Global fuse instance for performance across requests
let globalFuse: Fuse<CatalogueArticle> | null = null;
let lastCatalogueLength = 0;

export function matchArticles(
  aiArticles: AIArticle[],
  catalogue: CatalogueArticle[],
  preferredSupplier?: SupplierCode
): MatchResult {
  const matched: MatchedArticle[] = [];
  const missing: MissingArticle[] = [];

  // Init or update Fuse
  if (!globalFuse || catalogue.length !== lastCatalogueLength) {
    const options = {
      keys: ['description', 'specification', 'category', 'supplier_id', 'reference'],
      includeScore: true,
      threshold: 0.85, // Allow fuzzy matches
      ignoreLocation: true,
      useExtendedSearch: false
    };
    globalFuse = new Fuse(catalogue.filter(a => a.active), options);
    lastCatalogueLength = catalogue.length;
  }

  const fuse = globalFuse;

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
    const terms = [aiArticle.label, aiArticle.material_type, aiArticle.dimension].filter(Boolean).join(" ");
    
    // Exact match Geberit explicitly if requested
    let query = terms;
    if (aiArticle.label.toLowerCase().includes("bâti-support") || aiArticle.label.toLowerCase().includes("geberit")) {
        query += " geberit duofix";
    }

    const fuseResults = fuse.search(query);

    // Apply attribute hard filters and re-rank
    const scoredCandidates = fuseResults
      .map(result => {
        const article = result.item;
        
        // If preferred supplier, boost slightly
        const supplierBoost = preferredSupplier && article.supplier?.code === preferredSupplier ? 0.15 : 0;
        
        // Attribute check
        const attr = attrScore(aiArticle, article);
        if (attr.hardBlock) return { article, score: -1 };

        // Inverse fuse score (lower is better in Fuse, so 1 - score is similarity)
        const similarity = 1 - (result.score ?? 1);
        
        // Final blended score
        const finalScore = (similarity * 0.6) + (attr.score * 0.4) + supplierBoost;
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
        suggestions: fuseResults.slice(0, 3).map(r => r.item), // Top 3 raw semantic matches
      });
    }
  }

  const totalArticles = aiArticles.length;
  const matchRate = totalArticles > 0 ? matched.length / totalArticles : 0;
  return { matched, missing, totalArticles, matchRate };
}
