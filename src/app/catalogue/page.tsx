'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store';
import { formatAmount } from '@/lib/financial';

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

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title="Catalogue articles" />
        <div className="page-content">

          {/* Controls */}
          <div className="ql-header">
            <div className="ql-search-wrap">
              <svg className="ql-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7" cy="7" r="4" />
                <path d="M13 13l-2.8-2.8" />
              </svg>
              <input
                className="ql-search-input"
                type="text"
                placeholder="Référence, description, spécification..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button className="ql-search-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
            <div className="ql-controls">
              <select className="ql-filter-select" value={supplierFilter} onChange={e => { setSupplierFilter(e.target.value); setPage(1); }}>
                <option value="">Tous les fournisseurs</option>
                <option value="NSB">Nussbaum</option>
                <option value="ST">Sanitas Troesch</option>
                <option value="GM">Getaz Miauton</option>
              </select>
              {categories.length > 0 && (
                <select className="ql-filter-select" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
                  <option value="">Toutes les catégories</option>
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
                  <th>Fournisseur</th>
                  <th>Référence</th>
                  <th>Désignation</th>
                  <th>Spéc.</th>
                  <th>Catégorie</th>
                  <th>Unité</th>
                  <th style={{ textAlign: 'right' }}>Prix unitaire HT</th>
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
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      Aucun article trouvé
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
            <div className="ql-pagination">
              <button className="clay-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Préc.</button>
              <span>Page {page} / {Math.ceil(total / 50)}</span>
              <button className="clay-button" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Suiv. →</button>
            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
