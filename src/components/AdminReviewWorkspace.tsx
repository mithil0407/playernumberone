'use client';

import type { ReactNode } from 'react';

export const reviewTheme = {
  bg: '#F4EFE5',
  card: '#EDE5D2',
  panel: '#FBF8F0',
  border: 'rgba(44,38,34,0.1)',
  rowBorder: 'rgba(44,38,34,0.07)',
  ink: '#2C2622',
  muted: 'rgba(44,38,34,0.48)',
  slate: '#94A6AD',
  slateDeep: '#7E9098',
  gold: '#C9A96E',
  error: '#C4645A',
  success: '#5A8B6A',
};

export function ReviewCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border ${className}`} style={{ background: reviewTheme.card, borderColor: reviewTheme.border }}>
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="iconik-micro block mb-2" style={{ color: reviewTheme.muted }}>{children}</label>;
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
      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none luxury-body"
      style={{ background: reviewTheme.bg, color: reviewTheme.ink, border: `1px solid ${reviewTheme.border}` }}
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
      className={`w-full rounded-xl px-3 py-2.5 text-sm outline-none ${mono ? 'font-mono' : 'luxury-body'}`}
      style={{ background: reviewTheme.bg, color: reviewTheme.ink, border: `1px solid ${reviewTheme.border}` }}
    />
  );
}

export function Pill({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'success' | 'error' | 'gold' | 'slate';
}) {
  const color = tone === 'success' ? reviewTheme.success
    : tone === 'error' ? reviewTheme.error
      : tone === 'gold' ? reviewTheme.gold
        : tone === 'slate' ? reviewTheme.slate
          : reviewTheme.muted;
  return (
    <span className="rounded-full px-2.5 py-1 iconik-mono capitalize" style={{ fontSize: '10px', background: `${color}18`, color }}>
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  onClick,
  disabled,
  tone = 'neutral',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'neutral' | 'primary' | 'success' | 'danger';
  title?: string;
}) {
  const styles = tone === 'primary'
    ? { background: reviewTheme.slateDeep, color: reviewTheme.bg, border: `1px solid ${reviewTheme.slateDeep}` }
    : tone === 'success'
      ? { background: `${reviewTheme.success}18`, color: reviewTheme.success, border: `1px solid ${reviewTheme.success}30` }
      : tone === 'danger'
        ? { background: `${reviewTheme.error}12`, color: reviewTheme.error, border: `1px solid ${reviewTheme.error}25` }
        : { background: reviewTheme.card, color: reviewTheme.muted, border: `1px solid ${reviewTheme.border}` };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm luxury-body disabled:opacity-45 transition"
      style={styles}
    >
      {children}
    </button>
  );
}
