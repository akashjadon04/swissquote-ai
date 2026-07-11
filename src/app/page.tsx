'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store';
import { formatCHF } from '@/lib/financial';
import type { Quote } from '@/types/database.types';

// ─────────────────────────────────────────
// Dashboard Layout
// ─────────────────────────────────────────

export default function DashboardPage() {
  const { setIsMobile } = useAppStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState({ total: 0, draft: 0, finalized: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        const res = await fetch('/api/quotes?pageSize=10&sortBy=created_at&sortOrder=desc');
        const data = await res.json();
        setQuotes(data.data || []);
        
        // Calculate stats
        const all = data.data || [];
        setStats({
          total: data.total || 0,
          draft: all.filter((q: Quote) => q.status === 'draft').length,
          finalized: all.filter((q: Quote) => q.status === 'finalized').length,
          revenue: all.reduce((sum: number, q: Quote) => sum + (q.total_incl_vat || 0), 0),
        });
      } catch {
        // Silently handle — will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchQuotes();
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title="Tableau de bord" />
        <div className="page-content">
          {/* Stats Bar */}
          <div className="stats-bar">
            <StatCard label="Total devis" value={String(stats.total)} icon="📋" delay={0} />
            <StatCard label="Brouillons" value={String(stats.draft)} icon="✏️" delay={0.1} />
            <StatCard label="Finalisés" value={String(stats.finalized)} icon="✅" delay={0.2} />
            <StatCard label="Chiffre d'affaires" value={formatCHF(stats.revenue)} icon="💰" delay={0.3} />
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <Link href="/quotes/new" className="quick-action-card clay-card clay-card--interactive">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="quick-action-content"
              >
                <div className="quick-action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div>
                  <h3>Nouveau devis</h3>
                  <p>Créer un devis à partir d&apos;une description</p>
                </div>
              </motion.div>
            </Link>
            <Link href="/catalogue" className="quick-action-card clay-card clay-card--interactive">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="quick-action-content"
              >
                <div className="quick-action-icon secondary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4h16v16H4zM4 8h16M8 4v16" />
                  </svg>
                </div>
                <div>
                  <h3>Catalogue</h3>
                  <p>Gérer les articles et fournisseurs</p>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Recent Quotes */}
          <div className="recent-section">
            <div className="section-header">
              <h2>Devis récents</h2>
              <Link href="/quotes" className="view-all-link">Voir tout →</Link>
            </div>

            {loading ? (
              <div className="skeleton-list">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-card clay-card" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="skeleton-line w-40" />
                    <div className="skeleton-line w-60" />
                    <div className="skeleton-line w-30" />
                  </div>
                ))}
              </div>
            ) : quotes.length === 0 ? (
              <div className="empty-state clay-card">
                <div className="empty-icon">📝</div>
                <h3>Aucun devis</h3>
                <p>Commencez par créer votre premier devis.</p>
                <Link href="/quotes/new" className="clay-button clay-button--primary">
                  Nouveau devis
                </Link>
              </div>
            ) : (
              <div className="quote-list">
                {quotes.map((quote, index) => (
                  <QuoteCard key={quote.id} quote={quote} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

// ─────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────

function StatCard({ label, value, icon, delay }: { label: string; value: string; icon: string; delay: number }) {
  return (
    <motion.div
      className="stat-card clay-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 20 }}
    >
      <span className="stat-icon">{icon}</span>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────
// Quote Card Component
// ─────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--color-text-muted)',
  review: 'var(--color-warning)',
  finalized: 'var(--color-success)',
  missing_items: 'var(--color-danger)',
  sent: 'var(--color-accent)',
  accepted: 'var(--color-success)',
  invoiced: '#8B5CF6',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  review: 'En révision',
  finalized: 'Finalisé',
  missing_items: 'Manque articles',
  sent: 'Envoyé',
  accepted: 'Accepté',
  invoiced: 'Facturé',
};

function QuoteCard({ quote, index }: { quote: Quote; index: number }) {
  const date = new Date(quote.created_at).toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/quotes/${quote.id}`} className="quote-card clay-card clay-card--interactive">
        <div className="quote-card-header">
          <span className="quote-number" style={{ fontFamily: 'var(--font-mono)' }}>
            N° {quote.quote_number}
          </span>
          <span
            className="quote-status-badge"
            style={{
              backgroundColor: `${STATUS_COLORS[quote.status]}15`,
              color: STATUS_COLORS[quote.status],
              borderColor: `${STATUS_COLORS[quote.status]}30`,
            }}
          >
            {STATUS_LABELS[quote.status] || quote.status}
          </span>
        </div>
        <div className="quote-card-body">
          {quote.client_name && <span className="quote-client">{quote.client_name}</span>}
          {quote.building_address && (
            <span className="quote-building">{quote.building_address}</span>
          )}
          <span className="quote-date">{date}</span>
        </div>
        <div className="quote-card-footer">
          {quote.total_incl_vat ? (
            <span className="quote-total">{formatCHF(quote.total_incl_vat)}</span>
          ) : (
            <span className="quote-total-pending">En cours</span>
          )}
          {quote.has_missing_items && (
            <span className="quote-warning-badge">⚠️ Articles manquants</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
