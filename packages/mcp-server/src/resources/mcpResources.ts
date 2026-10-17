import type { McpSessionState } from '../mcpSessionManager';

export const MCP_RESOURCES_LIST = [
  {
    uri: 'mcp://pantry/expiring-soon',
    name: 'Household Pantry Expiring Within 72 Hours',
    description:
      'Live JSON feed of smart-fridge and pantry items expiring within 72 hours and estimated food-waste value in USD.',
    mimeType: 'application/json',
  },
  {
    uri: 'mcp://cart/active-comparison',
    name: 'Active Meal Plan & 3-Retailer Cart Comparison Matrix',
    description:
      'Current session meal plan macros and item-level price arbitrage across Amazon Fresh, Whole Foods Market, and Local Co-op.',
    mimeType: 'application/json',
  },
];

export function readMcpResource(session: McpSessionState, uri: string) {
  if (uri === 'mcp://pantry/expiring-soon') {
    const expiringItems = session.pantryItems
      .filter((item) => item.expiresInHours <= 72)
      .sort((a, b) => a.expiresInHours - b.expiresInHours);
    const totalAtRiskUsd = Number(
      expiringItems.reduce((sum, item) => sum + item.estimatedValueUsd, 0).toFixed(2)
    );

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              sessionId: session.sessionId,
              generatedAt: new Date().toISOString(),
              expiringWithinHours: 72,
              count: expiringItems.length,
              estimatedWasteValueUsd: totalAtRiskUsd,
              items: expiringItems,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (uri === 'mcp://cart/active-comparison') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              sessionId: session.sessionId,
              generatedAt: new Date().toISOString(),
              activeMealPlan: session.activeMealPlan,
              activeComparison: session.activeComparison,
              lastOrderConfirmation: session.lastOrderConfirmation,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  throw new Error(`Resource URI not found: ${uri}`);
}
