import { z } from 'zod';
import {
  type McpSessionState,
  type OrderConfirmationState,
  sessionManager,
} from '../mcpSessionManager';
import { executeCompareCarts } from './compareCarts';

export const checkoutBasketInputSchema = z.object({
  storeId: z
    .enum(['amazon-fresh', 'whole-foods', 'local-coop'])
    .default('amazon-fresh')
    .describe('Selected grocery retailer storeId'),
  deliverySlot: z
    .string()
    .default('6:00 PM – 7:00 PM')
    .describe('Chosen delivery slot window (e.g., "6:00 PM – 7:00 PM")'),
  applyPrimeSavings: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to apply Amazon Prime member discounts and free delivery window'),
});

export type CheckoutBasketInput = z.infer<typeof checkoutBasketInputSchema>;

export const CHECKOUT_BASKET_TOOL_DEFINITION = {
  name: 'checkout_smart_basket',
  description:
    'Finalizes the simulated grocery order for the selected store and delivery window, deducts rescued expiring pantry items from household inventory, generates a live order tracking code, and computes total food-waste avoided in USD plus Prime savings. Emits ORDER_CONFIRMATION_CARD MCP Apps UI widget.',
  inputSchema: {
    type: 'object',
    properties: {
      storeId: {
        type: 'string',
        enum: ['amazon-fresh', 'whole-foods', 'local-coop'],
        description: 'Retailer store ID to check out.',
      },
      deliverySlot: {
        type: 'string',
        description: 'Delivery window (e.g. "6:00 PM – 7:00 PM").',
      },
      applyPrimeSavings: {
        type: 'boolean',
        description: 'Apply Amazon Prime member savings.',
      },
    },
    required: ['storeId', 'deliverySlot'],
  },
};

export function executeCheckoutBasket(session: McpSessionState, rawArgs: unknown) {
  const parsed = checkoutBasketInputSchema.safeParse(rawArgs ?? {});
  const args: CheckoutBasketInput = parsed.success
    ? parsed.data
    : {
        storeId: 'amazon-fresh',
        deliverySlot: '6:00 PM – 7:00 PM',
        applyPrimeSavings: true,
      };

  if (!session.activeComparison) {
    executeCompareCarts(session, {
      preferredDeliveryWindow: args.deliverySlot,
    });
  }

  const comparison = session.activeComparison!;
  const selectedStore =
    comparison.stores.find((s) => s.storeId === args.storeId) ?? comparison.stores[0];

  const itemsOrdered = comparison.itemRows.map((row) => {
    if (selectedStore.storeId === 'amazon-fresh') {
      return {
        name: row.ingredientName,
        brand: row.amazonFreshBrand,
        priceUsd: row.amazonFreshPriceUsd,
      };
    }
    if (selectedStore.storeId === 'whole-foods') {
      return {
        name: row.ingredientName,
        brand: row.wholeFoodsBrand,
        priceUsd: row.wholeFoodsPriceUsd,
      };
    }
    return {
      name: row.ingredientName,
      brand: row.localCoopBrand,
      priceUsd: row.localCoopPriceUsd,
    };
  });

  const rescuedNames = session.activeMealPlan?.expiringItemsRescued ?? [
    'Organic Baby Spinach',
    'Strained 0% Greek Yogurt',
    'Artisan Fresh Paneer Block',
    'Ripe Hass Avocados',
  ];

  const foodWasteAvoidedUsd =
    session.activeMealPlan && session.activeMealPlan.estimatedWasteSavedUsd > 0
      ? session.activeMealPlan.estimatedWasteSavedUsd
      : 18.45;

  // Deduct/mark rescued pantry items as scheduled for dinner prep
  for (const item of session.pantryItems) {
    if (rescuedNames.some((r) => r.toLowerCase() === item.name.toLowerCase())) {
      item.quantity = Math.max(0, Math.round(item.quantity * 0.25));
      item.urgencyLevel = 'fresh';
    }
  }

  const primeSavingsUsd =
    args.applyPrimeSavings !== false
      ? Number((selectedStore.primeDiscountUsd + (selectedStore.storeId === 'amazon-fresh' ? 4.95 : 0)).toFixed(2))
      : 0;

  const orderConfirmation: OrderConfirmationState = {
    orderId: `AMZ-CW-${Math.floor(100000 + Math.random() * 900000)}`,
    trackingCode: `TRK-${selectedStore.storeId.toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-5)}`,
    storeId: selectedStore.storeId,
    storeName: selectedStore.storeName,
    deliverySlot: args.deliverySlot,
    itemsOrderedCount: itemsOrdered.length,
    itemsOrdered,
    subtotalUsd: selectedStore.subtotalUsd,
    primeSavingsUsd,
    deliveryFeeUsd: selectedStore.deliveryFeeUsd,
    finalTotalUsd: selectedStore.totalOutOfPocketUsd,
    foodWasteAvoidedUsd,
    pantryItemsDeducted: rescuedNames,
    placedAt: new Date().toISOString(),
  };

  session.lastOrderConfirmation = orderConfirmation;

  const mcpAppUi = {
    widgetType: 'ORDER_CONFIRMATION_CARD' as const,
    title: `Order Confirmed • ${selectedStore.storeName}`,
    subtitle: `Arriving ${args.deliverySlot} • Tracking ${orderConfirmation.trackingCode}`,
    order: orderConfirmation,
  };

  sessionManager.broadcastNotification(session.sessionId, 'notifications/resources/updated', {
    uri: 'mcp://pantry/expiring-soon',
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          summary: `Checked out ${orderConfirmation.itemsOrderedCount} items from ${orderConfirmation.storeName} for the ${orderConfirmation.deliverySlot} window. Total charged: $${orderConfirmation.finalTotalUsd.toFixed(2)} (Prime savings: $${orderConfirmation.primeSavingsUsd.toFixed(2)}, Food waste avoided: $${orderConfirmation.foodWasteAvoidedUsd.toFixed(2)}). Tracking code: ${orderConfirmation.trackingCode}.`,
          orderId: orderConfirmation.orderId,
          trackingCode: orderConfirmation.trackingCode,
          storeName: orderConfirmation.storeName,
          deliverySlot: orderConfirmation.deliverySlot,
          finalTotalUsd: orderConfirmation.finalTotalUsd,
          primeSavingsUsd: orderConfirmation.primeSavingsUsd,
          foodWasteAvoidedUsd: orderConfirmation.foodWasteAvoidedUsd,
        }),
      },
    ],
    mcp_app_ui: mcpAppUi,
    _meta: {
      mcp_app_ui: mcpAppUi,
      sessionId: session.sessionId,
    },
  };
}
