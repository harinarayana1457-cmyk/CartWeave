import { z } from 'zod';
import { getQuoteForIngredient } from '../data/seedData';
import {
  type ArbitrageItemRow,
  type McpSessionState,
  type StoreBasketSummary,
  type StoreComparisonState,
  sessionManager,
} from '../mcpSessionManager';
import { executeGenerateMealPlan } from './generateMealPlan';

export const compareCartsInputSchema = z.object({
  mealPlanId: z.string().optional().describe('Optional mealPlanId from generate_meal_plan'),
  missingIngredients: z
    .array(z.string())
    .optional()
    .describe('Optional explicit list of missing ingredients to price across 3 stores'),
  preferredDeliveryWindow: z
    .string()
    .optional()
    .default('6:00 PM – 7:00 PM')
    .describe('Preferred delivery window (e.g., "6:00 PM – 7:00 PM")'),
});

export type CompareCartsInput = z.infer<typeof compareCartsInputSchema>;

export const COMPARE_CARTS_TOOL_DEFINITION = {
  name: 'compare_grocery_carts',
  description:
    'Prices every missing meal-plan ingredient across Amazon Fresh, Whole Foods Market, and Local Co-op, factoring in package sizes, smart brand substitutions, Prime member discounts, and delivery fees. Emits STORE_ARBITRAGE_TABLE MCP Apps UI widget.',
  inputSchema: {
    type: 'object',
    properties: {
      mealPlanId: {
        type: 'string',
        description: 'Active meal plan ID to price.',
      },
      missingIngredients: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional list of missing ingredient names to compare.',
      },
      preferredDeliveryWindow: {
        type: 'string',
        description: 'Preferred delivery window (e.g. "6:00 PM – 7:00 PM").',
      },
    },
  },
};

