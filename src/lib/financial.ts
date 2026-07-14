import type { FinancialSummary, QuoteConfig } from '@/types/database.types';

// ═══════════════════════════════════════════
// AstraQuote (by Green AI Groupe) — Financial Calculation Engine
// ═══════════════════════════════════════════
// All amounts in CHF, rounded to 2 decimal places.
// Pure functions — fully testable, zero side effects.

/**
 * Round to 2 decimal places (Swiss rounding — standard).
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Round to nearest 5 centimes (Swiss Rappen rounding for totals).
 * Swiss standard: amounts are rounded to nearest 0.05 CHF.
 */
export function roundToRappen(n: number): number {
  return Math.round(n * 20) / 20;
}

/**
 * Format CHF amount for display.
 */
export function formatCHF(amount: number): string {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format CHF amount without currency symbol (for tables).
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─────────────────────────────────────────
// Core Calculation
// ─────────────────────────────────────────

interface QuoteItemForCalc {
  unit_price: number | null;
  quantity: number;
  line_total: number | null;
  is_missing: boolean;
}

/**
 * Calculate full financial summary for a quote.
 * 
 * Formula:
 *   Materials Subtotal = Σ (unit_price × quantity) for matched items
 *   Materials Margin = Materials Subtotal × margin%
 *   Labour Total = hours × rate (from canton)
 *   Subtotal excl. VAT = Materials + Margin + Labour + Travel
 *   VAT = Subtotal × vat_rate
 *   Total TTC = Subtotal + VAT
 */
export function calculateQuote(
  items: QuoteItemForCalc[],
  config: QuoteConfig
): FinancialSummary {
  // Materials subtotal — only priced (non-missing) items
  const materialsSubtotal = round2(
    items
      .filter(i => !i.is_missing && i.line_total !== null && i.line_total > 0)
      .reduce((sum, i) => sum + (i.line_total || 0), 0)
  );

  // Margin on materials
  const materialsMargin = round2(materialsSubtotal * (config.marginPct / 100));

  // Labour
  const labourTotal = round2(config.labourHours * config.labourRate);

  // Subtotal before VAT
  const subtotalExclVat = round2(
    materialsSubtotal + materialsMargin + labourTotal + config.travelFee
  );

  // Swiss VAT (8.1%)
  const vatAmount = round2(subtotalExclVat * config.vatRate);

  // Total including VAT (rounded to nearest Rappen)
  const totalInclVat = roundToRappen(subtotalExclVat + vatAmount);

  return {
    materialsSubtotal,
    materialsMarginPct: config.marginPct,
    materialsMargin,
    labourHours: config.labourHours,
    labourRate: config.labourRate,
    labourTotal,
    travelFee: config.travelFee,
    subtotalExclVat,
    vatRate: config.vatRate,
    vatAmount,
    totalInclVat,
  };
}

/**
 * Calculate line total for a single item.
 */
export function calculateLineTotal(unitPrice: number | null, quantity: number): number | null {
  if (unitPrice === null || unitPrice <= 0) return null;
  return round2(unitPrice * quantity);
}

/**
 * Recalculate all line totals and financial summary.
 */
export function recalculateAll(
  items: { unit_price: number | null; quantity: number; is_missing: boolean }[],
  config: QuoteConfig
): { items: QuoteItemForCalc[]; financials: FinancialSummary } {
  const calculatedItems = items.map(item => ({
    ...item,
    line_total: calculateLineTotal(item.unit_price, item.quantity),
  }));

  const financials = calculateQuote(calculatedItems, config);

  return { items: calculatedItems, financials };
}

// ─────────────────────────────────────────
// Labour Time Table (hours per unit per category)
// Based on Swiss plumbing professional standards (SIA/SICC)
// ─────────────────────────────────────────

/**
 * Labour hours per unit for each catalogue category.
 * Per metre for pipe/drainage, per piece for fittings/equipment.
 */
export const LABOUR_TIME_TABLE: Record<string, number> = {
  // Pipes — per linear metre (incl. cutting, fitting, fixing)
  tuyau_inox:        0.50,  // 30 min/m for press-fit inox
  evacuation_pe:     0.45,  // 27 min/m for PE drainage
  isolation:         0.20,  // 12 min/m for thermal insulation
  // Fittings — per piece
  coude_sertir:      0.25,  // 15 min per elbow (incl. press-fit)
  manchon:           0.20,  // 12 min per coupling/tee
  collier:           0.10,  // 6 min per bracket/clamp
  transition:        0.30,  // 18 min per transition piece
  // Valves — per piece
  robinetterie:      0.75,  // 45 min per valve/mixer/tap
  reducteur:         0.50,  // 30 min per pressure reducer
  // Major equipment — per unit
  chaudiere:         16.0,  // 16h per boiler (decommission + install + commission)
  ballon_ecs:         4.0,  // 4h per hot water tank
  circulateur:        2.0,  // 2h per circulator pump
  radiateur:          2.5,  // 2.5h per radiator panel (incl. connections)
  nourrice:           1.5,  // 1.5h per distribution manifold
  // Geberit — per unit
  geberit_duofix:     4.0,  // 4h per wall-hung toilet frame
  geberit_evacuation: 1.0,  // 1h per drain/trap
  // Sanitaire — per unit
  appareil_sanitaire: 2.0,  // 2h per sanitary appliance
  // Dismantling — per piece/metre
  depose:             0.75, // 45 min per item removed
  // Default fallback
  autre:              0.30,
};

/**
 * Calculate total labour hours from matched items.
 *
 * HARD RULE: items with quantity = null contribute ZERO hours.
 * We NEVER invent a quantity — the user must enter it.
 *
 * @param items Array of items with category, quantity, and unit
 * @param complexityMultiplier 1.0 = standard | 1.3 = occupied/narrow | 1.6 = very complex
 */
export function calculateLabourFromItems(
  items: { category?: string | null; quantity: number | null; unit?: string | null; isMissing?: boolean }[],
  complexityMultiplier: number = 1.0
): number {
  let totalHours = 0;

  for (const item of items) {
    // NEVER invent quantity — skip null quantities
    if (item.quantity === null || item.quantity === undefined || item.quantity <= 0) continue;

    const category = (item.category || 'autre').toLowerCase();
    const hours = LABOUR_TIME_TABLE[category] ?? LABOUR_TIME_TABLE['autre'];
    totalHours += hours * item.quantity;
  }

  // Apply complexity multiplier (round to 0.5h precision)
  const adjusted = totalHours * complexityMultiplier;
  return Math.round(adjusted * 2) / 2; // round to nearest 0.5h
}

/**
 * Map complexity string from AI to numeric multiplier.
 */
export function complexityMultiplier(complexity?: string | null): number {
  if (!complexity) return 1.0;
  if (complexity === 'complexe') return 1.3;
  if (complexity === 'tres_complexe') return 1.6;
  return 1.0;
}

// ─────────────────────────────────────────
// Default Config Values
// ─────────────────────────────────────────

export const DEFAULT_CONFIG: QuoteConfig = {
  labourRate: 145,   // CHF/h (Geneva)
  labourHours: 0,    // Calculated dynamically from items — never hardcoded
  marginPct: 15,     // 15% materials margin
  vatRate: 0.081,    // 8.1% Swiss VAT
  travelFee: 45,     // CHF
  canton: 'Genève',
};

/**
 * Parse labor duration and installers from description.
 * Standard workday: 8 hours.
 * Returns calculated hours or null if not found.
 */
export function parseLabourFromDescription(description: string): number | null {
  const text = description.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const numberMap: Record<string, number> = {
    'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5,
    'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
    '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10
  };

  const getNumber = (word: string): number | null => {
    const clean = word.replace(',', '.');
    return numberMap[clean] ?? (parseFloat(clean) || null);
  };

  // Find "X jours/jour/j" - supporting decimal digits like 1.5 or 0,5
  const dayRegex = /(?:(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s*(?:jours?|j(?:\s|$|\.)))/gi;
  // Find "Y monteurs/installateurs/ouvriers/personnes/techniciens" - supporting decimals if any
  const workerRegex = /(?:(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s*(?:monteurs?|installateurs?|ouvriers?|techniciens?|personnes?|hommes?|poseurs?))/gi;

  let days: number | null = null;
  let workers = 1;

  let dayMatch;
  dayRegex.lastIndex = 0;
  while ((dayMatch = dayRegex.exec(text)) !== null) {
    const val = getNumber(dayMatch[1]);
    if (val !== null) {
      days = val;
      break;
    }
  }

  let workerMatch;
  workerRegex.lastIndex = 0;
  while ((workerMatch = workerRegex.exec(text)) !== null) {
    const val = getNumber(workerMatch[1]);
    if (val !== null) {
      workers = val;
      break;
    }
  }

  if (days !== null) {
    return days * 8 * workers;
  }

  // Fallback to searching for "X heures" or "X h"
  const hourRegex = /(?:(\d+(?:[.,]\d+)?|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s*(?:heures?|h(?:\s|$|\.)))/gi;
  let hours: number | null = null;
  let hourMatch;
  hourRegex.lastIndex = 0;
  while ((hourMatch = hourRegex.exec(text)) !== null) {
    const val = getNumber(hourMatch[1]);
    if (val !== null) {
      hours = val;
      break;
    }
  }

  return hours;
}

