'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ParallaxStatsProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient?: string;
  trend?: { value: number; label: string };
}

export const ParallaxStats = ({ title, value, subtitle, icon, gradient = 'from-blue-500 to-indigo-600', trend }: ParallaxStatsProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl p-6 shadow-xl cursor-default overflow-hidden bg-gradient-to-br ${gradient} border border-white/10`}
    >
      <div 
        className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none" 
        style={{ transform: 'translateZ(0px)' }}
      />
      
      {/* Glare effect */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none rounded-3xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
        style={{
          opacity: isHovered ? 1 : 0,
          backgroundPosition: isHovered ? '200% center' : '-200% center',
          transition: 'opacity 0.4s ease',
        }}
      />

      <div style={{ transform: 'translateZ(50px)' }} className="relative z-20 flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-white/80 font-medium text-sm tracking-wide uppercase">{title}</span>
          <span className="text-white font-black text-4xl mt-1 drop-shadow-md">{value}</span>
          {subtitle && (
            <span className="text-white/60 text-xs mt-1">{subtitle}</span>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold px-2 py-1 rounded-full w-fit ${trend.value > 0 ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'}`}>
              <span>{trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="font-normal opacity-80">{trend.label}</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div style={{ transform: 'translateZ(70px)' }} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
            <div className="text-white drop-shadow-lg">
              {icon}
            </div>
          </div>
        )}
      </div>
      
      {/* Abstract decorative shapes */}
      <motion.div 
        style={{ transform: 'translateZ(20px)' }}
        className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl z-0 pointer-events-none"
      />
    </motion.div>
  );
};
