'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BlurText } from './index';

export function AIProcessingState() {
  const TypewriterAnimation = () => (
    <div className="typewriter">
      <div className="slide"><i></i></div>
      <div className="paper"></div>
      <div className="keyboard"></div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-12 py-10 px-4 w-full max-w-5xl mx-auto">
      {/* Center Typewriter */}
      <div className="flex flex-col items-center justify-center scale-125 md:scale-150">
        <TypewriterAnimation />
      </div>

      {/* Powered by Astra AI v1 Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="flex flex-col items-center justify-center relative group mt-8"
      >
        <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full scale-150 opacity-50 group-hover:opacity-100 transition-opacity duration-700" style={{ background: 'var(--color-accent-muted)' }} />
        <div className="relative px-6 py-2 rounded-full border border-border/50 bg-surface/80 backdrop-blur-sm shadow-sm flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-accent"
          >
            ✨
          </motion.div>
          <BlurText 
            text="Powered by Astra AI v1" 
            delay={100} 
            className="text-sm font-semibold tracking-wide bg-gradient-to-r from-accent to-accent-hover bg-clip-text text-transparent"
          />
        </div>
      </motion.div>
    </div>
  );
}
