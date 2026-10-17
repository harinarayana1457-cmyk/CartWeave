import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
  type Tool,
} from '@aws-sdk/client-bedrock-runtime';
import type { McpSessionState } from '../mcpSessionManager';
import {
  SCAN_PANTRY_TOOL_DEFINITION,
  executeScanPantry,
} from '../tools/scanPantry';
import {
  GENERATE_MEAL_PLAN_TOOL_DEFINITION,
  executeGenerateMealPlan,
} from '../tools/generateMealPlan';
import {
  COMPARE_CARTS_TOOL_DEFINITION,
  executeCompareCarts,
} from '../tools/compareCarts';
import {
  SWAP_CONSTRAINT_TOOL_DEFINITION,
  executeSwapConstraint,
} from '../tools/swapConstraint';
import {
  CHECKOUT_BASKET_TOOL_DEFINITION,
  executeCheckoutBasket,
} from '../tools/checkoutBasket';

export const ALL_MCP_TOOLS = [
  SCAN_PANTRY_TOOL_DEFINITION,
  GENERATE_MEAL_PLAN_TOOL_DEFINITION,
  COMPARE_CARTS_TOOL_DEFINITION,
  SWAP_CONSTRAINT_TOOL_DEFINITION,
  CHECKOUT_BASKET_TOOL_DEFINITION,
];

export function dispatchMcpTool(
  session: McpSessionState,
  toolName: string,
  args: unknown
) {
  switch (toolName) {
    case 'scan_pantry_inventory':
      return executeScanPantry(session, args);
    case 'generate_meal_plan':
      return executeGenerateMealPlan(session, args);
    case 'compare_grocery_carts':
      return executeCompareCarts(session, args);
    case 'swap_ingredient_constraint':
      return executeSwapConstraint(session, args);
    case 'checkout_smart_basket':
      return executeCheckoutBasket(session, args);
    default:
      throw new Error(`Unknown MCP tool: ${toolName}`);
  }
}

export interface ExecutedMcpTrace {
  id: string;
  toolName: string;
  arguments: Record<string, unknown>;
  latencyMs: number;
  jsonRpcRequest: Record<string, unknown>;
  jsonRpcResponse: Record<string, unknown>;
  mcp_app_ui: unknown;
}

export interface AgentOrchestrationResult {
  sessionId: string;
  orchestratorMode: 'aws-bedrock-converse' | 'mock-deterministic-planner';
  modelId: string;
  spokenResponse: string;
  executedTraces: ExecutedMcpTrace[];
  latestMcpAppUi: unknown;
  activeStateSnapshot: {
    pantryCount: number;
    activeMealPlan: McpSessionState['activeMealPlan'];
    activeComparison: McpSessionState['activeComparison'];
    lastOrderConfirmation: McpSessionState['lastOrderConfirmation'];
  };
}

function buildBedrockToolConfig(): Tool[] {
  return ALL_MCP_TOOLS.map((t) => ({
    toolSpec: {
      name: t.name,
      description: t.description,
      inputSchema: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        json: t.inputSchema as any,
      },
    },
  }));
}

function invokeAndRecordTool(
  session: McpSessionState,
  toolName: string,
  args: Record<string, unknown>,
  traces: ExecutedMcpTrace[]
) {
  const start = performance.now();
  const rpcId = `agent-rpc-${Date.now()}-${traces.length + 1}`;
  const jsonRpcRequest = {
    jsonrpc: '2.0',
    id: rpcId,
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args,
    },
  };

  const result = dispatchMcpTool(session, toolName, args);
  const latencyMs = Math.max(1, Math.round(performance.now() - start));

  const jsonRpcResponse = {
    jsonrpc: '2.0',
    id: rpcId,
    result,
  };

  traces.push({
    id: rpcId,
    toolName,
    arguments: args,
    latencyMs,
    jsonRpcRequest,
    jsonRpcResponse,
    mcp_app_ui: result.mcp_app_ui,
  });

  return result;
}

