'use client';

import React from 'react';
import {
  CheckCircle2,
  PackageCheck,
  Leaf,
  Sparkles,
  Truck,
  RefreshCw,
  Receipt,
  BadgePercent,
} from 'lucide-react';
import type { OrderConfirmationState } from '@/lib/mcpHttpClient';
import { Badge, Button, StatTile, usd, WidgetHeader } from '../ui';

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
      <WidgetHeader
        icon={<CheckCircle2 className="h-6 w-6" />}
        tone="success"
        title={title}
        subtitle={subtitle}
        widgetType="ORDER_CONFIRMATION_CARD"
        actions={
          <Button
            size="sm"
            variant="secondary"
            disabled={isBusy}
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() =>
              onExecuteTool(
                'scan_pantry_inventory',
                { filterExpiringWithinHours: 72 },
                'Verify Updated Post-Checkout Pantry Inventory'
              )
            }
          >
            View updated pantry
          </Button>
        }
      />

      {/* Order & Tracking Strip */}
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-fg-muted">
            Order ID:{' '}
            <strong className="font-mono text-slate-100">{order.orderId}</strong>
          </span>
          <span aria-hidden="true" className="text-white/20">
            ·
          </span>
          <span className="text-fg-muted">
            Tracking:{' '}
            <strong className="font-mono text-cyan-300">{order.trackingCode}</strong>
          </span>
        </div>
        <Badge tone="brand">
          <Truck aria-hidden="true" className="h-3.5 w-3.5" />
          {order.deliverySlot}
        </Badge>
      </div>

      {/* Savings & Sustainability Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Total charged"
          value={usd(order.finalTotalUsd)}
          hint="Amazon Pay"
          icon={<Receipt className="h-4 w-4" />}
        />
        <StatTile
          label="Prime savings"
          value={usd(order.primeSavingsUsd)}
          hint="member discount"
          tone="brand"
          icon={<BadgePercent className="h-4 w-4" />}
        />
        <StatTile
          label="Waste avoided"
          value={usd(order.foodWasteAvoidedUsd)}
          hint="rescued pantry"
          tone="success"
          icon={<Leaf className="h-4 w-4" />}
        />
        <StatTile
          label="Items ordered"
          value={order.itemsOrderedCount}
          hint={order.storeName}
          tone="violet"
          icon={<PackageCheck className="h-4 w-4" />}
        />
      </div>

      {/* Deducted Pantry Items & Ordered Line Items */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="glass rounded-3xl p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-bold text-white">
              <PackageCheck aria-hidden="true" className="h-4 w-4 text-cyan-300" />
              {order.storeName} basket ({order.itemsOrderedCount} items)
            </h3>
          </div>
          <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {order.itemsOrdered.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-sm ring-1 ring-inset ring-white/[0.06]"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{item.name}</div>
                  <div className="text-xs text-fg-muted">{item.brand}</div>
                </div>
                <span className="tabular font-mono text-sm font-semibold text-cyan-300">
                  {usd(item.priceUsd)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass flex flex-col justify-between rounded-3xl border-emerald-400/25 bg-emerald-500/[0.05] p-5">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-200">
              <Leaf aria-hidden="true" className="h-4 w-4 text-emerald-300" />
              Expiring pantry ingredients reserved
            </h3>
            <p className="mb-3 text-sm leading-relaxed text-fg-muted">
              Reserved in your household pantry state so they are consumed across your
              next 3 dinners:
            </p>
            <ul className="flex flex-wrap gap-2">
              {order.pantryItemsDeducted.map((name) => (
                <li key={name}>
                  <Badge tone="success" className="py-1 text-xs">
                    <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                    {name}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-4 space-y-1.5 rounded-2xl bg-surface/80 p-3.5 text-xs ring-1 ring-inset ring-white/[0.08]">
            <div className="flex justify-between text-fg-muted">
              <dt>Items subtotal</dt>
              <dd className="tabular font-medium text-slate-200">{usd(order.subtotalUsd)}</dd>
            </div>
            <div className="flex justify-between text-emerald-300">
              <dt>Prime discount + free delivery</dt>
              <dd className="tabular font-semibold">-{usd(order.primeSavingsUsd)}</dd>
            </div>
            <div className="flex justify-between border-t border-white/[0.08] pt-2 text-sm font-bold text-white">
              <dt>Total charged to Amazon Pay</dt>
              <dd className="tabular text-cyan-300">{usd(order.finalTotalUsd)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
