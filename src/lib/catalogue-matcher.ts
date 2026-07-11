import type { AIArticle, CatalogueArticle, MatchedArticle, MissingArticle, MatchResult, SupplierCode } from '@/types/database.types';

// ═══════════════════════════════════════════
// SwissQuote AI — Catalogue Matching Engine
// ═══════════════════════════════════════════

// ─────────────────────────────────────────
// Dimension Normalization
// ─────────────────────────────────────────

/**
 * Normalizes dimension strings for comparison.
 * Handles: Ø 54 mm, DN 40, 1½", Ø mm 54, DN mm 50, etc.
 */
export function normalizeDimension(dim: string | null | undefined): string {
  if (!dim) return '';
  
  let normalized = dim
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/ø/gi, '')
    .replace(/dn/gi, '')
    .replace(/mm/gi, '')
    .replace(/\s+/g, '')
    .trim();

  // Extract the numeric part
  const numMatch = normalized.match(/(\d+(?:[.,\/]\d+)?)/);
  if (numMatch) {
    normalized = numMatch[1].replace(',', '.');
  }

  return normalized;
}

/**
 * Extract numeric diameter in mm from a dimension string.
 */
function extractDiameterMm(dim: string | null | undefined): number | null {
  if (!dim) return null;
  const normalized = normalizeDimension(dim);
  const num = parseFloat(normalized);
  
  // Handle inch fractions
  if (dim.includes('"') || dim.includes("'")) {
    if (dim.includes('½') || dim.includes('1/2')) return dim.includes('1½') ? 40 : 15;
    if (dim.includes('¼') || dim.includes('1/4')) return dim.includes('1¼') ? 32 : 8;
    if (dim.includes('¾') || dim.includes('3/4')) return 20;
    if (dim.includes('5/4')) return 32;
    if (dim.includes('2"') || dim.includes('2\'')) return 50;
    if (dim.includes('1"') || dim.includes('1\'')) return 25;
  }
  
  return isNaN(num) ? null : num;
}

// ─────────────────────────────────────────
// Description Scoring
// ─────────────────────────────────────────

/**
 * Scores similarity between AI label and catalogue description.
 * Uses keyword overlap with weighting for technical terms.
 */
function descriptionScore(catalogueDesc: string, aiLabel: string): number {
  const technicalTerms = new Set([
    'inox', 'acier', 'cuivre', 'pvc', 'press', 'sertir', 'filet',
    'mâle', 'femelle', 'coude', 'manchon', 'tuyau', 'tube', 'collier',
    'isolation', 'réducteur', 'robinet', 'transition', 'bouchon',
    'raccord', 'bride', 'optipress', 'pressfitting', 'caoutchouc',
    '90°', '45°', 'compression', 'jonction',
  ]);

  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

  const catWords = new Set(normalize(catalogueDesc));
  const aiWords = normalize(aiLabel);

  if (aiWords.length === 0) return 0;

  let score = 0;
  let totalWeight = 0;

  for (const word of aiWords) {
    const weight = technicalTerms.has(word) ? 2 : 1;
    totalWeight += weight;
    if (catWords.has(word)) {
      score += weight;
    }
  }

  return totalWeight > 0 ? score / totalWeight : 0;
}

// ─────────────────────────────────────────
// Category Matching
// ─────────────────────────────────────────

const CATEGORY_ALIASES: Record<string, string[]> = {
  tuyau_inox: ['tuyau', 'tube', 'conduite'],
  coude_sertir: ['coude', 'courbe'],
  manchon: ['manchon', 'raccord', 'jonction'],
  collier: ['collier', 'bride', 'fixation'],
  isolation: ['isolation', 'coquille', 'manchon_isolant'],
  transition: ['transition', 'piece_transition', 'adaptation'],
  reducteur: ['reducteur', 'detendeur', 'pression'],
  robinet: ['robinet', 'vanne', 'arret'],
  raccord: ['raccord', 'ecrou', 'embout'],
  bouchon: ['bouchon', 'obturateur'],
  mamelon: ['mamelon', 'double_mamelon'],
};

