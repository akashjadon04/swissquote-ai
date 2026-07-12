'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AstraQuote (by Green AI Groupe)] Global error:', error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F8F7F5' }}>
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div style={{ fontSize: 64, marginBottom: '1rem' }}>⚠️</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111', marginBottom: '0.5rem' }}>
              Une erreur s&apos;est produite
            </h1>
            <p style={{ color: '#888', marginBottom: '2rem', maxWidth: 400 }}>
              {error.message || 'Une erreur inattendue est survenue. Veuillez réessayer.'}
              {error.digest && (
                <><br /><code style={{ fontSize: 11 }}>Réf: {error.digest}</code></>
              )}
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem',
              }}
            >
              🔄 Réessayer
            </button>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
