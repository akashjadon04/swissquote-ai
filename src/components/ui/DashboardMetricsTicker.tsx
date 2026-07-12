'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, Award, Zap } from 'lucide-react';

export function DashboardMetricsTicker() {
  return (
    <div className="w-full bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-2 overflow-hidden flex items-center shadow-md relative z-20">
      <motion.div
        animate={{ x: [0, -1500] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
        className="flex items-center gap-16 whitespace-nowrap px-4"
      >
        {[...Array(3)].map((_, i) => (
          <React.Fragment key={i}>
            <span className="flex items-center gap-2 text-sm font-semibold tracking-wide"><TrendingUp size={16} className="text-emerald-400"/> Croissance Annuelle: +24%</span>
            <span className="flex items-center gap-2 text-sm font-semibold tracking-wide"><Activity size={16} className="text-blue-400"/> Serveurs IA: 100% Opérationnels</span>
            <span className="flex items-center gap-2 text-sm font-semibold tracking-wide"><Award size={16} className="text-amber-400"/> N°1 Romandie Tech 2026</span>
            <span className="flex items-center gap-2 text-sm font-semibold tracking-wide"><Zap size={16} className="text-purple-400"/> Génération Moyenne: 2.3s</span>
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}
