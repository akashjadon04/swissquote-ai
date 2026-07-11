'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'var(--color-bg)',
      textAlign: 'center',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div style={{ fontSize: 80, lineHeight: 1, marginBottom: '1rem' }}>🔍</div>
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 800,
          color: 'var(--color-text-primary)',
          marginBottom: '0.5rem',
        }}>404</h1>
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--color-text-muted)',
          marginBottom: '2rem',
          maxWidth: 360,
        }}>
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--color-accent)',
            color: 'white',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.95rem',
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(var(--color-accent-rgb), 0.3)',
          }}
        >
          ← Retour au tableau de bord
        </Link>
      </motion.div>
    </div>
  );
}
