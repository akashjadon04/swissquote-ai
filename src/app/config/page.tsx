'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface ConfigValues {
  company_info: Record<string, string>;
  default_margin_pct: number;
  default_vat_rate: number;
  default_travel_fee: number;
  labour_rates: Record<string, number>;
  default_canton: string;
  preferred_supplier: string;
  quote_counter: string;
  gemini_daily_requests: number;
}

const CANTONS = [
  'Genève', 'Vaud', 'Valais', 'Fribourg', 'Neuchâtel',
  'Jura', 'Berne', 'Zürich', 'Bâle', 'Lucerne',
];

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────

export default function ConfigPage() {
  const { setIsMobile } = useAppStore();
  const [config, setConfig] = useState<Partial<ConfigValues>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [setIsMobile]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setConfig(data.config || {});
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const save = useCallback(async (key: string, value: unknown) => {
    setSaving(key);
    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } finally {
      setSaving(null);
    }
  }, []);

  const labourRates = (config.labour_rates as Record<string, number>) || {};

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar title="Configuration" />
        <div className="page-content">
          {loading ? (
            <div className="skeleton-list">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-card clay-card">
                  <div className="skeleton-line w-40" />
                  <div className="skeleton-line w-60" />
                </div>
              ))}
            </div>
          ) : (
            <div className="config-grid">

              {/* Company Info */}
              <div className="config-card clay-card">
                <h3 className="config-card-title">🏢 Informations société</h3>
                {[
                  { field: 'name', label: 'Nom de la société' },
                  { field: 'address', label: 'Adresse' },
                  { field: 'postal', label: 'Code postal' },
                  { field: 'city', label: 'Ville' },
                  { field: 'phone', label: 'Téléphone' },
                  { field: 'email', label: 'Email' },
                  { field: 'tva_number', label: 'Numéro TVA' },
                ].map(({ field, label }) => (
                  <div key={field} className="config-field">
                    <label className="config-label">{label}</label>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <input
                        className="config-input"
                        defaultValue={(config.company_info as Record<string, string>)?.[field] || ''}
                        onBlur={(e) => {
                          const newInfo = { ...(config.company_info as Record<string, string> || {}), [field]: e.target.value };
                          save('company_info', newInfo);
                        }}
                      />
                      <AnimatePresence>
                        {saved === 'company_info' && (
                          <motion.span
                            className="config-saved-indicator"
                            initial={{ opacity: 0, x: 4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                          >✓</motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Defaults */}
              <div className="config-card clay-card">
                <h3 className="config-card-title">💰 Paramètres financiers</h3>

                <div className="config-field">
                  <label className="config-label">Marge matériaux par défaut (%)</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="config-input"
                      style={{ maxWidth: 120 }}
                      defaultValue={Number(config.default_margin_pct) || 15}
                      onBlur={(e) => save('default_margin_pct', parseFloat(e.target.value))}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>%</span>
                    <SavedBadge show={saved === 'default_margin_pct'} />
                  </div>
                </div>

                <div className="config-field">
                  <label className="config-label">TVA Suisse (%)</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="config-input"
                      style={{ maxWidth: 120 }}
                      defaultValue={(Number(config.default_vat_rate) || 0.081) * 100}
                      step="0.1"
                      onBlur={(e) => save('default_vat_rate', parseFloat(e.target.value) / 100)}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>%</span>
                    <SavedBadge show={saved === 'default_vat_rate'} />
                  </div>
                </div>

                <div className="config-field">
                  <label className="config-label">Frais de déplacement par défaut (CHF)</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="config-input"
                      style={{ maxWidth: 120 }}
                      defaultValue={Number(config.default_travel_fee) || 45}
                      onBlur={(e) => save('default_travel_fee', parseFloat(e.target.value))}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>CHF</span>
                    <SavedBadge show={saved === 'default_travel_fee'} />
                  </div>
                </div>

                <div className="config-field">
                  <label className="config-label">Canton par défaut</label>
                  <select
                    className="config-input"
                    style={{ maxWidth: 200 }}
                    defaultValue={String(config.default_canton) || 'Genève'}
                    onChange={(e) => save('default_canton', e.target.value)}
                  >
                    {CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="config-field">
                  <label className="config-label">Fournisseur préféré par défaut</label>
                  <select
                    className="config-input"
                    style={{ maxWidth: 200 }}
                    defaultValue={String(config.preferred_supplier) || 'NSB'}
                    onChange={(e) => save('preferred_supplier', e.target.value)}
                  >
                    <option value="NSB">Nussbaum</option>
                    <option value="ST">Sanitas Troesch</option>
                    <option value="GM">Getaz Miauton</option>
                  </select>
                </div>
              </div>

              {/* Labour Rates by Canton */}
              <div className="config-card clay-card">
                <h3 className="config-card-title">⏱️ Taux horaires par canton (CHF/h)</h3>
                <table className="labour-rates-table">
                  <thead>
                    <tr>
                      <th>Canton</th>
                      <th style={{ textAlign: 'right' }}>CHF/h</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {CANTONS.map(canton => (
                      <tr key={canton}>
                        <td style={{ fontWeight: 500 }}>{canton}</td>
                        <td style={{ textAlign: 'right' }}>
                          <input
                            type="number"
                            className="labour-rate-input"
                            defaultValue={labourRates[canton] || 145}
                            onBlur={(e) => {
                              const newRates = { ...labourRates, [canton]: parseFloat(e.target.value) };
                              save('labour_rates', newRates);
                            }}
                          />
                        </td>
                        <td>
                          <AnimatePresence>
                            {saved === 'labour_rates' && (
                              <motion.span
                                className="config-saved-indicator"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ fontSize: 12 }}
                              >✓</motion.span>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI + System */}
              <div className="config-card clay-card">
                <h3 className="config-card-title">🤖 Système et numérotation</h3>

                <div className="config-field">
                  <label className="config-label">Dernier numéro de devis</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="config-input"
                      style={{ maxWidth: 140, fontFamily: 'var(--font-mono)' }}
                      defaultValue={Number(config.quote_counter) || 21648}
                      onBlur={(e) => save('quote_counter', e.target.value)}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                      → prochain: {(Number(config.quote_counter) || 21648) + 1}/AL/jf
                    </span>
                    <SavedBadge show={saved === 'quote_counter'} />
                  </div>
                </div>

                <div className="config-field">
                  <label className="config-label">Limite requêtes Gemini / jour</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <input
                      type="number"
                      className="config-input"
                      style={{ maxWidth: 120 }}
                      defaultValue={Number(config.gemini_daily_requests) || 1500}
                      onBlur={(e) => save('gemini_daily_requests', parseInt(e.target.value))}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>req/jour</span>
                    <SavedBadge show={saved === 'gemini_daily_requests'} />
                  </div>
                </div>

                {/* AI provider info */}
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-accent-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--space-1)', color: 'var(--color-accent)' }}>
                    ⚡ Cascade IA configurée
                  </div>
                  <div style={{ color: 'var(--color-text-muted)' }}>
                    Primaire: Gemini 2.0 Flash (gratuit, 1500/j)<br />
                    Secondaire: OpenRouter free tier (cascade automatique)
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}

function SavedBadge({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          className="config-saved-indicator"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{ fontSize: 12 }}
        >
          ✓ Enregistré
        </motion.span>
      )}
    </AnimatePresence>
  );
}
