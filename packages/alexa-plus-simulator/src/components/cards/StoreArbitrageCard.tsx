'use client';

import React, { useState } from 'react';
import {
  Scale,
  Truck,
  Award,
  CheckCircle2,
  ArrowRight,
  Tag,
} from 'lucide-react';
import type { StoreComparisonState } from '@/lib/mcpHttpClient';

interface StoreArbitrageCardProps {
  title: string;
  subtitle: string;
  comparison: StoreComparisonState;
  onExecuteTool: (
    toolName: string,
    args: Record<string, unknown>,
    userLabel: string
  ) => Promise<void>;
  isBusy: boolean;
}

export function StoreArbitrageCard({
  title,
  subtitle,
  comparison,
  onExecuteTool,
  isBusy,
}: StoreArbitrageCardProps) {
  const [selectedSlot, setSelectedSlot] = useState(
    comparison.preferredDeliveryWindow || '6:00 PM – 7:00 PM'
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-900/90 via-cyan-950/40 to-slate-900/90 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-500/30">
              STORE_ARBITRAGE_TABLE
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Delivery Slot:</span>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
          >
            <option value="6:00 PM – 7:00 PM">6:00 PM – 7:00 PM (Tonight)</option>
            <option value="7:00 PM – 8:00 PM">7:00 PM – 8:00 PM (Tonight)</option>
            <option value="Tomorrow 8:00 AM – 10:00 AM">
              Tomorrow 8:00 AM – 10:00 AM
            </option>
          </select>
        </div>
      </div>

      {/* 3 Retailer Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {comparison.stores.map((store) => {
          const isRecommended = store.storeId === comparison.recommendedStoreId;

          return (
            <div
              key={store.storeId}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                isRecommended
                  ? 'border-cyan-400/60 bg-gradient-to-b from-cyan-950/40 via-slate-900/90 to-slate-900/90 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 bg-slate-900/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-white">
                    {store.storeName}
                  </span>
                  {store.badge && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        isRecommended
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {store.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">{store.tagline}</p>

                <div className="mt-3 space-y-1 border-t border-slate-800/80 pt-2.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Items Subtotal:</span>
                    <span>${store.subtotalUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Prime Member Savings:</span>
                    <span>-${store.primeDiscountUsd.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Delivery Fee:</span>
                    <span>
                      {store.deliveryFeeUsd === 0
                        ? 'FREE (Prime)'
                        : `$${store.deliveryFeeUsd.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1.5 text-sm font-bold text-white">
                    <span>Total Out-of-Pocket:</span>
                    <span className="text-cyan-400">
                      ${store.totalOutOfPocketUsd.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2">
                <div className="mb-2 flex items-center gap-1 text-[11px] text-slate-400">
                  <Truck className="h-3.5 w-3.5 text-cyan-400" />
                  Window: {selectedSlot}
                </div>

                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() =>
                    onExecuteTool(
                      'checkout_smart_basket',
                      {
                        storeId: store.storeId,
                        deliverySlot: selectedSlot,
                        applyPrimeSavings: true,
                      },
                      `One-Tap Checkout ${store.storeName} (${selectedSlot})`
                    )
                  }
                  className={`w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                    isRecommended
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20 hover:opacity-95'
                      : 'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  One-Tap Checkout • ${store.totalOutOfPocketUsd.toFixed(2)}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Arbitrage Insight Callout */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-2.5 text-xs text-emerald-200">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{comparison.hybridSplitSummary.explanation}</span>
        </div>
        <span className="font-semibold text-emerald-300">
          Hybrid Floor: ${comparison.hybridSplitSummary.totalHybridUsd.toFixed(2)}
        </span>
      </div>

      {/* Item-by-Item Arbitrage Matrix */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/75">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
              <th className="py-2.5 px-3 font-semibold">Missing Ingredient</th>
              <th className="py-2.5 px-3 font-semibold text-cyan-300">
                Amazon Fresh (Prime)
              </th>
              <th className="py-2.5 px-3 font-semibold text-emerald-300">
                Whole Foods Market
              </th>
              <th className="py-2.5 px-3 font-semibold text-amber-300">
                Local Co-op
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {comparison.itemRows.map((row) => (
              <tr key={row.ingredientName} className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-medium text-white">
                  <div>{row.ingredientName}</div>
                  {row.amazonFreshNote && (
                    <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-cyan-300">
                      <Tag className="h-2.5 w-2.5" />
                      {row.amazonFreshNote}
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold ${
                        row.lowestStoreId === 'amazon-fresh'
                          ? 'text-cyan-400'
                          : 'text-slate-200'
                      }`}
                    >
                      ${row.amazonFreshPriceUsd.toFixed(2)}
                    </span>
                    {row.lowestStoreId === 'amazon-fresh' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {row.amazonFreshBrand} ({row.amazonFreshSize})
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold ${
                        row.lowestStoreId === 'whole-foods'
                          ? 'text-emerald-400'
                          : 'text-slate-200'
                      }`}
                    >
                      ${row.wholeFoodsPriceUsd.toFixed(2)}
                    </span>
                    {row.lowestStoreId === 'whole-foods' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {row.wholeFoodsBrand} ({row.wholeFoodsSize})
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold ${
                        row.lowestStoreId === 'local-coop'
                          ? 'text-amber-400'
                          : 'text-slate-200'
                      }`}
                    >
                      ${row.localCoopPriceUsd.toFixed(2)}
                    </span>
                    {row.lowestStoreId === 'local-coop' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {row.localCoopBrand} ({row.localCoopSize})
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
