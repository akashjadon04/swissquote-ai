'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

/* ─── Types ─────────────────────────────────────────────────── */

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic color variant */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  /** Size */
  size?: 'sm' | 'md';
  /** Optional dot indicator */
  dot?: boolean;
  children?: ReactNode;
}

/* ─── Status Badges ─────────────────────────────────────────── */

/** Preconfigured status badge for quotation workflow */
export type QuoteStatus =
  | 'brouillon'
  | 'en_revision'
  | 'finalise'
  | 'manque_articles';

const statusConfig: Record<
  QuoteStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  brouillon:       { label: 'Brouillon',       variant: 'default' },
  en_revision:     { label: 'En révision',     variant: 'warning' },
  finalise:        { label: 'Finalisé',        variant: 'success' },
  manque_articles: { label: 'Manque articles', variant: 'danger' },
};

export interface StatusBadgeProps
  extends Omit<BadgeProps, 'variant' | 'children'> {
  status: QuoteStatus;
}

export function StatusBadge({ status, ...rest }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} dot {...rest}>
      {config.label}
    </Badge>
  );
}

/* ─── Supplier Badge ────────────────────────────────────────── */

export type Supplier = 'nsb' | 'st' | 'gm';

const supplierConfig: Record<
  Supplier,
  { label: string; colorClass: string }
> = {
  nsb: { label: 'NSB', colorClass: styles.supplierNsb },
  st:  { label: 'ST',  colorClass: styles.supplierSt },
  gm:  { label: 'GM',  colorClass: styles.supplierGm },
};

export interface SupplierBadgeProps
  extends Omit<BadgeProps, 'variant' | 'children'> {
  supplier: Supplier;
}

export function SupplierBadge({ supplier, className = '', ...rest }: SupplierBadgeProps) {
  const config = supplierConfig[supplier];
  return (
    <span
      className={`clay-badge ${styles.badge} ${styles.badgeSm} ${config.colorClass} ${className}`}
      {...rest}
    >
      {config.label}
    </span>
  );
}

/* ─── Confidence Score Badge ────────────────────────────────── */

export interface ConfidenceBadgeProps
  extends Omit<BadgeProps, 'variant' | 'children'> {
  /** Value 0–100 */
  score: number;
}

function getConfidenceVariant(score: number): BadgeProps['variant'] {
  if (score >= 85) return 'success';
  if (score >= 60) return 'warning';
  return 'danger';
}

export function ConfidenceBadge({
  score,
  ...rest
}: ConfidenceBadgeProps) {
  const variant = getConfidenceVariant(score);
  return (
    <Badge variant={variant} size="sm" {...rest}>
      {score}%
    </Badge>
  );
}

/* ─── Base Badge Component ──────────────────────────────────── */

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const classes = [
    'clay-badge',
    styles.badge,
    styles[`variant_${variant}`],
    size === 'sm' ? styles.badgeSm : styles.badgeMd,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;
