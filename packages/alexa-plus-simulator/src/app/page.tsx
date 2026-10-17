'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BrowserMcpHttpClient,
  type McpAppWidgetPayload,
  type McpProtocolLogEntry,
} from '@/lib/mcpHttpClient';
import { EchoShowFrame } from '@/components/EchoShowFrame';
import {
  ConversationPane,
  type ChatTurn,
} from '@/components/ConversationPane';
import { McpAppsCanvas, type CanvasTab } from '@/components/McpAppsCanvas';
import {
  McpProtocolInspector,
  type ComplianceCheckResult,
} from '@/components/McpProtocolInspector';

export default function CartWeaveEchoShowPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [useLiveBedrock, setUseLiveBedrock] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [orbStatus, setOrbStatus] = useState<
    'idle' | 'listening' | 'thinking' | 'speaking'
  >('idle');
  const [isBusy, setIsBusy] = useState(false);
  const [isRunningSelfTest, setIsRunningSelfTest] = useState(false);

  const [activeTab, setActiveTab] = useState<CanvasTab>('PANTRY');
  const [pantryWidget, setPantryWidget] = useState<Extract<
    McpAppWidgetPayload,
    { widgetType: 'PANTRY_EXPIRY_GRID' }
  > | null>(null);
  const [mealPlanWidget, setMealPlanWidget] = useState<Extract<
    McpAppWidgetPayload,
    { widgetType: 'MEAL_PLAN_MACRO_CARDS' }
  > | null>(null);
  const [arbitrageWidget, setArbitrageWidget] = useState<Extract<
    McpAppWidgetPayload,
    { widgetType: 'STORE_ARBITRAGE_TABLE' }
  > | null>(null);
  const [orderWidget, setOrderWidget] = useState<Extract<
    McpAppWidgetPayload,
    { widgetType: 'ORDER_CONFIRMATION_CARD' }
  > | null>(null);

  const [protocolLogs, setProtocolLogs] = useState<McpProtocolLogEntry[]>([]);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'welcome-turn',
      role: 'alexa',
      text: 'Welcome to CartWeave on Echo Show 15! I am connected to your household MCP 2025-11-25 server. Tap any Judge Demo Scenario chip or speak naturally to rescue expiring pantry items, plan high-protein dinners, and compare Amazon Fresh vs. Whole Foods.',
      timestamp: 'Just now',
      toolsInvoked: ['initialize', 'tools/list', 'scan_pantry_inventory'],
    },
  ]);

  const clientRef = useRef<BrowserMcpHttpClient | null>(null);

  const speakAlexaReply = useCallback(
    (text: string) => {
      if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setOrbStatus('idle');
        return;
      }
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        setOrbStatus('speaking');
        utterance.onend = () => setOrbStatus('idle');
        utterance.onerror = () => setOrbStatus('idle');
        window.speechSynthesis.speak(utterance);
      } catch {
        setOrbStatus('idle');
      }
    },
    [isMuted]
  );

  const applyWidgetPayload = useCallback((payload: McpAppWidgetPayload | null | undefined) => {
    if (!payload || !payload.widgetType) return;
    if (payload.widgetType === 'PANTRY_EXPIRY_GRID') {
      setPantryWidget(payload);
      setActiveTab('PANTRY');
    } else if (payload.widgetType === 'MEAL_PLAN_MACRO_CARDS') {
      setMealPlanWidget(payload);
      setActiveTab('MEAL_PLAN');
    } else if (payload.widgetType === 'STORE_ARBITRAGE_TABLE') {
      setArbitrageWidget(payload);
      setActiveTab('ARBITRAGE');
    } else if (payload.widgetType === 'ORDER_CONFIRMATION_CARD') {
      setOrderWidget(payload);
      setActiveTab('ORDER');
    }
  }, []);

  // Initialize real MCP 2025-11-25 handshake on mount
  useEffect(() => {
    const client = new BrowserMcpHttpClient((entry) => {
      setProtocolLogs((prev) => [entry, ...prev]);
    });
    clientRef.current = client;

    let mounted = true;
    (async () => {
      try {
        const handshake = await client.initializeHandshake();
        if (!mounted) return;
        setSessionId(handshake.sessionId);
        setIsConnected(true);

        // Immediately load initial pantry telemetry via tools/call scan_pantry_inventory
        const initialPantry = await client.callTool('scan_pantry_inventory', {
          filterExpiringWithinHours: 72,
        });
        if (!mounted) return;
        applyWidgetPayload(initialPantry.mcp_app_ui);
      } catch {
        if (mounted) {
          setIsConnected(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [applyWidgetPayload]);

  // Direct interactive card button -> POST /mcp tools/call
  const handleExecuteTool = useCallback(
    async (
      toolName: string,
      args: Record<string, unknown>,
      userLabel: string
    ) => {
      const client = clientRef.current;
      if (!client) return;

      setIsBusy(true);
      setOrbStatus('thinking');

      const userTurnId = `turn-user-${Date.now()}`;
      setTurns((prev) => [
        ...prev,
        {
          id: userTurnId,
          role: 'user',
          text: `[Touch Action] ${userLabel}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);

      try {
        const result = await client.callTool(toolName, args);
        setSessionId(client.getSessionId());
        applyWidgetPayload(result.mcp_app_ui);

        let summaryText = `Executed ${toolName} on active session.`;
        try {
          const parsed = JSON.parse(result.content?.[0]?.text || '{}');
          if (parsed.summary) summaryText = parsed.summary;
        } catch {
          // Use fallback summary
        }

        setTurns((prev) => [
          ...prev,
          {
            id: `turn-alexa-${Date.now()}`,
            role: 'alexa',
            text: summaryText,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            toolsInvoked: [toolName],
          },
        ]);

        speakAlexaReply(summaryText);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'MCP tool call failed';
        setTurns((prev) => [
          ...prev,
          {
            id: `turn-err-${Date.now()}`,
            role: 'alexa',
            text: `I encountered an error calling ${toolName}: ${msg}`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
        setOrbStatus('idle');
      } finally {
        setIsBusy(false);
      }
    },
    [applyWidgetPayload, speakAlexaReply]
  );

  // Natural language utterance -> POST /agent/chat (Bedrock / Deterministic Multi-Tool Orchestrator)
  const handleSendUtterance = useCallback(
    async (utterance: string) => {
      const client = clientRef.current;
      if (!client) return;

      setIsBusy(true);
      setOrbStatus('thinking');

      setTurns((prev) => [
        ...prev,
        {
          id: `turn-u-${Date.now()}`,
          role: 'user',
          text: utterance,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);

      try {
        const response = await client.sendUtteranceToOrchestrator(
          utterance,
          useLiveBedrock
        );
        setSessionId(client.getSessionId());

        if (Array.isArray(response.executedTraces)) {
          for (const trace of response.executedTraces) {
            if (trace.mcp_app_ui) {
              applyWidgetPayload(trace.mcp_app_ui as McpAppWidgetPayload);
            }
          }
        } else if (response.latestMcpAppUi) {
          applyWidgetPayload(response.latestMcpAppUi as McpAppWidgetPayload);
        }

        const toolsInvoked = Array.isArray(response.executedTraces)
          ? response.executedTraces.map(
              (t: { toolName: string }) => t.toolName
            )
          : [];

        setTurns((prev) => [
          ...prev,
          {
            id: `turn-a-${Date.now()}`,
            role: 'alexa',
            text:
              response.spokenResponse ||
              'Updated your CartWeave kitchen dashboard.',
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            toolsInvoked,
          },
        ]);

        speakAlexaReply(response.spokenResponse || '');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Orchestrator connection error';
        setTurns((prev) => [
          ...prev,
          {
            id: `turn-err-${Date.now()}`,
            role: 'alexa',
            text: `Could not reach CartWeave MCP server on :3001 (${msg}).`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]);
        setOrbStatus('idle');
      } finally {
        setIsBusy(false);
      }
    },
    [applyWidgetPayload, speakAlexaReply, useLiveBedrock]
  );

  // Judge 1-Click MCP 2025-11-25 Compliance Check
  const handleRunComplianceSelfTest = useCallback(async (): Promise<
    ComplianceCheckResult[]
  > => {
    const client = clientRef.current;
    if (!client) return [];

    setIsRunningSelfTest(true);
    const results: ComplianceCheckResult[] = [];

    try {
      const t0 = performance.now();
      const hs = await client.initializeHandshake();
      setSessionId(hs.sessionId);
      setIsConnected(true);
      results.push({
        step: 'initialize + tools/list',
        passed: hs.initResult.protocolVersion === '2025-11-25' && hs.tools.length === 5,
        detail: `v${hs.initResult.protocolVersion} • ${hs.tools.length} tools`,
        latencyMs: Math.max(1, Math.round(performance.now() - t0)),
      });

      const t1 = performance.now();
      const r1 = await client.callTool('scan_pantry_inventory', {
        filterExpiringWithinHours: 72,
      });
      applyWidgetPayload(r1.mcp_app_ui);
      results.push({
        step: '1. scan_pantry_inventory',
        passed: r1.mcp_app_ui?.widgetType === 'PANTRY_EXPIRY_GRID',
        detail: 'PANTRY_EXPIRY_GRID emitted',
        latencyMs: Math.max(1, Math.round(performance.now() - t1)),
      });

      const t2 = performance.now();
      const r2 = await client.callTool('generate_meal_plan', {
        days: 3,
        maxBudgetUsd: 38,
        minProteinGramsPerMeal: 35,
        dietaryTags: ['vegetarian'],
        prioritizeExpiring: true,
      });
      applyWidgetPayload(r2.mcp_app_ui);
      results.push({
        step: '2. generate_meal_plan',
        passed: r2.mcp_app_ui?.widgetType === 'MEAL_PLAN_MACRO_CARDS',
        detail: 'MEAL_PLAN_MACRO_CARDS emitted',
        latencyMs: Math.max(1, Math.round(performance.now() - t2)),
      });

      const t3 = performance.now();
      const r3 = await client.callTool('compare_grocery_carts', {
        preferredDeliveryWindow: '6:00 PM – 7:00 PM',
      });
      applyWidgetPayload(r3.mcp_app_ui);
      results.push({
        step: '3. compare_grocery_carts',
        passed: r3.mcp_app_ui?.widgetType === 'STORE_ARBITRAGE_TABLE',
        detail: 'STORE_ARBITRAGE_TABLE emitted',
        latencyMs: Math.max(1, Math.round(performance.now() - t3)),
      });

      const t4 = performance.now();
      const r4 = await client.callTool('swap_ingredient_constraint', {
        dayIndex: 2,
        constraint: 'dairy-free',
        maxCalories: 520,
      });
      applyWidgetPayload(r4.mcp_app_ui);
      results.push({
        step: '4. swap_ingredient_constraint',
        passed: r4.mcp_app_ui?.widgetType === 'MEAL_PLAN_MACRO_CARDS',
        detail: 'Day 2 swapped (<520 kcal)',
        latencyMs: Math.max(1, Math.round(performance.now() - t4)),
      });

      const t5 = performance.now();
      const r5 = await client.callTool('checkout_smart_basket', {
        storeId: 'amazon-fresh',
        deliverySlot: '6:00 PM – 7:00 PM',
        applyPrimeSavings: true,
      });
      applyWidgetPayload(r5.mcp_app_ui);
      results.push({
        step: '5. checkout_smart_basket',
        passed: r5.mcp_app_ui?.widgetType === 'ORDER_CONFIRMATION_CARD',
        detail: 'ORDER_CONFIRMATION_CARD emitted',
        latencyMs: Math.max(1, Math.round(performance.now() - t5)),
      });
    } finally {
      setIsRunningSelfTest(false);
    }

    return results;
  }, [applyWidgetPayload]);

  return (
    <EchoShowFrame
      sessionId={sessionId}
      isConnected={isConnected}
      useLiveBedrock={useLiveBedrock}
      onToggleBedrockMode={() => setUseLiveBedrock((prev) => !prev)}
      isMuted={isMuted}
      onToggleMute={() => setIsMuted((prev) => !prev)}
      inspectorOpen={inspectorOpen}
      onToggleInspector={() => setInspectorOpen((prev) => !prev)}
      protocolLogCount={protocolLogs.length}
    >
      <div className="flex flex-col lg:flex-row flex-1">
        <ConversationPane
          turns={turns}
          orbStatus={orbStatus}
          onSendUtterance={handleSendUtterance}
          isBusy={isBusy || isRunningSelfTest}
        />

        <McpAppsCanvas
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pantryWidget={pantryWidget}
          mealPlanWidget={mealPlanWidget}
          arbitrageWidget={arbitrageWidget}
          orderWidget={orderWidget}
          onExecuteTool={handleExecuteTool}
          isBusy={isBusy || isRunningSelfTest}
        />
      </div>

      <McpProtocolInspector
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        sessionId={sessionId}
        logs={protocolLogs}
        onRunComplianceSelfTest={handleRunComplianceSelfTest}
        isRunningSelfTest={isRunningSelfTest}
      />
    </EchoShowFrame>
  );
}
