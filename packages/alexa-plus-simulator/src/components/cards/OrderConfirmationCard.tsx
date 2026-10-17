'use client';

import React from 'react';
import {
  CheckCircle2,
  PackageCheck,
  Leaf,
  Sparkles,
  Truck,
  RefreshCw,
} from 'lucide-react';
import type { OrderConfirmationState } from '@/lib/mcpHttpClient';

interface OrderConfirmationCardProps {
  title: string;
  subtitle: string;
  order: OrderConfirmationState;
  onExecuteTool: (
    toolName: string,
    args: Record<string, unknown>,
    userLabel: string
  ) => Promise<void>;
  isBusy: boolean;
}

export function OrderConfirmationCard({
  title,
  subtitle,
  order,
  onExecuteTool,
  isBusy,
}: OrderConfirmationCardProps) {
  return (
    <div className="space-y-4">
      {/* Hero Confirmation Banner */}
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/50 via-slate-900/90 to-cyan-950/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-500/20 p-2.5 border border-emerald-500/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/40">
                  ORDER_CONFIRMATION_CARD
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">{subtitle}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>
                  Order ID:{' '}
                  <strong className="font-mono text-slate-200">
                    {order.orderId}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Tracking:{' '}
                  <strong className="font-mono text-cyan-300">
                    {order.trackingCode}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isBusy}
            onClick={() =>
              onExecuteTool(
                'scan_pantry_inventory',
                { filterExpiringWithinHours: 72 },
                'Verify Updated Post-Checkout Pantry Inventory'
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            View Updated Pantry
          </button>
        </div>
      </div>

      {/* Savings & Sustainability Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-3">
          <div className="text-xs text-slate-400">Final Total Charged</div>
          <div className="mt-1 text-xl font-bold text-white">
            ${order.finalTotalUsd.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3">
          <div className="text-xs text-cyan-300">Prime Member Savings</div>
          <div className="mt-1 text-xl font-bold text-cyan-400">
            ${order.primeSavingsUsd.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
          <div className="text-xs text-emerald-300">Food Waste Avoided</div>
          <div className="mt-1 text-xl font-bold text-emerald-400">
            ${order.foodWasteAvoidedUsd.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3">
          <div className="text-xs text-indigo-300">Delivery Window</div>
          <div className="mt-1 text-sm font-bold text-indigo-300 flex items-center gap-1">
            <Truck className="h-4 w-4" />
            {order.deliverySlot}
          </div>
        </div>
      </div>

      {/* Deducted Pantry Items & Ordered Line Items */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <PackageCheck className="h-4 w-4 text-cyan-400" />
            {order.storeName} Basket ({order.itemsOrderedCount} Items)
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {order.itemsOrdered.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-2 text-xs"
              >
                <div>
                  <div className="font-medium text-slate-200">{item.name}</div>
                  <div className="text-[11px] text-slate-400">{item.brand}</div>
                </div>
                <span className="font-mono font-semibold text-cyan-300">
                  ${item.priceUsd.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/15 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300 mb-3">
              <Leaf className="h-4 w-4 text-emerald-400" />
              Expiring Pantry Ingredients Reserved &amp; Deducted
            </div>
            <p className="text-xs text-slate-300 mb-3">
              CartWeave reserved these expiring items in your household pantry
              state so they are consumed across your next 3 dinners:
            </p>
            <div className="flex flex-wrap gap-2">
              {order.pantryItemsDeducted.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200"
                >
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span>${order.subtotalUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400 mt-1">
              <span>Prime Discount + Free Slot Savings:</span>
              <span>-${order.primeSavingsUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-white border-t border-slate-800 mt-2 pt-2">
              <span>Total Charged to Amazon Pay:</span>
              <span className="text-cyan-400">
                ${order.finalTotalUsd.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
