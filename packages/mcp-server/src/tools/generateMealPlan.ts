import { z } from 'zod';
import { RECIPE_CATALOG, type Recipe } from '../data/seedData';
import {
  type ActiveMealPlan,
  type McpSessionState,
  type PlannedDayMeal,
  sessionManager,
} from '../mcpSessionManager';

export const generateMealPlanInputSchema = z.object({
  days: z.number().min(1).max(7).default(3),
  maxBudgetUsd: z.number().positive().default(38),
  minProteinGramsPerMeal: z.number().optional().default(30),
  dietaryTags: z.array(z.string()).optional().default(['vegetarian']),
  prioritizeExpiring: z.boolean().optional().default(true),
});

export type GenerateMealPlanInput = z.infer<typeof generateMealPlanInputSchema>;

export const GENERATE_MEAL_PLAN_TOOL_DEFINITION = {
  name: 'generate_meal_plan',
  description:
    'Generates a multi-day high-protein meal plan that prioritizes expiring pantry ingredients first, respects dietary tags and max budget in USD, computes per-serving macros, and lists missing store ingredients. Emits MEAL_PLAN_MACRO_CARDS MCP Apps UI widget.',
  inputSchema: {
    type: 'object',
    properties: {
      days: {
        type: 'number',
        description: 'Number of dinners to plan (e.g., 3).',
      },
      maxBudgetUsd: {
        type: 'number',
        description: 'Maximum total grocery budget in USD (e.g., 38).',
      },
      minProteinGramsPerMeal: {
        type: 'number',
        description: 'Minimum protein in grams per serving (e.g., 30).',
      },
      dietaryTags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Dietary restrictions such as vegetarian, dairy-free, gluten-free, vegan.',
      },
      prioritizeExpiring: {
        type: 'boolean',
        description: 'Whether to prioritize recipes that consume critical expiring pantry items first.',
      },
    },
    required: ['days', 'maxBudgetUsd'],
  },
};

