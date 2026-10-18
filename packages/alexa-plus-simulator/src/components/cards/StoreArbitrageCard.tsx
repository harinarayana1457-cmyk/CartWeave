'use client';

import React, { useState } from 'react';
import {
  Scale,
  Truck,
  Award,
  CheckCircle2,
  ArrowRight,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { StoreComparisonState } from '@/lib/mcpHttpClient';
import { Badge, Button, cx, usd, WidgetHeader } from '../ui';

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
      <WidgetHeader
        icon={<Scale className="h-6 w-6" />}
        tone="brand"
        title={title}
        subtitle={subtitle}
        widgetType="STORE_ARBITRAGE_TABLE"
        actions={
          <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5 ring-1 ring-inset ring-white/10">
            <Clock aria-hidden="true" className="h-4 w-4 text-cyan-300" />
            <label htmlFor="delivery-slot-select" className="text-xs font-medium text-fg-muted">
              Delivery window
            </label>
            <select
              id="delivery-slot-select"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="min-h-8 rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/10 focus:outline-none"
            >
              <option value="6:00 PM – 7:00 PM">6:00 PM – 7:00 PM (Tonight)</option>
              <option value="7:00 PM – 8:00 PM">7:00 PM – 8:00 PM (Tonight)</option>
              <option value="Tomorrow 8:00 AM – 10:00 AM">
                Tomorrow 8:00 AM – 10:00 AM
              </option>
            </select>
          </div>
        }
      />

      {/* 3 Retailer Summary Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {comparison.stores.map((store) => {
          const isRecommended = store.storeId === comparison.recommendedStoreId;

          return (
            <div
              key={store.storeId}
              className={cx(
                'glass relative flex flex-col justify-between overflow-hidden rounded-3xl p-5 transition-[border-color,box-shadow] duration-200',
                isRecommended && 'border-cyan-400/50 bg-cyan-500/[0.06] shadow-glow'
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-white">
                      {store.storeName}
                    </h3>
                    <p className="mt-0.5 text-xs text-fg-muted">{store.tagline}</p>
                  </div>
                  {store.badge && (
                    <Badge tone={isRecommended ? 'brand' : 'neutral'}>
                      {isRecommended && <Sparkles aria-hidden="true" className="h-3 w-3" />}
                      {store.badge}
                    </Badge>
                  )}
                </div>

                {/* Big Out-of-Pocket Hero Price */}
                <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-white/[0.04] px-3.5 py-3 ring-1 ring-inset ring-white/[0.06]">
                  <span className="text-xs font-medium text-fg-muted">Out-of-pocket</span>
                  <span
                    className={cx(
                      'tabular text-2xl font-extrabold tracking-tight',
                      isRecommended ? 'text-cyan-300' : 'text-white'
                    )}
                  >
                    {usd(store.totalOutOfPocketUsd)}
                  </span>
                </div>

                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-fg-muted">
                    <dt>Items subtotal</dt>
                    <dd className="tabular font-medium text-slate-200">
                      {usd(store.subtotalUsd)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <dt>Prime member savings</dt>
                    <dd className="tabular font-semibold">-{usd(store.primeDiscountUsd)}</dd>
                  </div>
                  <div className="flex justify-between text-fg-muted">
                    <dt>Delivery fee</dt>
                    <dd className="tabular font-medium text-slate-200">
                      {store.deliveryFeeUsd === 0
                        ? 'FREE (Prime)'
                        : usd(store.deliveryFeeUsd)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-4 border-t border-white/[0.06] pt-3">
                <div className="mb-2.5 flex items-center gap-1.5 text-xs text-fg-muted">
                  <Truck aria-hidden="true" className="h-3.5 w-3.5 text-cyan-300" />
                  <span>Window: {selectedSlot}</span>
                </div>

                <Button
                  size="sm"
                  variant={isRecommended ? 'primary' : 'secondary'}
                  fullWidth
                  disabled={isBusy}
                  trailingIcon={<ArrowRight className="h-4 w-4" />}
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
                >
                  Checkout · <span className="tabular">{usd(store.totalOutOfPocketUsd)}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Arbitrage Insight Callout */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-100">
        <div className="flex items-center gap-2.5">
          <Award aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-300" />
          <span>{comparison.hybridSplitSummary.explanation}</span>
        </div>
        <Badge tone="success" mono>
          Hybrid floor: {usd(comparison.hybridSplitSummary.totalHybridUsd)}
        </Badge>
      </div>

      {/* Item-by-Item Arbitrage Matrix */}
      <div className="glass overflow-x-auto rounded-3xl">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03] text-xs uppercase tracking-wider text-fg-muted">
              <th scope="col" className="px-4 py-3 font-semibold">
                Missing ingredient
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-cyan-300">
                Amazon Fresh (Prime)
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-emerald-300">
                Whole Foods Market
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-amber-300">
                Local Co-op
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {comparison.itemRows.map((row) => (
              <tr
                key={row.ingredientName}
                className="transition-colors hover:bg-white/[0.03]"
              >
                <th scope="row" className="px-4 py-3 font-semibold text-white">
                  <div>{row.ingredientName}</div>
                  {row.amazonFreshNote && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-cyan-400/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200 ring-1 ring-inset ring-cyan-400/20">
                      <Tag aria-hidden="true" className="h-3 w-3" />
                      {row.amazonFreshNote}
                    </div>
                  )}
                </th>
                <td className="px-4 py-3">
                  <PriceCell
                    price={row.amazonFreshPriceUsd}
                    brand={row.amazonFreshBrand}
                    size={row.amazonFreshSize}
                    isLowest={row.lowestStoreId === 'amazon-fresh'}
                    lowestTone="text-cyan-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <PriceCell
                    price={row.wholeFoodsPriceUsd}
                    brand={row.wholeFoodsBrand}
                    size={row.wholeFoodsSize}
                    isLowest={row.lowestStoreId === 'whole-foods'}
                    lowestTone="text-emerald-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <PriceCell
                    price={row.localCoopPriceUsd}
                    brand={row.localCoopBrand}
                    size={row.localCoopSize}
                    isLowest={row.lowestStoreId === 'local-coop'}
                    lowestTone="text-amber-300"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PriceCell({
  price,
  brand,
  size,
  isLowest,
  lowestTone,
}: {
  price: number;
  brand: string;
  size: string;
  isLowest: boolean;
  lowestTone: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span
          className={cx(
            'tabular text-sm font-bold',
            isLowest ? lowestTone : 'text-slate-200'
          )}
        >
          {usd(price)}
        </span>
        {isLowest && (
          <>
            <CheckCircle2 aria-hidden="true" className={cx('h-4 w-4', lowestTone)} />
            <span className="sr-only">(lowest price)</span>
          </>
        )}
      </div>
      <div className="mt-0.5 text-xs text-fg-muted">
        {brand} · {size}
      </div>
    </div>
  );
}