function matchCategory(aiCategory: string, catalogueCategory: string | null): boolean {
  if (!catalogueCategory) return false;

  const aiCat = aiCategory.toLowerCase();
  const catCat = catalogueCategory.toLowerCase();

  // Direct match
  if (aiCat === catCat) return true;

  // Alias match
  for (const [key, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if ((aiCat === key || aliases.includes(aiCat)) &&
        (catCat === key || aliases.includes(catCat))) {
      return true;
    }
  }

  return false;
}

// ─────────────────────────────────────────
// Main Matching Function
// ─────────────────────────────────────────

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
  
  // Step 1: Filter by preferred supplier first, then fall back to all
  let candidates = preferredSupplier
    ? catalogue.filter(a => a.supplier?.code === preferredSupplier && a.active)
    : catalogue.filter(a => a.active);

  // Step 2: Filter by category
  const byCategory = candidates.filter(a => matchCategory(aiArticle.material_type, a.category));
  
  if (byCategory.length > 0) {
    candidates = byCategory;
  }

  // Step 3: Filter by dimension
  const aiDiameter = extractDiameterMm(aiArticle.dimension);
  let byDimension = candidates;
  
  if (aiDiameter !== null) {
    byDimension = candidates.filter(a => {
      const catDiameter = extractDiameterMm(a.specification);
      return catDiameter !== null && Math.abs(catDiameter - aiDiameter) < 2; // 2mm tolerance
    });
    
    if (byDimension.length > 0) {
      candidates = byDimension;
    }
  }

  // Step 4: Score remaining by description similarity
  const scored = candidates
    .map(article => ({
      article,
      score: descriptionScore(article.description, aiArticle.label) * 0.6 +
             (matchCategory(aiArticle.material_type, article.category) ? 0.3 : 0) +
             (aiDiameter !== null && extractDiameterMm(article.specification) === aiDiameter ? 0.1 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  // Step 5: Check threshold
  const MATCH_THRESHOLD = 0.3;

  if (scored.length === 0 || scored[0].score < MATCH_THRESHOLD) {
    // If preferred supplier failed, try ALL suppliers
    if (preferredSupplier) {
      const allCandidates = catalogue.filter(a => a.active && a.supplier?.code !== preferredSupplier);
      const fallback = matchSingleArticleFromList(aiArticle, allCandidates, aiDiameter);
      if (fallback) {
        return { matched: true, aiArticle, ...fallback } as { matched: true } & MatchedArticle;
      }
    }

    // Generate suggestions (top 3 closest matches)
    const suggestions = scored.slice(0, 3).map(s => s.article);

    return {
      matched: false,
      aiArticle,
      reason: scored.length === 0
        ? `Aucun article trouvé pour la catégorie "${aiArticle.material_type}"${aiArticle.dimension ? ` dimension ${aiArticle.dimension}` : ''}`
        : `Confiance insuffisante (${(scored[0].score * 100).toFixed(0)}%) pour "${aiArticle.label}"`,
      suggestions,
    };
  }

  const best = scored[0];
  const supplierCode = (best.article.supplier?.code || 'NSB') as SupplierCode;

  return {
    matched: true,
    aiArticle,
    catalogueArticle: best.article,
    matchConfidence: Number(best.score.toFixed(3)),
    supplierCode,
  };
}

function matchSingleArticleFromList(
  aiArticle: AIArticle,
  catalogue: CatalogueArticle[],
  aiDiameter: number | null
): Omit<MatchedArticle, 'aiArticle'> | null {
  const byCategory = catalogue.filter(a => matchCategory(aiArticle.material_type, a.category));
  let candidates = byCategory.length > 0 ? byCategory : catalogue;

  if (aiDiameter !== null) {
    const byDim = candidates.filter(a => {
      const d = extractDiameterMm(a.specification);
      return d !== null && Math.abs(d - aiDiameter) < 2;
    });
    if (byDim.length > 0) candidates = byDim;
  }

  const scored = candidates
    .map(article => ({
      article,
      score: descriptionScore(article.description, aiArticle.label) * 0.6 +
             (matchCategory(aiArticle.material_type, article.category) ? 0.3 : 0) +
             (aiDiameter !== null && extractDiameterMm(article.specification) === aiDiameter ? 0.1 : 0),
    }))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0 || scored[0].score < 0.3) return null;

  return {
    catalogueArticle: scored[0].article,
    matchConfidence: Number(scored[0].score.toFixed(3)),
    supplierCode: (scored[0].article.supplier?.code || 'NSB') as SupplierCode,
  };
}

// ─────────────────────────────────────────
// Supplier Price Comparison
// ─────────────────────────────────────────

export interface SupplierPriceComparison {
  aiArticle: AIArticle;
  prices: {
    supplierCode: SupplierCode;
    supplierName: string;
    article: CatalogueArticle;
    matchConfidence: number;
  }[];
}

export function compareSupplierPrices(
  aiArticle: AIArticle,
  catalogue: CatalogueArticle[],
  supplierCodes: SupplierCode[]
): SupplierPriceComparison {
  const prices: SupplierPriceComparison['prices'] = [];
  const aiDiameter = extractDiameterMm(aiArticle.dimension);

  for (const code of supplierCodes) {
    const supplierArticles = catalogue.filter(a => a.supplier?.code === code && a.active);
    const byCategory = supplierArticles.filter(a => matchCategory(aiArticle.material_type, a.category));
    let candidates = byCategory.length > 0 ? byCategory : supplierArticles;

    if (aiDiameter !== null) {
      const byDim = candidates.filter(a => {
        const d = extractDiameterMm(a.specification);
        return d !== null && Math.abs(d - aiDiameter) < 2;
      });
      if (byDim.length > 0) candidates = byDim;
    }

    const scored = candidates
      .map(article => ({
        article,
        score: descriptionScore(article.description, aiArticle.label) * 0.6 +
               (matchCategory(aiArticle.material_type, article.category) ? 0.3 : 0) +
               (aiDiameter !== null && extractDiameterMm(article.specification) === aiDiameter ? 0.1 : 0),
      }))
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0 && scored[0].score >= 0.3) {
      const supplierNames: Record<string, string> = { NSB: 'Nussbaum', ST: 'Sanitas Troesch', GM: 'Getaz Miauton' };
      prices.push({
        supplierCode: code,
        supplierName: supplierNames[code] || code,
        article: scored[0].article,
        matchConfidence: Number(scored[0].score.toFixed(3)),
      });
    }
  }

  // Sort by price ascending (cheapest first)
  prices.sort((a, b) => a.article.unit_price - b.article.unit_price);

  return { aiArticle, prices };
}
