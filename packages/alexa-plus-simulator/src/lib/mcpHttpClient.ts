export const MCP_ENDPOINT =
  process.env.NEXT_PUBLIC_MCP_ENDPOINT || 'http://localhost:3001/mcp';
export const AGENT_CHAT_ENDPOINT =
  process.env.NEXT_PUBLIC_AGENT_ENDPOINT || 'http://localhost:3001/agent/chat';

export interface McpProtocolLogEntry {
  id: string;
  timestamp: string;
  direction: 'client->server' | 'agent->mcp';
  method: string;
  toolName?: string;
  sessionId: string | null;
  status: number;
  latencyMs: number;
  requestPayload: unknown;
  responsePayload: unknown;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiresInHours: number;
  category: 'Produce' | 'Dairy & Alt' | 'Protein' | 'Pantry Staple' | 'Grains';
  estimatedValueUsd: number;
  storageLocation: string;
  urgencyLevel: 'critical' | 'warning' | 'fresh';
}

export interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  prepTimeMinutes: number;
  servings: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  estimatedCostUsd: number;
  dietaryTags: string[];
  pantryIngredientsUsed: string[];
  missingIngredients: string[];
  chefNote: string;
  badgeText: string;
}

export interface PlannedDayMeal {
  dayIndex: number;
  dayLabel: string;
  recipe: Recipe;
}

export interface ActiveMealPlan {
  mealPlanId: string;
  days: number;
  maxBudgetUsd: number;
  minProteinGramsPerMeal: number;
  dietaryTags: string[];
  meals: PlannedDayMeal[];
  totalEstimatedCostUsd: number;
  averageProteinGrams: number;
  totalProteinGrams: number;
  totalCalories: number;
  expiringItemsRescued: string[];
  estimatedWasteSavedUsd: number;
  missingIngredients: string[];
  updatedAt: string;
}

export interface StoreBasketSummary {
  storeId: 'amazon-fresh' | 'whole-foods' | 'local-coop';
  storeName: string;
  tagline: string;
  subtotalUsd: number;
  primeDiscountUsd: number;
  deliveryFeeUsd: number;
  totalOutOfPocketUsd: number;
  estimatedArrivalWindow: string;
  availableSlots: string[];
  badge?: string;
}

export interface ArbitrageItemRow {
  ingredientName: string;
  amazonFreshPriceUsd: number;
  amazonFreshBrand: string;
  amazonFreshSize: string;
  amazonFreshNote?: string;
  wholeFoodsPriceUsd: number;
  wholeFoodsBrand: string;
  wholeFoodsSize: string;
  localCoopPriceUsd: number;
  localCoopBrand: string;
  localCoopSize: string;
  lowestStoreId: 'amazon-fresh' | 'whole-foods' | 'local-coop';
}

export interface StoreComparisonState {
  comparisonId: string;
  mealPlanId: string;
  preferredDeliveryWindow: string;
  itemRows: ArbitrageItemRow[];
  stores: StoreBasketSummary[];
  recommendedStoreId: 'amazon-fresh' | 'whole-foods' | 'local-coop';
  hybridSplitSummary: {
    totalHybridUsd: number;
    savingsVsHighestUsd: number;
    explanation: string;
  };
  updatedAt: string;
}

export interface OrderConfirmationState {
  orderId: string;
  trackingCode: string;
  storeId: 'amazon-fresh' | 'whole-foods' | 'local-coop';
  storeName: string;
  deliverySlot: string;
  itemsOrderedCount: number;
  itemsOrdered: Array<{ name: string; brand: string; priceUsd: number }>;
  subtotalUsd: number;
  primeSavingsUsd: number;
  deliveryFeeUsd: number;
  finalTotalUsd: number;
  foodWasteAvoidedUsd: number;
  pantryItemsDeducted: string[];
  placedAt: string;
}

