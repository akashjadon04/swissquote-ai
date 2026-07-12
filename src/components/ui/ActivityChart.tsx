import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCHF } from '@/lib/financial';

const data = [
  { name: 'Jan', revenue: 24000 },
  { name: 'Fév', revenue: 38000 },
  { name: 'Mar', revenue: 32000 },
  { name: 'Avr', revenue: 45780 },
  { name: 'Mai', revenue: 41890 },
  { name: 'Juin', revenue: 53390 },
  { name: 'Juil', revenue: 64490 },
];

export function ActivityChart() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="clay-card p-6 mb-8 w-full"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-text-primary">Évolution du Chiffre d'Affaires</h3>
        <span className="text-sm font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">+24.5% ce mois</span>
      </div>
      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
              formatter={(value: number) => [formatCHF(value), "CA"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
