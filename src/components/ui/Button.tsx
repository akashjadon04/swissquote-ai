'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import styles from './Button.module.css';

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
    <span className="dot-pulse" aria-hidden="true">
      <span className="dot-pulse__dot" />
      <span className="dot-pulse__dot" />
      <span className="dot-pulse__dot" />
    </span>
  );
}

/* ─── Motion Config ─────────────────────────────────────────── */

const motionProps: Partial<HTMLMotionProps<'button'>> = {
  whileTap: { scale: 0.97 },
  transition: { type: 'spring', stiffness: 500, damping: 30 },
};

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

    const classes = [
      'clay-button',
      `clay-button--${variant}`,
      `clay-button--${size}`,
      styles.button,
      fullWidth ? styles.fullWidth : '',
      loading ? styles.loading : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <motion.button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...motionProps}
        {...(rest as HTMLMotionProps<'button'>)}
      >
        {loading ? (
          <LoadingDots />
        ) : (
          <>
            {iconLeft && (
              <span className={styles.icon} aria-hidden="true">
                {iconLeft}
              </span>
            )}
            {children && <span className={styles.label}>{children}</span>}
            {iconRight && (
              <span className={styles.icon} aria-hidden="true">
                {iconRight}
              </span>
            )}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
