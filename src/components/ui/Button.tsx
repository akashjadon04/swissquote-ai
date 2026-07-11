'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

/* ─── Types ─────────────────────────────────────────────────── */

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Shows loading dots and disables interaction */
  loading?: boolean;
  /** Icon placed before label */
  iconLeft?: ReactNode;
  /** Icon placed after label */
  iconRight?: ReactNode;
  /** Expand to full width */
  fullWidth?: boolean;
  /** Button content */
  children?: ReactNode;
}

/* ─── Loading Dots ──────────────────────────────────────────── */

function LoadingDots() {
  return (
    <span className="dot-pulse" aria-hidden="true" style={{ position: 'relative', zIndex: 10 }}>
      <span className="dot-pulse__dot" style={{ backgroundColor: 'currentColor' }} />
      <span className="dot-pulse__dot" style={{ backgroundColor: 'currentColor' }} />
      <span className="dot-pulse__dot" style={{ backgroundColor: 'currentColor' }} />
    </span>
  );
}

/* ─── Component ─────────────────────────────────────────────── */

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Apply btn-12 classes provided by user
    let btnClasses = `btn-12 ${className}`;
    if (variant === 'secondary') {
      btnClasses += ' secondary';
    }
    if (fullWidth) {
      btnClasses += ' w-full';
    }

    return (
      <button
        ref={ref}
        className={btnClasses}
        disabled={isDisabled}
        aria-busy={loading}
        {...rest}
      >
        {loading ? (
          <LoadingDots />
        ) : (
          <>
            {iconLeft && <span>{iconLeft}</span>}
            {children && <span>{children}</span>}
            {iconRight && <span>{iconRight}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
