'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

/* ------------------------------------------------------------------
 * Shared CartWeave UI primitives
 * Centralises tone colors, touch-target sizes (≥40–44px) and focus /
 * pressed / disabled states so every card stays visually consistent.
 * ------------------------------------------------------------------ */

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet';

export const toneText: Record<Tone, string> = {
  neutral: 'text-fg',
  brand: 'text-cyan-300',
  success: 'text-emerald-300',
  warning: 'text-amber-300',
  danger: 'text-rose-300',
  violet: 'text-indigo-300',
};

const toneBadge: Record<Tone, string> = {
  neutral: 'bg-white/[0.06] text-slate-200 ring-white/10',
  brand: 'bg-cyan-400/10 text-cyan-200 ring-cyan-400/25',
  success: 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/25',
  warning: 'bg-amber-400/10 text-amber-200 ring-amber-400/25',
  danger: 'bg-rose-400/10 text-rose-200 ring-rose-400/30',
  violet: 'bg-indigo-400/10 text-indigo-200 ring-indigo-400/25',
};

const toneIconWell: Record<Tone, string> = {
  neutral: 'bg-white/[0.06] text-slate-200',
  brand: 'bg-cyan-400/15 text-cyan-300',
  success: 'bg-emerald-400/15 text-emerald-300',
  warning: 'bg-amber-400/15 text-amber-300',
  danger: 'bg-rose-400/15 text-rose-300',
  violet: 'bg-indigo-400/15 text-indigo-300',
};

export function Badge({
  tone = 'neutral',
  mono = false,
  className,
  children,
}: {
  tone?: Tone;
  mono?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        mono && 'font-mono text-[12px]',
        toneBadge[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function IconWell({
  tone = 'brand',
  size = 'md',
  children,
}: {
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-10 w-10',
        size === 'lg' && 'h-12 w-12 rounded-2xl',
        toneIconWell[tone]
      )}
    >
      {children}
    </span>
  );
}

type ButtonVariant = 'primary' | 'brand' | 'secondary' | 'ghost' | 'brandSoft' | 'warningSoft';

const buttonVariant: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent font-semibold shadow-glow-accent hover:bg-emerald-400 active:bg-emerald-600',
  brand:
    'bg-gradient-to-r from-cyan-400 to-indigo-500 text-white font-semibold shadow-glow hover:brightness-110 active:brightness-95',
  secondary:
    'bg-white/[0.06] text-slate-100 ring-1 ring-inset ring-white/10 hover:bg-white/[0.1] hover:ring-white/20 active:bg-white/[0.04]',
  ghost: 'text-slate-300 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.03]',
  brandSoft:
    'font-medium text-cyan-200 hover:bg-cyan-400/10 hover:text-cyan-100 active:bg-cyan-400/[0.06]',
  warningSoft:
    'font-medium bg-amber-400/15 text-amber-100 ring-1 ring-inset ring-amber-400/40 hover:bg-amber-400/20',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    icon,
    trailingIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 rounded-xl text-sm transition-[background-color,box-shadow,filter,color] duration-200 ease-out-expo',
        'disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' ? 'min-h-10 px-3.5' : 'min-h-11 px-4',
        fullWidth && 'w-full',
        buttonVariant[variant],
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : (
        icon && <span aria-hidden="true" className="inline-flex">{icon}</span>
      )}
      {children}
      {trailingIcon && <span aria-hidden="true" className="inline-flex">{trailingIcon}</span>}
    </button>
  );
});

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  icon?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</span>
        {icon && (
          <IconWell tone={tone} size="sm">
            {icon}
          </IconWell>
        )}
      </div>
      <div className={cx('tabular mt-2 text-2xl font-bold leading-none', toneText[tone])}>
        {value}
      </div>
      {hint && <div className="mt-1.5 text-xs text-fg-muted">{hint}</div>}
    </div>
  );
}

export function WidgetHeader({
  icon,
  tone = 'brand',
  title,
  subtitle,
  widgetType,
  actions,
}: {
  icon: React.ReactNode;
  tone?: Tone;
  title: string;
  subtitle: string;
  widgetType: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-5">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <IconWell tone={tone} size="lg">
            {icon}
          </IconWell>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">{title}</h2>
              <Badge tone={tone} mono>
                {widgetType}
              </Badge>
            </div>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-fg-muted">{subtitle}</p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function SectionLabel({
  icon,
  children,
  trailing,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-muted">
        {icon && <span aria-hidden="true" className="inline-flex text-cyan-300">{icon}</span>}
        {children}
      </span>
      {trailing}
    </div>
  );
}

export const usd = (n: number) => `$${n.toFixed(2)}`;
