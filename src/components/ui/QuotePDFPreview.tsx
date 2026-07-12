'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { QuoteData } from '@/store';
import { useTranslation } from '@/lib/i18n';
import { PremiumPDFTemplate } from './PremiumPDFTemplate';
import { formatAmount } from '@/lib/financial';

interface QuotePDFPreviewProps {
  quote: QuoteData;
  isOpen: boolean;
  onClose: () => void;
}

export function QuotePDFPreview({ quote, isOpen, onClose }: QuotePDFPreviewProps) {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [scale, setScale] = useState(1);
  const pdfRef = useRef<HTMLDivElement>(null);
  
  // Responsive scaling to fit mobile screens dynamically
  useEffect(() => {
    const handleResize = () => {
      // A4 width in pixels is approx 794px. If window is smaller, scale it down.
      const windowWidth = window.innerWidth;
      if (windowWidth < 850) {
        setScale((windowWidth - 40) / 794);
      } else {
        setScale(1);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGenerate = async () => {
    if (!pdfRef.current) return;
    setIsGenerating(true);
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = pdfRef.current;
      const opt = {
        margin:       [0, 0, 0, 0] as [number, number, number, number], // Margin handled by CSS padding inside PremiumPDFTemplate
        filename:     `Devis_${quote.id || 'Nouveau'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex flex-col bg-surface/80 backdrop-blur-xl overflow-hidden"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 bg-surface/90 border-b border-border shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-semibold">{t('quoteWizard', 'devis')}</h3>
              <p className="text-xs text-text-muted">Aperçu avant impression</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              iconLeft={<ArrowLeft size={16} />}
              className="md:flex hidden"
            >
              Retour
            </Button>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-full hover:bg-surface-2 transition-colors text-text-muted hover:text-text-primary"
            >
              <ArrowLeft size={24} />
            </button>
            <Button
              variant="primary"
              iconLeft={isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Download size={16} />}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Génération...' : t('quoteWizard', 'downloadPdf')}
            </Button>
          </div>
        </div>

        {/* Scalable Container for Mobile */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-8">
          <div className="flex justify-center" style={{ minHeight: `${297 * scale}mm` }}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top center',
                width: '210mm',
                minHeight: '297mm',
                backgroundColor: '#fff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* The Masterpiece PDF Template */}
              <PremiumPDFTemplate ref={pdfRef} quote={quote} />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
