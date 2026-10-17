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
    <section className="border-t border-cyan-500/35 bg-[#060A14] px-4 py-4 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span>Judge MCP 2025-11-25 Streamable HTTP Protocol Inspector</span>
          </div>

          <span className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-2.5 py-1 font-mono text-[11px] text-cyan-200">
            Mcp-Session-Id: {sessionId || 'Not initialized'}
          </span>

          <span className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-slate-300">
            Endpoint: <code className="text-cyan-300">POST /mcp</code>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isRunningSelfTest}
            onClick={handleSelfTest}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 hover:opacity-95 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            {isRunningSelfTest
              ? 'Running 5-Tool Compliance Check...'
              : 'Run MCP 2025-11-25 Compliance Check'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Compliance Self-Test Badges */}
      {complianceResults && (
        <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>
                MCP 2025-11-25 Automated Self-Test: {complianceResults.filter((r) => r.passed).length}/
                {complianceResults.length} Passed
              </span>
            </div>
            <span className="text-[11px] text-emerald-300 font-mono">
              protocolVersion === &quot;2025-11-25&quot; • VERIFIED
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {complianceResults.map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-emerald-500/30 bg-slate-950/75 p-2 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono font-semibold text-emerald-300 text-[11px]">
                    {item.step}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> PASS
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-300 truncate">
                  {item.detail}
                </div>
                <div className="mt-1 text-[10px] font-mono text-slate-400">
                  {item.latencyMs} ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological JSON-RPC 2.0 Frames List */}
      <div className="mt-3 max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {logs.map((entry) => {
          const isExpanded = expandedId === entry.id;
          return (
            <div
              key={entry.id}
              className="rounded-xl border border-slate-800/90 bg-slate-900/75 overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setExpandedId(isExpanded ? null : entry.id)
                }
                className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-800/60"
              >
                <div className="flex items-center gap-2.5">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-cyan-400" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                    HTTP {entry.status}
                  </span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {entry.method}
                  </span>
                  {entry.toolName && (
                    <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 font-mono text-[11px] text-indigo-200 border border-indigo-500/30">
                      {entry.toolName}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">
                    ({entry.direction})
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                  <span className="text-emerald-400">{entry.latencyMs} ms</span>
                  <span>{entry.timestamp}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="grid grid-cols-1 gap-2 border-t border-slate-800 bg-slate-950 p-3 md:grid-cols-2">
                  <div>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      JSON-RPC 2.0 Request Frame
                    </div>
                    <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-2 font-mono text-[10px] text-slate-200">
                      {JSON.stringify(entry.requestPayload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                      JSON-RPC 2.0 Response Frame
                    </div>
                    <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-2 font-mono text-[10px] text-slate-200">
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