export function executeCompareCarts(session: McpSessionState, rawArgs: unknown) {
  const parsed = compareCartsInputSchema.safeParse(rawArgs ?? {});
  const args: CompareCartsInput = parsed.success
    ? parsed.data
    : { preferredDeliveryWindow: '6:00 PM – 7:00 PM' };

  if (!session.activeMealPlan && (!args.missingIngredients || args.missingIngredients.length === 0)) {
    executeGenerateMealPlan(session, {
      days: 3,
      maxBudgetUsd: 38,
      minProteinGramsPerMeal: 35,
      dietaryTags: ['vegetarian'],
      prioritizeExpiring: true,
    });
  }

  const ingredientsToPrice =
    args.missingIngredients && args.missingIngredients.length > 0
      ? args.missingIngredients
      : session.activeMealPlan?.missingIngredients ?? [
          'Split Red Lentils',
          'Garam Masala & Ginger Paste',
          'Vine-Ripened Roma Tomatoes',
          'Sprouted Protein Flatbreads',
          'Smoky Rose Harissa Paste',
          'Hemp Hearts & Pepitas',
          'Chickpea & Lupini Protein Rigatoni',
          'Shelled Edamame Beans',
          'Nutritional Yeast Flakes',
        ];

  const itemRows: ArbitrageItemRow[] = [];
  let afSubtotal = 0;
  let afPrimeTotal = 0;
  let wfSubtotal = 0;
  let wfPrimeTotal = 0;
  let coopSubtotal = 0;
  let hybridTotal = 0;

  for (const ingName of ingredientsToPrice) {
    const quote = getQuoteForIngredient(ingName);
    const afPrice = quote.amazonFresh.primeMemberPriceUsd;
    const wfPrice = quote.wholeFoods.primeMemberPriceUsd;
    const coopPrice = quote.localCoop.primeMemberPriceUsd;

    afSubtotal += quote.amazonFresh.priceUsd;
    afPrimeTotal += afPrice;
    wfSubtotal += quote.wholeFoods.priceUsd;
    wfPrimeTotal += wfPrice;
    coopSubtotal += coopPrice;

    const minPrice = Math.min(afPrice, wfPrice, coopPrice);
    hybridTotal += minPrice;

    const lowestStoreId: ArbitrageItemRow['lowestStoreId'] =
      minPrice === afPrice
        ? 'amazon-fresh'
        : minPrice === wfPrice
        ? 'whole-foods'
        : 'local-coop';

    itemRows.push({
      ingredientName: quote.ingredientName,
      amazonFreshPriceUsd: afPrice,
      amazonFreshBrand: quote.amazonFresh.brandName,
      amazonFreshSize: quote.amazonFresh.packageSize,
      amazonFreshNote: quote.amazonFresh.substitutionNote,
      wholeFoodsPriceUsd: wfPrice,
      wholeFoodsBrand: quote.wholeFoods.brandName,
      wholeFoodsSize: quote.wholeFoods.packageSize,
      localCoopPriceUsd: coopPrice,
      localCoopBrand: quote.localCoop.brandName,
      localCoopSize: quote.localCoop.packageSize,
      lowestStoreId,
    });
  }

  const deliveryWindow = args.preferredDeliveryWindow ?? '6:00 PM – 7:00 PM';

  const stores: StoreBasketSummary[] = [
    {
      storeId: 'amazon-fresh',
      storeName: 'Amazon Fresh',
      tagline: 'Best Overall Basket • Prime Free 2-Hour Window',
      subtotalUsd: Number(afSubtotal.toFixed(2)),
      primeDiscountUsd: Number((afSubtotal - afPrimeTotal).toFixed(2)),
      deliveryFeeUsd: 0.0,
      totalOutOfPocketUsd: Number(afPrimeTotal.toFixed(2)),
      estimatedArrivalWindow: deliveryWindow,
      availableSlots: ['6:00 PM – 7:00 PM', '7:00 PM – 8:00 PM', 'Tomorrow 8:00 AM – 10:00 AM'],
      badge: 'Lowest Total Cost',
    },
    {
      storeId: 'whole-foods',
      storeName: 'Whole Foods Market',
      tagline: '100% Organic 365 & Specialty Curated Brands',
      subtotalUsd: Number(wfSubtotal.toFixed(2)),
      primeDiscountUsd: Number((wfSubtotal - wfPrimeTotal).toFixed(2)),
      deliveryFeeUsd: 4.95,
      totalOutOfPocketUsd: Number((wfPrimeTotal + 4.95).toFixed(2)),
      estimatedArrivalWindow: '7:00 PM – 8:00 PM',
      availableSlots: ['7:00 PM – 8:00 PM', '8:00 PM – 9:00 PM', 'Tomorrow 9:00 AM – 11:00 AM'],
      badge: '100% Certified Organic',
    },
    {
      storeId: 'local-coop',
      storeName: 'Local Neighborhood Co-op',
      tagline: 'Zero-Packaging Bulk Bins & Local Farmstead Produce',
      subtotalUsd: Number(coopSubtotal.toFixed(2)),
      primeDiscountUsd: 0.0,
      deliveryFeeUsd: 2.99,
      totalOutOfPocketUsd: Number((coopSubtotal + 2.99).toFixed(2)),
      estimatedArrivalWindow: '6:30 PM – 7:30 PM (Bike Courier)',
      availableSlots: ['6:30 PM – 7:30 PM', 'Tomorrow 10:00 AM – 12:00 PM'],
      badge: 'Zero-Plastic Bulk',
    },
  ];

  const highestTotal = Math.max(...stores.map((s) => s.totalOutOfPocketUsd));
  const lowestSingleStore = [...stores].sort(
    (a, b) => a.totalOutOfPocketUsd - b.totalOutOfPocketUsd
  )[0];

  const comparisonState: StoreComparisonState = {
    comparisonId: `cmp-${Date.now().toString(36)}`,
    mealPlanId: session.activeMealPlan?.mealPlanId ?? 'mp-default',
    preferredDeliveryWindow: deliveryWindow,
    itemRows,
    stores,
    recommendedStoreId: lowestSingleStore.storeId,
    hybridSplitSummary: {
      totalHybridUsd: Number(hybridTotal.toFixed(2)),
      savingsVsHighestUsd: Number((highestTotal - lowestSingleStore.totalOutOfPocketUsd).toFixed(2)),
      explanation: `Amazon Fresh wins single-basket checkout at $${lowestSingleStore.totalOutOfPocketUsd.toFixed(2)} with $0 Prime delivery (saving $${(
        highestTotal - lowestSingleStore.totalOutOfPocketUsd
      ).toFixed(2)} vs. Whole Foods delivered).`,
    },
    updatedAt: new Date().toISOString(),
  };

  session.activeComparison = comparisonState;

  const mcpAppUi = {
    widgetType: 'STORE_ARBITRAGE_TABLE' as const,
    title: '3-Retailer Smart Basket & Substitution Arbitrage',
    subtitle: `${itemRows.length} missing ingredients compared • Best single basket: ${lowestSingleStore.storeName} ($${lowestSingleStore.totalOutOfPocketUsd.toFixed(2)})`,
    comparison: comparisonState,
  };

  sessionManager.broadcastNotification(session.sessionId, 'notifications/resources/updated', {
    uri: 'mcp://cart/active-comparison',
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          summary: `Compared ${itemRows.length} missing ingredients across Amazon Fresh ($${stores[0].totalOutOfPocketUsd.toFixed(2)} incl. Prime savings), Whole Foods Market ($${stores[1].totalOutOfPocketUsd.toFixed(2)}), and Local Co-op ($${stores[2].totalOutOfPocketUsd.toFixed(2)}). Recommended: ${lowestSingleStore.storeName} saving $${comparisonState.hybridSplitSummary.savingsVsHighestUsd.toFixed(2)}.`,
          recommendedStoreId: comparisonState.recommendedStoreId,
          stores: stores.map((s) => ({
            storeId: s.storeId,
            storeName: s.storeName,
            totalOutOfPocketUsd: s.totalOutOfPocketUsd,
            primeDiscountUsd: s.primeDiscountUsd,
            deliveryFeeUsd: s.deliveryFeeUsd,
          })),
          savingsVsHighestUsd: comparisonState.hybridSplitSummary.savingsVsHighestUsd,
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
