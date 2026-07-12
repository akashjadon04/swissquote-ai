'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const MagicOrb = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const pathname = usePathname() || '';

  // Contextual messaging based on route
  const message = pathname.includes('/quotes/new')
    ? "Besoin d'aide pour extraire votre devis ? Collez simplement votre texte !"
    : pathname.includes('/quotes')
    ? "Gérez tous vos devis ici. Cliquez sur 'Nouveau Devis' pour commencer."
    : "AstraQuote AI est prêt à vous assister.";

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 10000); // Hide after 10s
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className="fixed bottom-24 right-8 z-[100] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {(isHovered || isVisible) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-4 bg-surface-2/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl max-w-[250px] text-sm text-text"
          >
            <div className="flex items-start gap-3">
              <MessageCircle size={16} className="text-accent mt-1 shrink-0" />
              <p className="font-medium">{message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        className="relative cursor-pointer pointer-events-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsVisible(!isVisible)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-accent/30 blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Core orb */}
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.4),0_0_20px_rgba(59,130,246,0.6)] flex items-center justify-center border border-white/20">
          <Sparkles className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" size={20} />
          
          {/* Inner reflection */}
          <div className="absolute top-1 left-2 w-4 h-4 bg-white/40 rounded-full blur-[1px]" />
        </div>
      </motion.div>
    </div>
  );
};
