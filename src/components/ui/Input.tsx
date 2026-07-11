'use client';

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react';
import styles from './Input.module.css';

/* ─── Shared Props ──────────────────────────────────────────── */

interface InputBaseProps {
  /** Label displayed above the input */
  label?: string;
  /** Error message — activates error styling */
  error?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Icon placed before the input */
  prefixIcon?: ReactNode;
  /** Icon placed after the input */
  suffixIcon?: ReactNode;
}

/* ─── Text Input ────────────────────────────────────────────── */

export interface InputProps
  extends InputBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      prefixIcon,
      suffixIcon,
      className = '',
      id: propId,
      ...rest
    },
    ref
  ) => {
    const autoId = useId();
    const id = propId ?? autoId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const hasError = Boolean(error);

    const wrapperClasses = [
      'clay-input-wrapper',
      prefixIcon ? 'clay-input-wrapper--prefix' : '',
      suffixIcon ? 'clay-input-wrapper--suffix' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      'clay-input',
      hasError ? 'clay-input--error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.field}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        <div className={wrapperClasses}>
          {prefixIcon && (
            <span className="clay-input__prefix" aria-hidden="true">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={inputClasses}
            aria-invalid={hasError || undefined}
            aria-describedby={
              hasError ? errorId : helperText ? helperId : undefined
            }
            {...rest}
          />
          {suffixIcon && (
            <span className="clay-input__suffix" aria-hidden="true">
              {suffixIcon}
            </span>
          )}
        </div>
        {hasError && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
        {!hasError && helperText && (
          <p id={helperId} className={styles.helper}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/* ─── Textarea ──────────────────────────────────────────────── */

export interface TextareaProps
  extends InputBaseProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'prefix'> {
  /** Show character count (requires maxLength) */
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      className = '',
      id: propId,
      onChange,
      defaultValue,
      value: controlledValue,
      ...rest
    },
    ref
  ) => {
    const autoId = useId();
    const id = propId ?? autoId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const hasError = Boolean(error);
    const [internalValue, setInternalValue] = useState(
      (defaultValue as string) ?? ''
    );

    const currentValue =
      controlledValue !== undefined
        ? String(controlledValue)
        : internalValue;
    const charCount = currentValue.length;

    const inputClasses = [
      'clay-input',
      'clay-input--textarea',
      hasError ? 'clay-input--error' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.field}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={inputClasses}
          maxLength={maxLength}
          aria-invalid={hasError || undefined}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          value={controlledValue}
          defaultValue={controlledValue === undefined ? defaultValue : undefined}
          onChange={(e) => {
            if (controlledValue === undefined) {
              setInternalValue(e.target.value);
            }
            onChange?.(e);
          }}
          {...rest}
        />
        <div className={styles.bottomRow}>
          <div>
            {hasError && (
              <p id={errorId} className={styles.error} role="alert">
                {error}
              </p>
            )}
            {!hasError && helperText && (
              <p id={helperId} className={styles.helper}>
                {helperText}
              </p>
            )}
          </div>
          {showCount && maxLength && (
            <span
              className={`${styles.charCount} ${
                charCount >= maxLength ? styles.charCountMax : ''
              }`}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Input;
