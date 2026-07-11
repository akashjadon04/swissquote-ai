'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store';
import { formatCHF } from '@/lib/financial';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type QuoteStatus = 'draft' | 'review' | 'finalized' | 'missing_items' | 'sent' | 'accepted' | 'invoiced';

interface Quote {
  id: string;
  quote_number: string;
  status: QuoteStatus;
  client_name: string | null;
  building_address: string | null;
  intervention_type: string | null;
  total_incl_vat: number | null;
  has_missing_items: boolean;
  ai_confidence: number | null;
  preferred_supplier: string | null;
  canton: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; bg: string; border: string }> = {
  draft:         { label: 'Brouillon',       color: 'var(--color-text-muted)',   bg: 'var(--color-surface-2)',     border: 'var(--color-border)' },
  review:        { label: 'En révision',      color: 'var(--color-warning)',      bg: 'var(--color-warning-light)', border: 'var(--color-warning-border)' },
  finalized:     { label: 'Finalisé',         color: 'var(--color-success)',      bg: 'var(--color-success-light)', border: 'var(--color-success-border)' },
  missing_items: { label: 'Articles manquants', color: 'var(--color-danger)',    bg: 'var(--color-danger-light)',  border: 'var(--color-danger-border)' },
  sent:          { label: 'Envoyé',           color: 'var(--color-accent)',       bg: 'var(--color-accent-light)',  border: 'rgba(37,99,235,0.3)' },
  accepted:      { label: 'Accepté',          color: '#16A34A',                  bg: '#F0FDF4',                    border: '#BBF7D0' },
  invoiced:      { label: 'Facturé',          color: '#7C3AED',                  bg: '#F5F3FF',                    border: '#DDD6FE' },
};

