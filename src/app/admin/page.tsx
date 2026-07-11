'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, MobileBottomNav, TopBar } from '@/components/layout/Sidebar';
import { formatCHF } from '@/lib/financial';
import type { Quote } from '@/types/database.types';
import { useTranslation } from '@/lib/i18n';
import { Shield, Clock, FileText, ChevronRight, User, Hash, Box, DollarSign } from 'lucide-react';
import { EmptyState } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminPage() {
  const { t } = useTranslation();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    async function fetchQuotes() {
      try {
        // Fetch ALL quotes globally using admin=true flag
        const res = await fetch('/api/quotes?pageSize=50&sortBy=created_at&sortOrder=desc&admin=true');
        const data = await res.json();
        setQuotes(data.data || []);
      } catch {
        console.error('Failed to load admin quotes');
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
        <TopBar title="Portail Administrateur" />
        <div className="page-content">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-accent tracking-tight flex items-center gap-3">
              <Shield className="text-blue-500" size={32} />
              Vue Globale (Admin)
            </h1>
            <p className="text-text-muted mt-2">
              Visionnage de tous les devis générés à travers toutes les sessions de test.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Global Quotes List */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                <FileText size={20} /> Tous les devis ({quotes.length})
              </h2>
              <div className="flex flex-col gap-3 h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <p className="text-text-muted">Chargement...</p>
                ) : quotes.length === 0 ? (
                  <EmptyState icon={Shield} title="Aucun devis" description="Le système est vierge." />
                ) : (
                  quotes.map((quote) => (
                    <motion.button
                      key={quote.id}
                      onClick={() => setSelectedQuote(quote)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`text-left p-4 rounded-2xl border transition-all duration-300 ${
                        selectedQuote?.id === quote.id 
                          ? 'bg-blue-500/10 border-blue-500/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_10px_20px_rgba(37,99,235,0.1)]' 
                          : 'bg-surface border-border hover:border-text-muted/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold font-mono text-sm">{quote.quote_number}</span>
                        <span className="text-xs text-text-muted">
                          {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      <h3 className="font-medium text-text-primary mb-1 truncate">{quote.subject_line || 'Devis sans objet'}</h3>
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                        <User size={12} />
                        <span className="truncate max-w-[120px]">{quote.ai_provider?.split('#')[1] || 'Session Inconnue'}</span>
                      </div>
                      <div className="font-bold text-accent">{formatCHF(quote.total_incl_vat || 0)}</div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>

            {/* Quote Audit Timeline */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {selectedQuote ? (
                  <motion.div
                    key={selectedQuote.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-surface border border-border rounded-[2rem] p-8 shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-8 pb-6 border-b border-border">
                      <div>
                        <h2 className="text-2xl font-black text-accent mb-2">Historique & Audit</h2>
                        <p className="text-text-muted flex items-center gap-2">
                          <Hash size={16} /> {selectedQuote.quote_number}
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-full font-bold text-sm flex items-center gap-2">
                        <Shield size={16} /> Session: {selectedQuote.ai_provider?.split('#')[1] || 'Inconnue'}
                      </div>
                    </div>

                    <div className="relative pl-8 space-y-12 before:absolute before:inset-0 before:ml-[39px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      
                      {/* Original Request Step */}
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-blue-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <User size={16} />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-surface-2 shadow-sm">
                          <div className="flex items-center justify-between space-x-2 mb-2">
                            <div className="font-bold text-accent">Requête Initiale</div>
                            <time className="text-xs font-medium text-text-muted">{new Date(selectedQuote.created_at).toLocaleTimeString('fr-CH')}</time>
                          </div>
                          <p className="text-sm text-text-muted italic bg-black/5 p-3 rounded-lg">
                            "{selectedQuote.original_description}"
                          </p>
                        </div>
                      </div>

                      {/* AI Extraction Step */}
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-purple-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <Box size={16} />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-surface-2 shadow-sm">
                          <div className="flex items-center justify-between space-x-2 mb-2">
                            <div className="font-bold text-purple-500">Extraction IA</div>
                            <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                              {(selectedQuote.ai_confidence ? selectedQuote.ai_confidence * 100 : 0).toFixed(0)}% Confiance
                            </span>
                          </div>
                          <div className="text-sm text-text-muted">
                            <p className="mb-2"><span className="font-semibold text-text-primary">Type:</span> {selectedQuote.intervention_type}</p>
                            <p className="mb-2"><span className="font-semibold text-text-primary">Articles trouvés:</span> {selectedQuote.ai_extraction ? (selectedQuote.ai_extraction as any).sections?.reduce((acc: number, s: any) => acc + s.articles.length, 0) : 0}</p>
                            <p><span className="font-semibold text-text-primary">Résumé Technique:</span> {selectedQuote.technical_summary}</p>
                          </div>
                        </div>
                      </div>

                      {/* Final Quote Step */}
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <DollarSign size={16} />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-emerald-500/5 shadow-sm">
                          <div className="flex items-center justify-between space-x-2 mb-2">
                            <div className="font-bold text-emerald-600">Devis Finalisé</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-text-muted">
                            <div>Matériel:</div>
                            <div className="font-medium text-right">{formatCHF(selectedQuote.materials_subtotal || 0)}</div>
                            <div>Main d'oeuvre:</div>
                            <div className="font-medium text-right">{formatCHF(selectedQuote.labour_total || 0)} ({selectedQuote.labour_hours}h)</div>
                            <div>Marge Matériel:</div>
                            <div className="font-medium text-right">{formatCHF(selectedQuote.materials_margin || 0)}</div>
                            <div className="col-span-2 border-t border-border mt-2 pt-2 flex justify-between font-bold text-text-primary">
                              <span>Total TTC:</span>
                              <span>{formatCHF(selectedQuote.total_incl_vat || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <EmptyState 
                      icon={Shield} 
                      title="Sélectionnez un devis" 
                      description="Cliquez sur un devis dans la liste pour voir son audit complet." 
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
