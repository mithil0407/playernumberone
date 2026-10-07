'use client';

import type { ReactNode } from 'react';

// The staff kit palette (see manAdmin/man-admin.css), as literal colours so
// callers can still mix them into rgba and gradients.
export const reviewTheme = {
  bg: '#f5f3ee',
  card: '#ffffff',
  panel: '#faf9f6',
  border: 'rgba(17,19,21,0.1)',
  rowBorder: 'rgba(17,19,21,0.06)',
  ink: '#111315',
  muted: 'rgba(17,19,21,0.5)',
  slate: '#2c5282',
  slateDeep: '#2c5282',
  gold: '#6a1f2b',
  error: '#b42318',
  success: '#2f6b4f',
};

export function ReviewCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`ma-card ma-card--flat ${className}`}>
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="ma-label">{children}</label>;
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={event => onChange(event.target.value)}
      placeholder={placeholder}
      className="ma-input"
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
  mono = false,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={event => onChange(event.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`ma-textarea ${mono ? 'font-mono' : ''}`}
    />
  );
}

const PILL_TONES = {
  success: 'ma-pill--green',
  error: 'ma-pill--red',
  gold: 'ma-pill--accent',
  slate: 'ma-pill--blue',
  muted: '',
};

export function Pill({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'success' | 'error' | 'gold' | 'slate';
}) {
  return (
    <span className={`ma-pill capitalize ${PILL_TONES[tone]}`}>
      {children}
    </span>
  );
}

// Primary is the one action a reviewer should take next; everything else stays quiet so it reads first.
const BUTTON_TONES = {
  primary: 'ma-btn--dark',
  success: 'ma-btn--success',
  danger: 'ma-btn--danger',
  neutral: 'ma-btn--secondary',
  ghost: 'ma-btn--ghost',
};

export function ActionButton({
  children,
  onClick,
  disabled,
  tone = 'neutral',
  size = 'md',
  title,
  ariaLabel,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: keyof typeof BUTTON_TONES;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const sizing = size === 'lg' ? 'ma-btn--lg' : size === 'sm' ? 'ma-btn--sm' : '';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`ma-btn ${BUTTON_TONES[tone]} ${sizing} ${className}`}
    >
      {children}
    </button>
  );
}
