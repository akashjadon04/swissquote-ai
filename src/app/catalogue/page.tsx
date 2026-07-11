'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store';
import { formatAmount } from '@/lib/financial';
import { EmptyState, Button } from '@/components/ui';
import { useTranslation } from '@/lib/i18n';
import { Box, X, ArrowLeft, ArrowRight, Search } from 'lucide-react';

interface CatalogueArticle {
  id: string;
  reference: string;
  description: string;
  specification: string | null;
  category: string | null;
  unit: string;
  unit_price: number;
  active: boolean;
  supplier: {
    code: string;
    name: string;
  } | null;
}

const SUPPLIER_COLORS: Record<string, string> = {
  NSB: 'var(--color-accent)',
  ST:  'var(--color-success)',
  GM:  'var(--color-warning)',
};

export default function CataloguePage() {
  const { setIsMobile } = useAppStore();
  const { t } = useTranslation();
  const [articles, setArticles] = useState<CatalogueArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setIsMobile]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounce(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '50',
        ...(searchDebounce ? { search: searchDebounce } : {}),
        ...(supplierFilter ? { supplierCode: supplierFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
      });
      const res = await fetch(`/api/catalogue?${params}`);
      const data = await res.json();
      setArticles(data.data || []);
      setTotal(data.total || 0);

      // Extract unique categories
      const cats = [...new Set((data.data || []).map((a: CatalogueArticle) => a.category).filter(Boolean))] as string[];
      if (cats.length > 0 && categories.length === 0) setCategories(cats);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounce, supplierFilter, categoryFilter, categories.length]);

  useEffect(() => { Promise.resolve().then(() => fetchArticles()); }, [fetchArticles]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title={t('catalogue', 'title')} />
        <div className="page-content">

          {/* Controls */}
          <div className="ql-header">
            <div className="ql-search-wrap">
              <Search className="ql-search-icon text-text-muted" size={16} />
              <input
                className="ql-search-input"
                type="text"
                placeholder={t('catalogue', 'searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button className="ql-search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
            </div>
            <div className="ql-controls">
              <select className="ql-filter-select" value={supplierFilter} onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}>
                <option value="">{t('catalogue', 'allSuppliers')}</option>
                <option value="NSB">Nussbaum</option>
                <option value="ST">Sanitas Troesch</option>
                <option value="GM">Getaz Miauton</option>
              </select>
              {categories.length > 0 && (
                <select className="ql-filter-select" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                  <option value="">{t('catalogue', 'allCategories')}</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="ql-count">{total} articles</div>

          {/* Table */}
          <div className="catalogue-table-wrap clay-card">
            <table className="catalogue-table">
              <thead>
                <tr>
                  <th>{t('catalogue', 'columns.supplier')}</th>
                  <th>{t('catalogue', 'columns.reference')}</th>
                  <th>{t('catalogue', 'columns.description')}</th>
                  <th>{t('catalogue', 'columns.specification')}</th>
                  <th>{t('catalogue', 'columns.category')}</th>
                  <th>{t('catalogue', 'columns.unit')}</th>
                  <th style={{ textAlign: 'right' }}>{t('catalogue', 'columns.unitPrice')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="cat-skeleton-row">
                      <td colSpan={7}><div className="skeleton-line" style={{ height: 12, animationDelay: `${i * 60}ms` }} /></td>
                    </tr>
                  ))
                ) : articles.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Box}
                        title={t('catalogue', 'emptyTitle')}
                        description={t('catalogue', 'emptyDesc')}
                      />
                    </td>
                  </tr>
                ) : (
                  articles.map((article, i) => (
                    <motion.tr
                      key={article.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="cat-row"
                    >
                      <td>
                        {article.supplier && (
                          <span
                            className="ql-supplier-badge"
                            style={{
                              color: SUPPLIER_COLORS[article.supplier.code] || 'var(--color-text-muted)',
                              backgroundColor: `${SUPPLIER_COLORS[article.supplier.code] || '#888'}15`,
                            }}
                          >
                            {article.supplier.code}
                          </span>
                        )}
                      </td>
                      <td><code className="cat-ref">{article.reference}</code></td>
                      <td className="cat-desc">{article.description}</td>
                      <td className="cat-spec">{article.specification || '—'}</td>
                      <td className="cat-category">
                        {article.category && (
                          <span className="cat-category-badge">{article.category}</span>
                        )}
                      </td>
                      <td className="cat-unit">{article.unit}</td>
                      <td className="cat-price">
                        <strong>{formatAmount(article.unit_price)}</strong>
                        <span className="cat-currency">CHF</span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 50 && (
            <div className="ql-pagination flex items-center justify-center gap-4 mt-8">
              <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} iconLeft={<ArrowLeft size={16} />}>Préc.</Button>
              <span className="text-sm text-text-muted font-medium">Page {page} / {Math.ceil(total / 50)}</span>
              <Button variant="secondary" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)} iconRight={<ArrowRight size={16} />}>Suiv.</Button>
            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
