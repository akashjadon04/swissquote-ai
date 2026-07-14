'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Cloud, Sunrise } from 'lucide-react';

export function GreetingWidget() {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  let greeting = "Bonjour";
  let Icon = Sun;
  let gradient = "from-blue-500/20 to-cyan-500/20";
  
  if (hour < 6) { greeting = "Bonne nuit"; Icon = Moon; gradient = "from-indigo-900/40 to-purple-900/40"; }
  else if (hour < 11) { greeting = "Bonjour"; Icon = Sunrise; gradient = "from-amber-500/20 to-orange-500/20"; }
  else if (hour < 18) { greeting = "Bonjour"; Icon = Sun; gradient = "from-blue-500/20 to-cyan-500/20"; }
  else { greeting = "Bonsoir"; Icon = Moon; gradient = "from-indigo-600/30 to-purple-600/30"; }

  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = time.toLocaleDateString('fr-CH', options);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl p-8 mb-8 border border-white/40 backdrop-blur-xl bg-gradient-to-r ${gradient} shadow-[0_8px_30px_rgb(0,0,0,0.04)]`}
    >
      <div className="flex items-center gap-6 relative z-10">
        <div className="p-4 bg-white/40 rounded-2xl shadow-inner backdrop-blur-md text-accent">
          <Icon size={40} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-text-primary capitalize-first">{greeting}, Arnaud !</h1>
          <p className="text-text-muted font-medium mt-1 capitalize-first text-lg">{dateStr}</p>
        </div>
      </div>
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
    </motion.div>
  );
}
