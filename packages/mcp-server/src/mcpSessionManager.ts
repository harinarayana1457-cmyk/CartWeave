import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { INITIAL_PANTRY_ITEMS, type PantryItem, type Recipe } from './data/seedData';

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

export interface McpSessionState {
  sessionId: string;
  protocolVersion: string;
  createdAt: string;
  lastUpdatedAt: string;
  pantryItems: PantryItem[];
  activeMealPlan: ActiveMealPlan | null;
  activeComparison: StoreComparisonState | null;
  lastOrderConfirmation: OrderConfirmationState | null;
  sseClients: Set<Response>;
}

class McpSessionManager {
  private sessions = new Map<string, McpSessionState>();

  public createSession(protocolVersion = '2025-11-25'): McpSessionState {
    const sessionId = `cw-mcp-${randomUUID()}`;
    const now = new Date().toISOString();
    const state: McpSessionState = {
      sessionId,
      protocolVersion: '2025-11-25',
      createdAt: now,
      lastUpdatedAt: now,
      pantryItems: INITIAL_PANTRY_ITEMS.map((item) => ({ ...item })),
      activeMealPlan: null,
      activeComparison: null,
      lastOrderConfirmation: null,
      sseClients: new Set<Response>(),
    };
    this.sessions.set(sessionId, state);
    return state;
  }

  public getSession(sessionId?: string): McpSessionState | undefined {
    if (!sessionId) return undefined;
    return this.sessions.get(sessionId);
  }

  public getOrCreateSession(sessionId?: string): McpSessionState {
    if (sessionId && this.sessions.has(sessionId)) {
      const existing = this.sessions.get(sessionId)!;
      existing.lastUpdatedAt = new Date().toISOString();
      return existing;
    }
    if (sessionId) {
      const now = new Date().toISOString();
      const customState: McpSessionState = {
        sessionId,
        protocolVersion: '2025-11-25',
        createdAt: now,
        lastUpdatedAt: now,
        pantryItems: INITIAL_PANTRY_ITEMS.map((item) => ({ ...item })),
        activeMealPlan: null,
        activeComparison: null,
        lastOrderConfirmation: null,
        sseClients: new Set<Response>(),
      };
      this.sessions.set(sessionId, customState);
      return customState;
    }
    return this.createSession();
  }

  public deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    for (const res of session.sseClients) {
      try {
        res.end();
      } catch {
        // Ignore already-closed stream
      }
    }
    session.sseClients.clear();
    return this.sessions.delete(sessionId);
  }

  public registerSseClient(sessionId: string, res: Response): void {
    const session = this.getOrCreateSession(sessionId);
    session.sseClients.add(res);
    res.on('close', () => {
      session.sseClients.delete(res);
    });
  }

  public broadcastNotification(
    sessionId: string,
    method: string,
    params: Record<string, unknown>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.sseClients.size === 0) return;
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params: {
        ...params,
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
    for (const client of session.sseClients) {
      try {
        client.write(`event: message\ndata: ${payload}\n\n`);
      } catch {
        session.sseClients.delete(client);
      }
    }
  }

  public getActiveSessionCount(): number {
    return this.sessions.size;
  }
}

export const sessionManager = new McpSessionManager();
