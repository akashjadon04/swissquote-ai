'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store';
import { formatCHF } from '@/lib/financial';
import type { Quote } from '@/types/database.types';
import { useTranslation } from '@/lib/i18n';
import { FileText, Edit2, CheckCircle, DollarSign, Plus, LayoutGrid } from 'lucide-react';
import { EmptyState, Button, GreetingWidget, ActivityChart } from '@/components/ui';
import dynamic from 'next/dynamic';

const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => mod.Player), { ssr: false });

// ─────────────────────────────────────────
// Dashboard Layout
// ─────────────────────────────────────────

export default function DashboardPage() {
  const { setIsMobile } = useAppStore();
  const { t } = useTranslation();
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
        const sessionId = localStorage.getItem('AstraQuote_session_id') || 'default-session';
        const res = await fetch('/api/quotes?pageSize=10&sortBy=created_at&sortOrder=desc', {
          headers: {
            'x-session-id': sessionId
          }
        });
        const data = await res.json();
        
        // Calculate stats
        const all = data.data || [];
        setQuotes(all.slice(0, 5)); // Keep max 5 recent quotes
        setStats({
          total: data.total || 0,
          draft: all.filter((q: Quote) => q.status === 'draft').length,
          finalized: all.filter((q: Quote) => q.status === 'finalized' || q.status === 'accepted' || q.status === 'invoiced').length,
          revenue: all.reduce((sum: number, q: Quote) => sum + (q.total_incl_vat || 0), 0),
        });
      } catch (error) {
        console.error('Failed to fetch dashboard quotes:', error);
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
        <TopBar title={t('sidebar', 'dashboard')} />
        <div className="page-content">
          <GreetingWidget />
          
          {/* Stats Bar */}
          <div className="stats-bar">
            <StatCard label={t('dashboard', 'activeQuotes')} value={String(stats.total)} icon={<FileText size={20} />} delay={0} />
            <StatCard label={"Taux de conversion"} value={stats.total ? Math.round((stats.finalized / stats.total) * 100) + '%' : '0%'} icon={<CheckCircle size={20} />} delay={0.1} />
            <StatCard label={"Pipeline (En cours)"} value={String(stats.total - stats.draft - stats.finalized)} icon={<Edit2 size={20} />} delay={0.2} />
            <StatCard label={t('dashboard', 'totalRevenue')} value={formatCHF(stats.revenue)} icon={<DollarSign size={20} />} delay={0.3} />
          </div>

          <ActivityChart />

          {/* Quick Actions */}
          <div className="quick-actions">
            <Link href="/quotes/new" className="quick-action-card clay-card clay-card--interactive">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="quick-action-content"
              >
                <div className="quick-action-icon">
                  <Plus size={24} />
                </div>
                <div>
                  <h3>{t('dashboard', 'newQuote')}</h3>
                  <p>{t('quotes', 'emptyDesc')}</p>
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
                  <LayoutGrid size={24} />
                </div>
                <div>
                  <h3>{t('sidebar', 'catalogue')}</h3>
                  <p>{t('catalogue', 'emptyDesc')}</p>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Recent Quotes */}
          <div className="recent-section">
            <div className="section-header">
              <h2>{t('dashboard', 'recentQuotes')}</h2>
              <Link href="/quotes" className="view-all-link">{t('dashboard', 'viewAll')} →</Link>
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
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="clay-card p-6 flex flex-col items-center justify-center min-h-[300px] text-center gap-4 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full scale-150 pointer-events-none" />
                <div className="mt-2 mb-2">
                  <Player
                    autoplay
                    loop
                    src="https://assets3.lottiefiles.com/packages/lf20_ot5gqdfc.json"
                    style={{ height: '180px', width: '180px' }}
                  />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                  <h3 className="text-2xl font-bold mb-2">{t('quotes', 'emptyTitle')}</h3>
                  <p className="text-text-muted mb-6 max-w-sm">{t('quotes', 'emptyDesc')}</p>
                  <Link href="/quotes/new" tabIndex={-1}>
                    <Button variant="primary" iconLeft={<Plus size={16}/>}>{t('dashboard', 'newQuote')}</Button>
                  </Link>
                </div>
              </motion.div>
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

function StatCard({ label, value, icon, delay }: { label: string; value: string; icon: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="stat-card clay-card"
    >
      <div className="stat-icon flex items-center justify-center text-accent bg-accent/10 rounded-full w-10 h-10">{icon}</div>
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