export async function runBedrockOrMockOrchestrator(
  session: McpSessionState,
  userUtterance: string,
  forceLiveBedrock?: boolean
): Promise<AgentOrchestrationResult> {
  const envMock = process.env.USE_MOCK_BEDROCK !== 'false';
  const hasAwsCreds = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
  const shouldAttemptBedrock =
    (forceLiveBedrock === true || !envMock) && hasAwsCreds;
  const modelId =
    process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

  if (shouldAttemptBedrock) {
    try {
      const client = new BedrockRuntimeClient({
        region: process.env.AWS_REGION || 'us-east-1',
      });
      const traces: ExecutedMcpTrace[] = [];
      const messages: Message[] = [
        {
          role: 'user',
          content: [{ text: userUtterance }],
        },
      ];

      let finalSpoken = '';
      for (let step = 0; step < 4; step++) {
        const command = new ConverseCommand({
          modelId,
          system: [
            {
              text: 'You are Alexa+ running CartWeave on an Echo Show 15 kitchen display. Use the provided MCP tools to scan expiring pantry items, generate high-protein meal plans within budget, compare grocery carts across Amazon Fresh, Whole Foods, and Local Co-op, swap dishes for dietary constraints, and check out smart baskets. Keep spoken responses concise, warm, and natural for voice output (2-3 sentences).',
            },
          ],
          messages,
          toolConfig: {
            tools: buildBedrockToolConfig(),
          },
        });

        const response = await client.send(command);
        const outputMessage = response.output?.message;
        if (!outputMessage) break;
        messages.push(outputMessage);

        const toolUses = (outputMessage.content ?? []).filter(
          (block) => block.toolUse !== undefined
        );

        if (toolUses.length === 0) {
          const textBlock = (outputMessage.content ?? []).find(
            (block) => block.text !== undefined
          );
          finalSpoken = textBlock?.text ?? '';
          break;
        }

        const toolResultBlocks = [];
        for (const block of toolUses) {
          const tu = block.toolUse!;
          const toolName = tu.name!;
          const args = (tu.input as Record<string, unknown>) ?? {};
          const toolOut = invokeAndRecordTool(session, toolName, args, traces);
          toolResultBlocks.push({
            toolResult: {
              toolUseId: tu.toolUseId,
              content: [{ text: toolOut.content[0].text }],
            },
          });
        }

        messages.push({
          role: 'user',
          content: toolResultBlocks,
        });
      }

      if (traces.length > 0) {
        const latestMcpAppUi = traces[traces.length - 1].mcp_app_ui;
        return {
          sessionId: session.sessionId,
          orchestratorMode: 'aws-bedrock-converse',
          modelId,
          spokenResponse:
            finalSpoken ||
            'I updated your CartWeave kitchen plan on your Echo Show display.',
          executedTraces: traces,
          latestMcpAppUi,
          activeStateSnapshot: {
            pantryCount: session.pantryItems.length,
            activeMealPlan: session.activeMealPlan,
            activeComparison: session.activeComparison,
            lastOrderConfirmation: session.lastOrderConfirmation,
          },
        };
      }
    } catch {
      // Fall back gracefully to deterministic multi-step planner when offline or without Bedrock permissions
    }
  }

  return runDeterministicPlanner(session, userUtterance, modelId);
}