export function executeGenerateMealPlan(session: McpSessionState, rawArgs: unknown) {
  const parsed = generateMealPlanInputSchema.safeParse(rawArgs ?? {});
  const args: GenerateMealPlanInput = parsed.success
    ? parsed.data
    : {
        days: 3,
        maxBudgetUsd: 38,
        minProteinGramsPerMeal: 30,
        dietaryTags: ['vegetarian'],
        prioritizeExpiring: true,
      };

  const expiringNames = new Set(
    session.pantryItems
      .filter((item) => item.expiresInHours <= 72)
      .map((item) => item.name.toLowerCase())
  );

  const normalizedTags = (args.dietaryTags ?? []).map((t) => t.toLowerCase().trim());

  let candidates = RECIPE_CATALOG.filter((recipe) => {
    const meetsProtein = recipe.proteinGrams >= (args.minProteinGramsPerMeal ?? 30);
    const meetsTags =
      normalizedTags.length === 0 ||
      normalizedTags.every((tag) =>
        recipe.dietaryTags.some((rt) => rt.toLowerCase() === tag)
      );
    return meetsProtein && meetsTags;
  });

  if (candidates.length < args.days) {
    candidates = [...RECIPE_CATALOG];
  }

  const scoredCandidates = candidates.map((recipe) => {
    const expiringHits = recipe.pantryIngredientsUsed.filter((used) =>
      expiringNames.has(used.toLowerCase())
    ).length;
    return {
      recipe,
      score: (args.prioritizeExpiring !== false ? expiringHits * 10 : 0) + recipe.proteinGrams * 0.25,
    };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  const selectedRecipes: Recipe[] = [];
  let runningCost = 0;

  for (const candidate of scoredCandidates) {
    if (selectedRecipes.length >= args.days) break;
    if (runningCost + candidate.recipe.estimatedCostUsd <= args.maxBudgetUsd || selectedRecipes.length === 0) {
      selectedRecipes.push(candidate.recipe);
      runningCost += candidate.recipe.estimatedCostUsd;
    }
  }

  while (selectedRecipes.length < args.days) {
    const fallback = RECIPE_CATALOG.find((r) => !selectedRecipes.some((s) => s.id === r.id));
    if (!fallback) break;
    selectedRecipes.push(fallback);
    runningCost += fallback.estimatedCostUsd;
  }

  const dayNames = ['Day 1 • Tonight', 'Day 2 • Tomorrow', 'Day 3 • Thursday', 'Day 4 • Friday', 'Day 5 • Saturday'];
  const meals: PlannedDayMeal[] = selectedRecipes.map((recipe, idx) => ({
    dayIndex: idx + 1,
    dayLabel: dayNames[idx] ?? `Day ${idx + 1}`,
    recipe,
  }));

  const totalEstimatedCostUsd = Number(
    meals.reduce((sum, m) => sum + m.recipe.estimatedCostUsd, 0).toFixed(2)
  );
  const totalProteinGrams = meals.reduce((sum, m) => sum + m.recipe.proteinGrams, 0);
  const averageProteinGrams = Math.round(totalProteinGrams / Math.max(1, meals.length));
  const totalCalories = meals.reduce((sum, m) => sum + m.recipe.calories, 0);

  const rescuedSet = new Set<string>();
  const missingSet = new Set<string>();
  for (const m of meals) {
    for (const p of m.recipe.pantryIngredientsUsed) {
      if (expiringNames.has(p.toLowerCase())) {
        rescuedSet.add(p);
      }
    }
    for (const miss of m.recipe.missingIngredients) {
      missingSet.add(miss);
    }
  }

  const expiringItemsRescued = Array.from(rescuedSet);
  const estimatedWasteSavedUsd = Number(
    session.pantryItems
      .filter((item) => expiringItemsRescued.some((r) => r.toLowerCase() === item.name.toLowerCase()))
      .reduce((sum, item) => sum + item.estimatedValueUsd, 0)
      .toFixed(2)
  );

  const mealPlan: ActiveMealPlan = {
    mealPlanId: `mp-${Date.now().toString(36)}`,
    days: meals.length,
    maxBudgetUsd: args.maxBudgetUsd,
    minProteinGramsPerMeal: args.minProteinGramsPerMeal ?? 30,
    dietaryTags: normalizedTags.length > 0 ? normalizedTags : ['vegetarian'],
    meals,
    totalEstimatedCostUsd,
    averageProteinGrams,
    totalProteinGrams,
    totalCalories,
    expiringItemsRescued,
    estimatedWasteSavedUsd,
    missingIngredients: Array.from(missingSet),
    updatedAt: new Date().toISOString(),
  };

  session.activeMealPlan = mealPlan;

  const mcpAppUi = {
    widgetType: 'MEAL_PLAN_MACRO_CARDS' as const,
    title: `${mealPlan.days}-Day Zero-Waste High-Protein Dinner Plan`,
    subtitle: `Avg ${mealPlan.averageProteinGrams}g protein/meal • Est. $${mealPlan.totalEstimatedCostUsd.toFixed(2)} / $${mealPlan.maxBudgetUsd.toFixed(2)} budget • Rescues $${mealPlan.estimatedWasteSavedUsd.toFixed(2)} expiring food`,
    mealPlan,
  };

  sessionManager.broadcastNotification(session.sessionId, 'notifications/resources/updated', {
    uri: 'mcp://cart/active-comparison',
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          summary: `Planned ${mealPlan.days} dinners (${mealPlan.dietaryTags.join(', ')}) averaging ${mealPlan.averageProteinGrams}g protein/serving for $${mealPlan.totalEstimatedCostUsd.toFixed(2)} (under $${mealPlan.maxBudgetUsd} budget). Rescued ${mealPlan.expiringItemsRescued.length} expiring items worth $${mealPlan.estimatedWasteSavedUsd.toFixed(2)}.`,
          mealPlanId: mealPlan.mealPlanId,
          totalEstimatedCostUsd: mealPlan.totalEstimatedCostUsd,
          averageProteinGrams: mealPlan.averageProteinGrams,
          expiringItemsRescued: mealPlan.expiringItemsRescued,
          missingIngredients: mealPlan.missingIngredients,
          meals: mealPlan.meals.map((m) => ({
            dayIndex: m.dayIndex,
            title: m.recipe.title,
            calories: m.recipe.calories,
            proteinGrams: m.recipe.proteinGrams,
            estimatedCostUsd: m.recipe.estimatedCostUsd,
          })),
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
