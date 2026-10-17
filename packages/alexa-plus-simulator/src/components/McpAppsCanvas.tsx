'use client';

import React from 'react';
import {
  Refrigerator,
  UtensilsCrossed,
  Scale,
  PackageCheck,
  Layers,
} from 'lucide-react';
import type { McpAppWidgetPayload } from '@/lib/mcpHttpClient';
import { PantryExpiryCard } from './cards/PantryExpiryCard';
import { MealPlanMacroCard } from './cards/MealPlanMacroCard';
import { StoreArbitrageCard } from './cards/StoreArbitrageCard';
import { OrderConfirmationCard } from './cards/OrderConfirmationCard';

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
    widgetBadge: string;
    icon: React.ReactNode;
    hasData: boolean;
  }> = [
    {
      id: 'PANTRY',
      label: 'Pantry Inventory',
      widgetBadge: 'scan_pantry_inventory',
      icon: <Refrigerator className="h-4 w-4" />,
      hasData: Boolean(pantryWidget),
    },
    {
      id: 'MEAL_PLAN',
      label: '3-Day Meal & Macro Plan',
      widgetBadge: 'generate_meal_plan',
      icon: <UtensilsCrossed className="h-4 w-4" />,
      hasData: Boolean(mealPlanWidget),
    },
    {
      id: 'ARBITRAGE',
      label: '3-Store Price Arbitrage',
      widgetBadge: 'compare_grocery_carts',
      icon: <Scale className="h-4 w-4" />,
      hasData: Boolean(arbitrageWidget),
    },
    {
      id: 'ORDER',
      label: 'Order Receipt',
      widgetBadge: 'checkout_smart_basket',
      icon: <PackageCheck className="h-4 w-4" />,
      hasData: Boolean(orderWidget),
    },
  ];

  return (
    <main className="w-full lg:w-[64%] bg-[#0B1120] p-4 sm:p-5 flex flex-col justify-between gap-4">
      <div className="space-y-4">
        {/* Top Interactive MCP Apps View Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 text-white border border-cyan-400/50 shadow-sm'
                      : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.hasData && (
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-[11px] text-slate-400">
            <Layers className="h-3.5 w-3.5 text-cyan-400" />
            <span>Alexa+ Multimodal MCP Apps Renderer</span>
          </div>
        </div>

        {/* Active MCP App Widget Viewport */}
        <div className="min-h-[470px]">
          {activeTab === 'PANTRY' && pantryWidget && (
            <PantryExpiryCard
              title={pantryWidget.title}
              subtitle={pantryWidget.subtitle}
              summaryMetrics={pantryWidget.summaryMetrics}
              items={pantryWidget.items}
              onExecuteTool={onExecuteTool}
              isBusy={isBusy}
            />
          )}

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
                title="No Active 3-Day Meal Plan Yet"
                description="Click below or tap Demo Scenario #1 to generate a 3-day high-protein vegetarian meal plan that rescues expiring pantry items."
                buttonLabel="Run generate_meal_plan (3 Dinners < $38)"
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
                title="3-Retailer Grocery Arbitrage Not Run Yet"
                description="Compare missing meal-plan ingredients across Amazon Fresh, Whole Foods Market, and Local Co-op with live Prime savings."
                buttonLabel="Run compare_grocery_carts Now"
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
                title="No Basket Checked Out Yet"
                description="Complete a one-tap smart checkout to generate an order tracking code, calculate Prime savings, and deduct rescued expiring pantry items."
                buttonLabel="Run checkout_smart_basket (Amazon Fresh 6–7 PM)"
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
      </div>
    </main>
  );
}

function EmptyWidgetPrompt({
  title,
  description,
  buttonLabel,
  onTrigger,
  isBusy,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  onTrigger: () => void;
  isBusy: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
      <h4 className="text-base font-semibold text-white">{title}</h4>
      <p className="mt-1.5 max-w-md text-xs text-slate-400">{description}</p>
      <button
        type="button"
        disabled={isBusy}
        onClick={onTrigger}
        className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 disabled:opacity-50"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
