'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught an error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--color-danger)' }}>Une erreur inattendue s&apos;est produite</h2>
      <p style={{ marginBottom: '1.5rem', maxWidth: '32rem', color: 'var(--color-text-muted)' }}>
        Le composant a rencontré un problème lors de l&apos;affichage. Vous pouvez réessayer ou revenir à l&apos;accueil.
      </p>
      <div className="flex gap-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Button variant="primary" onClick={() => reset()}>
          Réessayer
        </Button>
        <Button variant="secondary" onClick={() => (window.location.href = '/')}>
          Retour à l&apos;accueil
        </Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: '4px', textAlign: 'left', fontSize: '0.75rem', maxWidth: '42rem', overflow: 'auto', color: 'var(--color-danger)' }}>
          {error.message}
        </pre>
      )}
    </div>
  );
}
