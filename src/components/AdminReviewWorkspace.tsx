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

const PILL_TONES = {
  success: { background: '#E3EDE3', color: '#3F6A4C' },
  error: { background: '#F6E3DF', color: '#9A4039' },
  gold: { background: '#F1E6CF', color: '#7A5A26' },
  slate: { background: '#E2E8EA', color: '#3F5860' },
  muted: { background: 'rgba(44,38,34,0.06)', color: '#655E57' },
};

export function Pill({
  children,
  tone = 'muted',
}: {
  children: ReactNode;
  tone?: 'muted' | 'success' | 'error' | 'gold' | 'slate';
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 luxury-body font-medium whitespace-nowrap capitalize" style={{ fontSize: '11px', lineHeight: 1.2, ...PILL_TONES[tone] }}>
      {children}
    </span>
  );
}

// Primary is the one action a reviewer should take next; everything else stays quiet so it reads first.
const BUTTON_TONES = {
  primary: { background: reviewTheme.ink, color: reviewTheme.bg, border: `1px solid ${reviewTheme.ink}` },
  success: { background: '#E3EDE3', color: '#3F6A4C', border: '1px solid rgba(66,107,78,0.28)' },
  danger: { background: '#FBF1EE', color: '#9A4039', border: '1px solid rgba(154,64,57,0.28)' },
  neutral: { background: reviewTheme.panel, color: reviewTheme.ink, border: '1px solid rgba(44,38,34,0.14)' },
  ghost: { background: 'transparent', color: '#4F4943', border: '1px solid transparent' },
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
  const sizing = size === 'lg' ? 'px-5 py-3 text-sm font-medium' : size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-xl luxury-body whitespace-nowrap transition hover:brightness-[0.96] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A7538] ${sizing} ${className}`}
      style={BUTTON_TONES[tone]}
    >
      {children}
    </button>
  );
}
