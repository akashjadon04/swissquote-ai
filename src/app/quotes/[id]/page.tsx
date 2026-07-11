'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store';
import { formatCHF, formatAmount } from '@/lib/financial';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type QuoteStatus = 'draft' | 'review' | 'finalized' | 'missing_items' | 'sent' | 'accepted' | 'invoiced';

interface QuoteItem {
  id: string;
  reference: string | null;
  description: string;
  specification: string | null;
  quantity: number;
  unit: string;
  unit_price: number | null;
  line_total: number | null;
  is_missing: boolean;
  is_manually_added: boolean;
  ai_confidence: number | null;
  sort_order: number;
}

interface QuoteSection {
  id: string;
  section_code: string | null;
  section_label: string | null;
  description: string | null;
  sort_order: number;
  items: QuoteItem[];
}

interface FullQuote {
  id: string;
  quote_number: string;
  status: QuoteStatus;
  client_name: string | null;
  client_address: string | null;
  client_postal: string | null;
  client_city: string | null;
  client_contact: string | null;
  building_address: string | null;
  apartment_zone: string | null;
  subject_line: string | null;
  original_description: string | null;
  technical_summary: string | null;
  ai_confidence: number | null;
  ai_provider: string | null;
  preferred_supplier: string | null;
  canton: string | null;
  has_missing_items: boolean;
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
  exclusions: string[] | null;
  technician_name: string | null;
  company_name: string | null;
  sections: QuoteSection[];
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; bg: string }> = {
  draft:         { label: 'Brouillon',         color: 'var(--color-text-muted)', bg: 'var(--color-surface-2)' },
  review:        { label: 'En révision',        color: 'var(--color-warning)',    bg: 'var(--color-warning-light)' },
  finalized:     { label: 'Finalisé',           color: 'var(--color-success)',    bg: 'var(--color-success-light)' },
  missing_items: { label: 'Articles manquants', color: 'var(--color-danger)',     bg: 'var(--color-danger-light)' },
  sent:          { label: 'Envoyé',             color: 'var(--color-accent)',     bg: 'var(--color-accent-light)' },
  accepted:      { label: 'Accepté',            color: '#16A34A',                 bg: '#F0FDF4' },
  invoiced:      { label: 'Facturé',            color: '#7C3AED',                 bg: '#F5F3FF' },
};

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setIsMobile } = useAppStore();
  const [quote, setQuote] = useState<FullQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'financial' | 'raw'>('overview');
  const [statusChanging, setStatusChanging] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setIsMobile]);

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotes/${id}`);
      if (!res.ok) { router.push('/quotes'); return; }
      const data = await res.json();
      setQuote(data);
    } catch {
      router.push('/quotes');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchQuote(); }, [fetchQuote]);

  const changeStatus = async (newStatus: QuoteStatus) => {
    if (!quote) return;
    setStatusChanging(true);
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setQuote(q => q ? { ...q, status: newStatus } : q);
      toast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus]?.label}`);
    } else {
      toast.error('Erreur lors du changement de statut');
    }
    setStatusChanging(false);
  };

  const downloadPDF = () => {
    window.open(`/quotes/${id}/print`, '_blank');
    toast.success('Ouverture de l\'aperçu PDF…');
  };

  const duplicate = async () => {
    const res = await fetch(`/api/quotes/${id}/duplicate`, { method: 'POST' });
    if (res.ok) {
      const newQuote = await res.json();
      toast.success(`Devis dupliqué : ${newQuote.quote_number}`);
      router.push(`/quotes/${newQuote.id}`);
    } else {
      toast.error('Erreur lors de la duplication');
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <TopBar />
          <div className="page-content">
            <div className="qd-skeleton">
              <div className="skeleton-line w-40" style={{ height: 20 }} />
              <div className="skeleton-line w-60" style={{ height: 14 }} />
              <div className="clay-card" style={{ marginTop: 24, height: 160 }}>
                <div className="skeleton-line" style={{ height: 14, width: '40%' }} />
                <div className="skeleton-line" style={{ height: 12, width: '60%' }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!quote) return null;

  const status = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
  const allItems = quote.sections.flatMap(s => s.items);
  const missingCount = allItems.filter(i => i.is_missing).length;
  const createdDate = new Date(quote.created_at).toLocaleDateString('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar breadcrumb={['Devis', quote.quote_number]} />
        <div className="page-content">

          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="qd-header clay-card"
          >
            <div className="qd-header-top">
              <div className="qd-header-info">
                <div className="qd-quote-number">{quote.quote_number}</div>
                <h1 className="qd-client-name">{quote.client_name || 'Client non renseigné'}</h1>
                {quote.building_address && (
                  <div className="qd-address">📍 {quote.building_address}{quote.apartment_zone ? ` — ${quote.apartment_zone}` : ''}</div>
                )}
                <div className="qd-meta-row">
                  <span className="qd-date">Créé le {createdDate}</span>
                  {quote.canton && <span className="qd-canton">Canton: {quote.canton}</span>}
                  {quote.preferred_supplier && (
                    <span className={`ql-supplier-badge ql-supplier-${quote.preferred_supplier.toLowerCase()}`}>
                      {quote.preferred_supplier}
                    </span>
                  )}
                </div>
              </div>

              <div className="qd-header-actions">
                {/* Status selector */}
                <div className="qd-status-select-wrap">
                  <span className="ql-status-pill" style={{ color: status.color, backgroundColor: status.bg }}>
                    {status.label}
                  </span>
                  <select
                    className="qd-status-select"
                    value={quote.status}
                    onChange={e => changeStatus(e.target.value as QuoteStatus)}
                    disabled={statusChanging}
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Action buttons */}
                <div className="qd-action-buttons">
                  <button className="clay-button clay-button--primary" onClick={downloadPDF}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M7 2v7M4 6l3 3 3-3" />
                      <path d="M2 11h10" />
                    </svg>
                    Télécharger PDF
                  </button>
                  <button className="clay-button" onClick={duplicate} title="Dupliquer">
                    📋
                  </button>
                  <Link href={`/quotes/${id}/edit`} className="clay-button" title="Modifier">
                    ✏️
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="qd-stats">
              <div className="qd-stat">
                <span className="qd-stat-label">Total TTC</span>
                <span className="qd-stat-value qd-stat-total">
                  {quote.total_incl_vat ? formatCHF(quote.total_incl_vat) : '—'}
                </span>
              </div>
              <div className="qd-stat">
                <span className="qd-stat-label">Articles</span>
                <span className="qd-stat-value">{allItems.length}</span>
              </div>
              <div className="qd-stat">
                <span className="qd-stat-label">Manquants</span>
                <span className="qd-stat-value" style={{ color: missingCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {missingCount > 0 ? `⚠️ ${missingCount}` : '✓ 0'}
                </span>
              </div>
              <div className="qd-stat">
                <span className="qd-stat-label">Confiance IA</span>
                <span className="qd-stat-value">
                  {quote.ai_confidence !== null
                    ? `${Math.round(quote.ai_confidence * 100)}%`
                    : '—'}
                </span>
              </div>
              <div className="qd-stat">
                <span className="qd-stat-label">Fournisseur IA</span>
                <span className="qd-stat-value" style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  {quote.ai_provider || '—'}
                </span>
              </div>
            </div>

            {/* Missing items warning */}
            {missingCount > 0 && (
              <div className="qd-missing-warning">
                <span>⚠️</span>
                <span>{missingCount} article{missingCount > 1 ? 's' : ''} sans correspondance dans le catalogue. Le total est partiel.</span>
              </div>
            )}
          </motion.div>

          {/* Tabs */}
          <div className="qd-tabs">
            {[
              { id: 'overview', label: 'Aperçu' },
              { id: 'items', label: `Articles (${allItems.length})` },
              { id: 'financial', label: 'Finances' },
              { id: 'raw', label: 'Description brute' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`qd-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'overview' && <OverviewTab quote={quote} />}
              {activeTab === 'items' && <ItemsTab quote={quote} onRefresh={fetchQuote} />}
              {activeTab === 'financial' && <FinancialTab quote={quote} onUpdate={fetchQuote} />}
              {activeTab === 'raw' && <RawTab quote={quote} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

// ─────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────

function OverviewTab({ quote }: { quote: FullQuote }) {
  return (
    <div className="qd-overview-grid">
      {/* Client block */}
      <div className="clay-card qd-info-card">
        <h3 className="qd-info-card-title">👤 Client</h3>
        <div className="qd-info-row"><span>Nom</span><strong>{quote.client_name || '—'}</strong></div>
        <div className="qd-info-row"><span>Adresse</span><span>{quote.client_address || '—'}</span></div>
        {quote.client_postal && <div className="qd-info-row"><span>NPA / Ville</span><span>{quote.client_postal} {quote.client_city}</span></div>}
        {quote.client_contact && <div className="qd-info-row"><span>Contact</span><span>{quote.client_contact}</span></div>}
      </div>

      {/* Work block */}
      <div className="clay-card qd-info-card">
        <h3 className="qd-info-card-title">🏗️ Chantier</h3>
        <div className="qd-info-row"><span>Adresse</span><strong>{quote.building_address || '—'}</strong></div>
        {quote.apartment_zone && <div className="qd-info-row"><span>Zone / Local</span><span>{quote.apartment_zone}</span></div>}
        <div className="qd-info-row"><span>Canton</span><span>{quote.canton || 'Genève'}</span></div>
        {quote.subject_line && <div className="qd-info-row"><span>Objet</span><em style={{ fontSize: 13 }}>{quote.subject_line}</em></div>}
      </div>

      {/* AI Summary */}
      {quote.technical_summary && (
        <div className="clay-card qd-info-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="qd-info-card-title">
            🤖 Analyse IA
            {quote.ai_confidence !== null && (
              <span className="qd-confidence-badge" style={{
                background: quote.ai_confidence > 0.8 ? 'var(--color-success-light)' : quote.ai_confidence > 0.6 ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                color: quote.ai_confidence > 0.8 ? 'var(--color-success)' : quote.ai_confidence > 0.6 ? 'var(--color-warning)' : 'var(--color-danger)',
              }}>
                {Math.round(quote.ai_confidence * 100)}% confiance
              </span>
            )}
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--color-text-muted)', margin: 0 }}>
            {quote.technical_summary}
          </p>
        </div>
      )}

      {/* Exclusions */}
      {quote.exclusions && quote.exclusions.length > 0 && (
        <div className="clay-card qd-info-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="qd-info-card-title">🚫 Non compris</h3>
          <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {quote.exclusions.map((exc, i) => <li key={i}>{exc}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Items Tab
// ─────────────────────────────────────────

function ItemsTab({ quote, onRefresh }: { quote: FullQuote; onRefresh: () => void }) {
  return (
    <div className="qd-items">
      {quote.sections.sort((a, b) => a.sort_order - b.sort_order).map((section, sIdx) => (
        <div key={section.id} className="clay-card qd-section" style={{ animationDelay: `${sIdx * 50}ms` }}>
          <div className="qd-section-header">
            {section.section_code && (
              <span className="qd-section-code">{section.section_code}</span>
            )}
            <span className="qd-section-label">{section.section_label || 'Section'}</span>
            <span className="qd-section-count">{section.items.length} articles</span>
          </div>

          {section.description && (
            <p className="qd-section-desc">{section.description}</p>
          )}

          <div className="qd-items-table-wrap mt-4 mb-10 overflow-x-auto w-full">
            <table className="qd-items-table w-full text-left border-collapse block md:table">
              <thead className="hidden md:table-header-group">
                <tr>
                  <th className="col-ref p-4 font-semibold text-text-muted">Référence</th>
                  <th className="col-desc p-4 font-semibold text-text-muted">Désignation</th>
                  <th className="col-spec p-4 font-semibold text-text-muted">Spéc.</th>
                  <th className="col-qty p-4 font-semibold text-text-muted">Qté</th>
                  <th className="col-unit p-4 font-semibold text-text-muted">U.</th>
                  <th className="col-price p-4 font-semibold text-text-muted">P.U. HT</th>
                  <th className="col-total p-4 font-semibold text-text-muted">Total HT</th>
                  <th className="col-confidence p-4 font-semibold text-text-muted">IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-strong block md:table-row-group">
                {section.items.sort((a, b) => a.sort_order - b.sort_order).map(item => (
                  <tr key={item.id} className={`group hover:bg-surface-2 transition-colors flex flex-col md:table-row mb-4 md:mb-0 border border-border md:border-0 rounded-xl md:rounded-none overflow-hidden p-4 md:p-0 relative ${item.is_missing ? 'item-missing bg-danger/10' : 'bg-surface-1 md:bg-transparent'}`}>
                    <td className="p-2 md:p-4 border-b border-border/30 md:border-0 block md:table-cell">
                      <span className="md:hidden text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Référence</span>
                      {item.reference
                        ? <code className="cat-ref px-2 py-1 bg-surface-2 rounded-md text-sm border border-border-strong font-mono shadow-sm">{item.reference}</code>
                        : <span className="missing-label text-xs text-danger font-semibold bg-danger/20 px-2 py-0.5 rounded-full border border-danger/30">Manquant</span>
                      }
                    </td>
                    <td className="item-desc p-2 md:p-4 border-b border-border/30 md:border-0 block md:table-cell">
                      <span className="md:hidden text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Désignation</span>
                      <span className="font-medium text-text-primary">{item.description}</span>
                    </td>
                    <td className="item-spec p-2 md:p-4 border-b border-border/30 md:border-0 block md:table-cell text-text-muted">
                      <span className="md:hidden text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">Spéc.</span>
                      {item.specification || '—'}
                    </td>
                    <td className="item-num p-2 md:p-4 border-b border-border/30 md:border-0 flex items-center justify-between md:table-cell">
                      <span className="md:hidden text-[10px] font-bold text-text-muted uppercase tracking-wider block">Qté</span>
                      {item.quantity}
                    </td>
                    <td className="item-unit p-2 md:p-4 border-b border-border/30 md:border-0 flex items-center justify-between md:table-cell text-text-muted">
                      <span className="md:hidden text-[10px] font-bold text-text-muted uppercase tracking-wider block">U.</span>
                      {item.unit}
                    </td>
                    <td className="item-num p-2 md:p-4 border-b border-border/30 md:border-0 flex items-center justify-between md:table-cell">
                      <span className="md:hidden text-[10px] font-bold text-text-muted uppercase tracking-wider block">P.U. HT</span>
                      {item.unit_price ? formatAmount(item.unit_price) : '—'}
                    </td>
                    <td className="item-num item-total p-2 md:p-4 flex items-center justify-between md:table-cell">
                      <span className="md:hidden text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total HT</span>
                      {item.line_total ? <strong className="text-accent-light">{formatAmount(item.line_total)}</strong> : '—'}
                    </td>
                    <td className="p-2 md:p-4 flex flex-col md:table-cell justify-center">
                      <span className="md:hidden text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">IA Confiance</span>
                      {item.ai_confidence !== null && (
                        <div
                          className="confidence-bar w-full md:w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden"
                          title={`${Math.round(item.ai_confidence * 100)}% confiance`}
                        >
                          <div
                            className="confidence-fill h-full rounded-full"
                            style={{
                              width: `${Math.round(item.ai_confidence * 100)}%`,
                              background: item.ai_confidence > 0.75 ? 'var(--color-success)' : item.ai_confidence > 0.5 ? 'var(--color-warning)' : 'var(--color-danger)',
                            }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Financial Tab
// ─────────────────────────────────────────

function FinancialTab({ quote, onUpdate }: { quote: FullQuote; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    labour_hours: quote.labour_hours ?? 0,
    labour_rate: quote.labour_rate ?? 145,
    travel_fee: quote.travel_fee ?? 45,
    materials_margin_pct: quote.materials_margin_pct ?? 15,
  });

  const saveFinancials = async () => {
    // Recalculate
    const labourTotal = values.labour_hours * values.labour_rate;
    const materialsMargin = (quote.materials_subtotal ?? 0) * (values.materials_margin_pct / 100);
    const subtotalExclVat = (quote.materials_subtotal ?? 0) + materialsMargin + labourTotal + values.travel_fee;
    const vatAmount = subtotalExclVat * (quote.vat_rate ?? 0.081);
    const totalInclVat = subtotalExclVat + vatAmount;

    const res = await fetch(`/api/quotes/${quote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        labour_hours: values.labour_hours,
        labour_rate: values.labour_rate,
        travel_fee: values.travel_fee,
        materials_margin_pct: values.materials_margin_pct,
        materials_margin: Number(materialsMargin.toFixed(2)),
        labour_total: Number(labourTotal.toFixed(2)),
        subtotal_excl_vat: Number(subtotalExclVat.toFixed(2)),
        vat_amount: Number(vatAmount.toFixed(2)),
        total_incl_vat: Number(totalInclVat.toFixed(2)),
      }),
    });
    if (res.ok) {
      toast.success('Finances recalculées et sauvegardées');
      setEditing(false);
      onUpdate();
    } else {
      toast.error('Erreur de sauvegarde');
    }
  };

  return (
    <div className="qd-financial">
      <div className="qd-financial-grid">
        {/* Parameters */}
        <div className="clay-card">
          <div className="qd-financial-header">
            <h3>⚙️ Paramètres de calcul</h3>
            <button className="clay-button" style={{ fontSize: 12 }} onClick={() => setEditing(!editing)}>
              {editing ? '✕ Annuler' : '✏️ Modifier'}
            </button>
          </div>

          <div className="qd-param-row">
            <span className="qd-param-label">Heures MO</span>
            {editing
              ? <input type="number" className="config-input" style={{ maxWidth: 90, textAlign: 'right' }} value={values.labour_hours} onChange={e => setValues(v => ({ ...v, labour_hours: parseFloat(e.target.value) || 0 }))} />
              : <span className="qd-param-value">{quote.labour_hours ?? 0}h</span>
            }
          </div>
          <div className="qd-param-row">
            <span className="qd-param-label">Taux horaire</span>
            {editing
              ? <input type="number" className="config-input" style={{ maxWidth: 90, textAlign: 'right' }} value={values.labour_rate} onChange={e => setValues(v => ({ ...v, labour_rate: parseFloat(e.target.value) || 145 }))} />
              : <span className="qd-param-value">{formatAmount(quote.labour_rate ?? 145)} CHF/h</span>
            }
          </div>
          <div className="qd-param-row">
            <span className="qd-param-label">Marge matériaux</span>
            {editing
              ? <input type="number" className="config-input" style={{ maxWidth: 90, textAlign: 'right' }} value={values.materials_margin_pct} onChange={e => setValues(v => ({ ...v, materials_margin_pct: parseFloat(e.target.value) || 15 }))} />
              : <span className="qd-param-value">{quote.materials_margin_pct ?? 15}%</span>
            }
          </div>
          <div className="qd-param-row">
            <span className="qd-param-label">Frais déplacement</span>
            {editing
              ? <input type="number" className="config-input" style={{ maxWidth: 90, textAlign: 'right' }} value={values.travel_fee} onChange={e => setValues(v => ({ ...v, travel_fee: parseFloat(e.target.value) || 0 }))} />
              : <span className="qd-param-value">{formatAmount(quote.travel_fee ?? 45)} CHF</span>
            }
          </div>

          {editing && (
            <motion.button
              className="clay-button clay-button--primary"
              style={{ width: '100%', marginTop: 'var(--space-4)', justifyContent: 'center' }}
              whileTap={{ scale: 0.97 }}
              onClick={saveFinancials}
            >
              💾 Recalculer et sauvegarder
            </motion.button>
          )}
        </div>

        {/* Summary */}
        <div className="clay-card">
          <h3 className="qd-financial-title">📊 Récapitulatif</h3>
          <div className="qd-fin-rows">
            <div className="qd-fin-row">
              <span>Matériaux HT</span>
              <span>{formatCHF(quote.materials_subtotal ?? 0)}</span>
            </div>
            <div className="qd-fin-row muted">
              <span>+ Marge ({quote.materials_margin_pct ?? 15}%)</span>
              <span>{formatCHF(quote.materials_margin ?? 0)}</span>
            </div>
            <div className="qd-fin-row">
              <span>Main-d'œuvre</span>
              <span>{formatCHF(quote.labour_total ?? 0)}</span>
            </div>
            <div className="qd-fin-row muted">
              <span>{quote.labour_hours ?? 0}h × {formatAmount(quote.labour_rate ?? 145)} CHF/h</span>
            </div>
            <div className="qd-fin-row">
              <span>Déplacement</span>
              <span>{formatCHF(quote.travel_fee ?? 0)}</span>
            </div>
            <div className="qd-fin-divider" />
            <div className="qd-fin-row subtotal">
              <span>Sous-total HT</span>
              <span>{formatCHF(quote.subtotal_excl_vat ?? 0)}</span>
            </div>
            <div className="qd-fin-row muted">
              <span>TVA ({((quote.vat_rate ?? 0.081) * 100).toFixed(1)}%)</span>
              <span>{formatCHF(quote.vat_amount ?? 0)}</span>
            </div>
            <div className="qd-fin-divider" />
            <div className="qd-fin-row total">
              <span>TOTAL TTC</span>
              <strong>{formatCHF(quote.total_incl_vat ?? 0)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Raw Description Tab
// ─────────────────────────────────────────

function RawTab({ quote }: { quote: FullQuote }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {quote.original_description && (
        <div className="clay-card">
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)' }}>
            📝 Description originale
          </h3>
          <pre className="qd-raw-text">{quote.original_description}</pre>
        </div>
      )}
      {quote.technical_summary && (
        <div className="clay-card">
          <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-text-primary)' }}>
            🤖 Résumé technique IA
          </h3>
          <p className="qd-raw-text" style={{ whiteSpace: 'pre-wrap' }}>{quote.technical_summary}</p>
        </div>
      )}
    </div>
  );
}
