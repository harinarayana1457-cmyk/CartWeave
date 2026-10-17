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
} from 'lucide-react';
import type { ActiveMealPlan } from '@/lib/mcpHttpClient';

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
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900/90 via-indigo-950/60 to-slate-900/90 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/30">
              MEAL_PLAN_MACRO_CARDS
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        </div>

        <button
          type="button"
          disabled={isBusy}
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
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 disabled:opacity-50"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Compare 3 Stores ({mealPlan.missingIngredients.length} Missing Items)
        </button>
      </div>

      {/* Live Swap Notification Banner */}
      {swapHighlight && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-emerald-300">
              Live MCP Constraint Swap Applied (Day {swapHighlight.dayIndex}):
            </span>{' '}
            Replaced <span className="line-through opacity-75">{swapHighlight.previousDishTitle}</span>{' '}
            with <span className="font-semibold text-white">{swapHighlight.newDishTitle}</span>{' '}
            [{swapHighlight.constraintApplied}]
          </div>
          <div className="font-mono text-emerald-300">
            {swapHighlight.caloriesDelta <= 0
              ? `${swapHighlight.caloriesDelta} kcal`
              : `+${swapHighlight.caloriesDelta} kcal`}{' '}
            •{' '}
            {swapHighlight.costDeltaUsd <= 0
              ? `-$${Math.abs(swapHighlight.costDeltaUsd).toFixed(2)}`
              : `+$${swapHighlight.costDeltaUsd.toFixed(2)}`}
          </div>
        </div>
      )}

      {/* Macro Summary Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-xs text-slate-400">Est. 3-Dinner Spend</div>
          <div className="mt-1 text-xl font-bold text-cyan-400">
            ${mealPlan.totalEstimatedCostUsd.toFixed(2)}{' '}
            <span className="text-xs font-normal text-slate-400">
              / ${mealPlan.maxBudgetUsd}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-xs text-slate-400">Avg Protein / Serving</div>
          <div className="mt-1 text-xl font-bold text-indigo-400">
            {mealPlan.averageProteinGrams}g{' '}
            <span className="text-xs font-normal text-slate-400">
              ({mealPlan.totalProteinGrams}g total)
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-xs text-slate-400">Expiring Items Rescued</div>
          <div className="mt-1 text-xl font-bold text-emerald-400">
            {mealPlan.expiringItemsRescued.length} items
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <div className="text-xs text-slate-400">Food Waste Avoided</div>
          <div className="mt-1 text-xl font-bold text-emerald-400">
            ${mealPlan.estimatedWasteSavedUsd.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 3-Day Meal Cards */}
      <div className="space-y-3">
        {mealPlan.meals.map((meal) => {
          const r = meal.recipe;
          const isSwappedDay = swapHighlight?.dayIndex === meal.dayIndex;

          return (
            <div
              key={`${meal.dayIndex}-${r.id}`}
              className={`rounded-2xl border p-4 transition ${
                isSwappedDay
                  ? 'border-cyan-400/50 bg-gradient-to-r from-cyan-950/30 via-slate-900/90 to-slate-900/90'
                  : 'border-slate-800 bg-slate-900/75'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
                      {meal.dayLabel}
                    </span>
                    <span className="rounded-lg bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-500/30">
                      {r.badgeText}
                    </span>
                    {r.dietaryTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h4 className="text-base font-bold text-white pt-1">{r.title}</h4>
                  <p className="text-xs text-slate-300">{r.subtitle}</p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-400">
                    ${r.estimatedCostUsd.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {r.servings} servings
                  </div>
                </div>
              </div>

              {/* Macros Bar */}
              <div className="mt-3 flex flex-wrap items-center gap-4 rounded-xl bg-slate-950/60 px-3.5 py-2 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-indigo-300">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {r.proteinGrams}g Protein
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Flame className="h-3.5 w-3.5" />
                  {r.calories} kcal
                </span>
                <span className="text-slate-400">Carbs: {r.carbsGrams}g</span>
                <span className="text-slate-400">Fat: {r.fatGrams}g</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  {r.prepTimeMinutes}m prep
                </span>
              </div>

              {/* Pantry Rescued vs Missing Store Ingredients */}
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/15 p-2.5">
                  <div className="font-semibold text-emerald-300 mb-1">
                    Pantry Items Used (Zero Cost):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.pantryIngredientsUsed.map((ing) => (
                      <span
                        key={ing}
                        className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-200"
                      >
                        <Check className="h-3 w-3" />
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/15 p-2.5">
                  <div className="font-semibold text-cyan-300 mb-1">
                    Missing Store Ingredients:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.missingIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="rounded bg-cyan-500/15 px-2 py-0.5 text-[11px] text-cyan-200"
                      >
                        + {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive MCP Action Footer */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2.5">
                <span className="text-[11px] italic text-slate-400">
                  {r.chefNote}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
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
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Swap Dish (Dairy-Free &lt;520 kcal)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
