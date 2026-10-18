'use client';

import React, { useState } from 'react';
import {
  Terminal,
  CheckCircle2,
  Play,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { McpProtocolLogEntry } from '@/lib/mcpHttpClient';
import { Badge, Button, cx } from './ui';

export interface ComplianceCheckResult {
  step: string;
  passed: boolean;
  detail: string;
  latencyMs: number;
}

interface McpProtocolInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  logs: McpProtocolLogEntry[];
  onRunComplianceSelfTest: () => Promise<ComplianceCheckResult[]>;
  isRunningSelfTest: boolean;
}

export function McpProtocolInspector({
  isOpen,
  onClose,
  sessionId,
  logs,
  onRunComplianceSelfTest,
  isRunningSelfTest,
}: McpProtocolInspectorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [complianceResults, setComplianceResults] = useState<
    ComplianceCheckResult[] | null
  >(null);

  if (!isOpen) return null;

  const handleSelfTest = async () => {
    const res = await onRunComplianceSelfTest();
    setComplianceResults(res);
  };

  return (
    <section
      id="mcp-protocol-inspector"
      aria-label="MCP 2025-11-25 Protocol Inspector"
      className="border-t border-white/[0.08] bg-canvas/80 px-4 py-4 text-xs backdrop-blur-xl sm:px-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Terminal aria-hidden="true" className="h-4 w-4 text-cyan-300" />
            <span>MCP 2025-11-25 Streamable HTTP Inspector</span>
          </div>

          <Badge tone="brand" mono>
            Session: {sessionId ? `${sessionId.slice(0, 12)}…` : 'Not initialized'}
          </Badge>

          <Badge mono>POST /mcp</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            loading={isRunningSelfTest}
            icon={<Play className="h-3.5 w-3.5" />}
            onClick={handleSelfTest}
          >
            {isRunningSelfTest
              ? 'Running 5-tool compliance check…'
              : 'Run MCP 2025-11-25 compliance check'}
          </Button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close protocol inspector"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-fg-muted ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Compliance Self-Test Badges */}
      {complianceResults && (
        <div
          role="region"
          aria-label="MCP compliance results"
          className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.07] p-3.5"
        >
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-emerald-300" />
              <span>
                Automated self-test:{' '}
                {complianceResults.filter((r) => r.passed).length}/
                {complianceResults.length} passed
              </span>
            </div>
            <Badge tone="success" mono>
              protocolVersion === &quot;2025-11-25&quot; · VERIFIED
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {complianceResults.map((item) => (
              <div
                key={item.step}
                className="flex flex-col justify-between rounded-xl bg-surface/90 p-2.5 ring-1 ring-inset ring-emerald-400/25"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate font-mono text-[11px] font-semibold text-emerald-200">
                    {item.step}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-emerald-400/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200">
                    <CheckCircle2 aria-hidden="true" className="h-3 w-3" /> PASS
                  </span>
                </div>
                <div className="mt-1 truncate text-xs text-slate-200">
                  {item.detail}
                </div>
                <div className="tabular mt-1 font-mono text-[11px] text-fg-muted">
                  {item.latencyMs} ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological JSON-RPC 2.0 Frames List */}
      <div className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
        {logs.map((entry) => {
          const isExpanded = expandedId === entry.id;
          return (
            <div
              key={entry.id}
              className="overflow-hidden rounded-xl bg-surface/80 ring-1 ring-inset ring-white/[0.07]"
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="flex min-h-10 w-full flex-wrap items-center justify-between gap-2 px-3.5 py-2 text-left transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown aria-hidden="true" className="h-4 w-4 text-cyan-300" />
                  ) : (
                    <ChevronRight aria-hidden="true" className="h-4 w-4 text-fg-muted" />
                  )}
                  <Badge
                    tone={entry.status < 400 ? 'success' : 'danger'}
                    mono
                  >
                    HTTP {entry.status}
                  </Badge>
                  <span className="font-mono text-xs font-semibold text-cyan-200">
                    {entry.method}
                  </span>
                  {entry.toolName && (
                    <Badge tone="violet" mono>
                      {entry.toolName}
                    </Badge>
                  )}
                  <span className="text-xs text-fg-muted">({entry.direction})</span>
                </div>

                <div className="tabular flex items-center gap-3 font-mono text-xs text-fg-muted">
                  <span
                    className={cx(
                      'font-semibold',
                      entry.latencyMs < 50 ? 'text-emerald-300' : 'text-cyan-300'
                    )}
                  >
                    {entry.latencyMs} ms
                  </span>
                  <span>{entry.timestamp}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="grid grid-cols-1 gap-3 border-t border-white/[0.06] bg-canvas/80 p-3.5 md:grid-cols-2">
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                      JSON-RPC 2.0 Request Frame
                    </div>
                    <pre className="max-h-48 overflow-auto rounded-xl bg-surface p-3 font-mono text-[11px] leading-relaxed text-slate-200 ring-1 ring-inset ring-white/[0.06]">
                      {JSON.stringify(entry.requestPayload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                      JSON-RPC 2.0 Response Frame
                    </div>
                    <pre className="max-h-48 overflow-auto rounded-xl bg-surface p-3 font-mono text-[11px] leading-relaxed text-slate-200 ring-1 ring-inset ring-white/[0.06]">
                      {JSON.stringify(entry.responsePayload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
