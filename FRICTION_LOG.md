# CartWeave — Developer Experience & Friction Log (`FRICTION_LOG.md`)

> Prepared for the **Build, Ship, Shape: Amazon Developer Hackathon** (10% Judging Bonus & Alexa+ / MCP Toolkit Product Engineering Feedback).

---

## Executive Summary

While building **CartWeave**—an Alexa+ Multi-Brand Pantry, Meal-Plan & Grocery Arbitrage Concierge backed by a self-hosted **MCP `2025-11-25` Streamable HTTP** server and **Amazon Bedrock Converse API**—we documented key developer experience (DX) friction points across the Alexa+ MCP Toolkit specification, browser-to-MCP CORS header handling, multimodal UI payload contracts, and local simulator testing. Each friction item below includes root-cause analysis, the workaround implemented in CartWeave, and concrete product recommendations for the Amazon Alexa+ & AWS Developer Tools teams.

---

## Friction Log Summary Matrix

| ID | Category | Component | Severity | Status in CartWeave |
| :--- | :--- | :--- | :--- | :--- |
| **FL-01** | Protocol Transport | Browser CORS & `Mcp-Session-Id` Header Visibility | High | Resolved via explicit `Access-Control-Expose-Headers` |
| **FL-02** | Multimodal UI Contract | Standardizing `mcp_app_ui` Payloads inside MCP `CallToolResult` | High | Resolved via dual `content` + `structuredContent.mcp_app_ui` envelope |
| **FL-03** | Alexa+ Local Testing | Absence of a Standalone Local Echo Show 15 MCP Apps Emulator | High | Resolved by building the Next.js Echo Show 15 Simulator |
| **FL-04** | Bedrock Tool Orchestration | Mapping MCP JSON Schemas to Bedrock `ConverseCommand` `toolConfig` | Medium | Resolved via automated schema normalizer in `bedrockAgent.ts` |
| **FL-05** | Stateful Sessions | Managing `GET /mcp` SSE Streams Alongside Stateless Lambda Invocations | Medium | Resolved via `mcpSessionManager.ts` + DynamoDB TTL design in `template.yaml` |

---

## Detailed Friction Entries & Recommendations

### FL-01: Browser CORS Blocks `Mcp-Session-Id` Header Inspection in Web-Based MCP Simulators
- **Context**: In the MCP `2025-11-25` Streamable HTTP specification, the server assigns a session identifier via the `Mcp-Session-Id` HTTP response header during the `initialize` response, and the client must echo `Mcp-Session-Id` on all subsequent `POST /mcp`, `GET /mcp`, and `DELETE /mcp` requests.
- **Friction Encountered**: When testing a Streamable HTTP MCP server from a browser-based simulator or web debugger across ports (`localhost:3000` -> `localhost:3001`), the browser's Fetch API silently hides `res.headers.get("mcp-session-id")` (returning `null`) even when `Access-Control-Allow-Origin: *` is set, unless the server explicitly returns `Access-Control-Expose-Headers: Mcp-Session-Id`.
- **Workaround Implemented**: In `packages/mcp-server/src/index.ts`, we configured CORS with both `allowedHeaders: ['Content-Type', 'Accept', 'Mcp-Session-Id']` and `exposedHeaders: ['Mcp-Session-Id']`, and also mirrored `sessionId` inside `_meta.sessionId` of the `initialize` result payload for defense-in-depth.
- **Recommendation for Alexa+ MCP Toolkit Docs**: Add an explicit callout box and starter middleware snippet in the Alexa+ MCP Server setup guide highlighting `Access-Control-Expose-Headers: Mcp-Session-Id` for browser-based MCP Inspectors and Web Apps.

---

### FL-02: Lack of a Canonical TypeScript Schema for Alexa+ Multimodal `mcp_app_ui` Cards
- **Context**: Alexa+ on Echo Show devices pairs spoken natural-language responses with rich visual cards (MCP Apps UI). However, standard MCP `CallToolResult` only mandates `content: Array<{ type: "text", text: string }>`, leaving developers unsure where to attach typed visual widget payloads so both LLM orchestrators and multimodal displays can consume them cleanly.
- **Friction Encountered**: Embedding large UI layout JSON blobs inside `content[0].text` wastes LLM context tokens during multi-step tool chaining (e.g., `scan_pantry_inventory` -> `generate_meal_plan` -> `compare_grocery_carts`), while omitting structured data forces the UI layer to parse brittle markdown tables.
- **Workaround Implemented**: Every CartWeave MCP tool returns:
  1. Concise, token-efficient JSON summary in `content[0].text` for the LLM (`BedrockOrchestrator`), and
  2. Strongly typed `mcp_app_ui` widget descriptors (`PANTRY_EXPIRY_GRID`, `MEAL_PLAN_MACRO_CARDS`, `STORE_ARBITRAGE_TABLE`, `ORDER_CONFIRMATION_CARD`) both at the top-level tool response (`mcp_app_ui`) and inside `_meta.mcp_app_ui`.
