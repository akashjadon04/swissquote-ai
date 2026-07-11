import type { FinancialSummary, QuoteConfig } from '@/types/database.types';

// ═══════════════════════════════════════════
// SwissQuote AI — Financial Calculation Engine
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
// Default Config Values
// ─────────────────────────────────────────

export const DEFAULT_CONFIG: QuoteConfig = {
  labourRate: 145,   // CHF/h (Geneva)
  labourHours: 8,    // Default for remplacement_canalisation
  marginPct: 15,     // 15% materials margin
  vatRate: 0.081,    // 8.1% Swiss VAT
  travelFee: 45,     // CHF
  canton: 'Genève',
};
