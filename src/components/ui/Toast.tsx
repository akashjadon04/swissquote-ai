'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';

/* ─── Toast Wrapper ─────────────────────────────────────────── */

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={8}
      offset={16}
      toastOptions={{
        duration: 4000,
        className: 'clay-toast',
        style: {
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow:
            '8px 8px 24px rgba(26,25,22,0.1), -4px -4px 12px rgba(255,255,255,0.9), inset 0 1px 0 rgba(255,255,255,0.7)',
          padding: 'var(--space-3) var(--space-4)',
        },
      }}
      closeButton
      richColors
    />
  );
}

/* ─── French convenience helpers ────────────────────────────── */

export const notify = {
  success: (message: string, description?: string) =>
    toast.success(message, { description }),
  error: (message: string, description?: string) =>
    toast.error(message, { description }),
  warning: (message: string, description?: string) =>
    toast.warning(message, { description }),
  info: (message: string, description?: string) =>
    toast.info(message, { description }),
  loading: (message: string = 'Chargement en cours…') =>
    toast.loading(message),
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    } = {}
  ) =>
    toast.promise(promise, {
      loading: messages.loading ?? 'Traitement en cours…',
      success: messages.success ?? 'Opération réussie',
      error: messages.error ?? 'Une erreur est survenue',
    }),
  dismiss: (id?: string | number) => toast.dismiss(id),
};

export { toast };
export default Toaster;