function runDeterministicPlanner(
  session: McpSessionState,
  userUtterance: string,
  modelId: string
): AgentOrchestrationResult {
  const lower = userUtterance.toLowerCase();
  const traces: ExecutedMcpTrace[] = [];

  const mentionsCheckout =
    lower.includes('checkout') ||
    lower.includes('check out') ||
    lower.includes('place order') ||
    lower.includes('delivery window') ||
    lower.includes('6:00 pm');

  const mentionsSwap =
    lower.includes('swap') ||
    lower.includes('replace') ||
    lower.includes('dairy-free') ||
    lower.includes('520 cal');

  const mentionsCompare =
    lower.includes('compare') ||
    lower.includes('whole foods') ||
    lower.includes('arbitrage') ||
    (lower.includes('amazon fresh') && !mentionsCheckout);

  const mentionsPantry =
    lower.includes('pantry') ||
    lower.includes('scan') ||
    lower.includes('expir') ||
    lower.includes('spinach') ||
    lower.includes('fridge');

  const mentionsMealPlan =
    lower.includes('plan') ||
    lower.includes('dinner') ||
    lower.includes('protein') ||
    lower.includes('meal');

  let spokenResponse = '';

  if (mentionsCheckout) {
    const storeId: 'amazon-fresh' | 'whole-foods' | 'local-coop' = lower.includes(
      'whole foods'
    )
      ? 'whole-foods'
      : lower.includes('co-op') || lower.includes('coop')
      ? 'local-coop'
      : 'amazon-fresh';

    const slotMatch = userUtterance.match(
      /\d{1,2}:\d{2}\s*(?:AM|PM)\s*[–-]\s*\d{1,2}:\d{2}\s*(?:AM|PM)/i
    );
    const deliverySlot = slotMatch ? slotMatch[0] : '6:00 PM – 7:00 PM';

    invokeAndRecordTool(
      session,
      'checkout_smart_basket',
      {
        storeId,
        deliverySlot,
        applyPrimeSavings: true,
      },
      traces
    );

    const order = session.lastOrderConfirmation!;
    spokenResponse = `Done! I've checked out your ${order.storeName} basket for the ${order.deliverySlot} delivery window. Your total is $${order.finalTotalUsd.toFixed(
      2
    )} with $${order.primeSavingsUsd.toFixed(
      2
    )} in Prime savings, and we rescued $${order.foodWasteAvoidedUsd.toFixed(
      2
    )} worth of expiring pantry ingredients. Tracking code ${order.trackingCode} is live on your Echo Show.`;
  } else if (mentionsSwap) {
    const dayMatch = lower.match(/day\s*(\d+)/i);
    const dayIndex = dayMatch ? Number(dayMatch[1]) : 2;
    const calMatch = lower.match(/(\d{3})\s*cal/i);
    const maxCalories = calMatch ? Number(calMatch[1]) : 520;
    const constraint = lower.includes('gluten-free')
      ? 'gluten-free'
      : lower.includes('vegan')
      ? 'vegan'
      : 'dairy-free';

    invokeAndRecordTool(
      session,
      'swap_ingredient_constraint',
      {
        dayIndex,
        constraint,
        maxCalories,
      },
      traces
    );

    const mp = session.activeMealPlan!;
    const swappedMeal = mp.meals[Math.max(0, dayIndex - 1)];
    const afTotal =
      session.activeComparison?.stores.find((s) => s.storeId === 'amazon-fresh')
        ?.totalOutOfPocketUsd ?? mp.totalEstimatedCostUsd;

    spokenResponse = `I swapped Day ${dayIndex} to ${swappedMeal.recipe.title}—it's 100% ${constraint} at ${swappedMeal.recipe.calories} calories and ${swappedMeal.recipe.proteinGrams} grams of protein. Your 3-day meal plan now averages ${mp.averageProteinGrams} grams of protein per dinner, and your updated Amazon Fresh cart is $${afTotal.toFixed(
      2
    )}.`;
  } else if (mentionsCompare && !mentionsPantry && !mentionsMealPlan) {
    invokeAndRecordTool(
      session,
      'compare_grocery_carts',
      {
        preferredDeliveryWindow: '6:00 PM – 7:00 PM',
      },
      traces
    );

    const cmp = session.activeComparison!;
    const af = cmp.stores.find((s) => s.storeId === 'amazon-fresh')!;
    const wf = cmp.stores.find((s) => s.storeId === 'whole-foods')!;
    const coop = cmp.stores.find((s) => s.storeId === 'local-coop')!;

    spokenResponse = `I priced all ${cmp.itemRows.length} missing ingredients across three retailers. Amazon Fresh is the lowest single basket at $${af.totalOutOfPocketUsd.toFixed(
      2
    )} with free Prime delivery and smart brand substitutions, compared to $${wf.totalOutOfPocketUsd.toFixed(
      2
    )} at Whole Foods Market and $${coop.totalOutOfPocketUsd.toFixed(
      2
    )} at your Local Co-op—saving you $${cmp.hybridSplitSummary.savingsVsHighestUsd.toFixed(
      2
    )}.`;
  } else {
    // Default / Scenario 1: Scan Pantry + Plan 3 Dinners (+ optional Compare if requested)
    invokeAndRecordTool(
      session,
      'scan_pantry_inventory',
      {
        filterExpiringWithinHours: 72,
      },
      traces
    );

    const budgetMatch = userUtterance.match(/\$(\d+)/);
    const maxBudgetUsd = budgetMatch ? Number(budgetMatch[1]) : 38;

    invokeAndRecordTool(
      session,
      'generate_meal_plan',
      {
        days: 3,
        maxBudgetUsd,
        minProteinGramsPerMeal: 35,
        dietaryTags: ['vegetarian'],
        prioritizeExpiring: true,
      },
      traces
    );

    if (mentionsCompare) {
      invokeAndRecordTool(
        session,
        'compare_grocery_carts',
        {
          preferredDeliveryWindow: '6:00 PM – 7:00 PM',
        },
        traces
      );
    }

    const mp = session.activeMealPlan!;
    spokenResponse = `I scanned your smart pantry and found 4 items expiring within 40 hours—including baby spinach, Greek yogurt, fresh paneer, and Hass avocados worth $${mp.estimatedWasteSavedUsd.toFixed(
      2
    )}. I built a 3-day high-protein vegetarian meal plan averaging ${
      mp.averageProteinGrams
    } grams of protein per serving for $${mp.totalEstimatedCostUsd.toFixed(
      2
    )}, well under your $${maxBudgetUsd} budget.`;
  }

  const latestMcpAppUi =
    traces.length > 0 ? traces[traces.length - 1].mcp_app_ui : null;

  return {
    sessionId: session.sessionId,
    orchestratorMode: 'mock-deterministic-planner',
    modelId: `${modelId} (Mock Planner)`,
    spokenResponse,
    executedTraces: traces,
    latestMcpAppUi,
    activeStateSnapshot: {
      pantryCount: session.pantryItems.length,
      activeMealPlan: session.activeMealPlan,
      activeComparison: session.activeComparison,
      lastOrderConfirmation: session.lastOrderConfirmation,
    },
  };
}
