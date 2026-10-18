'use client';

import React from 'react';
import {
  Refrigerator,
  UtensilsCrossed,
  Scale,
  PackageCheck,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { McpAppWidgetPayload } from '@/lib/mcpHttpClient';
import { PantryExpiryCard } from './cards/PantryExpiryCard';
import { MealPlanMacroCard } from './cards/MealPlanMacroCard';
import { StoreArbitrageCard } from './cards/StoreArbitrageCard';
import { OrderConfirmationCard } from './cards/OrderConfirmationCard';
import { Button, cx, IconWell } from './ui';

export type CanvasTab = 'PANTRY' | 'MEAL_PLAN' | 'ARBITRAGE' | 'ORDER';

interface McpAppsCanvasProps {
  activeTab: CanvasTab;
  onSelectTab: (tab: CanvasTab) => void;
  pantryWidget: Extract<
    McpAppWidgetPayload,
    { widgetType: 'PANTRY_EXPIRY_GRID' }
  > | null;
  mealPlanWidget: Extract<
    McpAppWidgetPayload,
    { widgetType: 'MEAL_PLAN_MACRO_CARDS' }
  > | null;
  arbitrageWidget: Extract<
    McpAppWidgetPayload,
    { widgetType: 'STORE_ARBITRAGE_TABLE' }
  > | null;
  orderWidget: Extract<
    McpAppWidgetPayload,
    { widgetType: 'ORDER_CONFIRMATION_CARD' }
  > | null;
  onExecuteTool: (
    toolName: string,
    args: Record<string, unknown>,
    userLabel: string
  ) => Promise<void>;
  isBusy: boolean;
}

export function McpAppsCanvas({
  activeTab,
  onSelectTab,
  pantryWidget,
  mealPlanWidget,
  arbitrageWidget,
  orderWidget,
  onExecuteTool,
  isBusy,
}: McpAppsCanvasProps) {
  const tabs: Array<{
    id: CanvasTab;
    label: string;
    shortLabel: string;
    widgetBadge: string;
    icon: React.ReactNode;
    hasData: boolean;
  }> = [
    {
      id: 'PANTRY',
      label: 'Pantry',
      shortLabel: 'Pantry',
      widgetBadge: 'scan_pantry_inventory',
      icon: <Refrigerator className="h-4 w-4" />,
      hasData: Boolean(pantryWidget),
    },
    {
      id: 'MEAL_PLAN',
      label: 'Meal Plan',
      shortLabel: 'Meals',
      widgetBadge: 'generate_meal_plan',
      icon: <UtensilsCrossed className="h-4 w-4" />,
      hasData: Boolean(mealPlanWidget),
    },
    {
      id: 'ARBITRAGE',
      label: 'Price Compare',
      shortLabel: 'Compare',
      widgetBadge: 'compare_grocery_carts',
      icon: <Scale className="h-4 w-4" />,
      hasData: Boolean(arbitrageWidget),
    },
    {
      id: 'ORDER',
      label: 'Order',
      shortLabel: 'Order',
      widgetBadge: 'checkout_smart_basket',
      icon: <PackageCheck className="h-4 w-4" />,
      hasData: Boolean(orderWidget),
    },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const idx = tabs.findIndex((t) => t.id === activeTab);
    const next =
      e.key === 'ArrowRight' ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
    onSelectTab(tabs[next].id);
    document.getElementById(`canvas-tab-${tabs[next].id}`)?.focus();
  };

  return (
    <main className="w-full lg:w-[62%] xl:w-[64%] p-4 sm:p-5 flex flex-col gap-4">
      {/* Top Interactive MCP Apps View Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="MCP App widgets"
          onKeyDown={handleTabKeyDown}
          className="glass flex w-full items-center gap-1 overflow-x-auto rounded-2xl p-1 sm:w-auto"
        >
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`canvas-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="canvas-panel"
                tabIndex={isActive ? 0 : -1}
                title={tab.widgetBadge}
                onClick={() => onSelectTab(tab.id)}
                className={cx(
                  'relative flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3.5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 sm:flex-none',
                  isActive
                    ? 'bg-white/[0.1] text-white shadow-glass ring-1 ring-inset ring-white/15'
                    : 'text-fg-muted hover:bg-white/[0.04] hover:text-white'
                )}
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'tabular flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold',
                    isActive ? 'bg-cyan-400 text-slate-950' : 'bg-white/[0.08] text-fg-muted'
                  )}
                >
                  {idx + 1}
                </span>
                <span aria-hidden="true" className="hidden md:inline-flex">
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {tab.hasData && (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    />
                    <span className="sr-only">(has data)</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-1.5 text-xs text-fg-muted">
          <Layers aria-hidden="true" className="h-3.5 w-3.5 text-cyan-300" />
          <span>Alexa+ Multimodal MCP Apps Renderer</span>
        </div>
      </div>

      {/* Active MCP App Widget Viewport */}
      <div
        id="canvas-panel"
        role="tabpanel"
        aria-labelledby={`canvas-tab-${activeTab}`}
        aria-busy={isBusy}
        key={activeTab}
        className="min-h-[470px] animate-fade-up"
      >
        {activeTab === 'PANTRY' &&
          (pantryWidget ? (
            <PantryExpiryCard
              title={pantryWidget.title}
              subtitle={pantryWidget.subtitle}
              summaryMetrics={pantryWidget.summaryMetrics}
              items={pantryWidget.items}
              onExecuteTool={onExecuteTool}
              isBusy={isBusy}
            />
          ) : (
            <WidgetSkeleton />
          ))}

        {activeTab === 'MEAL_PLAN' &&
          (mealPlanWidget ? (
            <MealPlanMacroCard
              title={mealPlanWidget.title}
              subtitle={mealPlanWidget.subtitle}
              mealPlan={mealPlanWidget.mealPlan}
              swapHighlight={mealPlanWidget.swapHighlight}
              onExecuteTool={onExecuteTool}
              isBusy={isBusy}
            />
          ) : (
            <EmptyWidgetPrompt
              icon={<UtensilsCrossed className="h-6 w-6" />}
              title="No Active 3-Day Meal Plan Yet"
              description="Click below or tap Demo Scenario #1 to generate a 3-day high-protein vegetarian meal plan that rescues expiring pantry items."
              buttonLabel="Generate 3 dinners under $38"
              toolName="generate_meal_plan"
              onTrigger={() =>
                onExecuteTool(
                  'generate_meal_plan',
                  {
                    days: 3,
                    maxBudgetUsd: 38,
                    minProteinGramsPerMeal: 35,
                    dietaryTags: ['vegetarian'],
                    prioritizeExpiring: true,
                  },
                  'Generate 3-Day High-Protein Meal Plan'
                )
              }
              isBusy={isBusy}
            />
          ))}

        {activeTab === 'ARBITRAGE' &&
          (arbitrageWidget ? (
            <StoreArbitrageCard
              title={arbitrageWidget.title}
              subtitle={arbitrageWidget.subtitle}
              comparison={arbitrageWidget.comparison}
              onExecuteTool={onExecuteTool}
              isBusy={isBusy}
            />
          ) : (
            <EmptyWidgetPrompt
              icon={<Scale className="h-6 w-6" />}
              title="3-Retailer Grocery Arbitrage Not Run Yet"
              description="Compare missing meal-plan ingredients across Amazon Fresh, Whole Foods Market, and Local Co-op with live Prime savings."
              buttonLabel="Compare 3 stores now"
              toolName="compare_grocery_carts"
              onTrigger={() =>
                onExecuteTool(
                  'compare_grocery_carts',
                  { preferredDeliveryWindow: '6:00 PM – 7:00 PM' },
                  'Compare Amazon Fresh vs. Whole Foods vs. Local Co-op'
                )
              }
              isBusy={isBusy}
            />
          ))}

        {activeTab === 'ORDER' &&
          (orderWidget ? (
            <OrderConfirmationCard
              title={orderWidget.title}
              subtitle={orderWidget.subtitle}
              order={orderWidget.order}
              onExecuteTool={onExecuteTool}
              isBusy={isBusy}
            />
          ) : (
            <EmptyWidgetPrompt
              icon={<PackageCheck className="h-6 w-6" />}
              title="No Basket Checked Out Yet"
              description="Complete a one-tap smart checkout to generate an order tracking code, calculate Prime savings, and deduct rescued expiring pantry items."
              buttonLabel="Checkout Amazon Fresh (6–7 PM)"
              toolName="checkout_smart_basket"
              onTrigger={() =>
                onExecuteTool(
                  'checkout_smart_basket',
                  {
                    storeId: 'amazon-fresh',
                    deliverySlot: '6:00 PM – 7:00 PM',
                    applyPrimeSavings: true,
                  },
                  'One-Tap Checkout Amazon Fresh Basket'
                )
              }
              isBusy={isBusy}
            />
          ))}
      </div>
    </main>
  );
}

function EmptyWidgetPrompt({
  icon,
  title,
  description,
  buttonLabel,
  toolName,
  onTrigger,
  isBusy,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  toolName: string;
  onTrigger: () => void;
  isBusy: boolean;
}) {
  return (
    <div className="glass relative flex min-h-[470px] flex-col items-center justify-center overflow-hidden rounded-3xl border-dashed p-10 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <IconWell tone="brand" size="lg">
        {icon}
      </IconWell>
      <h3 className="relative mt-4 text-lg font-bold tracking-tight text-white">{title}</h3>
      <p className="relative mt-2 max-w-md text-sm leading-relaxed text-fg-muted">{description}</p>
      <Button
        variant="primary"
        className="relative mt-6"
        loading={isBusy}
        onClick={onTrigger}
        icon={<Sparkles className="h-4 w-4" />}
      >
        {buttonLabel}
      </Button>
      <code className="relative mt-3 font-mono text-xs text-fg-muted">tools/call · {toolName}</code>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading pantry inventory">
      <div className="skeleton h-[104px] rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[92px] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[120px] rounded-2xl" />
        ))}
      </div>
      <p className="text-center text-sm text-fg-muted">
        Connecting to the CartWeave MCP server on <code className="font-mono text-cyan-300">:3001</code>…
      </p>
    </div>
  );
}
