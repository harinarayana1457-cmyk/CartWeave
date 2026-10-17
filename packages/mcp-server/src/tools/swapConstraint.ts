import { z } from 'zod';
import { RECIPE_CATALOG } from '../data/seedData';
import { type McpSessionState, sessionManager } from '../mcpSessionManager';
import { executeGenerateMealPlan } from './generateMealPlan';
import { executeCompareCarts } from './compareCarts';

export const swapConstraintInputSchema = z.object({
  dayIndex: z
    .number()
    .min(1)
    .max(7)
    .default(2)
    .describe('1-based day index in the active meal plan to swap (e.g., 2 for Day 2)'),
  constraint: z
    .string()
    .default('dairy-free')
    .describe('Dietary or ingredient constraint to apply (e.g., "dairy-free", "gluten-free", "low-calorie", "budget")'),
  maxCalories: z
    .number()
    .optional()
    .default(520)
    .describe('Maximum calories allowed for the replacement dish (e.g., 520)'),
  targetStore: z
    .string()
    .optional()
    .describe('Optional preferred store for recalculating ingredient pricing'),
});

export type SwapConstraintInput = z.infer<typeof swapConstraintInputSchema>;

export const SWAP_CONSTRAINT_TOOL_DEFINITION = {
  name: 'swap_ingredient_constraint',
  description:
    'Mutates the active session meal plan for a specific dayIndex (e.g., swapping Day 2 to a dairy-free dish under 520 calories), recalculates 3-day protein/calorie macros, and updates 3-store cart totals live. Emits updated MEAL_PLAN_MACRO_CARDS MCP Apps UI widget.',
  inputSchema: {
    type: 'object',
    properties: {
      dayIndex: {
        type: 'number',
        description: '1-based day index in the meal plan to swap (e.g., 2).',
      },
      constraint: {
        type: 'string',
        description: 'Constraint such as "dairy-free", "gluten-free", "vegan", or "budget".',
      },
      maxCalories: {
        type: 'number',
        description: 'Maximum calories for the replacement dish (e.g., 520).',
      },
      targetStore: {
        type: 'string',
        description: 'Optional preferred retailer ID.',
      },
    },
    required: ['dayIndex', 'constraint'],
  },
};

