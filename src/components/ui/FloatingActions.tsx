import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, LayoutGrid, Users, X } from 'lucide-react';
import Link from 'next/link';

export function FloatingActions() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: <FileText size={20} />, label: "Nouveau Devis", href: "/quotes/new", color: "bg-blue-600" },
    { icon: <LayoutGrid size={20} />, label: "Catalogue", href: "/catalogue", color: "bg-purple-600" },
    { icon: <Users size={20} />, label: "Clients", href: "/clients", color: "bg-emerald-600" }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && actions.map((action, i) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
            className="flex items-center gap-4"
          >
            <span className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-xl text-sm font-bold text-text shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60 pointer-events-none">
              {action.label}
            </span>
            <Link href={action.href} onClick={() => setIsOpen(false)}>
              <div className={`w-14 h-14 rounded-full ${action.color} text-white flex items-center justify-center shadow-xl shadow-${action.color}/30 hover:scale-110 transition-transform cursor-pointer`}>
                {action.icon}
              </div>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
      
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-accent to-blue-700 text-white flex items-center justify-center shadow-[0_10px_40px_rgba(37,99,235,0.4)] relative mt-2"
      >
        <motion.div animate={{ rotate: isOpen ? 135 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <Plus size={32} />
        </motion.div>
        {!isOpen && (
          <div className="absolute inset-0 rounded-full animate-ping bg-accent/40 pointer-events-none" style={{ animationDuration: '3s' }} />
        )}
      </motion.button>
    </div>
  );
}
