'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore, useQuoteStore } from '@/store';
import type { AIExtractionResult, MatchResult, CatalogueArticle } from '@/types/database.types';
import { formatAmount, formatCHF } from '@/lib/financial';

// ─────────────────────────────────────────
// Wizard Steps
// ─────────────────────────────────────────

const STEPS = [
  { id: 'description', label: 'Description', icon: '✍️' },
  { id: 'processing', label: 'Analyse IA', icon: '🤖' },
  { id: 'review', label: 'Révision', icon: '📋' },
  { id: 'financials', label: 'Financier', icon: '💰' },
];

export default function NewQuotePage() {
  const { setIsMobile, isMobile } = useAppStore();
  const { quote, setQuote, resetQuote, wizardStep, setWizardStep, isProcessing, setProcessing, setProcessingError, processingError } = useQuoteStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [description, setDescription] = useState('');
  const [extraction, setExtraction] = useState<AIExtractionResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [provider, setProvider] = useState<string>('');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  useEffect(() => {
    resetQuote();
  }, [resetQuote]);

  // ─────────────────────────────────────────
  // Step 1: Submit Description to AI
  // ─────────────────────────────────────────

  const handleSubmitDescription = useCallback(async () => {
    if (!description.trim() || description.trim().length < 10) return;

    setCurrentStep(1);
    setProcessing(true, 0);
    setProcessingError(null);

    try {
      // Step 1: AI extraction
      setProcessing(true, 1);
      const aiRes = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.json();
        throw new Error(err.error || 'Erreur d\'extraction AI');
      }

      const aiData = await aiRes.json();
      setExtraction(aiData.extraction);
      setProvider(aiData.provider);

      // Step 2: Catalogue matching
      setProcessing(true, 2);
      const allArticles = aiData.extraction.sections.flatMap(
        (s: { articles: unknown[] }) => s.articles
      );

      const matchRes = await fetch('/api/catalogue/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: allArticles,
          preferredSupplier: quote.preferredSupplier || 'NSB',
        }),
      });

      if (!matchRes.ok) {
        const err = await matchRes.json();
        throw new Error(err.error || 'Erreur de correspondance');
      }

      const matchData = await matchRes.json();
      setMatchResult(matchData.result);

      // Step 3: Build quote data
      setProcessing(true, 3);

      // Get config for financial calculation
      const configRes = await fetch('/api/config');
      const configData = await configRes.json();
      const labourRates = configData.config?.labour_rates || {};
      const canton = quote.canton || 'Genève';
      const labourRate = labourRates[canton] || 145;

      // Find intervention hours
      const interventionType = aiData.extraction.intervention_type;
      const defaultHoursMap: Record<string, number> = {
        remplacement_canalisation: 8, installation_robinetterie: 3,
        installation_sanitaire: 12, renovation_isolation: 4,
        coupure_eau: 2, installation_nourrice: 5,
        remplacement_chauffe_eau: 6, mise_en_pression: 1.5,
        remplacement_colonne: 10, depannage_urgent: 2, autre: 4,
      };
      const labourHours = defaultHoursMap[interventionType] || 4;

      // Build sections with matched items
      const sections = aiData.extraction.sections.map(
        (section: { section_label: string; description_verbatim: string; articles: Array<{ label: string; material_type: string; dimension: string | null; quantity: number | null; unit: string | null; confidence: number }> }, sIdx: number) => ({
          id: `section-${sIdx}`,
          sectionCode: String(25 + sIdx),
          sectionLabel: section.section_label,
          description: section.description_verbatim,
          items: section.articles.map((article, aIdx: number) => {
            const matched = matchData.result.matched.find(
              (m: { aiArticle: { label: string } }) => m.aiArticle.label === article.label
            );
            const missing = matchData.result.missing.find(
              (m: { aiArticle: { label: string } }) => m.aiArticle.label === article.label
            );

            if (matched) {
              const cat = matched.catalogueArticle as CatalogueArticle;
              return {
                id: `item-${sIdx}-${aIdx}`,
                reference: cat.reference,
                description: cat.description,
                specification: cat.specification,
                quantity: article.quantity || 1,
                unit: cat.unit,
                unitPrice: cat.unit_price,
                lineTotal: cat.unit_price * (article.quantity || 1),
                supplierCode: matched.supplierCode,
                supplierName: null,
                aiLabel: article.label,
                aiConfidence: matched.matchConfidence,
                isMissing: false,
                isManuallyAdded: false,
                matchedTextStart: null,
                matchedTextEnd: null,
                sortOrder: aIdx,
              };
            }

            return {
              id: `item-${sIdx}-${aIdx}`,
              reference: null,
              description: article.label,
              specification: article.dimension,
              quantity: article.quantity || 1,
              unit: article.unit || 'p',
              unitPrice: null,
              lineTotal: null,
              supplierCode: null,
              supplierName: null,
              aiLabel: article.label,
              aiConfidence: article.confidence,
              isMissing: true,
              isManuallyAdded: false,
              matchedTextStart: null,
              matchedTextEnd: null,
              sortOrder: aIdx,
              reason: missing?.reason || 'Aucune correspondance trouvée',
              suggestions: missing?.suggestions || [],
            };
          }),
          sortOrder: sIdx,
        })
      );

      // Calculate financials
      const allItems = sections.flatMap((s: { items: Array<{ isMissing: boolean; lineTotal: number | null }> }) => s.items);
      const materialsSubtotal = allItems
        .filter((i: { isMissing: boolean; lineTotal: number | null }) => !i.isMissing && i.lineTotal)
        .reduce((sum: number, i: { lineTotal: number | null }) => sum + (i.lineTotal || 0), 0);
      const marginPct = 15;
      const materialsMargin = materialsSubtotal * (marginPct / 100);
      const travelFee = 45;
      const labourTotal = labourHours * labourRate;
      const subtotal = materialsSubtotal + materialsMargin + labourTotal + travelFee;
      const vatRate = 0.081;
      const vatAmount = subtotal * vatRate;
      const total = subtotal + vatAmount;

      setQuote({
        originalDescription: description,
        aiExtraction: aiData.extraction,
        aiProvider: aiData.provider,
        interventionType,
        technicalSummary: aiData.extraction.technical_summary,
        aiConfidence: aiData.extraction.confidence_global,
        sections,
        hasMissingItems: allItems.some((i: { isMissing: boolean }) => i.isMissing),
        exclusions: aiData.extraction.exclusions_suggested,
        financials: {
          materialsSubtotal: Number(materialsSubtotal.toFixed(2)),
          materialsMarginPct: marginPct,
          materialsMargin: Number(materialsMargin.toFixed(2)),
          labourHours,
          labourRate,
          labourTotal: Number(labourTotal.toFixed(2)),
          travelFee,
          subtotalExclVat: Number(subtotal.toFixed(2)),
          vatRate,
          vatAmount: Number(vatAmount.toFixed(2)),
          totalInclVat: Number(total.toFixed(2)),
        },
      });

      setProcessing(false);
      setCurrentStep(2);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setProcessingError(message);
      setCurrentStep(0);
    }
  }, [description, quote.canton, quote.preferredSupplier, setProcessing, setProcessingError, setQuote]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar breadcrumb={['Devis', 'Nouveau']} />
        <div className="page-content">
          {/* Step Indicator */}
          <div className="wizard-steps">
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                className={`wizard-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
              >
                <div className="wizard-step-icon">
                  {i < currentStep ? '✓' : step.icon}
                </div>
                {!isMobile && <span className="wizard-step-label">{step.label}</span>}
                {i < STEPS.length - 1 && <div className="wizard-step-connector" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Description Input */}
            {currentStep === 0 && (
              <motion.div
                key="description"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="wizard-panel"
              >
                <div className="wizard-header">
                  <h2>Description des travaux</h2>
                  <p>Décrivez les travaux en français, comme vous le feriez pour un collègue technicien.</p>
                </div>

                {processingError && (
                  <div className="error-banner clay-card">
                    <span>⚠️</span>
                    <span>{processingError}</span>
                  </div>
                )}

                <div className="description-input-wrapper">
                  <textarea
                    className="clay-input description-textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Coupure d'eau et vidange des installations. Démontage, dépose et évacuation de la conduite existante depuis la chaufferie jusqu'au sous-sol..."
                    rows={8}
                  />
                  <div className="description-footer">
                    <span className="char-count">
                      {description.length} / 10 000
                    </span>
                    <button
                      className="clay-button clay-button--primary clay-button--lg"
                      onClick={handleSubmitDescription}
                      disabled={description.trim().length < 10}
                    >
                      <span>Analyser avec l&apos;IA</span>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 10h12M12 4l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Example Templates */}
                <div className="template-section">
                  <h3>Ou choisissez un modèle:</h3>
                  <div className="template-grid">
                    {[
                      { label: 'Remplacement canalisation', text: "Coupure d'eau et vidange des installations. Démontage, dépose et évacuation de la conduite existante depuis la chaufferie jusqu'au sous-sol au droit de la cave n°1. Reprise sur la conduite d'eau chaude dans la chaufferie. Remplacement en tuyau type Inox Ø 54 mm depuis la chaufferie jusqu'à la nourrice existante. Vidange des colonnes d'eau chaude de l'immeuble. Remplacement des conduites horizontales en tuyau type Inox Ø 28 mm, y compris raccords et fixations. Reprise sur les pieds de colonnes. Réfection des isolations avec finition PVC. Remise en pression des installations." },
                      { label: 'Installation robinetterie', text: "Fourniture et pose de robinetterie neuve dans salle de bain: mitigeur lavabo Ø 15 mm, mitigeur douche encastré Ø 20 mm, robinet d'arrêt sous lavabo. Y compris raccordements, joints, flexibles et mise en eau." },
                      { label: 'Dépannage urgent', text: "Fuite sur colonne montante eau froide au 3ème étage. Coupure d'eau urgente. Remplacement de la section endommagée en tuyau inox Ø 28 mm sur environ 2 mètres. Raccords de transition, colliers de fixation. Remise en pression et contrôle d'étanchéité." },
                    ].map((t) => (
                      <button
                        key={t.label}
                        className="template-card clay-card clay-card--interactive"
                        onClick={() => setDescription(t.text)}
                      >
                        <span className="template-label">{t.label}</span>
                        <span className="template-preview">{t.text.slice(0, 80)}...</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: AI Processing Animation */}
            {currentStep === 1 && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="wizard-panel processing-panel"
              >
                <div className="processing-animation">
                  <div className="processing-orb">
                    <div className="orb-ring orb-ring-1" />
                    <div className="orb-ring orb-ring-2" />
                    <div className="orb-ring orb-ring-3" />
                    <div className="orb-core">🤖</div>
                  </div>
                  <h2>Analyse en cours...</h2>
                  <div className="processing-steps">
                    {[
                      'Lecture de la description',
                      'Extraction sémantique (IA)',
                      'Correspondance catalogue',
                      'Calcul financier',
                    ].map((label, i) => (
                      <div
                        key={i}
                        className={`processing-step ${
                          useQuoteStore.getState().processingStep > i
                            ? 'done'
                            : useQuoteStore.getState().processingStep === i
                            ? 'active'
                            : ''
                        }`}
                      >
                        <div className="processing-step-indicator">
                          {useQuoteStore.getState().processingStep > i ? '✓' : (
                            useQuoteStore.getState().processingStep === i ? (
                              <div className="dot-pulse" />
                            ) : <span className="step-num">{i + 1}</span>
                          )}
                        </div>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Review Articles */}
            {currentStep === 2 && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="wizard-panel"
              >
                <div className="wizard-header">
                  <h2>Révision des articles</h2>
                  <div className="review-meta">
                    {extraction && (
                      <span className="provider-badge">
                        {provider === 'gemini' ? '⚡ Gemini' : '🌐 OpenRouter'}
                      </span>
                    )}
                    {extraction && (
                      <span className="confidence-badge" style={{
                        backgroundColor: extraction.confidence_global > 0.8 ? 'var(--color-success-light)' :
                          extraction.confidence_global > 0.5 ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                        color: extraction.confidence_global > 0.8 ? 'var(--color-success)' :
                          extraction.confidence_global > 0.5 ? 'var(--color-warning)' : 'var(--color-danger)',
                      }}>
                        Confiance: {(extraction.confidence_global * 100).toFixed(0)}%
                      </span>
                    )}
                    {matchResult && (
                      <span className="match-badge">
                        {matchResult.matched.length}/{matchResult.totalArticles} correspondances
                      </span>
                    )}
                  </div>
                </div>

                {/* Technical Summary */}
                {extraction?.technical_summary && (
                  <div className="tech-summary clay-card">
                    <h4>📋 Résumé technique</h4>
                    <p>{extraction.technical_summary}</p>
                  </div>
                )}

                {/* Articles Table */}
                {quote.sections.map((section, sIdx) => (
                  <div key={section.id} className="article-section">
                    <div className="section-title">
                      <span className="section-code">{section.sectionCode}</span>
                      <span>{section.sectionLabel}</span>
                    </div>
                    <div className="articles-table-wrapper">
                      <table className="articles-table">
                        <thead>
                          <tr>
                            <th className="col-ref">Réf.</th>
                            <th className="col-desc">Description</th>
                            <th className="col-spec">Spéc.</th>
                            <th className="col-qty">Qté</th>
                            <th className="col-unit">Unité</th>
                            <th className="col-price">Prix unit.</th>
                            <th className="col-total">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.items.map((item, iIdx) => (
                            <tr key={item.id} className={item.isMissing ? 'missing-row' : ''}>
                              <td className="col-ref">
                                {item.reference ? (
                                  <code className="ref-code">{item.reference}</code>
                                ) : (
                                  <span className="missing-badge">⚠️</span>
                                )}
                              </td>
                              <td className="col-desc">
                                <div className="item-desc">
                                  {item.description}
                                  {item.isMissing && (
                                    <span className="missing-label">Article non trouvé</span>
                                  )}
                                </div>
                              </td>
                              <td className="col-spec">{item.specification || '—'}</td>
                              <td className="col-qty">
                                <input
                                  type="number"
                                  className="qty-input"
                                  value={item.quantity}
                                  min={0}
                                  step={0.1}
                                  onChange={(e) => {
                                    useQuoteStore.getState().updateItem(sIdx, iIdx, {
                                      quantity: parseFloat(e.target.value) || 0,
                                    });
                                  }}
                                />
                              </td>
                              <td className="col-unit">{item.unit}</td>
                              <td className="col-price">
                                {item.unitPrice ? formatAmount(item.unitPrice) : '—'}
                              </td>
                              <td className="col-total">
                                {item.lineTotal ? (
                                  <strong>{formatAmount(item.lineTotal)}</strong>
                                ) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* Navigation */}
                <div className="wizard-nav">
                  <button
                    className="clay-button"
                    onClick={() => setCurrentStep(0)}
                  >
                    ← Retour
                  </button>
                  <button
                    className="clay-button clay-button--primary"
                    onClick={() => setCurrentStep(3)}
                  >
                    Continuer vers financier →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Financial Summary */}
            {currentStep === 3 && (
              <motion.div
                key="financials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="wizard-panel"
              >
                <div className="wizard-header">
                  <h2>Résumé financier</h2>
                  <p>Vérifiez et ajustez les paramètres financiers du devis.</p>
                </div>

                <div className="financial-grid">
                  {/* Left: Adjustable parameters */}
                  <div className="financial-params clay-card">
                    <h3>Paramètres</h3>

                    <div className="param-group">
                      <label>Canton</label>
                      <select
                        className="clay-input"
                        value={quote.canton}
                        onChange={(e) => {
                          const cantonRates: Record<string, number> = {
                            'Genève': 145, 'Vaud': 138, 'Valais': 130,
                            'Fribourg': 132, 'Neuchâtel': 135, 'Jura': 128,
                            'Berne': 140, 'Zürich': 148, 'Bâle': 142, 'Lucerne': 136,
                          };
                          const newRate = cantonRates[e.target.value] || 145;
                          setQuote({
                            canton: e.target.value,
                            financials: {
                              ...quote.financials,
                              labourRate: newRate,
                            },
                          });
                          useQuoteStore.getState().recalculateFinancials();
                        }}
                      >
                        {Object.keys({ 'Genève': 145, 'Vaud': 138, 'Valais': 130, 'Fribourg': 132, 'Neuchâtel': 135, 'Jura': 128, 'Berne': 140, 'Zürich': 148, 'Bâle': 142, 'Lucerne': 136 }).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="param-group">
                      <label>Heures de travail</label>
                      <input
                        type="number"
                        className="clay-input"
                        value={quote.financials.labourHours}
                        min={0}
                        step={0.5}
                        onChange={(e) => {
                          setQuote({
                            financials: {
                              ...quote.financials,
                              labourHours: parseFloat(e.target.value) || 0,
                            },
                          });
                          useQuoteStore.getState().recalculateFinancials();
                        }}
                      />
                    </div>

                    <div className="param-group">
                      <label>Taux horaire (CHF/h)</label>
                      <input
                        type="number"
                        className="clay-input"
                        value={quote.financials.labourRate}
                        min={0}
                        onChange={(e) => {
                          setQuote({
                            financials: {
                              ...quote.financials,
                              labourRate: parseFloat(e.target.value) || 0,
                            },
                          });
                          useQuoteStore.getState().recalculateFinancials();
                        }}
                      />
                    </div>

                    <div className="param-group">
                      <label>Marge matériaux (%)</label>
                      <input
                        type="number"
                        className="clay-input"
                        value={quote.financials.materialsMarginPct}
                        min={0}
                        max={100}
                        onChange={(e) => {
                          setQuote({
                            financials: {
                              ...quote.financials,
                              materialsMarginPct: parseFloat(e.target.value) || 0,
                            },
                          });
                          useQuoteStore.getState().recalculateFinancials();
                        }}
                      />
                    </div>

                    <div className="param-group">
                      <label>Frais de déplacement (CHF)</label>
                      <input
                        type="number"
                        className="clay-input"
                        value={quote.financials.travelFee}
                        min={0}
                        onChange={(e) => {
                          setQuote({
                            financials: {
                              ...quote.financials,
                              travelFee: parseFloat(e.target.value) || 0,
                            },
                          });
                          useQuoteStore.getState().recalculateFinancials();
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: Financial Summary */}
                  <div className="financial-summary clay-card">
                    <h3>Totaux du devis</h3>

                    <div className="summary-lines">
                      <div className="summary-line">
                        <span>Matériaux</span>
                        <span>{formatCHF(quote.financials.materialsSubtotal)}</span>
                      </div>
                      <div className="summary-line muted">
                        <span>Marge ({quote.financials.materialsMarginPct}%)</span>
                        <span>{formatCHF(quote.financials.materialsMargin)}</span>
                      </div>
                      <div className="summary-line">
                        <span>Main-d&apos;œuvre ({quote.financials.labourHours}h × {formatAmount(quote.financials.labourRate)}/h)</span>
                        <span>{formatCHF(quote.financials.labourTotal)}</span>
                      </div>
                      <div className="summary-line">
                        <span>Déplacement</span>
                        <span>{formatCHF(quote.financials.travelFee)}</span>
                      </div>
                      <div className="summary-divider" />
                      <div className="summary-line subtotal">
                        <span>Sous-total HT</span>
                        <span>{formatCHF(quote.financials.subtotalExclVat)}</span>
                      </div>
                      <div className="summary-line muted">
                        <span>TVA ({(quote.financials.vatRate * 100).toFixed(1)}%)</span>
                        <span>{formatCHF(quote.financials.vatAmount)}</span>
                      </div>
                      <div className="summary-divider" />
                      <div className="summary-line total">
                        <span>Total TTC</span>
                        <span>{formatCHF(quote.financials.totalInclVat)}</span>
                      </div>
                    </div>

                    {quote.hasMissingItems && (
                      <div className="missing-warning">
                        ⚠️ Ce devis contient des articles non référencés. Le total est partiel.
                      </div>
                    )}
                  </div>
                </div>

                {/* Exclusions */}
                {quote.exclusions && quote.exclusions.length > 0 && (
                  <div className="exclusions-section clay-card">
                    <h3>Non compris dans ce devis:</h3>
                    <ul>
                      {quote.exclusions.map((exc, i) => (
                        <li key={i}>• {exc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Navigation */}
                <div className="wizard-nav">
                  <button className="clay-button" onClick={() => setCurrentStep(2)}>
                    ← Retour aux articles
                  </button>
                  <button
                    className="clay-button clay-button--primary clay-button--lg"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/quotes', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            description: quote.originalDescription,
                            aiExtraction: quote.aiExtraction,
                            aiProvider: quote.aiProvider,
                            interventionType: quote.interventionType,
                            technicalSummary: quote.technicalSummary,
                            aiConfidence: quote.aiConfidence,
                            preferredSupplier: quote.preferredSupplier,
                            canton: quote.canton,
                            hasMissingItems: quote.hasMissingItems,
                            exclusions: quote.exclusions,
                            ...quote.financials,
                            sections: quote.sections,
                          }),
                        });
                        if (res.ok) {
                          window.location.href = '/quotes';
                        }
                      } catch {
                        // handle
                      }
                    }}
                  >
                    💾 Enregistrer le devis
                  </button>
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
