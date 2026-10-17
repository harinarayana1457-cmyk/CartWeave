export const MCP_PROMPTS_LIST = [
  {
    name: 'weekly-budget-chef',
    description:
      'Parameterized Alexa+ kitchen concierge prompt that plans high-protein dinners under a target grocery budget and compares multi-retailer carts.',
    arguments: [
      {
        name: 'budget',
        description: 'Maximum grocery spend in USD (e.g., "38")',
        required: true,
      },
      {
        name: 'headcount',
        description: 'Number of household diners per meal (e.g., "2")',
        required: false,
      },
      {
        name: 'dietaryRestriction',
        description: 'Dietary tag such as vegetarian, dairy-free, or gluten-free',
        required: false,
      },
    ],
  },
  {
    name: 'use-it-up-rescue',
    description:
      'Zero-waste kitchen rescue prompt that scans expiring fridge items within 48 hours and constructs a high-protein dinner plan to eliminate food waste.',
    arguments: [
      {
        name: 'maxHoursUntilExpiry',
        description: 'Urgency window in hours (default "48")',
        required: false,
      },
    ],
  },
];

export function getMcpPrompt(name: string, args: Record<string, string> = {}) {
  if (name === 'weekly-budget-chef') {
    const budget = args.budget ?? '38';
    const headcount = args.headcount ?? '2';
    const dietaryRestriction = args.dietaryRestriction ?? 'vegetarian';

    return {
      description: `Weekly Budget Chef plan for ${headcount} diners under $${budget} (${dietaryRestriction})`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Alexa, scan my pantry for expiring items and plan 3 high-protein ${dietaryRestriction} dinners for ${headcount} people under $${budget}, then compare Amazon Fresh vs. Whole Foods for the missing ingredients.`,
          },
        },
      ],
    };
  }

  if (name === 'use-it-up-rescue') {
    const hours = args.maxHoursUntilExpiry ?? '48';
    return {
      description: `Zero-waste rescue prompt for ingredients expiring within ${hours} hours`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Alexa, check which fridge items expire within ${hours} hours and build a 3-day high-protein meal plan that uses them all before they spoil.`,
          },
        },
      ],
    };
  }

  throw new Error(`Prompt not found: ${name}`);
}
