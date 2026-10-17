'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Refrigerator,
} from 'lucide-react';
import type { PantryItem } from '@/lib/mcpHttpClient';

interface PantryExpiryCardProps {
  title: string;
  subtitle: string;
  summaryMetrics: {
    totalItemsCount: number;
    criticalExpiryCount: number;
    expiringWithin72hCount: number;
    atRiskValueUsd: number;
    filterHoursApplied: number;
  };
  items: PantryItem[];
  onExecuteTool: (
    toolName: string,
    args: Record<string, unknown>,
    userLabel: string
  ) => Promise<void>;
  isBusy: boolean;
}

export function PantryExpiryCard({
  title,
  subtitle,
  summaryMetrics,
  items,
  onExecuteTool,
  isBusy,
}: PantryExpiryCardProps) {
  const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

  const displayedItems = filterCriticalOnly
    ? items.filter((i) => i.expiresInHours <= 48)
    : items;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-slate-900/90 via-indigo-950/50 to-slate-900/90 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Refrigerator className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-500/30">
              PANTRY_EXPIRY_GRID
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => setFilterCriticalOnly((prev) => !prev)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              filterCriticalOnly
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            {filterCriticalOnly ? 'Showing <=48h Critical' : 'Filter <=48h Urgent'}
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              onExecuteTool(
                'generate_meal_plan',
                {
                  days: 3,
                  maxBudgetUsd: 38,
                  minProteinGramsPerMeal: 35,
                  dietaryTags: ['vegetarian'],
                  prioritizeExpiring: true,
                },
                'Plan 3 High-Protein Rescue Dinners (<$38)'
              )
            }
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Auto-Plan 3 Rescue Dinners
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-xs text-slate-400">Tracked Pantry Items</div>
          <div className="mt-1 text-xl font-bold text-white">
            {summaryMetrics.totalItemsCount}
          </div>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
          <div className="text-xs text-rose-300">Critical (&le;36h)</div>
          <div className="mt-1 text-xl font-bold text-rose-400">
            {summaryMetrics.criticalExpiryCount} items
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
          <div className="text-xs text-amber-300">Expiring (&le;72h)</div>
          <div className="mt-1 text-xl font-bold text-amber-400">
            {summaryMetrics.expiringWithin72hCount} items
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
          <div className="text-xs text-emerald-300">At-Risk Waste Value</div>
          <div className="mt-1 text-xl font-bold text-emerald-400">
            ${summaryMetrics.atRiskValueUsd.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Pantry Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {displayedItems.map((item) => {
          const isCritical = item.expiresInHours <= 36;
          const isWarning = item.expiresInHours > 36 && item.expiresInHours <= 72;

          return (
            <div
              key={item.id}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition ${
                isCritical
                  ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/30 via-slate-900/90 to-slate-900/90'
                  : isWarning
                  ? 'border-amber-500/35 bg-gradient-to-br from-amber-950/25 via-slate-900/90 to-slate-900/90'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {item.category}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Qty:{' '}
                    <span className="font-medium text-slate-200">
                      {item.quantity} {item.unit}
                    </span>{' '}
                    • {item.storageLocation} • Value:{' '}
                    <span className="text-emerald-400">
                      ${item.estimatedValueUsd.toFixed(2)}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isCritical ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : isWarning ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {item.expiresInHours <= 72
                    ? `${item.expiresInHours}h left`
                    : `${Math.round(item.expiresInHours / 24)}d fresh`}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                <span className="text-[11px] text-slate-400">
                  {isCritical
                    ? 'Urgent: Use tonight or tomorrow'
                    : isWarning
                    ? 'Recommended for 3-day meal plan'
                    : 'Stable pantry staple'}
                </span>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    onExecuteTool(
                      'scan_pantry_inventory',
                      {
                        filterExpiringWithinHours: 72,
                        addOrUpdateItems: [
                          {
                            name: item.name,
                            quantity: item.quantity,
                            unit: item.unit,
                            expiresInHours: Math.max(6, Math.min(24, item.expiresInHours)),
                            category: item.category,
                          },
                        ],
                      },
                      `Prioritize ${item.name} for immediate rescue`
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
                >
                  <PlusCircle className="h-3 w-3" />
                  Prioritize Item
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
