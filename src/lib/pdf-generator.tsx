import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer';

// ═══════════════════════════════════════════
// AstraQuote (by Green AI Groupe) — PDF Document (J.J. Pallud format)
// ═══════════════════════════════════════════

// Register fonts (Helvetica is built-in, no external needed)
// Using built-in PDF fonts for reliability

const COLORS = {
  accent: '#2563EB',
  text: '#1A1916',
  muted: '#6B6860',
  border: '#E5E3DE',
  surface: '#F8F7F5',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
};

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },

  // ── Header ──────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  companyBlock: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.accent,
    marginBottom: 4,
  },
  companyAddress: {
    fontSize: 8,
    color: COLORS.muted,
    lineHeight: 1.5,
  },
  quoteMetaBlock: {
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.accent,
    marginBottom: 4,
  },
  quoteNumber: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  quoteDate: {
    fontSize: 8,
    color: COLORS.muted,
  },

  // ── Client / Building Info ───────────
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  infoBlock: {
    flex: 1,
    padding: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoBlockTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoLine: {
    fontSize: 9,
    color: COLORS.text,
    lineHeight: 1.5,
  },
  infoLineMuted: {
    fontSize: 8,
    color: COLORS.muted,
    lineHeight: 1.5,
  },

  // ── Subject Line ─────────────────────
  subjectRow: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#EFF4FF',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  subjectLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  subjectText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
  },

  // ── Section Header ───────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    padding: '6 8',
    marginBottom: 0,
    borderRadius: 0,
  },
  sectionCode: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: 'rgba(255,255,255,0.7)',
    marginRight: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    flex: 1,
  },

  // ── Description verbatim ─────────────
  sectionDescription: {
    fontSize: 8,
    color: COLORS.muted,
    lineHeight: 1.6,
    padding: '6 8',
    backgroundColor: COLORS.surface,
    marginBottom: 2,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: COLORS.border,
    fontStyle: 'italic',
  },

  // ── Articles Table ───────────────────
  tableContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F2F1EE',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: '4 6',
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '4 6',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.surface,
  },
  tableRowMissing: {
    backgroundColor: '#FEF9F2',
  },
  cell: {
    fontSize: 8,
    color: COLORS.text,
    lineHeight: 1.4,
  },
  cellMuted: {
    fontSize: 7,
    color: COLORS.muted,
  },
  cellMono: {
    fontSize: 8,
    fontFamily: 'Courier',
  },
  cellMissingLabel: {
    fontSize: 7,
    color: COLORS.warning,
    fontStyle: 'italic',
  },

  // Column widths
  colRef:   { width: 70 },
  colDesc:  { flex: 1 },
  colQty:   { width: 30, textAlign: 'right' },
  colUnit:  { width: 25, textAlign: 'center' },
  colPrice: { width: 65, textAlign: 'right' },
  colTotal: { width: 85, textAlign: 'right' },

  // ── Financial Summary ────────────────
  financialSection: {
    marginTop: 12,
    marginLeft: 'auto',
    width: 280,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  financialRowAlt: {
    backgroundColor: COLORS.surface,
  },
  financialLabel: {
    fontSize: 8,
    color: COLORS.text,
  },
  financialValue: {
    fontSize: 8,
    fontFamily: 'Courier',
    color: COLORS.text,
    textAlign: 'right',
  },
  financialMuted: {
    color: COLORS.muted,
    fontSize: 7,
  },
  financialDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  financialSubtotal: {
    fontFamily: 'Helvetica-Bold',
  },
  financialTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '8 8',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    marginTop: 4,
  },
  financialTotalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
  },
  financialTotalValue: {
    fontSize: 11,
    fontFamily: 'Courier-Bold',
    color: '#FFFFFF',
  },

  // ── Exclusions ───────────────────────
  exclusionsSection: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  exclusionsTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.warning,
    marginBottom: 4,
  },
  exclusionItem: {
    fontSize: 8,
    color: COLORS.text,
    lineHeight: 1.6,
  },

  // ── Missing Items Warning ────────────
  missingWarning: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF9F2',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  missingWarningText: {
    fontSize: 8,
    color: COLORS.warning,
    fontStyle: 'italic',
    flex: 1,
  },

  // ── Signature Block ──────────────────
  signatureSection: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 20,
  },
  signatureBox: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    minHeight: 60,
  },
  signatureTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.muted,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  signatureRole: {
    fontSize: 7,
    color: COLORS.muted,
  },

  // ── Footer ──────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.muted,
  },
  pageNumber: {
    fontSize: 7,
    color: COLORS.muted,
  },
});

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function formatCHFPDF(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
  }).format(n);
}