- **Recommendation for Alexa+ MCP Toolkit**: Publish an official `@amazon-alexa/mcp-apps-ui` TypeScript types package defining standard Echo Show widget primitives (Grid, MacroCard, ComparisonTable, OrderReceipt) with automatic APL/HTML preview renderers.

---

### FL-03: Testing Multi-Turn Voice + Touch Interactions Locally Without Physical Echo Show Hardware
- **Context**: In kitchen workflows like CartWeave, users naturally alternate between voice commands (*"Scan my pantry and plan 3 dinners"*) and touch interactions on the Echo Show 15 screen (tapping *"Swap Dish"* on Day 2 or selecting a delivery window).
- **Friction Encountered**: Existing CLI MCP inspectors test single JSON-RPC calls in isolation but cannot simulate how a touch tap inside a rendered widget mutates the shared `Mcp-Session-Id` state that the voice assistant references on the next spoken turn.
- **Workaround Implemented**: We built `/packages/alexa-plus-simulator`, a full Echo Show 15 split-screen simulator combining Web Speech API (`webkitSpeechRecognition` + `speechSynthesis`), interactive MCP Apps cards that dispatch live `POST /mcp` (`tools/call`) requests over the shared `Mcp-Session-Id`, and a built-in **Judge MCP Protocol Inspector Drawer** with a 1-click **MCP 2025-11-25 Compliance Check**.
- **Recommendation for Alexa+ Developer Console**: Provide an embeddable React/Next.js `<AlexaPlusMcpSimulator endpoint="http://localhost:3001/mcp" />` component in the Alexa+ SDK so developers can test multimodal voice + touch session continuity locally.

---

### FL-04: Bridging MCP `tools/list` JSON Schemas to Amazon Bedrock `ConverseCommand` `toolSpec`
- **Context**: MCP `tools/list` exposes each tool's parameters under `inputSchema` (standard JSON Schema), whereas `@aws-sdk/client-bedrock-runtime`'s `ConverseCommand` expects `toolConfig.tools[].toolSpec.inputSchema.json`.
- **Friction Encountered**: In addition to the nested `.json` wrapper, offline hackathon judges and CI pipelines frequently evaluate repositories without live AWS credentials or Bedrock model access enabled in `us-east-1`, which causes naive Bedrock integrations to crash on startup.
- **Workaround Implemented**: In `packages/mcp-server/src/aws/bedrockAgent.ts`, we implemented an automatic MCP-to-Bedrock `ToolConfiguration` adapter alongside a zero-cost `USE_MOCK_BEDROCK=true` fallback mode (switchable live from the Echo Show 15 top status bar) that executes the exact same multi-step MCP tools deterministically.
- **Recommendation for AWS SDK / Bedrock Team**: Add a first-class helper `fromMcpTools(mcpToolsList)` in `@aws-sdk/client-bedrock-runtime` to convert MCP `tools/list` output directly into Bedrock `ConverseCommand` `toolConfig`.

---

### FL-05: Streamable HTTP Session Continuity Across `POST /mcp`, `GET /mcp` (SSE), and `DELETE /mcp`
- **Context**: MCP `2025-11-25` unifies request/response JSON-RPC (`POST /mcp`), server-initiated event streams (`GET /mcp` with `Accept: text/event-stream`), and explicit session teardown (`DELETE /mcp`).
- **Friction Encountered**: Coordinating SSE progress notifications when a tool call (`POST /mcp`) mutates session state requires indexing active SSE response streams by `Mcp-Session-Id` and handling clean disconnects without leaking memory.
- **Workaround Implemented**: `packages/mcp-server/src/mcpSessionManager.ts` manages per-session state (pantry inventory, active 3-day meal plan, 3-store comparison, checkout receipt, and connected SSE clients) and broadcasts real-time `notifications/message` and `notifications/resources/updated` events whenever a tool mutates session state.