const SUPPLIER_LABELS: Record<string, string> = { NSB: 'Nussbaum', ST: 'Sanitas Troesch', GM: 'Getaz Miauton' };

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export default function QuotesPage() {
  const { setIsMobile, isMobile } = useAppStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchDebounce, setSearchDebounce] = useState('');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) setViewMode('list');
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        sortBy: 'created_at',
        sortOrder: 'desc',
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchDebounce ? { search: searchDebounce } : {}),
      });
      const res = await fetch(`/api/quotes?${params}`);
      const data = await res.json();
      setQuotes(data.data || []);
      setTotal(data.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchDebounce]);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);

  // Group by status for kanban
  const kanbanGroups = (['draft', 'review', 'finalized', 'missing_items', 'sent', 'accepted'] as QuoteStatus[]).map(s => ({
    status: s,
    ...STATUS_CONFIG[s],
    quotes: quotes.filter(q => q.status === s),
  }));

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title="Devis" />
        <div className="page-content">

          {/* Header Row */}
          <div className="ql-header">
            <div className="ql-search-wrap">
              <svg className="ql-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7" cy="7" r="4" />
                <path d="M13 13l-2.8-2.8" />
              </svg>
              <input
                className="ql-search-input"
                type="text"
                placeholder="Rechercher par numéro, client, adresse..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="ql-search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>

            <div className="ql-controls">
              {/* Status Filter */}
              <select
                className="ql-filter-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>

              {/* View Toggle (desktop only) */}
              {!isMobile && (
                <div className="ql-view-toggle">
                  <button
                    className={`ql-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="Vue liste"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 4h12M2 8h12M2 12h12" />
                    </svg>
                  </button>
                  <button
                    className={`ql-view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
                    onClick={() => setViewMode('kanban')}
                    title="Vue Kanban"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="1" y="2" width="4" height="12" rx="1" />
                      <rect x="6" y="2" width="4" height="9" rx="1" />
                      <rect x="11" y="2" width="4" height="7" rx="1" />
                    </svg>
                  </button>
                </div>
              )}

              <Link href="/quotes/new" className="clay-button clay-button--primary ql-new-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 2v12M2 8h12" />
                </svg>
                {!isMobile && <span>Nouveau devis</span>}
              </Link>
            </div>
          </div>

          {/* Count badge */}
          <div className="ql-count">
            <span>{total} devis{statusFilter ? ` · ${STATUS_CONFIG[statusFilter as QuoteStatus]?.label}` : ''}</span>
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="skeleton-list">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="skeleton-card clay-card" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="skeleton-line w-40" />
                      <div className="skeleton-line w-60" />
                      <div className="skeleton-line w-30" />
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : quotes.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="empty-state clay-card">
                  <div className="empty-icon">📋</div>
                  <h3>{search || statusFilter ? 'Aucun résultat' : 'Aucun devis'}</h3>
                  <p>
                    {search || statusFilter
                      ? 'Essayez de modifier vos filtres ou votre recherche.'
                      : 'Créez votre premier devis en quelques secondes avec l\'IA.'}
                  </p>
                  <Link href="/quotes/new" className="clay-button clay-button--primary">
                    Nouveau devis
                  </Link>
                </div>
              </motion.div>
            ) : viewMode === 'list' ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="ql-list">
                  {quotes.map((quote, i) => (
                    <QuoteListRow key={quote.id} quote={quote} index={i} onRefresh={fetchQuotes} />
                  ))}
                </div>

                {/* Pagination */}
                {total > 20 && (
                  <div className="ql-pagination">
                    <button
                      className="clay-button"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >← Préc.</button>
                    <span>Page {page} / {Math.ceil(total / 20)}</span>
                    <button
                      className="clay-button"
                      disabled={page * 20 >= total}
                      onClick={() => setPage(p => p + 1)}
                    >Suiv. →</button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="kanban-board">
                  {kanbanGroups.map(group => (
                    <div key={group.status} className="kanban-column">
                      <div className="kanban-column-header">
                        <span
                          className="kanban-status-dot"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="kanban-column-title">{group.label}</span>
                        <span className="kanban-column-count">{group.quotes.length}</span>
                      </div>
                      <div className="kanban-cards">
                        {group.quotes.map(quote => (
                          <KanbanCard key={quote.id} quote={quote} />
                        ))}
                        {group.quotes.length === 0 && (
                          <div className="kanban-empty">Aucun devis</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

// ─────────────────────────────────────────
// Quote List Row
// ─────────────────────────────────────────

function QuoteListRow({ quote, index, onRefresh }: { quote: Quote; index: number; onRefresh: () => void }) {
  const status = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
  const date = new Date(quote.created_at).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
  const [menuOpen, setMenuOpen] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setMenuOpen(false);
    await fetch(`/api/quotes/${quote.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    onRefresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="ql-row clay-card">
        <Link href={`/quotes/${quote.id}`} className="ql-row-main">
          <div className="ql-row-number">
            <code>{quote.quote_number}</code>
          </div>
          <div className="ql-row-info">
            <div className="ql-row-client">{quote.client_name || '—'}</div>
            <div className="ql-row-building">{quote.building_address || 'Adresse non renseignée'}</div>
          </div>
          <div className="ql-row-meta">
            {quote.preferred_supplier && (
              <span className={`ql-supplier-badge ql-supplier-${quote.preferred_supplier.toLowerCase()}`}>
                {SUPPLIER_LABELS[quote.preferred_supplier] || quote.preferred_supplier}
              </span>
            )}
            {quote.has_missing_items && (
              <span className="ql-missing-badge">⚠️</span>
            )}
          </div>
          <div className="ql-row-status">
            <span
              className="ql-status-pill"
              style={{ color: status.color, backgroundColor: status.bg, borderColor: status.border }}
            >
              {status.label}
            </span>
          </div>
          <div className="ql-row-total">
            {quote.total_incl_vat
              ? <strong>{formatCHF(quote.total_incl_vat)}</strong>
              : <span className="ql-total-pending">—</span>}
          </div>
          <div className="ql-row-date">{date}</div>
        </Link>

        {/* Actions Menu */}
        <div className="ql-row-actions">
          <button className="ql-action-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="ql-dropdown clay-card"
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
              >
                <div className="ql-dropdown-section">
                  <span className="ql-dropdown-label">Changer le statut</span>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    k !== quote.status && (
                      <button key={k} className="ql-dropdown-item" onClick={() => handleStatusChange(k)}>
                        <span style={{ color: v.color }}>●</span> {v.label}
                      </button>
                    )
                  ))}
                </div>
                <div className="ql-dropdown-divider" />
                <Link href={`/quotes/${quote.id}`} className="ql-dropdown-item">
                  ✏️ Modifier
                </Link>
                <Link href={`/quotes/${quote.id}/pdf`} className="ql-dropdown-item">
                  📄 Télécharger PDF
                </Link>
                <button className="ql-dropdown-item" onClick={async () => {
                  await fetch(`/api/quotes/${quote.id}/duplicate`, { method: 'POST' });
                  setMenuOpen(false);
                  onRefresh();
                }}>
                  📋 Dupliquer
                </button>
                <div className="ql-dropdown-divider" />
                <button className="ql-dropdown-item danger" onClick={async () => {
                  if (confirm('Supprimer ce devis définitivement ?')) {
                    await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
                    setMenuOpen(false);
                    onRefresh();
                  }
                }}>
                  🗑️ Supprimer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Kanban Card
// ─────────────────────────────────────────

function KanbanCard({ quote }: { quote: Quote }) {
  const date = new Date(quote.created_at).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short' });
  return (
    <Link href={`/quotes/${quote.id}`}>
      <motion.div
        className="kanban-card clay-card"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="kanban-card-number">{quote.quote_number}</div>
        {quote.client_name && <div className="kanban-card-client">{quote.client_name}</div>}
        {quote.building_address && (
          <div className="kanban-card-address">{quote.building_address}</div>
        )}
        <div className="kanban-card-footer">
          {quote.total_incl_vat && (
            <span className="kanban-card-total">{formatCHF(quote.total_incl_vat)}</span>
          )}
          <span className="kanban-card-date">{date}</span>
        </div>
        {quote.has_missing_items && (
          <div className="kanban-card-warning">⚠️ Articles manquants</div>
        )}
      </motion.div>
    </Link>
  );
}
