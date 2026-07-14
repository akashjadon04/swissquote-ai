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

function hasWord(text: string, words: string[]): boolean {
  const normalized = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,.'"\(\)\-\/]+/);
  return words.some(w => normalized.includes(w));
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

  // 5. Category Match - STRICTOR CATEGORY CHECKS WITH COMPATIBILITY MAP
  const CATEGORY_COMPATIBILITY: Record<string, string[]> = {
    tuyau_inox: ['tuyau_inox'],
    evacuation_pe: ['evacuation_pe', 'geberit_evacuation', 'autre'],
    coude_sertir: ['coude_sertir', 'manchon', 'autre'],
    manchon: ['manchon', 'coude_sertir', 'autre'],
    collier: ['collier', 'autre'],
    isolation: ['isolation', 'autre'],
    robinetterie: ['robinetterie', 'autre'],
    geberit_duofix: ['geberit_duofix', 'autre', 'robinetterie'],
    geberit_evacuation: ['geberit_evacuation', 'evacuation_pe', 'autre'],
    appareil_sanitaire: ['appareil_sanitaire', 'geberit_duofix', 'robinetterie', 'autre'],
    transition: ['manchon', 'coude_sertir', 'robinetterie', 'autre'],
    reducteur: ['robinetterie', 'autre'],
    nourrice: ['robinetterie', 'autre'],
    chaudiere: ['autre', 'robinetterie'],
    ballon_ecs: ['autre', 'robinetterie'],
    circulateur: ['autre', 'robinetterie'],
    radiateur: ['autre', 'robinetterie'],
    depose: ['autre'],
    autre: ['autre', 'tuyau_inox', 'evacuation_pe', 'coude_sertir', 'manchon', 'collier', 'isolation', 'robinetterie', 'geberit_duofix', 'geberit_evacuation'],
  };

  const aiCat = aiArticle.category;
  const catCat = catArticle.category;
  if (aiCat && catCat) {
    const allowed = CATEGORY_COMPATIBILITY[aiCat];
    if (allowed && !allowed.includes(catCat) && catCat !== 'autre' && aiCat !== 'autre') {
      return { score: 0, hardBlock: true };
    }
  }

  const catDesc = (catArticle.description || "").toLowerCase();
  const catName = ((catArticle as any).name || "").toLowerCase();
  const fullCatText = catDesc + " " + catName;
  const fullAiText = aiText.toLowerCase();

  // 6. Spare Parts / Accessories check
  const accessoryKeywords = [
    'poignee', 'poignée', 'levier', 'bouton', 'rosace', 'insert',
    'stabilisation', 'fixation', 'raccordement', 'finition', 'facade', 'façade',
    'transformation', 'amortisseur', 'cache', 'rechange', 'cartouche', 'flexible',
    'plaque de commande', 'plaque de declenchement', 'plaque de déclenchement', 'plaque de design',
    'boite de construction', 'boîte de construction', 'element de finition', 'élément de finition',
    'couvercle', 'vidage', 'siphon', 'receveur', 'paroi', 'traverse', 'montage',
    'plaque', 'boitier', 'boîtier', 'raccord', 'kit', 'set', 'mamelon', 'stabilisateur',
    'barre', 'tringle', 'tige', 'joint', 'vis', 'écrou', 'ecrou', 'rondelle', 'colle',
    'manchon', 'coude', 'rallonge', 'caniveau', 'caniveaux', 'ecoulement', 'écoulement',
    'garniture', 'flexible', 'panneau', 'adaptateur', 'pied', 'pieds', 'patin', 'patins',
    'stylo', 'trappe', 'porte', 'boite', 'boîte', 'support', 'butee', 'butée',
    'axe', 'axes', 'soupape', 'membrane', 'pile', 'cable', 'câble', 'transformateur',
    'alimentation', 'tube', 'tuyau', 'flexible'
  ];

  const isAccessoryInCatalog = hasWord(fullCatText, accessoryKeywords);
  const isAccessoryRequested = hasWord(fullAiText, accessoryKeywords);

  if (isAccessoryInCatalog && !isAccessoryRequested) {
    return { score: 0, hardBlock: true };
  }

  // 7. Outdoor / Garden check
  const outdoorKeywords = ['jardin', 'exterieur', 'extérieur', 'garden', 'outdoor', 'arrosage', 'arroser', 'piscine'];
  const isOutdoorInCatalog = hasWord(fullCatText, outdoorKeywords);
  const isOutdoorRequested = hasWord(fullAiText, outdoorKeywords);

  if (isOutdoorInCatalog && !isOutdoorRequested) {
    return { score: 0, hardBlock: true };
  }

  // 8. Luxury / High-End / Shower Toilets check
  const luxuryKeywords = ['aquaclean', 'mera', 'comfort', 'sela', 'tuma', 'sensowash', 'wc-aufsatz', 'wc complet geberit aquaclean'];
  const isLuxuryInCatalog = hasWord(fullCatText, luxuryKeywords);
  const isLuxuryRequested = hasWord(fullAiText, luxuryKeywords);

  const catPrice = catArticle.unit_price ?? (catArticle as any).base_price ?? 0;
  const isExpensive = catPrice > 1500 && (catCat === 'geberit_duofix' || catCat === 'appareil_sanitaire' || catCat === 'robinetterie');

  if ((isLuxuryInCatalog || isExpensive) && !isLuxuryRequested) {
    return { score: 0, hardBlock: true };
  }

  // 9. Product Group Match Boost (e.g. both are WCs, mixers, pipes, siphons)
  const productGroups = [
    ['wc', 'toilette', 'cuvette', 'water-closet'],
    ['mitigeur', 'robinet', 'melangeur', 'mélangeur', 'valv', 'soupape'],
    ['tuyau', 'tube', 'conduit', 'canalisation'],
    ['siphon', 'vidage', 'evacuation', 'écoulement', 'ecoulement'],
    ['lavabo', 'vasque', 'lave-mains', 'lave mains']
  ];

  let hasProductGroupMatch = false;
  for (const group of productGroups) {
    const aiHas = group.some(word => fullAiText.includes(word));
    const catHas = group.some(word => fullCatText.includes(word));
    if (aiHas && catHas) {
      hasProductGroupMatch = true;
      break;
    }
  }

  // 10. Exact Phrase Match Boost
  const queryNorm = fullAiText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const catNorm = fullCatText.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (catNorm.includes(queryNorm)) {
    return { score: 1.0, hardBlock: false };
  }

  return { score: hasProductGroupMatch ? 0.65 : 0.5, hardBlock: false };
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
  const rawMatched: MatchedArticle[] = [];
  const rawMissing: MissingArticle[] = [];

  const activeCatalogue = catalogue.filter(a => a.active);

  for (const aiArticle of aiArticles) {
    if (aiArticle.needs_site_measurement) {
      rawMissing.push({
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
      .filter(c => c.score >= 0.55) // Threshold for a good match
      .sort((a, b) => b.score - a.score);

    if (scoredCandidates.length > 0) {
      const topMatch = scoredCandidates[0];
      rawMatched.push({
        aiArticle,
        catalogueArticle: topMatch.article,
        matchConfidence: Math.min(topMatch.score, 0.99), // Cap at 99%
        supplierCode: (topMatch.article.supplier?.code as SupplierCode) || 'GZ',
      });
    } else {
      rawMissing.push({
        aiArticle,
        reason: `Aucune correspondance trouvée avec les bons attributs pour "${aiArticle.label}".`,
        suggestions: searchResults.slice(0, 3).map(r => r.item), // Top 3 raw semantic matches
      });
    }
  }

  // --- DUPLICATE MERGING LOGIC ---
  const matched: MatchedArticle[] = [];
  const seenRefs = new Map<string, MatchedArticle>();

  for (const m of rawMatched) {
    const ref = m.catalogueArticle.reference;
    if (seenRefs.has(ref)) {
      const existing = seenRefs.get(ref)!;
      if (existing.aiArticle.quantity !== null && m.aiArticle.quantity !== null) {
        existing.aiArticle.quantity += m.aiArticle.quantity;
      } else if (m.aiArticle.quantity !== null) {
        existing.aiArticle.quantity = m.aiArticle.quantity;
      }
    } else {
      const cloned = {
        ...m,
        aiArticle: { ...m.aiArticle }
      };
      seenRefs.set(ref, cloned);
      matched.push(cloned);
    }
  }

  const missing: MissingArticle[] = [];
  const seenMissingLabels = new Map<string, MissingArticle>();

  for (const m of rawMissing) {
    const label = m.aiArticle.label.toLowerCase().trim();
    if (seenMissingLabels.has(label)) {
      const existing = seenMissingLabels.get(label)!;
      if (existing.aiArticle.quantity !== null && m.aiArticle.quantity !== null) {
        existing.aiArticle.quantity += m.aiArticle.quantity;
      } else if (m.aiArticle.quantity !== null) {
        existing.aiArticle.quantity = m.aiArticle.quantity;
      }
    } else {
      const cloned = {
        ...m,
        aiArticle: { ...m.aiArticle }
      };
      seenMissingLabels.set(label, cloned);
      missing.push(cloned);
    }
  }

  const totalArticles = matched.length + missing.length;
  const matchRate = totalArticles > 0 ? matched.length / totalArticles : 0;
  return { matched, missing, totalArticles, matchRate };
}
