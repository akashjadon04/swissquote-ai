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

function extractWidthCm(text: string | null | undefined): number | null {
  if (!text) return null;
  // Look for patterns like "80 cm", "80cm", "B=80cm", "B=120 cm", "120x90", "120 x 90", "largeur 80"
  // For standard Swiss sanitary ware, common widths are 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 120, 130
  
  const matches = [
    ...text.matchAll(/(?:B=|largeur\s*)?(\d{2,3})(?:\s*cm|\s*[xX]\s*\d{2,3})/gi),
    ...text.matchAll(/(?:\b|B=|largeur\s*)(\d{2,3})\s*cm\b/gi)
  ];
  
  for (const m of matches) {
    const val = parseInt(m[1], 10);
    // Sanity check - widths of basins/furniture usually between 30 and 200
    if (val >= 30 && val <= 200) {
      return val;
    }
  }
  return null;
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
    .split(/[^a-z0-9]+/);
  return words.some(w => normalized.includes(w));
}

function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/(\d+)\s*[xX]\s*(\d+)/g, '$1 x $2') // separate dimensions like 60x40 -> 60 x 40
    .replace(/(\d+)([a-zA-Z]+)/g, '$1 $2') // separate 60cm -> 60 cm
    .replace(/([a-zA-Z]+)(\d+)/g, '$1 $2'); // separate DN40 -> DN 40
}

const STARTING_ACCESSORY_KEYWORDS = [
  'plaque', 'bouton', 'vis', 'joint', 'kit', 'set', 'axe', 'tige', 'poignee', 'poignée', 
  'tiroir', 'façade', 'facade', 'porte-serviettes', 'porte serviette', 'siphon', 'reglette', 'réglette', 
  'miroir', 'garniture', 'pied', 'pieds', 'patin', 'patins', 'support', 'traverse', 'raccordement', 
  'raccord', 'manchon', 'coude', 'rallonge', 'cache', 'couvercle', 'boite', 'boîte', 'boitier', 'boîtier', 
  'flexible', 'mamelon', 'adaptateur', 'soupape', 'membrane', 'pile', 'cable', 'câble', 'transformateur', 
  'alimentation', 'aérateur', 'aerateur', 'mousseur', 'régulateur', 'regulateur', 'bloc', 'valve', 
  'electrovanne', 'électrovanne', 'cartouche', 'corps', 'stabilisateur', 'stabilisation', 'abattant',
  'equerre', 'équerre', 'vis de cache', 'regulateur jet', 'barre', 'ecoulement', 'écoulement', 'bride',
  'grille', 'capuchon', 'crochet', 'sangle', 'anneau', 'rosace', 'enjoliveur', 'bague', 'ecrou', 'écrou',
  'indicateur', 'ensemble', 'rohbauset', 'convertisseur', 'passerelle', 'volant', 'excentrique', 'broche',
  'étrier', 'partie', 'poussoir', 'mécanisme', 'trappe', 'habillage', 'ouverture', 'unité',
  'unite', 'clip', 'capot', 'logement', 'verrou', 'protection', 'languette', 'presseur', 'disque',
  'recouvrement', 'actionneur', 'batterie', 'interbloc', 'insert', 'tête', 'pièce', 'bol', 'boulon',
  'rail', 'douille', 'piece', 'rabot', 'outil', 'lame', 'machine', 'levier', 'materiel', 'matériel', 'racloir', 'appareil', 'cadre', 'scie', 'etagere', 'étagère', 'coupe-tube', 'cle', 'clé', 'gabarit', 'cisaille', 'ebavureur', 'ébavureur'
];

function isAccessory(desc: string): boolean {
  const clean = desc.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^geberit\s+/, "")
    .replace(/^duofix\s+/, "")
    .trim();
  
  return STARTING_ACCESSORY_KEYWORDS.some(kw => clean.startsWith(kw));
}

// Synonym Map for French plumbing and HVAC terms
const SYNONYMS: Record<string, string[]> = {
  vasque: ["lavabo", "lave-mains", "lave mains", "cuvette", "bac"],
  lavabo: ["vasque", "lave-mains", "lave mains", "bac"],
  wc: ["toilette", "cuvette", "water-closet", "water closet", "bâti-support", "duofix"],
  toilette: ["wc", "cuvette", "water-closet", "water closet"],
  boiler: ["chauffe-eau", "chauffe eau", "cumulus", "ballon", "ecs"],
  "chauffe-eau": ["boiler", "cumulus", "ballon", "ecs"],
  mitigeur: ["melangeur", "mélangeur", "robinet", "vanne"],
  evacuation: ["siphon", "bonde", "silent", "pe", "écoulement", "ecoulement", "vidage"],
  siphon: ["evacuation", "bonde", "vidage"],
  tube: ["tuyau", "conduite", "canalisation"],
  tuyau: ["tube", "conduite", "canalisation"],
  raccord: ["manchon", "coude", "te", "tee", "sertir", "presser"],
  manchon: ["raccord", "manchon", "union", "transition"],
  coude: ["raccord", "sertir", "presser"],
  plaque: ["poussoir", "commande", "declenchement", "déclenchement"],
  commande: ["plaque", "poussoir", "declenchement", "déclenchement"],
  abattant: ["siege", "lunette", "couvercle"],
  bâti: ["duofix", "bati-support", "bâti-support", "support", "cadre", "chassis"],
  "bâti-support": ["duofix", "bati-support", "support", "cadre", "chassis"],
  duofix: ["bati-support", "bâti-support", "support", "cadre", "chassis"]
};

