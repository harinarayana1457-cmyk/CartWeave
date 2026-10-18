'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  Refrigerator,
  Package,
  Flame,
  Leaf,
  Pin,
  Filter,
} from 'lucide-react';
import type { PantryItem } from '@/lib/mcpHttpClient';
import { Badge, Button, cx, StatTile, usd, WidgetHeader } from '../ui';

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
      <WidgetHeader
        icon={<Refrigerator className="h-6 w-6" />}
        tone="brand"
        title={title}
        subtitle={subtitle}
        widgetType="PANTRY_EXPIRY_GRID"
        actions={
          <>
            <Button
              size="sm"
              variant={filterCriticalOnly ? 'warningSoft' : 'secondary'}
              aria-pressed={filterCriticalOnly}
              disabled={isBusy}
              onClick={() => setFilterCriticalOnly((prev) => !prev)}
              icon={<Filter className="h-4 w-4" />}
            >
              {filterCriticalOnly ? 'Showing ≤48h' : 'Urgent only'}
            </Button>
            <Button
              size="sm"
              variant="primary"
              loading={isBusy}
              icon={<Sparkles className="h-4 w-4" />}
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
            >
              Auto-plan 3 rescue dinners
            </Button>
          </>
        }
      />

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Tracked items"
          value={summaryMetrics.totalItemsCount}
          icon={<Package className="h-4 w-4" />}
        />
        <StatTile
          label="Critical ≤36h"
          value={summaryMetrics.criticalExpiryCount}
          hint="use tonight"
          tone="danger"
          icon={<Flame className="h-4 w-4" />}
        />
        <StatTile
          label="Expiring ≤72h"
          value={summaryMetrics.expiringWithin72hCount}
          hint="plan this week"
          tone="warning"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatTile
          label="At-risk value"
          value={usd(summaryMetrics.atRiskValueUsd)}
          hint="waste to rescue"
          tone="success"
          icon={<Leaf className="h-4 w-4" />}
        />
      </div>

      {/* Pantry Grid */}
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {displayedItems.map((item) => {
          const isCritical = item.expiresInHours <= 36;
          const isWarning = item.expiresInHours > 36 && item.expiresInHours <= 72;
          // Freshness meter: 0h → 0%, 120h+ → 100%
          const freshnessPct = Math.max(4, Math.min(100, (item.expiresInHours / 120) * 100));

          return (
            <li
              key={item.id}
              className={cx(
                'glass group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 transition-[border-color,background-color] duration-200',
                isCritical && 'border-rose-400/30 bg-rose-500/[0.06]',
                isWarning && 'border-amber-400/25 bg-amber-500/[0.04]'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-white">{item.name}</span>
                    <Badge>{item.category}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-fg-muted">
                    <span className="tabular font-medium text-slate-200">
                      {item.quantity} {item.unit}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.storageLocation}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular text-emerald-300">{usd(item.estimatedValueUsd)}</span>
                  </div>
                </div>

                <Badge tone={isCritical ? 'danger' : isWarning ? 'warning' : 'success'} className="tabular py-1">
                  {isCritical ? (
                    <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : isWarning ? (
                    <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  {item.expiresInHours <= 72
                    ? `${item.expiresInHours}h left`
                    : `${Math.round(item.expiresInHours / 24)}d fresh`}
                </Badge>
              </div>

              {/* Freshness meter (redundant with text label — color is not the only signal) */}
              <div
                className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
                role="meter"
                aria-label={`${item.name} freshness`}
                aria-valuemin={0}
                aria-valuemax={120}
                aria-valuenow={Math.min(120, item.expiresInHours)}
              >
                <div
                  className={cx(
                    'h-full rounded-full transition-[width] duration-500 ease-out-expo',
                    isCritical ? 'bg-rose-400' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                  )}
                  style={{ width: `${freshnessPct}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                <span className="text-xs text-fg-muted">
                  {isCritical
                    ? 'Urgent: Use tonight or tomorrow'
                    : isWarning
                    ? 'Recommended for 3-day meal plan'
                    : 'Stable pantry staple'}
                </span>

                <Button
                  size="sm"
                  variant="brandSoft"
                  disabled={isBusy}
                  icon={<Pin className="h-3.5 w-3.5" />}
                  aria-label={`Prioritize ${item.name} for immediate rescue`}
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
                >
                  Prioritize
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
