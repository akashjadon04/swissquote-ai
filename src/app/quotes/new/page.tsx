'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Bot, ClipboardCheck, DollarSign, FileText, AlertCircle, ArrowLeft, ArrowRight, Download, Loader2, Eye, Check } from 'lucide-react';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { useAppStore, useQuoteStore } from '@/store';
import { AIProcessingState, Button, AnimatedSaveButton, PremiumPDFTemplate } from '@/components/ui';
import type { AIExtractionResult, MatchResult, CatalogueArticle, Quote } from '@/types/database.types';
import { formatAmount, formatCHF } from '@/lib/financial';
import { useTranslation } from '@/lib/i18n';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Wizard Steps
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export default function NewQuotePage() {
  const { setIsMobile, isMobile } = useAppStore();
  const { quote, setQuote, resetQuote, wizardStep, setWizardStep, isProcessing, setProcessing, setProcessingError, processingError } = useQuoteStore();
  const { t, locale } = useTranslation();

  const STEPS = [
    { id: 'description', label: t('quoteWizard', 'steps.description'), icon: <PenTool size={18} /> },
    { id: 'processing', label: t('quoteWizard', 'steps.processing'), icon: <Bot size={18} /> },
    { id: 'review', label: t('quoteWizard', 'steps.review'), icon: <ClipboardCheck size={18} /> },
    { id: 'financials', label: t('quoteWizard', 'steps.financials'), icon: <DollarSign size={18} /> },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [description, setDescription] = useState('');
  const [extraction, setExtraction] = useState<AIExtractionResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [provider, setProvider] = useState<string>('');
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isSilentDownloading, setIsSilentDownloading] = useState(false);
  const [showLowQualityWarning, setShowLowQualityWarning] = useState(false);
  const hiddenPdfRef = useRef<HTMLDivElement>(null);

  const handleSilentDownload = async () => {
    if (!hiddenPdfRef.current) return;
    setIsSilentDownloading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = hiddenPdfRef.current;
      const opt = {
        margin:       [0, 0, 0, 0] as [number, number, number, number],
        filename:     `Devis_${quote.id || 'Nouveau'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsSilentDownloading(false);
    }
  };

  const promptScore = useMemo(() => {
    if (!description) return 0;
    let score = 0;
    const len = description.length;
    score += Math.min(40, (len / 150) * 40);
    const numbersMatch = description.match(/\d+/g);
    if (numbersMatch) score += Math.min(20, numbersMatch.length * 5);
    if (/(client|m\.|mme\.|rue|av\.|avenue|route|chemin|cp|ch-|genÃƒÂ¨ve|lausanne)/i.test(description)) score += 20;
    if (/(tuyau|inox|cuivre|sertir|coude|manchon|vanne|robinet|chaufferie|vidange|fuite)/i.test(description)) score += 20;
    return Math.min(100, Math.round(score));
  }, [description]);

  const hasUnresolvedItems = useMemo(() => {
    return quote.sections.some(section => 
      section.items.some(item => item.isMissing || item.quantity === 0)
    );
  }, [quote.sections]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  useEffect(() => {
    resetQuote();
  }, [resetQuote]);

  useEffect(() => {
    const mainContainer = document.querySelector('.app-main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // Step 1: Submit Description to AI
  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

  const handleSubmitDescription = useCallback(async (force = false) => {
    if (!description.trim() || description.trim().length < 10) return;

    if (promptScore < 80 && !force) {
      setShowLowQualityWarning(true);
      return;
    }
    setShowLowQualityWarning(false);

    setCurrentStep(1);
    setProcessing(true, 1);
    setProcessingError(null);

    try {
      // Single unified call: AI extraction + catalogue matching on the server.
      // Eliminates 2 extra round-trips (was 3 calls, now 1 = ~8s faster).
      setProcessing(true, 1);
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          preferredSupplier: quote.preferredSupplier || 'NSB',
        }),
      });

      if (!res.ok) {
        const rawText = await res.text().catch(() => 'Unable to read response text');
        let errObj;
        try {
          errObj = JSON.parse(rawText);
        } catch {
          // It's not JSON (likely Vercel 504 HTML timeout or 502 Bad Gateway)
          throw new Error(`Raw API Error (${res.status}):\n${rawText.slice(0, 500)}...`);
        }
        throw new Error(errObj.error || `Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const { extraction, provider, matchResult, labourHours: calculatedLabourHours, labourComplexity: _labourComplexity, realMatchRate } = data;


      setExtraction(extraction);
      setProvider(provider);
      setMatchResult(matchResult);

      setProcessing(true, 2);

      // Labour rate by canton
      const LABOUR_RATES: Record<string, number> = {
        'Genève': 120, 'Vaud': 120, 'Valais': 120, 'Fribourg': 120,
        'Neuchâtel': 120, 'Jura': 120, 'Berne': 120, 'Zürich': 120,
        'Bâle': 120, 'Lucerne': 120,
      };
      const canton = quote.canton || 'Genève';
      const labourRate = LABOUR_RATES[canton] || 120;
      const interventionType = "Installation/Rénovation";
      // Use server-calculated labour hours (based on actual items + complexity)
      // NEVER use hardcoded hours — null quantities = 0 hours (user must fill in)
      const labourHours = typeof calculatedLabourHours === 'number' ? calculatedLabourHours : 0;
      const marginPct = 15;
      const vatRate = 0.081;
      const travelFee = 45;

      // Build sections with matched items
      const sections = extraction.sections.map(
        (section: { section_label: string; description_verbatim: string; articles: Array<{ label: string; material_type: string; dimension: string | null; quantity: number | null; unit: string | null; confidence: number }> }, sIdx: number) => ({
          id: `section-${sIdx}`,
          sectionCode: String(25 + sIdx),
          sectionLabel: section.section_label,
          description: section.description_verbatim,
          items: section.articles.map((article, aIdx: number) => {
            const matched = matchResult.matched.find(
              (m: { aiArticle: { label: string } }) => m.aiArticle.label === article.label
            );
            const missing = matchResult.missing.find(
              (m: { aiArticle: { label: string } }) => m.aiArticle.label === article.label
            );

            // RULE: Never estimate. null quantity — 0 so user is forced to fill it in.
            const safeQty = article.quantity === null || article.quantity === undefined ? 0 : article.quantity;

            if (matched) {
              const cat = matched.catalogueArticle as CatalogueArticle;
              const unitPrice = cat.unit_price; // Only catalogue prices. Never AI-estimated.
              return {
                id: `item-${sIdx}-${aIdx}`,
                reference: cat.reference,
                description: cat.description,
                specification: cat.specification ?? null,
                quantity: safeQty,
                unit: cat.unit,
                unitPrice,
                lineTotal: safeQty > 0 && unitPrice ? unitPrice * safeQty : null,
                supplierCode: matched.supplierCode,
                supplierName: null,
                aiLabel: article.label,
                aiConfidence: matched.matchConfidence,
                isMissing: false,
                is_estimate: !!('is_estimate' in article && article.is_estimate),
                isManuallyAdded: false,
                matchedTextStart: null,
                matchedTextEnd: null,
                sortOrder: aIdx,
              };
            }

            // No catalogue match — flag as missing. No price, no reference.
            return {
              id: `item-${sIdx}-${aIdx}`,
              reference: null,
              description: article.label,
              specification: article.dimension ?? null,
              quantity: safeQty,
              unit: article.unit || 'p',
              unitPrice: null,
              lineTotal: null,
              supplierCode: null,
              supplierName: null,
              aiLabel: article.label,
              aiConfidence: article.confidence,
              isMissing: true,
              is_estimate: !!('is_estimate' in article && article.is_estimate),
              isManuallyAdded: false,
              matchedTextStart: null,
              matchedTextEnd: null,
              sortOrder: aIdx,
              reason: missing?.reason || 'Aucune correspondance dans le catalogue',
              suggestions: missing?.suggestions || [],
            };
          }),
          sortOrder: sIdx,
        })
      );

      setProcessing(true, 3);

      // Financials: only from matched items that have a real catalogue price
      const allItems = sections.flatMap((s: { items: Array<{ isMissing: boolean; lineTotal: number | null }> }) => s.items);
      const materialsSubtotal = allItems
        .filter((i: { isMissing: boolean; lineTotal: number | null }) => !i.isMissing && i.lineTotal)
        .reduce((sum: number, i: { lineTotal: number | null }) => sum + (i.lineTotal || 0), 0);
      const materialsMargin = materialsSubtotal * (marginPct / 100);
      const labourTotal = labourHours * labourRate;
      const subtotal = materialsSubtotal + materialsMargin + labourTotal + travelFee;
      const vatAmount = subtotal * vatRate;
      const total = subtotal + vatAmount;

      setQuote({
        originalDescription: description,
        aiExtraction: extraction,
        aiProvider: provider,
        interventionType,
        technicalSummary: null,
        // Use real catalogue match rate, not AI extraction confidence
        // (a 95% confident AI extraction that fails to match still shows 95% otherwise)
        aiConfidence: typeof realMatchRate === 'number' ? realMatchRate : 0.8,

        sections,
        hasMissingItems: allItems.some((i: { isMissing: boolean }) => i.isMissing),
        exclusions: [],
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
  }, [description, quote.canton, quote.preferredSupplier, promptScore, setProcessing, setProcessingError, setQuote]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <TopBar breadcrumb={[t('sidebar', 'quotes'), t('dashboard', 'newQuote')]} />
        <div className="page-content">
            {/* Graphical Step Indicator */}
            <div className="wizard-steps flex items-center justify-center">
              {STEPS.map((step, i) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`wizard-step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
                  >
                    <div className="wizard-step-icon">
                      {i < currentStep ? <Check size={18} /> : step.icon}
                    </div>
                    {!isMobile && <span className="wizard-step-label">{step.label}</span>}
                  </div>
                  {i < STEPS.length - 1 && <div className={`wizard-step-connector ${i < currentStep ? 'completed' : ''}`} />}
                </React.Fragment>
              ))}
            </div>

          <div className="wizard-content relative">
            {/* Step 0: Description Input */}
            {currentStep === 0 && (
              <div
                key="description"
                className="wizard-panel animate-in fade-in slide-in-from-left-4 duration-300"
              >
                <div className="wizard-header">
                  <h2>{t('quoteWizard', 'descriptionTitle')}</h2>
                  <p>{t('quoteWizard', 'descriptionSubtitle')}</p>
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
                      className="btn-12"
                      onClick={() => handleSubmitDescription()}
                      disabled={description.trim().length < 10}
                    >
                      <span className="flex items-center gap-2 font-black tracking-wide">
                        {t('quoteWizard', 'analyzeBtn')}
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 10h12M12 4l6 6-6 6" />
                        </svg>
                      </span>
                    </button>
                  </div>

                    {/* Prompt Quality UI */}
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider">
                        <span className={promptScore >= 80 ? 'text-success' : 'text-warning'}>
                          {locale === 'en' ? 'Prompt Quality' : 'Qualité du prompt'}
                        </span>
                        <span className={promptScore >= 80 ? 'text-success' : 'text-warning'}>{promptScore}%</span>
                      </div>
                      <div className="w-full bg-black/5 dark:bg-white/5 rounded-full h-4 p-[2px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] border border-border/50">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${promptScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : promptScore >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-500 to-rose-400'}`}
                          style={{ width: `${promptScore}%` }}
                        />
                      </div>
                    </div>

                    {showLowQualityWarning && (
                        <div 
                          className="mt-4 p-4 rounded-xl border border-warning/30 bg-warning/10 flex flex-col gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                        >
                          <div className="flex items-center gap-2 text-warning font-bold">
                            <AlertCircle size={18} />
                            {locale === 'en' ? 'AI needs more details' : 'L\'IA a besoin de plus de détails'}
                          </div>
                          <p className="text-sm text-text-primary/90">
                            {locale === 'en' 
                              ? 'Your description is missing some details (dimensions, quantities, client name). The quote might have missing items. Do you want to continue anyway?' 
                              : 'Votre description manque de détails (dimensions, quantités, nom du client). Le devis risque d\'avoir des articles manquants. Voulez-vous continuer quand même ?'}
                          </p>
                          <div className="flex gap-3 justify-end mt-2">
                            <button className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-surface-3 transition-colors" onClick={() => setShowLowQualityWarning(false)}>
                              {locale === 'en' ? 'Edit Prompt' : 'Modifier le prompt'}
                            </button>
                            <button className="px-4 py-2 rounded-lg text-sm font-bold bg-warning text-black shadow-lg hover:brightness-110 transition-all" onClick={() => handleSubmitDescription(true)}>
                              {locale === 'en' ? 'Continue Anyway' : 'Continuer quand même'}
                            </button>
                          </div>
                        </div>
                      )}
                  </div>

                {/* Example Templates */}
                <div className="template-section">
                  <h3>{t('quoteWizard', 'orChooseTemplate')}</h3>
                  <div className="template-grid">
                      {[
                        { label: t('quoteWizard', 'templates.replacement.title'), text: "Client: Jean Dupont, 1000 Lausanne. Intervention prévue le 15 août. Coupure d'eau et vidange des installations. Démontage, dépose et évacuation de la conduite existante depuis la chaufferie jusqu'au sous-sol au droit de la cave n°1. Reprise sur la conduite d'eau chaude dans la chaufferie. Fourniture et pose de: 15m de Tuyau acier inox 1:4521 Optipress Ø 54 mm, 25m de Tuyau acier inox 1:4521 Optipress Ø 28 mm, 12 pces de Coude à sertir 90° inox, 8 pces de Manchon coulissant à sertir inox, 40 pces de Collier de fixation isophonique pour tube, et 30m d'Isolation PIR + finition PVC. Remise en pression, purge et contrôle de l'étanchéité." },
                        { label: t('quoteWizard', 'templates.installation.title'), text: "Client: Marie Curie, 1201 Genève. Installation salle de bain: Fourniture et pose de robinetterie neuve. 2 pces de Vanne à bille, 5m de Tuyau acier inox 1:4521 Optipress Ø 15 mm, 4 pces de Coude à sertir 90° inox, 1 pce de Clapet anti-retour, et 10 pces de Raccords de raccordement. Y compris raccordements, joints, flexibles et mise en eau." },
                        { label: t('quoteWizard', 'templates.urgent.title'), text: "Client: Hôpital Cantonal, 1700 Fribourg. Dépannage urgent: Fuite sur colonne montante d'eau froide au 3ème étage. Remplacement de la section endommagée comprenant: 3m de Tuyau acier inox 1:4521 Optipress Ø 35 mm, 2 pces de Pièce de transition à sertir inox fileté, 3 pces de Manchon coulissant à sertir inox, 5 pces de Collier de fixation isophonique pour tube, et 1 pce de Purgeur automatique. Remise en pression et contrôle." },
                      ].map((tpl) => (
                      <button
                        key={tpl.label}
                        className="template-card clay-card clay-card--interactive"
                        onClick={() => setDescription(tpl.text)}
                      >
                        <span className="template-label">{tpl.label}</span>
                        <span className="template-preview">{tpl.text.slice(0, 80)}...</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: AI Processing Animation */}
            {currentStep === 1 && (
              <div
                key="processing"
                className="wizard-panel animate-in fade-in slide-in-from-right-4 duration-300"
              >
                <AIProcessingState />
              </div>
            )}

            {/* Step 2: Review Articles */}
            {currentStep === 2 && (
              <div
                key="review"
                className="wizard-panel animate-in fade-in slide-in-from-right-4 duration-300"
              >
                <div className="wizard-header">
                  <h2>{t('quoteWizard', 'reviewTitle')}</h2>
                  <div className="review-meta">
                    {extraction && (
                      <span className="provider-badge">
                        {provider === 'gemini' ? '✨ Powered by Astra AI' : '🌐 OpenRouter'}
                      </span>
                    )}
                    {typeof quote?.aiConfidence === 'number' && (
                      <span className="confidence-badge" style={{
                        backgroundColor: quote!.aiConfidence > 0.8 ? 'var(--color-success-light)' :
                          quote!.aiConfidence > 0.5 ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                        color: quote!.aiConfidence > 0.8 ? 'var(--color-success)' :
                          quote!.aiConfidence > 0.5 ? 'var(--color-warning)' : 'var(--color-danger)',
                      }}>
                        {locale === 'en' ? 'Confidence' : 'Confiance'}: {(quote!.aiConfidence * 100).toFixed(0)}%
                      </span>
                    )}
                    {matchResult && (
                      <span className="match-badge">
                        {matchResult.matched.length}/{matchResult.totalArticles} {locale === 'en' ? 'matches' : 'correspondances'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Technical Summary Disabled for simplified AI */}

                {/* Articles Table */}
                {quote.sections.map((section, sIdx) => (
                  <div key={section.id} className="article-section mb-8">
                    <div className="section-title">
                      <span className="section-code">{section.sectionCode}</span>
                      <span>{section.sectionLabel}</span>
                    </div>

                    {/* ─── TABLE FOR ALL SCREENS ─── */}
                    <div className="neo-table-container mt-4 overflow-x-auto w-full">
                      <table className="articles-table w-full text-left border-collapse">
                        <thead className="bg-surface-2/30">
                          <tr>
                            <th className="col-ref p-4 font-semibold text-text-muted min-w-[120px]">{t('catalogue', 'columns.reference')}</th>
                            <th className="col-desc p-4 font-semibold text-text-muted min-w-[300px]">{t('catalogue', 'columns.description')}</th>
                            <th className="col-qty p-4 font-semibold text-text-muted min-w-[100px]">{t('catalogue', 'columns.quantity')}</th>
                            <th className="col-unit p-4 font-semibold text-text-muted min-w-[100px]">{t('catalogue', 'columns.unit')}</th>
                            <th className="col-price p-4 font-semibold text-text-muted min-w-[120px]">{t('catalogue', 'columns.unitPrice')}</th>
                            <th className="col-total p-4 font-semibold text-text-muted min-w-[120px]">{t('catalogue', 'columns.total') || 'Total'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-strong">
                          {section.items.map((item, iIdx) => (
                              <React.Fragment key={item.id}>
                            <tr key={item.id} className={`group hover:bg-surface-2 transition-colors ${item.isMissing ? 'bg-danger/5' : (item.is_estimate ? 'bg-orange-50/30 border-orange-200' : (item.reference ? 'bg-green-50/30 border-green-200' : ''))}`}>
                              <td className="col-ref p-4">
                                <input type="text" className={`neo-input w-24 text-sm font-mono ${!item.reference ? 'border-warning border bg-warning/5' : ''}`} placeholder="Réf..." value={item.reference || ''} onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { reference: e.target.value })} />
                              </td>
                              <td className="col-desc p-4">
                                <input type="text" className={`neo-input w-full font-medium ${!item.description ? 'border-danger border-2 bg-danger/5' : ''}`} placeholder="Description..." value={item.description || ''} onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { description: e.target.value })} />
                                </td>
                              <td className="col-qty p-4">
                                <input type="number" className={`neo-input w-20 ${item.quantity === 0 || !item.quantity ? 'border-danger border-2 bg-danger/5 text-danger font-bold' : ''}`} value={item.quantity || ''} placeholder="0" min={0} step={0.1}
                                  onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { quantity: parseFloat(e.target.value) || 0 })} />
                              </td>
                              <td className="col-unit p-4 text-sm">
                                <input type="text" className={`neo-input w-20 text-sm ${!item.unit ? 'border-danger border-2 bg-danger/5' : ''}`} placeholder="Unité" value={item.unit || ''} onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { unit: e.target.value })} />
                              </td>
                              <td className="col-price p-4">
                                <input type="number" className={`neo-input w-24 ${!item.unitPrice ? 'border-danger border-2 bg-danger/5' : ''}`} placeholder="CHF" value={item.unitPrice || ''} onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { unitPrice: parseFloat(e.target.value) || 0 })} />
                              </td>
                              <td className="col-total p-4 font-bold text-accent">
                                {item.lineTotal ? formatAmount(item.lineTotal) : (item.unitPrice && item.quantity ? formatAmount(item.unitPrice * item.quantity) : '—')}
                              </td>
                            </tr>
                              {/* WARNINGS ROW */}
                              {(item.isMissing || item.is_estimate || (!item.quantity || item.quantity === 0)) && (
                                <tr>
                                  <td colSpan={6} className="px-4 pb-4">
                                    <div className="flex flex-col gap-2 p-3 bg-surface-2/30 rounded-xl border border-border/50">
                                      {item.isMissing && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs text-danger font-semibold bg-danger/10 px-2 py-0.5 rounded-full border border-danger/20">{t('quoteWizard', 'articleNotFound')}</span>
                                          <button className="text-xs text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 hover:bg-accent/20 transition-colors" onClick={() => useQuoteStore.getState().updateItem(sIdx, iIdx, { isMissing: false })}>
                                            {locale === 'en' ? 'Validate ✓' : 'Valider ✓'}
                                          </button>
                                        </div>
                                      )}
                                      {item.is_estimate && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs text-orange-600 font-semibold bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                                            {locale === 'en' ? 'AI Estimate - Please Verify' : 'Estimation IA - A vérifier'}
                                          </span>
                                          <button className="text-xs text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 hover:bg-accent/20 transition-colors" onClick={() => useQuoteStore.getState().updateItem(sIdx, iIdx, { is_estimate: false })}>
                                            {locale === 'en' ? 'Validate ✓' : 'Valider ✓'}
                                          </button>
                                        </div>
                                      )}
                                      {(!item.quantity || item.quantity === 0) && (
                                        <div className="flex items-center gap-4 flex-wrap">
                                          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                                            <AlertCircle size={14} /> Information manquante requise:
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-text-primary">Combien de <strong className="lowercase">{item.aiLabel?.split(' ')[0] || 'cet article'}</strong> ?</span>
                                            <input 
                                              type="number" 
                                              className="neo-input w-24 text-sm py-1 border-red-500/50 focus:border-red-500" 
                                              placeholder="Qté..." 
                                              min={1} 
                                              step={0.1}
                                              onChange={(e) => useQuoteStore.getState().updateItem(sIdx, iIdx, { quantity: parseFloat(e.target.value) || 0 })}
                                            />
                                            <span className="text-sm text-text-muted font-medium">{item.unit || 'pce'}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile card layout removed entirely per user request (wants real tables on mobile) */}
                  </div>
                ))}
 
                {/* Navigation */}
                <div className="wizard-nav flex gap-4">
                  <Button
                    variant="secondary"
                    iconLeft={<ArrowLeft size={16} />}
                    onClick={() => setCurrentStep(0)}
                  >
                    {t('quoteWizard', 'backToArticles')}
                  </Button>
                  <div className="flex flex-col items-end gap-2">
                    {hasUnresolvedItems && (
                      <span className="text-warning text-sm font-semibold bg-warning/10 px-3 py-1 rounded-full border border-warning/20">
                        {locale === 'en' ? '⚠ Missing items will have 0 price' : '⚠ Les articles sans prix apparaîtront vides'}
                      </span>
                    )}
                    <Button
                      variant="primary"
                      iconRight={<ArrowRight size={16} />}
                      onClick={() => setCurrentStep(3)}
                    >
                      {t('quoteWizard', 'continueToFinancials')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Financial Summary */}
            {currentStep === 3 && (
                <div
                  key="financials"
                  className="wizard-panel animate-in fade-in slide-in-from-right-4 duration-300"
                >
                <div className="wizard-header text-center mb-10">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-light mb-2">{t('quoteWizard', 'financialSummary') || 'Résumé financier'}</h2>
                  <p className="text-text-muted">{t('quoteWizard', 'financialSummaryDesc') || 'Vérifiez et ajustez les paramètres financiers du devis.'}</p>
                </div>

                <div className="financial-grid grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto">
                  {/* Left: Adjustable parameters */}
                  <div className="financial-params bg-surface-2/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_20px_40px_rgba(0,0,0,0.4)] flex flex-col gap-6">
                    <h3 className="text-xl font-semibold mb-2">{t('quoteWizard', 'parameters') || 'Paramètres'}</h3>

                    <div className="param-group flex flex-col gap-2">
                      <label className="text-sm font-medium text-text-muted">{t('quoteWizard', 'canton') || 'Canton'}</label>
                      <select
                        className="clay-input"
                        value={quote.canton}
                        onChange={(e) => {
                          const cantonRates: Record<string, number> = {
                            'Genève': 120, 'Vaud': 120, 'Valais': 120,
                            'Fribourg': 120, 'Neuchâtel': 120, 'Jura': 120,
                            'Berne': 120, 'Zürich': 120, 'Bâle': 120, 'Lucerne': 120,
                          };
                          const newRate = cantonRates[e.target.value] || 120;
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
                        {Object.keys({ 'Genève': 120, 'Vaud': 120, 'Valais': 120, 'Fribourg': 120, 'Neuchâtel': 120, 'Jura': 120, 'Berne': 120, 'Zürich': 120, 'Bâle': 120, 'Lucerne': 120 }).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                      </select>
                    </div>

                    <div className="param-group flex flex-col gap-2">
                      <label className="text-sm font-medium text-text-muted">{t('quoteWizard', 'labourHours') || 'Heures de travail'}</label>
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
                                isLabourManual: true,
                                labourHours: parseFloat(e.target.value) || 0,
                              },
                            });
                          useQuoteStore.getState().recalculateFinancials();
                        }}
                      />
                    </div>

                    <div className="param-group flex flex-col gap-2">
                      <label className="text-sm font-medium text-text-muted">{t('quoteWizard', 'labourRate') || 'Taux horaire (CHF/h)'}</label>
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

                    <div className="param-group flex flex-col gap-2">
                      <label className="text-sm font-medium text-text-muted">{t('quoteWizard', 'materialsMarginPct') || 'Marge matériaux (%)'}</label>
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

                    <div className="param-group flex flex-col gap-2">
                      <label className="text-sm font-medium text-text-muted">{t('quoteWizard', 'travelFee') || 'Frais de déplacement (CHF)'}</label>
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
                  <div className="financial-summary bg-surface/50 backdrop-blur-lg rounded-[2rem] border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_15px_30px_rgba(0,0,0,0.3)] p-8">
                    <h3 className="text-xl font-semibold mb-6">{t('quoteWizard', 'totals')}</h3>
                    <div className="summary-lines">
                      <div className="summary-line">
                        <span>{t('quoteWizard', 'materials')}</span>
                        <span>{formatCHF(quote.financials.materialsSubtotal)}</span>
                      </div>
                      <div className="summary-line muted">
                        <span>{t('quoteWizard', 'margin')} ({quote.financials.materialsMarginPct}%)</span>
                        <span>{formatCHF(quote.financials.materialsMargin)}</span>
                      </div>
                      <div className="summary-line">
                        <span>{t('quoteWizard', 'labour')} ({quote.financials.labourHours}h à {formatAmount(quote.financials.labourRate)}/h)</span>
                        <span>{formatCHF(quote.financials.labourTotal)}</span>
                      </div>
                      <div className="summary-line">
                        <span>{t('quoteWizard', 'travel')}</span>
                        <span>{formatCHF(quote.financials.travelFee)}</span>
                      </div>
                      <div className="summary-divider" />
                      <div className="summary-line subtotal">
                        <span>{t('quoteWizard', 'subtotalExclVat')}</span>
                        <span>{formatCHF(quote.financials.subtotalExclVat)}</span>
                      </div>
                      <div className="summary-line muted">
                        <span>{t('quoteWizard', 'vat')} ({(quote.financials.vatRate * 100).toFixed(1)}%)</span>
                        <span>{formatCHF(quote.financials.vatAmount)}</span>
                      </div>
                      <div className="summary-divider" />
                      <div className="summary-line total">
                        <span>{t('quoteWizard', 'totalInclVat')}</span>
                        <span>{formatCHF(quote.financials.totalInclVat)}</span>
                      </div>
                    </div>

                    {quote.hasMissingItems && (
                      <div className="missing-warning flex items-center gap-2">
                        <AlertCircle size={16} /> {t('quoteWizard', 'missingWarning')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Exclusions */}
                {quote.exclusions && quote.exclusions.length > 0 && (
                  <div className="exclusions-section bg-surface-2/40 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_20px_40px_rgba(0,0,0,0.4)] rounded-[2rem] p-8 max-w-5xl mx-auto mt-8">
                    <h3 className="text-xl font-semibold text-accent mb-4">{t('quoteWizard', 'exclusions')}</h3>
                    <ul className="list-disc pl-6 space-y-2 text-text-primary/80">
                      {quote.exclusions.map((exc, i) => (
                        <li key={i}>{exc}</li>
                      ))}
                    </ul>
                  </div>
                )}


                <div className="wizard-nav flex gap-4 items-center justify-between mt-12 max-w-5xl mx-auto">
                  <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => setCurrentStep(2)}>
                    {t('quoteWizard', 'backToArticles')}
                  </Button>
                  <div className="flex-1 flex justify-end items-center gap-4">
                    <Button 
                      variant="primary" 
                      onClick={handleSilentDownload} 
                      disabled={isSilentDownloading}
                      iconLeft={isSilentDownloading ? <Loader2 className="animate-spin" size={16}/> : <Download size={16} />}
                      className="print:hidden"
                    >
                      {isSilentDownloading ? 'GÃƒÂ©nÃƒÂ©ration...' : t('quoteWizard', 'downloadPdf')}
                    </Button>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-muted hidden md:inline">{t('quoteWizard', 'saveQuote')}</span>
                      <AnimatedSaveButton
                    onClick={async () => {
                      try {
                        const { apiFetch } = await import('@/lib/api');
                        const res = await apiFetch('/api/quotes', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            description: quote.originalDescription,
                            aiExtraction: quote.aiExtraction,
                            aiProvider: quote.aiProvider,
                            interventionType: quote.interventionType,
                            technicalSummary: quote.technicalSummary,
                            aiConfidence: quote!.aiConfidence,
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
                  />
                  </div>
                  </div>
                </div>
                </div>
              )}
          </div>
        </div>
      </main>
      <MobileBottomNav />
        <div 
          style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}
          className="print:hidden"
        >
          <PremiumPDFTemplate ref={hiddenPdfRef} quote={quote} />
        </div>
    </div>
  );
}