export interface JobContext {
  isOutdoor: boolean;
  isBathroom: boolean;
  isHeating: boolean;
  isWaterHeater: boolean;
  isResidential: boolean;
  isIndustrial: boolean;
}

export function detectJobContext(text: string): JobContext {
  const normalized = text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const isOutdoor = /\b(jardin|exterieur|arrosage|piscine|garden|outdoor)\b/i.test(normalized);
  const isBathroom = /\b(salle de bain|bain|lavabo|vasque|wc|toilette|douche|baignoire|bidet|sanitaire|lavabos|douches)\b/i.test(normalized);
  const isHeating = /\b(pompe a chaleur|chaudiere|chauffage|radiateur|pac|nourrice|collecteur|circulateur|pompe de circulation|chaufferie|vannes d'arret|vannes de zone)\b/i.test(normalized);
  const isWaterHeater = /\b(boiler|chauffe-eau|ecs|cumulus|ballon d'eau chaude|ballon ecs)\b/i.test(normalized);

  const isIndustrial = /\b(industriel|collectif|commercial|immeuble|grand|puissance|tertiaire|300\s*kw|300kw|dn\s*(?:50|65|80|100|125|150))\b/i.test(normalized);
  const isResidential = !isIndustrial && (
    /\b(residentiel|domestique|appartement|maison|villa|logement|individuel|unifamiliale)\b/i.test(normalized) ||
    isBathroom ||
    !/\b(industriel|commercial|collectif)\b/i.test(normalized)
  );

  return {
    isOutdoor,
    isBathroom,
    isHeating,
    isWaterHeater,
    isResidential,
    isIndustrial: !isResidential
  };
}

function attrScore(aiArticle: AIArticle, catArticle: CatalogueArticle, jobContext: JobContext): { score: number; hardBlock: boolean } {
  const catAttrs = catArticle.attributes || {};
  const aiText = aiArticle.label;
  const catSpec = catArticle.specification;
  const catCat = catArticle.category;
  const catPrice = catArticle.unit_price ?? (catArticle as any).base_price ?? 0;

  let matchedAttributeScore: number | null = null;

  const catDesc = (catArticle.description || "").toLowerCase();
  const catName = ((catArticle as any).name || "").toLowerCase();
  const fullCatText = catDesc + " " + catName;
  const fullAiText = aiText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. power_kw check
  const aiKw = extractKw(aiText);
  const catKw = catAttrs.power_kw ?? extractKw(catSpec) ?? extractKw(catArticle.description);
  if (aiKw !== null && catKw !== null) {
    if (Math.abs(aiKw - catKw) <= 2) matchedAttributeScore = 1.0;
    else if (Math.abs(aiKw - catKw) <= 5) matchedAttributeScore = 0.5;
    else return { score: 0, hardBlock: true };
  } else if (aiKw !== null && catKw === null) {
    return { score: 0, hardBlock: true };
  }

  // 2. capacity_l check
  const aiL = extractLitres(aiText);
  const catL = catAttrs.capacity_l ?? extractLitres(catSpec) ?? extractLitres(catArticle.description);
  if (aiL !== null && catL !== null) {
    if (Math.abs(aiL - catL) <= 20) matchedAttributeScore = 1.0;
    else if (Math.abs(aiL - catL) <= 50) matchedAttributeScore = 0.5;
    else return { score: 0, hardBlock: true };
  } else if (aiL !== null && catL === null) {
    return { score: 0, hardBlock: true };
  }

  // 3. diameter_mm check - STRICTOR TOLERANCE (plumbing standards)
  const aiD = extractDiameterMm(aiText);
  let catD = catAttrs.diameter_mm ?? extractDiameterMm(catSpec) ?? extractDiameterMm(catArticle.description) ?? null;
  if (catD === 1 || (catD !== null && catD < 3)) {
    catD = extractDiameterMm(catArticle.description) ?? extractDiameterMm(catSpec) ?? catAttrs.diameter_mm ?? null;
  }
  if (aiD !== null && catD !== null) {
    // If difference is small (e.g. 15mm vs 16mm, which is standard for multicouche vs copper), allow.
    // Otherwise if they are distinct sizes (16 vs 20, 20 vs 26, 28 vs 76 etc.), hard block!
    if (Math.abs(aiD - catD) <= 1.5) {
      matchedAttributeScore = 1.0;
    } else {
      return { score: 0, hardBlock: true };
    }
  } else if (aiD !== null && catD === null) {
    // If the AI explicitly requires a diameter but the catalog article has none, it's a mismatch
    return { score: 0, hardBlock: true };
  }
  
  // 3.5 Width check for Sanitary fixtures
  if (catCat === 'appareil_sanitaire' || hasWord(fullAiText, ['lavabo', 'vasque', 'meuble', 'armoire', 'miroir', 'receveur', 'douche'])) {
    const aiW = extractWidthCm(aiText);
    const catW = extractWidthCm(fullCatText);
    
    if (aiW !== null && catW !== null) {
      // If sizes differ by more than 5cm, it's a mismatch (e.g. 80cm != 60cm)
      if (Math.abs(aiW - catW) > 5) {
        return { score: 0, hardBlock: true };
      } else {
        matchedAttributeScore = 1.0;
      }
    }
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
    tuyau_inox: ['tuyau_inox', 'evacuation_pe', 'autre'],
    evacuation_pe: ['evacuation_pe', 'geberit_evacuation', 'tuyau_inox', 'autre'],
    coude_sertir: ['coude_sertir', 'manchon', 'autre'],
    manchon: ['manchon', 'coude_sertir', 'autre'],
    collier: ['collier', 'autre'],
    isolation: ['isolation', 'autre'],
    robinetterie: ['robinetterie', 'autre'],
    geberit_duofix: ['geberit_duofix', 'autre'],
    geberit_evacuation: ['geberit_evacuation', 'evacuation_pe', 'autre'],
    appareil_sanitaire: ['appareil_sanitaire', 'autre', 'geberit_evacuation', 'geberit_duofix'],
    transition: ['manchon', 'coude_sertir', 'robinetterie', 'autre'],
    reducteur: ['robinetterie', 'autre'],
    nourrice: ['robinetterie', 'autre'],
    chaudiere: ['autre', 'robinetterie'],
    ballon_ecs: ['autre', 'robinetterie'],
    circulateur: ['autre', 'robinetterie'],
    radiateur: ['autre', 'robinetterie'],
    depose: ['autre'],
    autre: ['autre', 'tuyau_inox', 'evacuation_pe', 'coude_sertir', 'manchon', 'collier', 'isolation', 'robinetterie', 'geberit_duofix', 'geberit_evacuation', 'appareil_sanitaire'],
  };

  const aiCat = aiArticle.category;
  if (aiCat && catCat) {
    const allowed = CATEGORY_COMPATIBILITY[aiCat];
    if (allowed && !allowed.includes(catCat) && catCat !== 'autre' && aiCat !== 'autre') {
      return { score: 0, hardBlock: true };
    }
  }

  // 6. Spare Parts / Accessories check using starting keywords (avoids false blocking primary items)
  const isAccessoryInCatalog = isAccessory(catDesc) || isAccessory(catName);
  const isAccessoryRequested = hasWord(fullAiText, STARTING_ACCESSORY_KEYWORDS) && 
                              !fullAiText.includes('bati-support') && 
                              !fullAiText.includes('bati support') && 
                              !fullAiText.includes('duofix') && 
                              !fullAiText.includes('cadre');

  if (isAccessoryInCatalog && !isAccessoryRequested) {
    return { score: 0, hardBlock: true };
  }

  // Strict accessory word exclusion to prevent spare parts/attachments matching primary queries
  const accessoryWords = [
    'paneel', 'panel', 'etagere', 'étagère', 'synchronisation', 'commande', 
    'fixation', 'cable', 'câble', 'rallonge', 'kit', 'set', 'joint', 
    'poignee', 'poignée', 'tiroir', 'abattant', 'lunette', 'couvercle', 
    'grille', 'capot', 'cache', 'vis', 'bouton', 'axe', 'tige', 
    'pied', 'pieds', 'patin', 'patins', 'traverse', 'support', 
    'mecanisme', 'mécanisme', 'module', 'trappe', 'habillage', 'clip', 
    'logement', 'verrou', 'protection', 'languette', 'presseur', 'disque', 
    'recouvrement', 'actionneur', 'batterie', 'interbloc', 'insert', 
    'tête', 'tete', 'piece', 'pièce', 'bol', 'boulon', 'rail', 'douille', 
    'outil', 'lame', 'machine', 'levier', 'materiel', 'matériel', 
    'racloir', 'cadre', 'scie', 'accessoire', 'accessoires', 'porte', 'portes', 'einschub', 'drueckerplatte', 'druckerplatte', 'befestigung', 'befestigungssatz', 'zubehor', 'zubehör', 'kabel', 'netzteil', 'netzgerat', 'netzgeraet', 'trafo', 'transformator', 'bouchon', 'bouchons', 'capuchon', 'capuchons'
  ];

  for (const word of accessoryWords) {
    const cleanWord = word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (hasWord(fullCatText, [cleanWord]) && !hasWord(fullAiText, [cleanWord])) {
      if (cleanWord === 'support' && (fullAiText.includes('support') || fullAiText.includes('bati-support'))) {
        continue;
      }
      return { score: 0, hardBlock: true };
    }
  }

  // Linguistic head-noun check to prevent washbasins matching faucet queries
  const isFaucetsRequested = hasWord(fullAiText, ['mitigeur', 'robinet', 'melangeur', 'mélangeur']);
  if (isFaucetsRequested) {
    const idxLavabo = fullCatText.indexOf('lavabo');
    const idxVasque = fullCatText.indexOf('vasque');
    const idxLaveMains = fullCatText.indexOf('lave-mains');
    const idxMinBasin = Math.min(
      idxLavabo === -1 ? Infinity : idxLavabo,
      idxVasque === -1 ? Infinity : idxVasque,
      idxLaveMains === -1 ? Infinity : idxLaveMains
    );

    const idxMitigeur = fullCatText.indexOf('mitigeur');
    const idxRobinet = fullCatText.indexOf('robinet');
    const idxRobinetterie = fullCatText.indexOf('robinetterie');
    const idxMinFaucet = Math.min(
      idxMitigeur === -1 ? Infinity : idxMitigeur,
      idxRobinet === -1 ? Infinity : idxRobinet,
      idxRobinetterie === -1 ? Infinity : idxRobinetterie
    );

    if (idxMinBasin < idxMinFaucet) {
      return { score: 0, hardBlock: true };
    }
  }

  // 6.5 Bambini children line block
  const isBambiniInCatalog = hasWord(fullCatText, ['bambini']);
  const isBambiniRequested = hasWord(fullAiText, ['bambini', 'enfant', 'enfants', 'child', 'children']);

  if (isBambiniInCatalog && !isBambiniRequested) {
    return { score: 0, hardBlock: true };
  }

  // 7. Outdoor / Garden check (Bidirectional)
  const outdoorKeywords = ['jardin', 'exterieur', 'extérieur', 'garden', 'outdoor', 'arrosage', 'arroser', 'piscine'];
  const isOutdoorInCatalog = hasWord(fullCatText, outdoorKeywords);
  const isOutdoorRequested = hasWord(fullAiText, outdoorKeywords);

  if (isOutdoorInCatalog && !isOutdoorRequested && !jobContext.isOutdoor) {
    return { score: 0, hardBlock: true };
  }

  const indoorOnlyKeywords = ['duofix', 'bati-support', 'bâti-support', 'bati support', 'encastre', 'encastré', 'suspendu', 'cuvette suspendue'];
  const isIndoorOnlyInCatalog = hasWord(fullCatText, indoorOnlyKeywords) || catCat === 'geberit_duofix';
  if ((isOutdoorRequested || jobContext.isOutdoor) && isIndoorOnlyInCatalog && !isOutdoorInCatalog) {
    return { score: 0, hardBlock: true };
  }

  // 7.5 Product-type Coherence / Mutual Exclusion
  const isWcRequested = hasWord(fullAiText, ['wc', 'toilette', 'cuvette']);
  const isDuofixRequested = hasWord(fullAiText, ['duofix', 'bati-support', 'bâti-support', 'cadre', 'chassis', 'support']);
  const isShowerColumnRequested = hasWord(fullAiText, ['colonne de douche', 'colonne douche']);
  const isMixerRequested = hasWord(fullAiText, ['mitigeur', 'melangeur', 'mélangeur']);
  const isHeatPumpRequested = hasWord(fullAiText, ['pompe a chaleur', 'pompe à chaleur', 'pac']);
  const isBoilerRequested = hasWord(fullAiText, ['chaudiere', 'chaudière']);

  const isCatalogDuofix = hasWord(fullCatText, ['duofix', 'bati-support', 'bâti-support', 'cadre', 'chassis', 'support']) || catCat === 'geberit_duofix';
  const isCatalogShowerColumn = hasWord(fullCatText, ['colonne de douche', 'colonne douche']);
  const isCatalogWc = hasWord(fullCatText, ['wc', 'toilette', 'cuvette']) && !isCatalogDuofix;
  const isCatalogMixer = hasWord(fullCatText, ['mitigeur', 'melangeur', 'mélangeur']) && !isCatalogShowerColumn;
  const isCatalogHeatPump = hasWord(fullCatText, ['pompe a chaleur', 'pompe à chaleur', 'pac']);
  const isCatalogBoiler = hasWord(fullCatText, ['chaudiere', 'chaudière']) && !isCatalogHeatPump;

  const isPipeRequested = hasWord(fullAiText, ['tube', 'tuyau', 'conduit', 'canalisation']);
  const isSiphonRequested = hasWord(fullAiText, ['siphon', 'bonde', 'vidage']);
  
  const isCatalogSiphon = hasWord(fullCatText, ['siphon', 'bonde', 'vidage']) || catCat === 'geberit_evacuation';
  const isCatalogPipe = hasWord(fullCatText, ['tube', 'tuyau', 'conduit', 'canalisation']) && !isCatalogSiphon;

  const isShowerRequested = hasWord(fullAiText, ['douche']);

  const isLavaboInCatalog = hasWord(fullCatText, ['lavabo', 'vasque', 'lave-mains', 'lave mains', 'waschtisch']);
  if (isShowerRequested && isMixerRequested && isLavaboInCatalog) {
    return { score: 0, hardBlock: true };
  }

  if (isShowerRequested && !isDuofixRequested && isCatalogDuofix) {
    return { score: 0, hardBlock: true };
  }

  const isCatalogWcDuofixElement = catCat === 'geberit_duofix' && hasWord(fullCatText, ['wc', 'toilette', 'cuvette']);
  if (isWcRequested && !isDuofixRequested && isCatalogDuofix && !isCatalogWc && !isCatalogWcDuofixElement) {
    return { score: 0, hardBlock: true };
  }
  if (isMixerRequested && (isCatalogDuofix || isCatalogBoiler || isCatalogHeatPump)) {
    return { score: 0, hardBlock: true };
  }
  if (isShowerColumnRequested && isCatalogMixer && !isCatalogShowerColumn) {
    return { score: 0, hardBlock: true };
  }
  if (isMixerRequested && !isShowerColumnRequested && isCatalogShowerColumn) {
    return { score: 0, hardBlock: true };
  }
  if (isPipeRequested && isCatalogSiphon) {
    return { score: 0, hardBlock: true };
  }
  if (isSiphonRequested && isCatalogPipe) {
    return { score: 0, hardBlock: true };
  }
  if (isHeatPumpRequested && isCatalogBoiler && !isCatalogHeatPump) {
    return { score: 0, hardBlock: true };
  }

  const isBathRequested = hasWord(fullAiText, ['baignoire', 'bain']);
  const isBasinRequested = hasWord(fullAiText, ['lavabo', 'vasque', 'evier', 'lave-mains', 'lave mains']);

  const isCatalogShower = hasWord(fullCatText, ['douche', 'brause']);
  const isCatalogBath = hasWord(fullCatText, ['baignoire', 'bain', 'wanne']);
  const isCatalogBasin = hasWord(fullCatText, ['lavabo', 'vasque', 'evier', 'lave-mains', 'lave mains', 'waschtisch', 'handwaschbecken']);

  if ((isShowerRequested || isBathRequested) && isCatalogBasin && !isCatalogShower && !isCatalogBath) {
    return { score: 0, hardBlock: true };
  }
  if (isBasinRequested && (isCatalogShower || isCatalogBath) && !isCatalogBasin) {
    return { score: 0, hardBlock: true };
  }

  // Receveur (shower tray) check
  const isReceveurRequested = hasWord(fullAiText, ['receveur']);
  const isCatalogReceveur = hasWord(fullCatText, ['receveur']);
  if (isReceveurRequested && !isCatalogReceveur) {
    return { score: 0, hardBlock: true };
  }

  // Meuble (furniture/cabinet) check
  const isMeubleRequested = hasWord(fullAiText, ['meuble']);
  const isCatalogMeuble = hasWord(fullCatText, ['meuble']);
  if (isMeubleRequested && !isCatalogMeuble) {
    return { score: 0, hardBlock: true };
  }

  // Lave-mains (guest washbasin) check
  const isLaveMainsRequested = fullAiText.includes('lave-mains') || fullAiText.includes('lave mains');
  const isCatalogLaveMains = fullCatText.includes('lave-mains') || fullCatText.includes('lave mains') || fullCatText.includes('handwaschbecken');
  if (isLaveMainsRequested && !isCatalogLaveMains) {
    return { score: 0, hardBlock: true };
  }
  if (!isLaveMainsRequested && isCatalogLaveMains) {
    return { score: 0, hardBlock: true };
  }

  // ─── Variant Qualifier Hard Block (sanitary fixture context only) ─────────
  // "double vasque" / "meuble double" are product-variant discriminators:
  // a double-basin fixture is a completely different (more expensive) product.
  // IMPORTANT: "double" also appears in general plumbing fitting names
  // (raccord double, mamelon double, coude double, clapet double…) — those
  // must NOT be blocked. The guard therefore only fires when "double"/"triple"
  // co-occurs with a sanitary fixture word in the AI label.
  const SANITARY_FIXTURE_WORDS = ['vasque', 'lavabo', 'meuble', 'bac', 'evier', 'plan', 'baignoire'];
  const aiHasSanitaryCtx = SANITARY_FIXTURE_WORDS.some(w => fullAiText.includes(w));
  if (aiHasSanitaryCtx) {
    if (hasWord(fullAiText, ['double']) && !hasWord(fullCatText, ['double'])) {
      return { score: 0, hardBlock: true };
    }
    if (hasWord(fullAiText, ['triple']) && !hasWord(fullCatText, ['triple'])) {
      return { score: 0, hardBlock: true };
    }
    // "simple" explicitly requested → must not be matched to a "double" item
    if (hasWord(fullAiText, ['simple']) && hasWord(fullCatText, ['double'])) {
      return { score: 0, hardBlock: true };
    }
  }

  // Job-Specific Exclusions (Heating vs Bathroom)
  if (jobContext.isHeating && !jobContext.isBathroom) {
    if (catCat === 'geberit_duofix' || catCat === 'appareil_sanitaire') {
      const isSanitaryExplicitlyRequested = hasWord(fullAiText, ['wc', 'lavabo', 'vasque', 'douche', 'baignoire', 'toilette', 'duofix', 'bati-support']);
      if (!isSanitaryExplicitlyRequested) {
        return { score: 0, hardBlock: true };
      }
    }
  }

  if (jobContext.isBathroom && !jobContext.isHeating && !jobContext.isWaterHeater) {
    if (catCat === 'chaudiere' || catCat === 'circulateur') {
      const isHeatingExplicitlyRequested = hasWord(fullAiText, ['chaudiere', 'chaudière', 'pompe a chaleur', 'pompe à chaleur', 'circulateur', 'pompe de circulation']);
      if (!isHeatingExplicitlyRequested) {
        return { score: 0, hardBlock: true };
      }
    }
  }

  // 7.6 Residential vs Industrial Scale Filter using Job Context
  const isCatalogIndustrial = hasWord(fullCatText, ['industriel', 'commercial', 'collectif', 'immeuble', 'tertiaire', 'puissance élevée', 'grande puissance', 'bride']) || 
                             (fullCatText.includes('kw') && (extractKw(fullCatText) || 0) > 50) ||
                             (fullCatText.includes('dn') && (extractDiameterMm(fullCatText) || 0) >= 50 && hasWord(fullCatText, ['disconnecteur', 'vanne', 'filtre', 'compteur'])) ||
                             (catPrice > 1500 && hasWord(fullCatText, ['chaudiere', 'chaudière', 'boiler', 'fitting', 'raccord', 'liaison']));

  if (jobContext.isResidential && isCatalogIndustrial) {
    return { score: 0, hardBlock: true };
  }
  if (catPrice > 2000 && isCatalogIndustrial && !jobContext.isIndustrial) {
    return { score: 0, hardBlock: true };
  }

  // 8. Luxury / High-End / Shower Toilets check
  const luxuryKeywords = ['aquaclean', 'mera', 'comfort', 'sela', 'tuma', 'sensowash', 'wc-aufsatz', 'wc complet geberit aquaclean'];
  const isLuxuryInCatalog = hasWord(fullCatText, luxuryKeywords);
  const isLuxuryRequested = hasWord(fullAiText, luxuryKeywords);

  // Block expensive luxury items across ALL sanitary categories unless explicitly requested
  const isExpensive = catPrice > 1500 && (
    catCat === 'geberit_duofix' || 
    catCat === 'appareil_sanitaire' || 
    catCat === 'robinetterie' ||
    catCat === 'autre'
  );

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
  
  let baseScore = matchedAttributeScore ?? (hasProductGroupMatch ? 0.65 : 0.5);
  if (catNorm.includes(queryNorm)) {
    baseScore = 1.0;
  }
  
  return { score: baseScore, hardBlock: false };
}

function levenshtein(a: string, b: string): number {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT TYPE GROUPS — each query is classified into one of these groups.
// The search then ONLY considers catalogue items from compatible groups.
// This is the core fix that prevents category cross-contamination.
// ─────────────────────────────────────────────────────────────────────────────
const PRODUCT_TYPE_GROUPS: { name: string; triggerKeywords: string[]; compatibleCategories: string[] }[] = [
  {
    name: 'wc_frame',
    triggerKeywords: ['duofix', 'bati-support', 'bâti-support', 'bati support', 'chassis wc', 'support wc', 'cadre wc'],
    compatibleCategories: ['geberit_duofix', 'autre'],
  },
  {
    name: 'toilet_bowl',
    triggerKeywords: ['cuvette', 'cuvette wc', 'cuvette suspendue', 'wc suspendu'],
    compatibleCategories: ['appareil_sanitaire', 'geberit_duofix', 'autre'],
  },
  {
    name: 'toilet_seat',
    triggerKeywords: ['abattant', 'siege wc', 'lunette wc'],
    compatibleCategories: ['appareil_sanitaire', 'geberit_duofix', 'autre'],
  },
  {
    name: 'flush_plate',
    triggerKeywords: ['plaque de commande', 'plaque commande', 'poussoir wc', 'declencheur wc'],
    compatibleCategories: ['geberit_duofix', 'appareil_sanitaire', 'autre'],
  },
  {
    name: 'washbasin',
    triggerKeywords: ['lavabo', 'vasque', 'lave-mains', 'lave mains'],
    compatibleCategories: ['appareil_sanitaire', 'geberit_duofix', 'autre'],
  },
  {
    name: 'vanity_unit',
    triggerKeywords: ['meuble sous-lavabo', 'meuble sous lavabo', 'meuble vasque', 'sous-vasque', 'meuble lavabo'],
    compatibleCategories: ['appareil_sanitaire', 'autre'],
  },
  {
    name: 'shower_column',
    triggerKeywords: ['colonne de douche', 'colonne douche', 'barre de douche', 'set de douche'],
    compatibleCategories: ['robinetterie', 'autre'],
  },
  {
    name: 'shower_tray',
    triggerKeywords: ['receveur de douche', 'receveur douche', 'bac a douche', 'bac douche'],
    compatibleCategories: ['appareil_sanitaire', 'autre'],
  },
  {
    name: 'bathtub',
    triggerKeywords: ['baignoire'],
    compatibleCategories: ['appareil_sanitaire', 'autre'],
  },
  {
    name: 'basin_mixer',
    triggerKeywords: ['mitigeur lavabo', 'mitigeur de lavabo', 'robinet lavabo', 'mitigeur monocommande lavabo'],
    compatibleCategories: ['robinetterie', 'autre'],
  },
  {
    name: 'kitchen_mixer',
    triggerKeywords: ['mitigeur evier', 'robinet cuisine', 'mitigeur cuisine'],
    compatibleCategories: ['robinetterie', 'autre'],
  },
  {
    name: 'thermostatic_valve',
    triggerKeywords: ['thermostatique', 'mitigeur thermostatique', 'robinet thermostatique'],
    compatibleCategories: ['robinetterie', 'autre'],
  },
  {
    name: 'ball_valve',
    triggerKeywords: ['vanne a bille', 'robinet a bille', 'vanne d arret', 'arret d eau'],
    compatibleCategories: ['robinetterie', 'autre'],
  },
  {
    name: 'water_heater',
    triggerKeywords: ['boiler', 'chauffe-eau', 'chauffe eau', 'cumulus', 'ballon ecs', 'ballon eau chaude'],
    compatibleCategories: ['ballon_ecs', 'autre', 'robinetterie'],
  },
  {
    name: 'heat_pump',
    triggerKeywords: ['pompe a chaleur', 'pompe chaleur', 'pac air', 'pac eau'],
    compatibleCategories: ['chaudiere', 'autre'],
  },
  {
    name: 'boiler',
    triggerKeywords: ['chaudiere', 'chaudiere condensation', 'generateur chaleur'],
    compatibleCategories: ['chaudiere', 'autre'],
  },
  {
    name: 'radiator',
    triggerKeywords: ['radiateur', 'panneau chauffant', 'corps de chauffe'],
    compatibleCategories: ['radiateur', 'autre'],
  },
  {
    name: 'drain_trap',
    triggerKeywords: ['siphon', 'bonde', 'vidage', 'ecoulement lavabo', 'ecoulement douche'],
    compatibleCategories: ['geberit_evacuation', 'evacuation_pe', 'autre'],
  },
  {
    name: 'drainage_pipe',
    triggerKeywords: ['evacuation', 'tuyau evacuation', 'tube pe', 'drainage', 'chute'],
    compatibleCategories: ['evacuation_pe', 'geberit_evacuation', 'tuyau_inox', 'autre'],
  },
  {
    name: 'press_pipe',
    triggerKeywords: ['tuyau inox', 'tube inox', 'optipress', 'tuyau multicouche', 'tube multicouche', 'raccordement eau'],
    compatibleCategories: ['tuyau_inox', 'manchon', 'coude_sertir', 'autre'],
  },
  {
    name: 'fitting',
    triggerKeywords: ['coude', 'te sertir', 'manchon', 'raccord sertir', 'pressfitting'],
    compatibleCategories: ['coude_sertir', 'manchon', 'tuyau_inox', 'autre'],
  },
  {
    name: 'insulation',
    triggerKeywords: ['isolation', 'coquille isolante', 'isolant tuyau'],
    compatibleCategories: ['isolation', 'autre'],
  },
  {
    name: 'clamp',
    triggerKeywords: ['collier de fixation', 'collier isophonique', 'bride'],
    compatibleCategories: ['collier', 'autre'],
  },
];

/**
 * Detect the product type group for a given query.
 * Returns the compatible catalogue categories for that product type,
 * or null if no specific type is detected (fall back to unrestricted search).
 */
function detectProductTypeGroup(queryNorm: string): string[] | null {
  const stopWords = ['pour', 'de', 'du', 'des', 'avec', 'sans', 'sur', 'dans', 'en', 'le', 'la', 'les', 'un', 'une', 'et', 'ou', 'a', 'au'];
  let cleanQuery = queryNorm.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const sw of stopWords) {
    const regex = new RegExp(`\\b${sw}\\b`, 'g');
    cleanQuery = cleanQuery.replace(regex, ' ');
  }
  cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();

  let bestMatch: { cats: string[]; length: number } | null = null;
  for (const group of PRODUCT_TYPE_GROUPS) {
    for (const kw of group.triggerKeywords) {
      const kwNorm = kw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .split(/\s+/)
        .filter(w => !stopWords.includes(w))
        .join(" ");
      
      if (cleanQuery.includes(kwNorm) && kwNorm.length > 0) {
        if (!bestMatch || kwNorm.length > bestMatch.length) {
          bestMatch = { cats: group.compatibleCategories, length: kwNorm.length };
        }
      }
    }
  }
  return bestMatch ? bestMatch.cats : null;
}

function customSearch(query: string, catalogue: CatalogueArticle[], allowedCategories?: string[]) {
  const STOP_WORDS = new Set(['de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'pour', 'avec', 'sans', 'sur', 'en', 'et', 'ou', 'a', 'au', 'd', 'l', 's', 'c', 'qu', 'ce', 'ces']);
  
  const normQuery = normalizeText(query);
  const rawWords = normQuery.split(/[\s,.'"\(\)\-\/]+/).filter(w => w.length > 1);
  const queryWords = rawWords.filter(w => !STOP_WORDS.has(w));
  if (queryWords.length === 0) return [];

  // ── Product type pre-filter ──────────────────────────────────────────────
  // Detect which product type this query belongs to, then restrict the
  // candidate pool to only items of compatible categories.
  // This prevents a shower column search from matching a Duofix frame
  // just because both descriptions share the word "douche".
  const detectedCategories = allowedCategories ?? detectProductTypeGroup(normQuery);

  const KEY_NOUNS = new Set(['multicouche', 'duofix', 'bati-support', 'cuvette', 'mitigeur', 'lavabo', 'boiler', 'douche', 'siphon', 'wc', 'toilette', 'vasque', 'chauffe-eau', 'colonne', 'receveur', 'baignoire']);

  const results: { item: CatalogueArticle; score: number }[] = [];
  for (let i = 0; i < catalogue.length; i++) {
    const item = catalogue[i];

    // ── Category pre-filter (the key fix) ──────────────────────────────────
    if (detectedCategories && detectedCategories.length > 0) {
      const itemCat = (item.category || 'autre').toLowerCase();
      if (!detectedCategories.includes(itemCat)) {
        continue; // Skip items from incompatible product categories entirely
      }
    }

    const desc = normalizeText(item.description || "");
    const spec = normalizeText(item.specification || "");
    const ref = (item.reference || "").toLowerCase();
    const fullText = `${desc} ${spec} ${ref}`;

    let matchCount = 0;
    let keyNounMatched = false;

    for (let j = 0; j < queryWords.length; j++) {
      const word = queryWords[j];
      let wordMatched = false;

      // 1. Exact/Substring match
      if (fullText.includes(word)) {
        wordMatched = true;
      } 
      // 2. Direct synonym match
      else {
        const syns = SYNONYMS[word];
        if (syns && syns.some(syn => fullText.includes(syn))) {
          wordMatched = true;
        }
      }

      // 3. Fuzzy match fallback (only for longer words to avoid false positives)
      if (!wordMatched && word.length >= 5) {
        const catWords = fullText.split(/[\s,.'"\(\)\-\/]+/);
        for (const catWord of catWords) {
          if (catWord.length >= 5 && Math.abs(catWord.length - word.length) <= 1 && levenshtein(word, catWord) <= 1) {
            wordMatched = true;
            break;
          }
          const syns = SYNONYMS[word];
          if (syns) {
            for (const syn of syns) {
              if (catWord.length >= 5 && Math.abs(catWord.length - syn.length) <= 1 && levenshtein(syn, catWord) <= 1) {
                wordMatched = true;
                break;
              }
            }
          }
          if (wordMatched) break;
        }
      }

      if (wordMatched) {
        matchCount++;
        if (KEY_NOUNS.has(word)) {
          keyNounMatched = true;
        }
      }
    }

    let score = matchCount / queryWords.length;

    // Bigram boost — consecutive matching words
    let bigramMatches = 0;
    for (let j = 0; j < queryWords.length - 1; j++) {
      const bigram = `${queryWords[j]} ${queryWords[j+1]}`;
      if (fullText.includes(bigram)) {
        bigramMatches++;
      }
    }
    if (queryWords.length > 1) {
      score += (bigramMatches / (queryWords.length - 1)) * 0.2;
    }

    // Key noun boost — matching the product noun is critical
    if (keyNounMatched) {
      score += 0.2;
    }

    score = Math.min(score, 1.0);

    if (score >= 0.3) {
      results.push({ item, score });
    }
  }
  return results.sort((a, b) => b.score - a.score);
}

export function matchArticles(
  aiArticles: AIArticle[],
  catalogue: CatalogueArticle[],
  preferredSupplier?: SupplierCode,
  fullDescriptionText?: string
): MatchResult {
  const rawMatched: MatchedArticle[] = [];
  const rawMissing: MissingArticle[] = [];

  const activeCatalogue = catalogue.filter(a => {
    if (!a.active) return false;
    const price = a.unit_price ?? (a as any).base_price ?? 0;
    return price > 0;
  });

  // Detect job context from fullDescriptionText or aiArticles
  const jobText = (fullDescriptionText || "") + " " + aiArticles.map(a => a.label).join(" ");
  const jobContext = detectJobContext(jobText);

  for (const aiArticle of aiArticles) {
    if (aiArticle.category === 'depose') {
      rawMissing.push({
        aiArticle,
        reason: `Prestation de dépose/main d'œuvre, pas d'article physique correspondant dans le catalogue`,
        suggestions: []
      });
      continue;
    }
    // We proceed to match even if needs_site_measurement is true, so that suggestions appear.

    // Build rich search query
    const aiCategory = (aiArticle.category || '').replace(/_/g, ' ');
    let query = [aiArticle.label, aiCategory].filter(Boolean).join(" ");
    
    if (aiArticle.label.toLowerCase().includes("bâti-support") || aiArticle.label.toLowerCase().includes("geberit")) {
        query += " geberit duofix";
    }

    const searchResults = customSearch(query, activeCatalogue);

    // Apply attribute hard filters and re-rank
    const scoredCandidates = searchResults
      .map(result => {
        const article = result.item;
        
        // Exclude low-quality semantic matches
        if (result.score < 0.45) return { article, score: -1 };
        
        // If preferred supplier, boost slightly
        const supplierBoost = preferredSupplier && article.supplier?.code === preferredSupplier ? 0.15 : 0;
        
        // Attribute check
        const attr = attrScore(aiArticle, article, jobContext);
        if (attr.hardBlock) return { article, score: -1 };

        // Final blended score
        const finalScore = (result.score * 0.6) + (attr.score * 0.4) + supplierBoost;
        return { article, score: finalScore };
      })
      .filter(c => c.score >= 0.60) // Threshold for a good match
      .sort((a, b) => {
        if (Math.abs(b.score - a.score) < 0.0001) {
          const priceA = a.article.unit_price ?? (a.article as any).base_price ?? 0;
          const priceB = b.article.unit_price ?? (b.article as any).base_price ?? 0;
          return priceA - priceB;
        }
        return b.score - a.score;
      });

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
