import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { sessionManager } from './mcpSessionManager';
import {
  ALL_MCP_TOOLS,
  dispatchMcpTool,
  runBedrockOrMockOrchestrator,
} from './aws/bedrockAgent';
import { MCP_RESOURCES_LIST, readMcpResource } from './resources/mcpResources';
import { MCP_PROMPTS_LIST, getMcpPrompt } from './prompts/mcpPrompts';

export const MCP_PROTOCOL_VERSION = '2025-11-25';

export function createMcpExpressApp() {
  const app = express();

  app.use(
    cors({
      origin: '*',
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'Mcp-Session-Id', 'Authorization'],
      exposedHeaders: ['Mcp-Session-Id'],
    })
  );

  app.use(express.json({ limit: '2mb' }));

  // Health endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: '@cartweave/mcp-server',
      protocolVersion: MCP_PROTOCOL_VERSION,
      transport: 'MCP 2025-11-25 Streamable HTTP',
      activeSessions: sessionManager.getActiveSessionCount(),
      bedrockDefaultMode:
        process.env.USE_MOCK_BEDROCK === 'false' ? 'live-bedrock' : 'mock-offline',
      timestamp: new Date().toISOString(),
    });
  });

  // MCP 2025-11-25 Streamable HTTP — POST /mcp
  app.post('/mcp', (req: Request, res: Response) => {
    const incomingSessionId = req.header('Mcp-Session-Id') || req.header('mcp-session-id');
    const body = req.body;

    if (!body || body.jsonrpc !== '2.0') {
      res.status(400).json({
        jsonrpc: '2.0',
        id: body?.id ?? null,
        error: {
          code: -32600,
          message: 'Invalid JSON-RPC 2.0 request payload',
        },
      });
      return;
    }

    const { id, method, params } = body;

    try {
      // 1. initialize handshake
      if (method === 'initialize') {
        const requestedProtocol = params?.protocolVersion ?? MCP_PROTOCOL_VERSION;
        const session = sessionManager.createSession(requestedProtocol);
        res.setHeader('Mcp-Session-Id', session.sessionId);

        res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: MCP_PROTOCOL_VERSION,
            capabilities: {
              tools: { listChanged: true },
              resources: { subscribe: true, listChanged: true },
              prompts: { listChanged: false },
            },
            serverInfo: {
              name: 'cartweave-alexa-plus-mcp-server',
              version: '1.0.0',
              description:
                'CartWeave — Alexa+ Multi-Brand Pantry, Meal-Plan & Grocery Arbitrage MCP 2025-11-25 Server',
            },
            _meta: {
              sessionId: session.sessionId,
              transport: 'streamable-http-2025-11-25',
            },
          },
        });
        return;
      }

      // Resolve or create session for subsequent requests
      const session = sessionManager.getOrCreateSession(incomingSessionId ?? undefined);
      res.setHeader('Mcp-Session-Id', session.sessionId);

      // Notifications (no id or notifications/*)
      if (method === 'notifications/initialized' || method === 'initialized') {
        res.status(202).json({
          jsonrpc: '2.0',
          id: id ?? null,
          result: { acknowledged: true, sessionId: session.sessionId },
        });
        return;
      }

      if (method === 'ping') {
        res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {},
        });
        return;
      }

      // 2. tools/list
      if (method === 'tools/list') {
        res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            tools: ALL_MCP_TOOLS,
          },
        });
        return;
      }

      // 3. tools/call
      if (method === 'tools/call') {
        const toolName = params?.name;
        const toolArgs = params?.arguments ?? {};
        if (!toolName || typeof toolName !== 'string') {
          res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Missing tool name in tools/call params',
            },
          });
          return;
        }

        const toolOutput = dispatchMcpTool(session, toolName, toolArgs);

        sessionManager.broadcastNotification(
          session.sessionId,
          'notifications/message',
          {
            level: 'info',
            toolExecuted: toolName,
            widgetType: toolOutput.mcp_app_ui?.widgetType,
          }
        );

        res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: toolOutput,
        });
        return;
      }

      // 4. resources/list
      if (method === 'resources/list') {
        res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            resources: MCP_RESOURCES_LIST,
          },
        });
        return;
      }

      // 5. resources/read
      if (method === 'resources/read') {
        const uri = params?.uri;
        if (!uri || typeof uri !== 'string') {
          res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: {
              code: -32602,
              message: 'Missing resource uri in resources/read params',
            },
          });
          return;
        }
        const resourceData = readMcpResource(session, uri);
        res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: resourceData,
        });
        return;
      }

      // 6. prompts/list
      if (method === 'prompts/list') {
        res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            prompts: MCP_PROMPTS_LIST,
          },
        });
        return;
      }

      // 7. prompts/get
      if (method === 'prompts/get') {
        const promptName = params?.name;
        const promptArgs = (params?.arguments as Record<string, string>) ?? {};
        const promptData = getMcpPrompt(promptName, promptArgs);
        res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: promptData,
        });
        return;
      }

      res.status(404).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'Internal MCP execution error';
      res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: errMessage,
        },
      });
    }
  });

  // MCP 2025-11-25 Streamable HTTP — GET /mcp (Server-Sent Events stream)
  app.get('/mcp', (req: Request, res: Response) => {
    const incomingSessionId =
      req.header('Mcp-Session-Id') ||
      req.header('mcp-session-id') ||
      (req.query.sessionId as string | undefined);

    const session = sessionManager.getOrCreateSession(incomingSessionId);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Mcp-Session-Id', session.sessionId);
    res.flushHeaders?.();

    sessionManager.registerSseClient(session.sessionId, res);

    const connectedEvent = JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/connected',
      params: {
        sessionId: session.sessionId,
        protocolVersion: MCP_PROTOCOL_VERSION,
        timestamp: new Date().toISOString(),
      },
    });
    res.write(`event: message\ndata: ${connectedEvent}\n\n`);
  });

  // MCP 2025-11-25 Streamable HTTP — DELETE /mcp (Session termination)
  app.delete('/mcp', (req: Request, res: Response) => {
    const incomingSessionId =
      req.header('Mcp-Session-Id') || req.header('mcp-session-id');

    if (!incomingSessionId) {
      res.status(400).json({
        error: 'Mcp-Session-Id header is required to close a session',
      });
      return;
    }

    const deleted = sessionManager.deleteSession(incomingSessionId);
    res.status(200).json({
      closed: deleted,
      sessionId: incomingSessionId,
      protocolVersion: MCP_PROTOCOL_VERSION,
    });
  });

  // Alexa+ Simulator Natural Language Utterance Endpoint -> Bedrock / Mock Orchestrator
  app.post('/agent/chat', async (req: Request, res: Response) => {
    try {
      const incomingSessionId =
        req.header('Mcp-Session-Id') ||
        req.header('mcp-session-id') ||
        req.body?.sessionId;
      const utterance: string = req.body?.message || req.body?.utterance || '';
      const forceLiveBedrock: boolean | undefined = req.body?.forceLiveBedrock;

      if (!utterance.trim()) {
        res.status(400).json({ error: 'Missing message or utterance in request body' });
        return;
      }

      const session = sessionManager.getOrCreateSession(incomingSessionId);
      res.setHeader('Mcp-Session-Id', session.sessionId);

      const orchestrationResult = await runBedrockOrMockOrchestrator(
        session,
        utterance,
        forceLiveBedrock
      );

      res.status(200).json(orchestrationResult);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Agent orchestration error';
      res.status(500).json({ error: message });
    }
  });

  return app;
}

if (require.main === module) {
  const PORT = Number(process.env.PORT || 3001);
  const app = createMcpExpressApp();
  app.listen(PORT, () => {
    console.log(
      `[CartWeave MCP Server] Listening on http://localhost:${PORT}/mcp (Protocol ${MCP_PROTOCOL_VERSION})`
    );
  });
}