export function executeSwapConstraint(session: McpSessionState, rawArgs: unknown) {
  const parsed = swapConstraintInputSchema.safeParse(rawArgs ?? {});
  const args: SwapConstraintInput = parsed.success
    ? parsed.data
    : { dayIndex: 2, constraint: 'dairy-free', maxCalories: 520 };

  if (!session.activeMealPlan) {
    executeGenerateMealPlan(session, {
      days: 3,
      maxBudgetUsd: 38,
      minProteinGramsPerMeal: 35,
      dietaryTags: ['vegetarian'],
      prioritizeExpiring: true,
    });
  }

  const mealPlan = session.activeMealPlan!;
  const targetIdx = Math.max(0, Math.min(mealPlan.meals.length - 1, args.dayIndex - 1));
  const previousRecipe = mealPlan.meals[targetIdx].recipe;
  const activeRecipeIds = new Set(mealPlan.meals.map((m) => m.recipe.id));

  const constraintLower = args.constraint.toLowerCase();
  const maxCal = args.maxCalories ?? 520;

  let replacement = RECIPE_CATALOG.find((r) => {
    if (activeRecipeIds.has(r.id)) return false;
    const matchesCal = r.calories <= maxCal;
    const matchesConstraint =
      r.dietaryTags.some((t) => constraintLower.includes(t.toLowerCase())) ||
      r.title.toLowerCase().includes(constraintLower) ||
      r.subtitle.toLowerCase().includes(constraintLower);
    return matchesCal && matchesConstraint;
  });

  if (!replacement) {
    replacement =
      RECIPE_CATALOG.find((r) => !activeRecipeIds.has(r.id) && r.calories <= maxCal) ??
      RECIPE_CATALOG.find((r) => r.id !== previousRecipe.id)!;
  }

  mealPlan.meals[targetIdx] = {
    ...mealPlan.meals[targetIdx],
    recipe: replacement,
  };

  mealPlan.totalEstimatedCostUsd = Number(
    mealPlan.meals.reduce((sum, m) => sum + m.recipe.estimatedCostUsd, 0).toFixed(2)
  );
  mealPlan.totalProteinGrams = mealPlan.meals.reduce((sum, m) => sum + m.recipe.proteinGrams, 0);
  mealPlan.averageProteinGrams = Math.round(
    mealPlan.totalProteinGrams / Math.max(1, mealPlan.meals.length)
  );
  mealPlan.totalCalories = mealPlan.meals.reduce((sum, m) => sum + m.recipe.calories, 0);

  const missingSet = new Set<string>();
  const expiringNames = new Set(
    session.pantryItems.filter((i) => i.expiresInHours <= 72).map((i) => i.name.toLowerCase())
  );
  const rescuedSet = new Set<string>();

  for (const m of mealPlan.meals) {
    for (const ing of m.recipe.missingIngredients) missingSet.add(ing);
    for (const p of m.recipe.pantryIngredientsUsed) {
      if (expiringNames.has(p.toLowerCase())) rescuedSet.add(p);
    }
  }

  mealPlan.missingIngredients = Array.from(missingSet);
  mealPlan.expiringItemsRescued = Array.from(rescuedSet);
  mealPlan.updatedAt = new Date().toISOString();

  // Live recalculate 3-store comparison so cart totals stay in sync
  executeCompareCarts(session, {
    mealPlanId: mealPlan.mealPlanId,
    missingIngredients: mealPlan.missingIngredients,
  });

  const mcpAppUi = {
    widgetType: 'MEAL_PLAN_MACRO_CARDS' as const,
    title: `${mealPlan.days}-Day Plan (Updated Day ${args.dayIndex} -> ${args.constraint})`,
    subtitle: `Swapped Day ${args.dayIndex} to "${replacement.title}" (${replacement.calories} kcal, ${replacement.proteinGrams}g protein) • New total: $${mealPlan.totalEstimatedCostUsd.toFixed(2)}`,
    mealPlan,
    swapHighlight: {
      dayIndex: args.dayIndex,
      previousDishTitle: previousRecipe.title,
      newDishTitle: replacement.title,
      constraintApplied: `${args.constraint}${args.maxCalories ? ` (<${args.maxCalories} kcal)` : ''}`,
      caloriesDelta: replacement.calories - previousRecipe.calories,
      costDeltaUsd: Number((replacement.estimatedCostUsd - previousRecipe.estimatedCostUsd).toFixed(2)),
    },
  };

  sessionManager.broadcastNotification(session.sessionId, 'notifications/resources/updated', {
    uri: 'mcp://cart/active-comparison',
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          summary: `Swapped Day ${args.dayIndex} from "${previousRecipe.title}" (${previousRecipe.calories} kcal) to "${replacement.title}" (${replacement.calories} kcal, ${replacement.proteinGrams}g protein, tags: ${replacement.dietaryTags.join(', ')}). Updated 3-day total cost to $${mealPlan.totalEstimatedCostUsd.toFixed(2)} and refreshed 3-store cart totals.`,
          swappedDayIndex: args.dayIndex,
          previousDish: previousRecipe.title,
          newDish: replacement.title,
          newDishCalories: replacement.calories,
          newDishProteinGrams: replacement.proteinGrams,
          updatedMealPlanTotalUsd: mealPlan.totalEstimatedCostUsd,
          updatedAmazonFreshBasketUsd:
            session.activeComparison?.stores.find((s) => s.storeId === 'amazon-fresh')
              ?.totalOutOfPocketUsd ?? mealPlan.totalEstimatedCostUsd,
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
