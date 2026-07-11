'use client';

import {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Modal.module.css';

/* ─── Types ─────────────────────────────────────────────────── */

export interface ModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Size preset */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Optional title */
  title?: string;
  /** Optional description */
  description?: string;
  /** Modal content */
  children?: ReactNode;
  /** Footer slot (typically action buttons) */
  footer?: ReactNode;
  /** Prevent closing on backdrop click */
  persistent?: boolean;
}

/* ─── Size Map ──────────────────────────────────────────────── */

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  full: styles.sizeFull,
};

/* ─── Desktop Overlay Variants ──────────────────────────────── */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const desktopVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.15 },
  },
};

const mobileVariants = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 36 },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.25 },
  },
};

/* ─── Focus Trap ────────────────────────────────────────────── */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useFocusTrap(open: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement;

    const el = containerRef.current;
    if (!el) return;

    // Small delay to allow animation
    const timer = setTimeout(() => {
      const first = el.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      previousFocus.current?.focus();
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const el = containerRef.current;
      if (!el) return;

      const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    []
  );

  return { containerRef, handleKeyDown };
}

/* ─── Component ─────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  size = 'md',
  title,
  description,
  children,
  footer,
  persistent = false,
}: ModalProps) {
  const { containerRef, handleKeyDown } = useFocusTrap(open);

  // Escape key
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ duration: 0.2 }}
          onClick={persistent ? undefined : onClose}
          aria-hidden="true"
        >
          {/* Desktop Modal */}
          <motion.div
            ref={containerRef}
            className={`${styles.modal} ${styles.desktopModal} ${sizeMap[size]}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            aria-describedby={description ? 'modal-desc' : undefined}
            variants={desktopVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {title && (
              <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <button
                  className={styles.closeBtn}
                  onClick={onClose}
                  aria-label="Fermer"
                  type="button"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" />
                  </svg>
                </button>
              </div>
            )}
            {description && (
              <p id="modal-desc" className={styles.description}>
                {description}
              </p>
            )}
            <div className={styles.body}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
          </motion.div>

          {/* Mobile Bottom Sheet */}
          <motion.div
            ref={!title ? containerRef : undefined}
            className={`${styles.modal} ${styles.mobileSheet} ${sizeMap[size]}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={mobileVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="clay-bottom-sheet__handle" />
            {title && (
              <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <button
                  className={styles.closeBtn}
                  onClick={onClose}
                  aria-label="Fermer"
                  type="button"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" />
                  </svg>
                </button>
              </div>
            )}
            {description && (
              <p className={styles.description}>{description}</p>
            )}
            <div className={styles.body}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
