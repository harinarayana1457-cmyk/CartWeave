'use client';

import React from 'react';
import {
  Flame,
  Dumbbell,
  Clock,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Check,
  Plus,
  Wallet,
  Leaf,
  ArrowRightLeft,
  Users,
} from 'lucide-react';
import type { ActiveMealPlan } from '@/lib/mcpHttpClient';
import { Badge, Button, cx, StatTile, usd, WidgetHeader } from '../ui';

interface MealPlanMacroCardProps {
  title: string;
  subtitle: string;
  mealPlan: ActiveMealPlan;
  swapHighlight?: {
    dayIndex: number;
    previousDishTitle: string;
    newDishTitle: string;
    constraintApplied: string;
    caloriesDelta: number;
    costDeltaUsd: number;
  };
  onExecuteTool: (
    toolName: string,
    args: Record<string, unknown>,
    userLabel: string
  ) => Promise<void>;
  isBusy: boolean;
}

export function MealPlanMacroCard({
  title,
  subtitle,
  mealPlan,
  swapHighlight,
  onExecuteTool,
  isBusy,
}: MealPlanMacroCardProps) {
  const budgetPct = Math.min(100, (mealPlan.totalEstimatedCostUsd / mealPlan.maxBudgetUsd) * 100);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <WidgetHeader
        icon={<Sparkles className="h-6 w-6" />}
        tone="violet"
        title={title}
        subtitle={subtitle}
        widgetType="MEAL_PLAN_MACRO_CARDS"
        actions={
          <Button
            size="sm"
            variant="primary"
            loading={isBusy}
            icon={<ShoppingCart className="h-4 w-4" />}
            onClick={() =>
              onExecuteTool(
                'compare_grocery_carts',
                {
                  mealPlanId: mealPlan.mealPlanId,
                  missingIngredients: mealPlan.missingIngredients,
                  preferredDeliveryWindow: '6:00 PM – 7:00 PM',
                },
                'Compare 3 Retailers for Missing Ingredients'
              )
            }
          >
            Compare 3 stores · {mealPlan.missingIngredients.length} items
          </Button>
        }
      />

      {/* Live Swap Notification Banner */}
      {swapHighlight && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-50"
        >
          <div className="flex items-start gap-2.5">
            <ArrowRightLeft aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <div>
              <span className="font-semibold text-emerald-200">
                Day {swapHighlight.dayIndex} swapped · {swapHighlight.constraintApplied}
              </span>
              <div className="mt-0.5 text-emerald-100/90">
                <span className="line-through opacity-70">{swapHighlight.previousDishTitle}</span>
                <span aria-hidden="true"> → </span>
                <span className="sr-only"> replaced with </span>
                <span className="font-semibold text-white">{swapHighlight.newDishTitle}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="success" mono>
              {swapHighlight.caloriesDelta <= 0
                ? `${swapHighlight.caloriesDelta} kcal`
                : `+${swapHighlight.caloriesDelta} kcal`}
            </Badge>
            <Badge tone="success" mono>
              {swapHighlight.costDeltaUsd <= 0
                ? `-$${Math.abs(swapHighlight.costDeltaUsd).toFixed(2)}`
                : `+$${swapHighlight.costDeltaUsd.toFixed(2)}`}
            </Badge>
          </div>
        </div>
      )}

      {/* Macro Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="3-dinner spend"
          tone="brand"
          icon={<Wallet className="h-4 w-4" />}
          value={usd(mealPlan.totalEstimatedCostUsd)}
          hint={
            <span className="block">
              <span className="tabular">of ${mealPlan.maxBudgetUsd} budget</span>
              <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <span
                  className="block h-full rounded-full bg-cyan-400"
                  style={{ width: `${budgetPct}%` }}
                />
              </span>
            </span>
          }
        />
        <StatTile
          label="Avg protein"
          tone="violet"
          icon={<Dumbbell className="h-4 w-4" />}
          value={`${mealPlan.averageProteinGrams}g`}
          hint={<span className="tabular">{mealPlan.totalProteinGrams}g total</span>}
        />
        <StatTile
          label="Items rescued"
          tone="success"
          icon={<Leaf className="h-4 w-4" />}
          value={mealPlan.expiringItemsRescued.length}
          hint="expiring soon"
        />
        <StatTile
          label="Waste avoided"
          tone="success"
          icon={<Sparkles className="h-4 w-4" />}
          value={usd(mealPlan.estimatedWasteSavedUsd)}
        />
      </div>

      {/* 3-Day Meal Cards */}
      <ol className="space-y-3">
        {mealPlan.meals.map((meal) => {
          const r = meal.recipe;
          const isSwappedDay = swapHighlight?.dayIndex === meal.dayIndex;

          return (
            <li
              key={`${meal.dayIndex}-${r.id}`}
              className={cx(
                'glass rounded-3xl p-5 transition-[border-color,box-shadow] duration-300',
                isSwappedDay && 'border-cyan-400/40 shadow-glow'
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-indigo-400/15 ring-1 ring-inset ring-indigo-400/30"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200">Day</span>
                    <span className="tabular text-xl font-extrabold leading-none text-white">{meal.dayIndex}</span>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="sr-only">{meal.dayLabel}:</span>
                      <Badge tone="success">{r.badgeText}</Badge>
                      {r.dietaryTags.map((tag) => (
                        <Badge key={tag}>{tag}</Badge>
                      ))}
                      {isSwappedDay && (
                        <Badge tone="brand">
                          <RefreshCw aria-hidden="true" className="h-3 w-3" /> Swapped
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold leading-snug tracking-tight text-white">{r.title}</h3>
                    <p className="text-sm text-fg-muted">{r.subtitle}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="tabular text-2xl font-bold text-cyan-300">{usd(r.estimatedCostUsd)}</div>
                  <div className="mt-0.5 flex items-center justify-end gap-1 text-xs text-fg-muted">
                    <Users aria-hidden="true" className="h-3 w-3" />
                    {r.servings} servings
                  </div>
                </div>
              </div>

              {/* Macros Bar */}
              <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Macro icon={<Dumbbell className="h-3.5 w-3.5" />} label="Protein" value={`${r.proteinGrams}g`} tone="text-indigo-200" />
                <Macro icon={<Flame className="h-3.5 w-3.5" />} label="Calories" value={`${r.calories}`} tone="text-amber-200" />
                <Macro label="Carbs" value={`${r.carbsGrams}g`} />
                <Macro label="Fat" value={`${r.fatGrams}g`} />
                <Macro icon={<Clock className="h-3.5 w-3.5" />} label="Prep" value={`${r.prepTimeMinutes}m`} />
              </dl>

              {/* Pantry Rescued vs Missing Store Ingredients */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-500/[0.06] p-3 ring-1 ring-inset ring-emerald-400/15">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    From your pantry · free
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {r.pantryIngredientsUsed.map((ing) => (
                      <li key={ing}>
                        <Badge tone="success">
                          <Check aria-hidden="true" className="h-3 w-3" />
                          {ing}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl bg-cyan-500/[0.06] p-3 ring-1 ring-inset ring-cyan-400/15">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-300">
                    Need from store
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {r.missingIngredients.map((ing) => (
                      <li key={ing}>
                        <Badge tone="brand">
                          <Plus aria-hidden="true" className="h-3 w-3" />
                          {ing}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Interactive MCP Action Footer */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
                <p className="max-w-prose text-sm italic text-fg-muted">“{r.chefNote}”</p>

                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isBusy}
                  icon={<RefreshCw className="h-4 w-4" />}
                  onClick={() =>
                    onExecuteTool(
                      'swap_ingredient_constraint',
                      {
                        dayIndex: meal.dayIndex,
                        constraint: 'dairy-free',
                        maxCalories: 520,
                      },
                      `Swap Day ${meal.dayIndex} for Dairy-Free (<520 kcal)`
                    )
                  }
                >
                  Swap · dairy-free &lt;520 kcal
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Macro({
  icon,
  label,
  value,
  tone = 'text-slate-100',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-inset ring-white/[0.06]">
      <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-fg-muted">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </dt>
      <dd className={cx('tabular mt-0.5 text-base font-bold', tone)}>{value}</dd>
    </div>
  );
}
