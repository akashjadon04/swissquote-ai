'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Card.module.css';

/* ─── Types ─────────────────────────────────────────────────── */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Clay variant */
  variant?: 'default' | 'elevated' | 'interactive';
  /** Inner padding */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Optional header slot */
  header?: ReactNode;
  /** Optional footer slot */
  footer?: ReactNode;
  children?: ReactNode;
}

/* ─── Padding Map ───────────────────────────────────────────── */

const paddingMap: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

/* ─── Component ─────────────────────────────────────────────── */

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      header,
      footer,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const clayVariant =
      variant === 'elevated'
        ? 'clay-card clay-card--elevated'
        : variant === 'interactive'
          ? 'clay-card clay-card--interactive'
          : 'clay-card';

    const classes = [clayVariant, styles.card, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} {...rest}>
        {header && (
          <div className={styles.header}>{header}</div>
        )}
        <div className={`${styles.body} ${paddingMap[padding]}`}>
          {children}
        </div>
        {footer && (
          <div className={styles.footer}>{footer}</div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
