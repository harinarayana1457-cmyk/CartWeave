import { z } from 'zod';
import { type McpSessionState, sessionManager } from '../mcpSessionManager';
import type { PantryItem } from '../data/seedData';

export const scanPantryInputSchema = z.object({
  filterExpiringWithinHours: z
    .number()
    .optional()
    .describe('Optional max hours until expiry filter (e.g. 72 to highlight expiring items)'),
  addOrUpdateItems: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number(),
        unit: z.string(),
        expiresInHours: z.number(),
        category: z
          .enum(['Produce', 'Dairy & Alt', 'Protein', 'Pantry Staple', 'Grains'])
          .optional(),
      })
    )
    .optional()
    .describe('Optional pantry items to add or update in the household inventory'),
});

export type ScanPantryInput = z.infer<typeof scanPantryInputSchema>;

export const SCAN_PANTRY_TOOL_DEFINITION = {
  name: 'scan_pantry_inventory',
  description:
    'Scans current household pantry and fridge inventory sorted by expiry urgency, highlighting items expiring within 48-72 hours and calculating at-risk food waste value in USD. Emits PANTRY_EXPIRY_GRID MCP Apps UI widget.',
  inputSchema: {
    type: 'object',
    properties: {
      filterExpiringWithinHours: {
        type: 'number',
        description: 'Optional threshold in hours to filter expiring items (default shows all sorted by urgency, highlighting <= 72h).',
      },
      addOrUpdateItems: {
        type: 'array',
        description: 'Optional list of pantry items to add or update.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            expiresInHours: { type: 'number' },
            category: { type: 'string' },
          },
          required: ['name', 'quantity', 'unit', 'expiresInHours'],
        },
      },
    },
  },
};

export function executeScanPantry(session: McpSessionState, rawArgs: unknown) {
  const parsed = scanPantryInputSchema.safeParse(rawArgs ?? {});
  const args: ScanPantryInput = parsed.success ? parsed.data : {};

  if (args.addOrUpdateItems && args.addOrUpdateItems.length > 0) {
    for (const incoming of args.addOrUpdateItems) {
      const existing = session.pantryItems.find(
        (p) => p.name.toLowerCase() === incoming.name.toLowerCase()
      );
      const urgencyLevel: PantryItem['urgencyLevel'] =
        incoming.expiresInHours <= 36
          ? 'critical'
          : incoming.expiresInHours <= 72
          ? 'warning'
          : 'fresh';

      if (existing) {
        existing.quantity = incoming.quantity;
        existing.unit = incoming.unit;
        existing.expiresInHours = incoming.expiresInHours;
        existing.urgencyLevel = urgencyLevel;
        if (incoming.category) existing.category = incoming.category;
      } else {
        session.pantryItems.push({
          id: `pantry-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: incoming.name,
          quantity: incoming.quantity,
          unit: incoming.unit,
          expiresInHours: incoming.expiresInHours,
          category: incoming.category ?? 'Produce',
          estimatedValueUsd: 4.25,
          storageLocation: 'Fridge Crisper',
          urgencyLevel,
        });
      }
    }
  }

  const sortedItems = [...session.pantryItems].sort(
    (a, b) => a.expiresInHours - b.expiresInHours
  );

  const threshold = args.filterExpiringWithinHours ?? 72;
  const expiringSoonItems = sortedItems.filter((item) => item.expiresInHours <= threshold);
  const criticalItems = sortedItems.filter((item) => item.expiresInHours <= 36);
  const atRiskValueUsd = Number(
    expiringSoonItems.reduce((sum, item) => sum + item.estimatedValueUsd, 0).toFixed(2)
  );

  const mcpAppUi = {
    widgetType: 'PANTRY_EXPIRY_GRID' as const,
    title: 'Smart Fridge & Pantry Telemetry',
    subtitle: `${expiringSoonItems.length} items expiring within ${threshold}h ($${atRiskValueUsd.toFixed(2)} at-risk value)`,
    summaryMetrics: {
      totalItemsCount: sortedItems.length,
      criticalExpiryCount: criticalItems.length,
      expiringWithin72hCount: expiringSoonItems.length,
      atRiskValueUsd,
      filterHoursApplied: threshold,
    },
    items: sortedItems,
    expiringSoonItems,
  };

  sessionManager.broadcastNotification(session.sessionId, 'notifications/resources/updated', {
    uri: 'mcp://pantry/expiring-soon',
  });

  const summaryText = `Scanned ${sortedItems.length} household pantry items. Found ${expiringSoonItems.length} items expiring within ${threshold} hours (${expiringSoonItems
    .map((i) => `${i.name} [${i.quantity}${i.unit}, ${i.expiresInHours}h]`)
    .join(', ')}) representing $${atRiskValueUsd.toFixed(2)} in potential food waste.`;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          summary: summaryText,
          expiringSoonCount: expiringSoonItems.length,
          atRiskValueUsd,
          expiringItems: expiringSoonItems.map((i) => ({
            name: i.name,
            quantity: `${i.quantity}${i.unit}`,
            expiresInHours: i.expiresInHours,
            estimatedValueUsd: i.estimatedValueUsd,
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