function formatAmountPDF(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('fr-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// ─────────────────────────────────────────
// Document Component
// ─────────────────────────────────────────

interface PDFQuote {
  quote_number: string;
  client_name: string | null;
  client_address: string | null;
  client_postal: string | null;
  client_city: string | null;
  client_contact: string | null;
  building_address: string | null;
  apartment_zone: string | null;
  subject_line: string | null;
  company_name: string | null;
  company_address: string | null;
  technician_name: string | null;
  canton: string | null;
  has_missing_items: boolean;
  exclusions: string[] | null;
  materials_subtotal: number | null;
  materials_margin_pct: number | null;
  materials_margin: number | null;
  labour_hours: number | null;
  labour_rate: number | null;
  labour_total: number | null;
  travel_fee: number | null;
  subtotal_excl_vat: number | null;
  vat_rate: number | null;
  vat_amount: number | null;
  total_incl_vat: number | null;
  created_at: string;
  sections: {
    id: string;
    section_code: string | null;
    section_label: string | null;
    description: string | null;
    sort_order: number;
    items: {
      id: string;
      reference: string | null;
      description: string;
      quantity: number;
      unit: string;
      unit_price: number | null;
      line_total: number | null;
      is_missing: boolean;
      sort_order: number;
    }[];
  }[];
}

function QuoteDocument({ quote }: { quote: PDFQuote }) {
  const date = new Date(quote.created_at).toLocaleDateString('fr-CH', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <Document
      title={`Devis ${quote.quote_number}`}
      author={quote.company_name || 'AstraQuote (by Green AI Groupe)'}
      subject="Devis de travaux"
      creator="AstraQuote (by Green AI Groupe)"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>{quote.company_name || 'J.J. Pallud SA'}</Text>
            <Text style={styles.companyAddress}>
              {quote.company_address || 'Route de Frontenex 62, 1207 Genève'}
              {'\n'}Tél: +41 22 700 00 00  |  info@jjpallud.ch
            </Text>
          </View>
          <View style={styles.quoteMetaBlock}>
            <Text style={styles.quoteTitle}>DEVIS</Text>
            <Text style={styles.quoteNumber}>N° {quote.quote_number}</Text>
            <Text style={styles.quoteDate}>Date: {date}</Text>
          </View>
        </View>

        {/* Client + Building Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>CLIENT</Text>
            <Text style={styles.infoLine}>{quote.client_name || '—'}</Text>
            {quote.client_address && <Text style={styles.infoLineMuted}>{quote.client_address}</Text>}
            {(quote.client_postal || quote.client_city) && (
              <Text style={styles.infoLineMuted}>{[quote.client_postal, quote.client_city].filter(Boolean).join(' ')}</Text>
            )}
            {quote.client_contact && <Text style={styles.infoLineMuted}>{quote.client_contact}</Text>}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>CHANTIER</Text>
            <Text style={styles.infoLine}>{quote.building_address || '—'}</Text>
            {quote.apartment_zone && <Text style={styles.infoLineMuted}>{quote.apartment_zone}</Text>}
            {quote.canton && <Text style={styles.infoLineMuted}>Canton: {quote.canton}</Text>}
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoBlockTitle}>TECHNICIEN</Text>
            <Text style={styles.infoLine}>{quote.technician_name || '—'}</Text>
          </View>
        </View>

        {/* Subject */}
        {quote.subject_line && (
          <View style={styles.subjectRow}>
            <Text style={styles.subjectLabel}>Objet des travaux</Text>
            <Text style={styles.subjectText}>{quote.subject_line}</Text>
          </View>
        )}

        {/* Sections */}
        {(quote.sections || []).sort((a, b) => a.sort_order - b.sort_order).map((section) => (
          <View key={section.id}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              {section.section_code && <Text style={styles.sectionCode}>{section.section_code}</Text>}
              <Text style={styles.sectionLabel}>{section.section_label || 'Section'}</Text>
            </View>

            {/* Description verbatim (optional) */}
            {section.description && (
              <Text style={styles.sectionDescription}>{section.description}</Text>
            )}

            {/* Articles Table */}
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colRef]}>Référence</Text>
                <Text style={[styles.tableHeaderCell, styles.colDesc]}>Désignation</Text>
                <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
                <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unité</Text>
                <Text style={[styles.tableHeaderCell, styles.colPrice]}>P.U. HT</Text>
                <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total HT</Text>
              </View>

              {/* Table Rows */}
              {section.items.sort((a, b) => a.sort_order - b.sort_order).map((item, idx) => (
                <View
                  key={item.id}
                  wrap={false}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 ? styles.tableRowAlt : {},
                    item.is_missing ? styles.tableRowMissing : {},
                  ]}
                >
                  <View style={styles.colRef}>
                    {item.reference
                      ? <Text style={[styles.cellMono, { fontSize: 7 }]}>{item.reference}</Text>
                      : <Text style={styles.cellMissingLabel}>Article manquant</Text>
                    }
                  </View>
                  <View style={styles.colDesc}>
                    <Text style={styles.cell}>{item.description}</Text>
                  </View>
                  <View style={styles.colQty}>
                    <Text style={[styles.cellMono, { textAlign: 'right' }]}>{item.quantity}</Text>
                  </View>
                  <View style={styles.colUnit}>
                    <Text style={[styles.cellMuted, { textAlign: 'center' }]}>{item.unit}</Text>
                  </View>
                  <View style={styles.colPrice}>
                    <Text style={[styles.cellMono, { textAlign: 'right' }]}>
                      {item.unit_price ? formatAmountPDF(item.unit_price) : '—'}
                    </Text>
                  </View>
                  <View style={styles.colTotal}>
                    <Text style={[styles.cellMono, { textAlign: 'right', fontFamily: 'Courier-Bold' }]}>
                      {item.line_total ? formatAmountPDF(item.line_total) : '—'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Missing items warning */}
        {quote.has_missing_items && (
          <View style={styles.missingWarning}>
            <Text style={styles.missingWarningText}>
              ⚠ Ce devis contient des articles non référencés (signalés &quot;Article manquant&quot;). Le total indiqué est partiel. Les articles manquants devront être sourcés et ajoutés manuellement.
            </Text>
          </View>
        )}

        {/* Financial Summary */}
        <View style={styles.financialSection} wrap={false}>
          <View style={[styles.financialRow, styles.financialRowAlt]}>
            <Text style={styles.financialLabel}>Matériaux HT</Text>
            <Text style={styles.financialValue}>{formatCHFPDF(quote.materials_subtotal)}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={[styles.financialLabel, styles.financialMuted]}>
              Marge matériaux ({quote.materials_margin_pct ?? 15}%)
            </Text>
            <Text style={[styles.financialValue, styles.financialMuted]}>
              {formatCHFPDF(quote.materials_margin)}
            </Text>
          </View>
          <View style={[styles.financialRow, styles.financialRowAlt]}>
            <Text style={styles.financialLabel}>
              Main-d&apos;œuvre ({quote.labour_hours ?? 0}h × CHF {formatAmountPDF(quote.labour_rate)}/h)
            </Text>
            <Text style={styles.financialValue}>{formatCHFPDF(quote.labour_total)}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Frais de déplacement</Text>
            <Text style={styles.financialValue}>{formatCHFPDF(quote.travel_fee)}</Text>
          </View>
          <View style={styles.financialDivider} />
          <View style={[styles.financialRow, styles.financialRowAlt]}>
            <Text style={[styles.financialLabel, styles.financialSubtotal]}>Sous-total HT</Text>
            <Text style={[styles.financialValue, styles.financialSubtotal]}>
              {formatCHFPDF(quote.subtotal_excl_vat)}
            </Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={[styles.financialLabel, styles.financialMuted]}>
              TVA ({((quote.vat_rate ?? 0.081) * 100).toFixed(1)}%)
            </Text>
            <Text style={[styles.financialValue, styles.financialMuted]}>
              {formatCHFPDF(quote.vat_amount)}
            </Text>
          </View>
          <View style={styles.financialTotal}>
            <Text style={styles.financialTotalLabel}>TOTAL TTC</Text>
            <Text style={styles.financialTotalValue}>{formatCHFPDF(quote.total_incl_vat)}</Text>
          </View>
        </View>

        {/* Exclusions */}
        {quote.exclusions && quote.exclusions.length > 0 && (
          <View style={styles.exclusionsSection} wrap={false}>
            <Text style={styles.exclusionsTitle}>Non compris dans ce devis:</Text>
            {quote.exclusions.map((exc, i) => (
              <Text key={i} style={styles.exclusionItem}>• {exc}</Text>
            ))}
          </View>
        )}

        {/* Signature blocks */}
        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>POUR ACCORD CLIENT</Text>
            <Text style={styles.signatureRole}>Date et signature: ________________________</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>ÉTABLI PAR</Text>
            <Text style={styles.signatureName}>{quote.technician_name || 'Technicien'}</Text>
            <Text style={styles.signatureRole}>{quote.company_name || 'J.J. Pallud SA'}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {quote.company_name || 'J.J. Pallud SA'} — {quote.company_address || 'Genève'} — Devis généré par AstraQuote (by Green AI Groupe)
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────
// Export Function
// ─────────────────────────────────────────

export async function generateQuotePDF(quote: PDFQuote): Promise<Buffer> {
  const buffer = await renderToBuffer(<QuoteDocument quote={quote} />);
  return Buffer.from(buffer);
}
