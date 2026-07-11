'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store';
import { useTranslation } from '@/lib/i18n';

interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  actor_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_ICONS: Record<string, string> = {
  create: '✅',
  update: '✏️',
  delete: '🗑️',
  duplicate: '📋',
  pdf_generated: '📄',
};

const ENTITY_LABELS: Record<string, string> = {
  quote: 'Devis',
  client: 'Client',
  config: 'Config',
  catalogue: 'Catalogue',
};

export default function AuditPage() {
  const { setIsMobile } = useAppStore();
  const { t } = useTranslation();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setIsMobile]);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?page=${page}&pageSize=30`);
      const data = await res.json();
      setEntries(data.data || []);
      setTotal(data.total || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { Promise.resolve().then(() => fetchLog()); }, [fetchLog]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title={t('sidebar', 'audit')} />
        <div className="page-content">
          <div className="ql-count">{total} {t('admin', 'events')}</div>

          <div className="audit-timeline clay-card">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="audit-skeleton" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="skeleton-line w-20" />
                  <div className="skeleton-line w-60" />
                </div>
              ))
            ) : entries.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <div className="empty-icon">📋</div>
                <p style={{ color: 'var(--color-text-muted)' }}>{t('admin', 'noEvents')}</p>
              </div>
            ) : (
              entries.map((entry, i) => {
                const date = new Date(entry.created_at);
                const timeStr = date.toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' });
                const dateStr = date.toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', year: 'numeric' });
                const isNewDay = i === 0 || new Date(entries[i - 1].created_at).toDateString() !== date.toDateString();

                return (
                  <React.Fragment key={entry.id}>
                    {isNewDay && (
                      <div className="audit-day-separator">
                        <span>{dateStr}</span>
                      </div>
                    )}
                    <motion.div
                      className="audit-entry"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <div className="audit-icon">{ACTION_ICONS[entry.action] || '●'}</div>
                      <div className="audit-content">
                        <div className="audit-title">
                          <span className="audit-action">{entry.action}</span>
                          {' '}
                          <span className="audit-entity">{ENTITY_LABELS[entry.entity_type] || entry.entity_type}</span>
                          {entry.meta && 'quote_number' in entry.meta && (
                            <code className="audit-ref"> #{String(entry.meta.quote_number)}</code>
                          )}
                        </div>
                        {entry.meta && Object.keys(entry.meta).length > 0 && (
                          <div className="audit-meta">
                            {JSON.stringify(entry.meta)}
                          </div>
                        )}
                      </div>
                      <div className="audit-time">{timeStr}</div>
                    </motion.div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {total > 30 && (
            <div className="ql-pagination">
              <button className="clay-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>{t('generic', 'prev')}</button>
              <span>{t('generic', 'page')} {page} / {Math.ceil(total / 30)}</span>
              <button className="clay-button" disabled={page * 30 >= total} onClick={() => setPage(p => p + 1)}>{t('generic', 'next')}</button>
            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
