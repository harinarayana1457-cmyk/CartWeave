import assert from 'assert';
import type { AddressInfo } from 'net';
import { createMcpExpressApp, MCP_PROTOCOL_VERSION } from '../index';

async function runMcpComplianceTestSuite() {
  console.log('================================================================');
  console.log(' CartWeave — Automated MCP 2025-11-25 Compliance & Tool Suite');
  console.log('================================================================');

  const app = createMcpExpressApp();
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[PASS] Ephemeral MCP server started at ${baseUrl}/mcp`);

  try {
    // 1. Verify GET /health
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200, 'GET /health must return 200');
    const healthJson = (await healthRes.json()) as { protocolVersion: string };
    assert.strictEqual(healthJson.protocolVersion, '2025-11-25');
    console.log('[PASS] 1/9 GET /health verified (protocolVersion === "2025-11-25")');

    // 2. Verify POST /mcp initialize handshake & Mcp-Session-Id header
    const initRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-init-1',
        method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'cartweave-compliance-verifier', version: '1.0.0' },
        },
      }),
    });

    assert.strictEqual(initRes.status, 200, 'initialize must return HTTP 200');
    const sessionId = initRes.headers.get('mcp-session-id');
    assert.ok(sessionId && sessionId.startsWith('cw-mcp-'), 'Mcp-Session-Id header must be returned');
    const exposeHeader = initRes.headers.get('access-control-expose-headers') ?? '';
    assert.ok(
      exposeHeader.toLowerCase().includes('mcp-session-id'),
      'Access-Control-Expose-Headers must include Mcp-Session-Id'
    );

    const initBody = (await initRes.json()) as {
      result: { protocolVersion: string; capabilities: Record<string, unknown> };
    };
    assert.strictEqual(initBody.result.protocolVersion, MCP_PROTOCOL_VERSION);
    console.log(`[PASS] 2/9 initialize handshake verified (Mcp-Session-Id: ${sessionId})`);

    const commonHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      'Mcp-Session-Id': sessionId!,
    };

    // 3. Verify tools/list
    const toolsListRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-tools-list',
        method: 'tools/list',
        params: {},
      }),
    });
    const toolsListBody = (await toolsListRes.json()) as {
      result: { tools: Array<{ name: string }> };
    };
    assert.strictEqual(toolsListBody.result.tools.length, 5, 'Must expose exactly 5 MCP tools');
    console.log(
      `[PASS] 3/9 tools/list verified (${toolsListBody.result.tools.map((t) => t.name).join(', ')})`
    );

    // 4. Verify resources/list & resources/read + prompts/list & prompts/get
    const resListRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-res-list',
        method: 'resources/list',
        params: {},
      }),
    });
    const resListBody = (await resListRes.json()) as {
      result: { resources: Array<{ uri: string }> };
    };
    assert.strictEqual(resListBody.result.resources.length, 2, 'Must expose 2 MCP resources');

    const resReadRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-res-read',
        method: 'resources/read',
        params: { uri: 'mcp://pantry/expiring-soon' },
      }),
    });
    const resReadBody = (await resReadRes.json()) as {
      result: { contents: Array<{ uri: string; text: string }> };
    };
    assert.ok(resReadBody.result.contents[0].text.includes('Organic Baby Spinach'));

    const promptsListRes = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'test-prompts-list',
        method: 'prompts/list',
        params: {},
      }),
    });
    const promptsListBody = (await promptsListRes.json()) as {
      result: { prompts: Array<{ name: string }> };
    };
    assert.strictEqual(promptsListBody.result.prompts.length, 2, 'Must expose 2 MCP prompts');
    console.log('[PASS] 4/9 resources/list, resources/read, and prompts/list verified');

    // 5. Verify Tool 1: scan_pantry_inventory
    const tool1Res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-1',
        method: 'tools/call',
        params: {
          name: 'scan_pantry_inventory',
          arguments: { filterExpiringWithinHours: 72 },
        },
      }),
    });
    const tool1Body = (await tool1Res.json()) as {
      result: { mcp_app_ui: { widgetType: string; expiringSoonItems: unknown[] } };
    };
    assert.strictEqual(tool1Body.result.mcp_app_ui.widgetType, 'PANTRY_EXPIRY_GRID');
    assert.ok(tool1Body.result.mcp_app_ui.expiringSoonItems.length >= 4);
    console.log('[PASS] 5/9 Tool 1 (scan_pantry_inventory) -> PANTRY_EXPIRY_GRID verified');

    // 6. Verify Tool 2: generate_meal_plan
    const tool2Res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-2',
        method: 'tools/call',
        params: {
          name: 'generate_meal_plan',
          arguments: {
            days: 3,
            maxBudgetUsd: 38,
            minProteinGramsPerMeal: 35,
            dietaryTags: ['vegetarian'],
            prioritizeExpiring: true,
          },
        },
      }),
    });
    const tool2Body = (await tool2Res.json()) as {
      result: {
        mcp_app_ui: {
          widgetType: string;
          mealPlan: { meals: unknown[]; totalEstimatedCostUsd: number };
        };
      };
    };
    assert.strictEqual(tool2Body.result.mcp_app_ui.widgetType, 'MEAL_PLAN_MACRO_CARDS');
    assert.strictEqual(tool2Body.result.mcp_app_ui.mealPlan.meals.length, 3);
    assert.ok(tool2Body.result.mcp_app_ui.mealPlan.totalEstimatedCostUsd <= 38);
    console.log('[PASS] 6/9 Tool 2 (generate_meal_plan) -> MEAL_PLAN_MACRO_CARDS verified');

    // 7. Verify Tool 3: compare_grocery_carts
    const tool3Res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-3',
        method: 'tools/call',
        params: {
          name: 'compare_grocery_carts',
          arguments: { preferredDeliveryWindow: '6:00 PM – 7:00 PM' },
        },
      }),
    });
    const tool3Body = (await tool3Res.json()) as {
      result: {
        mcp_app_ui: {
          widgetType: string;
          comparison: { stores: unknown[]; recommendedStoreId: string };
        };
      };
    };
    assert.strictEqual(tool3Body.result.mcp_app_ui.widgetType, 'STORE_ARBITRAGE_TABLE');
    assert.strictEqual(tool3Body.result.mcp_app_ui.comparison.stores.length, 3);
    console.log('[PASS] 7/9 Tool 3 (compare_grocery_carts) -> STORE_ARBITRAGE_TABLE verified');

    // 8. Verify Tool 4: swap_ingredient_constraint
    const tool4Res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-4',
        method: 'tools/call',
        params: {
          name: 'swap_ingredient_constraint',
          arguments: { dayIndex: 2, constraint: 'dairy-free', maxCalories: 520 },
        },
      }),
    });
    const tool4Body = (await tool4Res.json()) as {
      result: {
        mcp_app_ui: {
          widgetType: string;
          swapHighlight: { dayIndex: number; newDishTitle: string };
        };
      };
    };
    assert.strictEqual(tool4Body.result.mcp_app_ui.widgetType, 'MEAL_PLAN_MACRO_CARDS');
    assert.strictEqual(tool4Body.result.mcp_app_ui.swapHighlight.dayIndex, 2);
    console.log(
      `[PASS] 8/9 Tool 4 (swap_ingredient_constraint) -> Swapped Day 2 to "${tool4Body.result.mcp_app_ui.swapHighlight.newDishTitle}"`
    );

    // 9. Verify Tool 5: checkout_smart_basket & DELETE /mcp
    const tool5Res = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'call-5',
        method: 'tools/call',
        params: {
          name: 'checkout_smart_basket',
          arguments: {
            storeId: 'amazon-fresh',
            deliverySlot: '6:00 PM – 7:00 PM',
            applyPrimeSavings: true,
          },
        },
      }),
    });
    const tool5Body = (await tool5Res.json()) as {
      result: {
        mcp_app_ui: {
          widgetType: string;
          order: { trackingCode: string; foodWasteAvoidedUsd: number };
        };
      };
    };
    assert.strictEqual(tool5Body.result.mcp_app_ui.widgetType, 'ORDER_CONFIRMATION_CARD');
    assert.ok(tool5Body.result.mcp_app_ui.order.trackingCode.startsWith('TRK-'));

    const deleteRes = await fetch(`${baseUrl}/mcp`, {
      method: 'DELETE',
      headers: { 'Mcp-Session-Id': sessionId! },
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log(
      `[PASS] 9/9 Tool 5 (checkout_smart_basket) -> ORDER_CONFIRMATION_CARD (${tool5Body.result.mcp_app_ui.order.trackingCode}) & DELETE /mcp verified`
    );

    console.log('================================================================');
    console.log(' ALL 9 MCP 2025-11-25 STREAMABLE HTTP COMPLIANCE CHECKS PASSED!');
    console.log('================================================================');
  } finally {
    server.close();
  }
}

runMcpComplianceTestSuite().catch((err) => {
  console.error('[FAIL] MCP Compliance Suite failed:', err);
  process.exit(1);
});
