import React from 'react';
import { Clock, Bot, CheckCircle, Save } from 'lucide-react';
import { QuoteData } from '@/store';
import { useTranslation } from '@/lib/i18n';

interface QuoteHistoryLogProps {
  quote: QuoteData;
}

export function QuoteHistoryLog({ quote }: QuoteHistoryLogProps) {
  const { t } = useTranslation();

  const events = [
    { 
      id: 1, 
      title: 'Devis initié', 
      desc: 'Création du brouillon et saisie de la description.',
      icon: Clock, 
      time: 'Il y a 5 min',
      color: 'text-text-muted',
      bg: 'bg-surface-2'
    },
    { 
      id: 2, 
      title: 'Analyse IA', 
      desc: `Extraction sémantique via ${quote.aiProvider || 'Astra AI'} terminée avec succès.`,
      icon: Bot, 
      time: 'Il y a 4 min',
      color: 'text-accent',
      bg: 'bg-accent/10 border-accent/20'
    },
    { 
      id: 3, 
      title: 'Correspondance Catalogue', 
      desc: `Articles associés au fournisseur ${quote.preferredSupplier || 'NSB'}.`,
      icon: CheckCircle, 
      time: 'Il y a 2 min',
      color: 'text-success',
      bg: 'bg-success/10 border-success/20'
    },
    { 
      id: 4, 
      title: 'Prêt pour révision', 
      desc: 'Calculs financiers appliqués, en attente de validation.',
      icon: Save, 
      time: 'À l\'instant',
      color: 'text-warning',
      bg: 'bg-warning/10 border-warning/20'
    }
  ];

  return (
    <div className="bg-surface-2/40 backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),_0_20px_40px_rgba(0,0,0,0.4)] rounded-[2rem] p-6 md:p-8 max-w-5xl mx-auto mt-8 w-full overflow-hidden">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Clock size={20} className="text-accent" />
        Historique & Audit
      </h3>
      
      <div className="relative border-l-2 border-border/50 ml-4 pl-8 space-y-10 py-2">
        {events.map((ev, idx) => (
          <div key={ev.id} className="relative group">
            {/* Timeline Node */}
            <div className={`absolute -left-[41px] top-0 p-2 rounded-full bg-surface border-2 ${ev.bg} ${ev.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
              <ev.icon size={16} />
            </div>
            
            {/* Content */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 bg-surface/50 p-4 rounded-xl border border-border/50 shadow-sm hover:border-border transition-colors">
              <div>
                <h4 className="font-semibold text-text-primary text-base">{ev.title}</h4>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">{ev.desc}</p>
              </div>
              <span className="text-xs font-bold text-text-muted whitespace-nowrap bg-surface-2 px-3 py-1.5 rounded-lg border border-border/50 shadow-sm w-fit mt-2 sm:mt-0 flex items-center gap-1.5">
                <Clock size={12} className="opacity-50" /> {ev.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