export type McpAppWidgetPayload =
  | {
      widgetType: 'PANTRY_EXPIRY_GRID';
      title: string;
      subtitle: string;
      summaryMetrics: {
        totalItemsCount: number;
        criticalExpiryCount: number;
        expiringWithin72hCount: number;
        atRiskValueUsd: number;
        filterHoursApplied: number;
      };
      items: PantryItem[];
      expiringSoonItems: PantryItem[];
    }
  | {
      widgetType: 'MEAL_PLAN_MACRO_CARDS';
      title: string;
      subtitle: string;
      mealPlan: ActiveMealPlan;
      swapHighlight?: {
        dayIndex: number;
        previousDishTitle: string;
        newDishTitle: string;
        constraintApplied: string;
        caloriesDelta: number;
        costDeltaUsd: number;
      };
    }
  | {
      widgetType: 'STORE_ARBITRAGE_TABLE';
      title: string;
      subtitle: string;
      comparison: StoreComparisonState;
    }
  | {
      widgetType: 'ORDER_CONFIRMATION_CARD';
      title: string;
      subtitle: string;
      order: OrderConfirmationState;
    };

export class BrowserMcpHttpClient {
  private sessionId: string | null = null;
  private onLog: (entry: McpProtocolLogEntry) => void;

  constructor(onLog: (entry: McpProtocolLogEntry) => void) {
    this.onLog = onLog;
  }

  public getSessionId(): string | null {
    return this.sessionId;
  }

  public setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  public async sendRpc<T = unknown>(
    method: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const rpcId = `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const requestPayload = {
      jsonrpc: '2.0',
      id: rpcId,
      method,
      params,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    };

    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const start = performance.now();
    const res = await fetch(MCP_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestPayload),
    });
    const latencyMs = Math.max(1, Math.round(performance.now() - start));

    const headerSessionId = res.headers.get('Mcp-Session-Id') || res.headers.get('mcp-session-id');
    if (headerSessionId) {
      this.sessionId = headerSessionId;
    }

    const responsePayload = await res.json();
    if (!this.sessionId && responsePayload?.result?._meta?.sessionId) {
      this.sessionId = responsePayload.result._meta.sessionId;
    }

    this.onLog({
      id: rpcId,
      timestamp: new Date().toLocaleTimeString(),
      direction: 'client->server',
      method,
      toolName: method === 'tools/call' ? String(params.name ?? '') : undefined,
      sessionId: this.sessionId,
      status: res.status,
      latencyMs,
      requestPayload,
      responsePayload,
    });

    if (responsePayload.error) {
      throw new Error(responsePayload.error.message || 'MCP RPC Error');
    }

    return responsePayload.result as T;
  }

  public async initializeHandshake() {
    const initResult = await this.sendRpc<{
      protocolVersion: string;
      capabilities: Record<string, unknown>;
      serverInfo: { name: string; version: string };
    }>('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {
        roots: { listChanged: true },
      },
      clientInfo: {
        name: 'alexa-plus-echo-show-15-simulator',
        version: '1.0.0',
      },
    });

    const toolsResult = await this.sendRpc<{
      tools: Array<{ name: string; description: string }>;
    }>('tools/list', {});

    const resourcesResult = await this.sendRpc<{
      resources: Array<{ uri: string; name: string }>;
    }>('resources/list', {});

    return {
      sessionId: this.sessionId,
      initResult,
      tools: toolsResult.tools,
      resources: resourcesResult.resources,
    };
  }

  public async callTool(
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<{
    content: Array<{ type: string; text: string }>;
    mcp_app_ui: McpAppWidgetPayload;
  }> {
    return this.sendRpc('tools/call', {
      name,
      arguments: args,
    });
  }

  public async readResource(uri: string) {
    return this.sendRpc('resources/read', { uri });
  }

  public async sendUtteranceToOrchestrator(
    message: string,
    forceLiveBedrock: boolean
  ) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.sessionId) {
      headers['Mcp-Session-Id'] = this.sessionId;
    }

    const res = await fetch(AGENT_CHAT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        sessionId: this.sessionId,
        forceLiveBedrock,
      }),
    });

    const headerSessionId =
      res.headers.get('Mcp-Session-Id') || res.headers.get('mcp-session-id');
    if (headerSessionId) {
      this.sessionId = headerSessionId;
    }

    const data = await res.json();
    if (Array.isArray(data.executedTraces)) {
      for (const trace of data.executedTraces) {
        this.onLog({
          id: trace.id,
          timestamp: new Date().toLocaleTimeString(),
          direction: 'agent->mcp',
          method: 'tools/call',
          toolName: trace.toolName,
          sessionId: this.sessionId,
          status: 200,
          latencyMs: trace.latencyMs,
          requestPayload: trace.jsonRpcRequest,
          responsePayload: trace.jsonRpcResponse,
        });
      }
    }

    return data;
  }
}
