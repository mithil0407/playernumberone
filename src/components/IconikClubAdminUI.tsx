'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export const CLUB = {
  bg: '#F4EFE5',
  surface: '#FBF8F1',
  card: '#EDE5D2',
  ink: '#2C2622',
  muted: 'rgba(44,38,34,0.52)',
  faint: 'rgba(44,38,34,0.34)',
  border: 'rgba(44,38,34,0.11)',
  gold: '#A9874F',
  slate: '#7E9098',
  green: '#5A8B6A',
  red: '#B45E55',
  amber: '#A47A38',
};

export const primaryButtonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#2C2622] px-4 py-2.5 text-sm font-medium text-[#F4EFE5] transition hover:bg-[#3D3430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9874F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
export const secondaryButtonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[rgba(44,38,34,0.14)] bg-transparent px-4 py-2.5 text-sm font-medium text-[#2C2622] transition hover:bg-[rgba(44,38,34,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9874F] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
export const quietButtonClass = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-[rgba(44,38,34,0.62)] transition hover:bg-[rgba(44,38,34,0.06)] hover:text-[#2C2622] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9874F]';
export const dangerButtonClass = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-[#B45E55] transition hover:bg-[rgba(180,94,85,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B45E55]';
export const controlClass = 'min-h-10 w-full rounded-xl border border-[rgba(44,38,34,0.13)] bg-[#FBF8F1] px-3.5 py-2.5 text-sm text-[#2C2622] outline-none transition placeholder:text-[rgba(44,38,34,0.34)] focus:border-[#A9874F] focus:ring-2 focus:ring-[rgba(169,135,79,0.18)]';

export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="iconik-micro mb-2" style={{ color: CLUB.muted }}>{eyebrow}</p>}
        <h1 className="iconik-display text-[30px] sm:text-[34px]" style={{ color: CLUB.ink }}>{title}</h1>
        {description && <p className="luxury-body mt-2 max-w-2xl text-sm" style={{ color: CLUB.muted }}>{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function AdminCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border ${className}`} style={{ background: CLUB.surface, borderColor: CLUB.border }}>{children}</section>;
}

export function AdminSection({ title, description, actions, children, className = '' }: { title: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <AdminCard className={className}>
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: CLUB.border }}>
        <div>
          <h2 className="iconik-display text-xl" style={{ color: CLUB.ink }}>{title}</h2>
          {description && <p className="mt-1 text-xs" style={{ color: CLUB.muted }}>{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </AdminCard>
  );
}

export function FilterBar({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:flex-wrap sm:items-center ${className}`} style={{ background: CLUB.card, borderColor: CLUB.border }}>{children}</div>;
}

const badgeStyles = {
  neutral: { color: CLUB.slate, background: 'rgba(126,144,152,0.13)' },
  success: { color: CLUB.green, background: 'rgba(90,139,106,0.13)' },
  warning: { color: CLUB.amber, background: 'rgba(164,122,56,0.13)' },
  danger: { color: CLUB.red, background: 'rgba(180,94,85,0.12)' },
  accent: { color: CLUB.gold, background: 'rgba(169,135,79,0.13)' },
};

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof badgeStyles }) {
  return <span className="inline-flex items-center rounded-full px-2.5 py-1 iconik-mono capitalize" style={{ fontSize: 10, ...badgeStyles[tone] }}>{children}</span>;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div className="flex min-h-48 flex-col items-center justify-center gap-3" style={{ color: CLUB.muted }}><Loader2 className="animate-spin" size={21} /><p className="text-sm">{label}</p></div>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center"><p className="iconik-display text-xl" style={{ color: CLUB.ink }}>{title}</p>{description && <p className="mt-2 max-w-md text-sm" style={{ color: CLUB.muted }}>{description}</p>}{action && <div className="mt-5">{action}</div>}</div>;
}

export function InlineNotice({ tone = 'success', children }: { tone?: 'success' | 'error'; children: ReactNode }) {
  const error = tone === 'error';
  return <div role={error ? 'alert' : 'status'} className="flex items-start gap-2 rounded-xl border px-4 py-3 text-sm" style={{ color: error ? CLUB.red : CLUB.green, borderColor: error ? 'rgba(180,94,85,.22)' : 'rgba(90,139,106,.22)', background: error ? 'rgba(180,94,85,.06)' : 'rgba(90,139,106,.06)' }}>{error ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}{children}</div>;
}

export function WorkflowSteps({ steps, current }: { steps: string[]; current: number }) {
  return <ol className="mb-7 grid grid-cols-3 overflow-hidden rounded-xl border" style={{ borderColor: CLUB.border }}>{steps.map((step, index) => <li key={step} className="flex items-center gap-2 border-r px-3 py-2.5 last:border-r-0" style={{ borderColor: CLUB.border, background: index === current ? CLUB.ink : index < current ? 'rgba(90,139,106,.08)' : CLUB.card, color: index === current ? CLUB.bg : index < current ? CLUB.green : CLUB.muted }}><span className="iconik-mono flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px]" style={{ borderColor: 'currentColor' }}>{index + 1}</span><span className="hidden text-xs font-medium sm:block">{step}</span></li>)}</ol>;
}

export function ActionMenu({ label = 'More', children }: { label?: string; children: ReactNode }) {
  return (
    <details className="group relative" onClick={event => event.stopPropagation()}>
      <summary className={`${secondaryButtonClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>{label}</summary>
      <div className="absolute right-0 z-20 mt-2 min-w-48 rounded-xl border p-1.5 shadow-xl" style={{ background: CLUB.surface, borderColor: CLUB.border }}>
        {children}
      </div>
    </details>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel, busy, onCancel, onConfirm }: { open: boolean; title: string; description: string; confirmLabel: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="presentation" onMouseDown={onCancel}><div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ background: CLUB.surface, borderColor: CLUB.border }} onMouseDown={e => e.stopPropagation()}><h2 id="confirm-title" className="iconik-display text-2xl" style={{ color: CLUB.ink }}>{title}</h2><p className="mt-3 text-sm leading-6" style={{ color: CLUB.muted }}>{description}</p><div className="mt-6 flex justify-end gap-2"><button type="button" className={secondaryButtonClass} onClick={onCancel}>Cancel</button><button type="button" className={dangerButtonClass} disabled={busy} onClick={onConfirm}>{busy && <Loader2 size={14} className="animate-spin" />}{confirmLabel}</button></div></div></div>;
}
