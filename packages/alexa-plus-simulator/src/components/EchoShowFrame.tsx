'use client';

import React, { useEffect, useState } from 'react';
import {
  Wifi,
  CameraOff,
  Cpu,
  Terminal,
  ShieldCheck,
  Volume2,
  VolumeX,
  ShoppingBasket,
  CloudOff,
  Cloud,
} from 'lucide-react';
import { cx } from './ui';

interface EchoShowFrameProps {
  sessionId: string | null;
  isConnected: boolean;
  useLiveBedrock: boolean;
  onToggleBedrockMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  protocolLogCount: number;
  orbStatus?: 'idle' | 'listening' | 'thinking' | 'speaking';
  children: React.ReactNode;
}

export function EchoShowFrame({
  sessionId,
  isConnected,
  useLiveBedrock,
  onToggleBedrockMode,
  isMuted,
  onToggleMute,
  inspectorOpen,
  onToggleInspector,
  protocolLogCount,
  orbStatus = 'idle',
  children,
}: EchoShowFrameProps) {
  const [clockText, setClockText] = useState('');
  const [dateText, setDateText] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockText(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      setDateText(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, []);

  const isActive = orbStatus !== 'idle';

  return (
    <div className="aurora min-h-screen p-2 sm:p-4 lg:p-8 flex flex-col items-center justify-center">
      {/* Echo Show 15 Wall-Mount Bezel */}
      <div className="relative w-full max-w-[1600px] rounded-[34px] bg-gradient-to-b from-slate-700/60 to-slate-900/80 p-[10px] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9),0_0_80px_-20px_rgba(34,211,238,0.18)]">
        {/* Hardware camera lens */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[3px] h-1 w-1 -translate-x-1/2 rounded-full bg-slate-950 ring-1 ring-slate-600"
        />

        <div className="screen-grid relative flex flex-col overflow-hidden rounded-[26px] bg-surface ring-1 ring-white/10">
          {/* Top Hardware & Alexa+ Status Bar */}
          <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-surface/80 px-4 py-3 backdrop-blur-xl sm:px-5">
            {/* Left: Brand + Device Identity + Connection */}
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 shadow-glow-accent"
                >
                  <ShoppingBasket className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <div className="leading-tight">
                  <div className="text-base font-extrabold tracking-tight text-white">CartWeave</div>
                  <div className="flex items-center gap-1 text-xs text-fg-muted">
                    <CameraOff aria-hidden="true" className="h-3 w-3 text-emerald-400" />
                    Echo Show 15 · Kitchen
                  </div>
                </div>
              </div>

              <span aria-hidden="true" className="hidden h-8 w-px bg-white/10 sm:block" />

              <div
                role="status"
                aria-live="polite"
                className={cx(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset',
                  isConnected
                    ? 'bg-emerald-400/10 text-emerald-200 ring-emerald-400/25'
                    : 'bg-amber-400/10 text-amber-200 ring-amber-400/25'
                )}
              >
                <span className="relative flex h-2 w-2">
                  {isConnected && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  )}
                  <span
                    className={cx(
                      'relative inline-flex h-2 w-2 rounded-full',
                      isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                    )}
                  />
                </span>
                <span>
                  MCP 2025-11-25 · {isConnected ? 'Connected' : 'Connecting…'}
                </span>
              </div>

              {sessionId && (
                <div
                  title={`Active Mcp-Session-Id negotiated over POST /mcp: ${sessionId}`}
                  className="hidden xl:flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-slate-300 ring-1 ring-inset ring-white/10"
                >
                  <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-cyan-300" />
                  <span className="text-fg-muted">Session</span>
                  <span className="text-cyan-200">{sessionId.slice(0, 8)}…{sessionId.slice(-4)}</span>
                </div>
              )}
            </div>

            {/* Right: Orchestrator Segmented Control, Voice, Inspector & Clock */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Orchestrator mode"
                className="hidden md:flex items-center rounded-xl bg-white/[0.04] p-1 ring-1 ring-inset ring-white/10"
              >
                <button
                  type="button"
                  aria-pressed={!useLiveBedrock}
                  onClick={() => useLiveBedrock && onToggleBedrockMode()}
                  className={cx(
                    'flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors duration-200',
                    !useLiveBedrock
                      ? 'bg-indigo-500/25 text-indigo-100 ring-1 ring-inset ring-indigo-400/40'
                      : 'text-fg-muted hover:text-white'
                  )}
                >
                  <CloudOff aria-hidden="true" className="h-3.5 w-3.5" />
                  Mock Planner
                </button>
                <button
                  type="button"
                  aria-pressed={useLiveBedrock}
                  onClick={() => !useLiveBedrock && onToggleBedrockMode()}
                  className={cx(
                    'flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors duration-200',
                    useLiveBedrock
                      ? 'bg-amber-500/20 text-amber-100 ring-1 ring-inset ring-amber-400/40'
                      : 'text-fg-muted hover:text-white'
                  )}
                >
                  <Cloud aria-hidden="true" className="h-3.5 w-3.5" />
                  Live Bedrock
                </button>
              </div>

              {/* Compact orchestrator toggle on small screens */}
              <button
                type="button"
                onClick={onToggleBedrockMode}
                aria-label={`Orchestrator: ${useLiveBedrock ? 'Live AWS Bedrock' : 'Mock Offline Planner'}. Tap to switch.`}
                className="md:hidden flex min-h-10 items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 ring-1 ring-inset ring-white/10"
              >
                <Cpu aria-hidden="true" className="h-4 w-4" />
                {useLiveBedrock ? 'Bedrock' : 'Mock'}
              </button>

              <button
                type="button"
                onClick={onToggleMute}
                aria-pressed={!isMuted}
                aria-label={isMuted ? 'Enable Alexa voice output' : 'Mute Alexa voice output'}
                title="Toggle Alexa+ Web Speech TTS Voice Output"
                className={cx(
                  'flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset transition-colors duration-200',
                  isMuted
                    ? 'bg-white/[0.04] text-fg-muted ring-white/10 hover:text-white'
                    : 'bg-cyan-400/15 text-cyan-200 ring-cyan-400/30'
                )}
              >
                {isMuted ? (
                  <VolumeX aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Volume2 aria-hidden="true" className="h-4 w-4" />
                )}
              </button>

              <button
                type="button"
                onClick={onToggleInspector}
                aria-pressed={inspectorOpen}
                aria-controls="mcp-protocol-inspector"
                className={cx(
                  'flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold ring-1 ring-inset transition-colors duration-200',
                  inspectorOpen
                    ? 'bg-cyan-400/15 text-cyan-100 ring-cyan-400/40'
                    : 'bg-white/[0.04] text-slate-200 ring-white/10 hover:bg-white/[0.08]'
                )}
              >
                <Terminal aria-hidden="true" className="h-4 w-4" />
                <span className="hidden sm:inline">Inspector</span>
                <span className="tabular min-w-[1.5rem] rounded-md bg-cyan-400/20 px-1.5 py-0.5 text-center text-[11px] font-bold text-cyan-100">
                  {protocolLogCount}
                </span>
              </button>

              <div className="ml-1 hidden sm:flex flex-col items-end leading-tight">
                <span className="tabular text-lg font-bold tracking-tight text-white" suppressHydrationWarning>
                  {clockText}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-fg-muted" suppressHydrationWarning>
                  <Wifi aria-hidden="true" className="h-3 w-3 text-cyan-300" />
                  {dateText}
                </span>
              </div>
            </div>
          </header>

          {/* Main Split-Screen Content */}
          <div className="relative flex flex-1 flex-col">{children}</div>

          {/* Bottom Alexa+ Ambient Light Bar — animates while Alexa is active */}
          <div
            aria-hidden="true"
            className={cx(
              'h-1 w-full bg-[length:200%_100%] transition-opacity duration-500',
              isActive
                ? 'animate-shimmer bg-gradient-to-r from-indigo-500 via-cyan-300 to-indigo-500 opacity-100'
                : 'bg-gradient-to-r from-indigo-600/70 via-cyan-400/70 to-indigo-600/70 opacity-60'
            )}
          />
        </div>
      </div>
    </div>
  );
}
