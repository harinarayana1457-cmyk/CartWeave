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
} from 'lucide-react';

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
  children,
}: EchoShowFrameProps) {
  const [clockText, setClockText] = useState('6:15 PM');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockText(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#040710] p-2 sm:p-4 lg:p-6 flex flex-col items-center justify-center">
      {/* Echo Show 15 Wall-Mount Aluminum & Matte White/Dark Bezel */}
      <div className="w-full max-w-[1560px] rounded-[28px] border-[10px] border-slate-800/95 bg-[#090D1A] shadow-[0_0_80px_rgba(0,202,255,0.12)] ring-1 ring-white/10 overflow-hidden flex flex-col">
        {/* Top Hardware & Alexa+ Status Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 bg-[#070B14]/95 px-4 py-2.5 text-xs">
          {/* Left: Hardware Camera Shutter + Device Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900 px-2.5 py-1 text-slate-300">
              <CameraOff className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-medium">Echo Show 15 • Kitchen Wall</span>
            </div>

            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium border ${
                isConnected
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span>
                MCP 2025-11-25 Streamable HTTP •{' '}
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>

            {sessionId && (
              <div
                title="Active Mcp-Session-Id negotiated over POST /mcp"
                className="hidden xl:flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 font-mono text-[11px] text-cyan-300"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Mcp-Session-Id: {sessionId.slice(0, 22)}...</span>
              </div>
            )}
          </div>

          {/* Right: Bedrock Mode Toggle, TTS Mute, Protocol Inspector Toggle & Clock */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleBedrockMode}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium transition ${
                useLiveBedrock
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                  : 'border-indigo-500/40 bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/25'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>
                Orchestrator:{' '}
                <strong>
                  {useLiveBedrock ? 'Live AWS Bedrock' : 'Mock Offline Planner'}
                </strong>
              </span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              title="Toggle Alexa+ Web Speech TTS Voice Output"
              className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-300 hover:bg-slate-800"
            >
              {isMuted ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                  <span>Voice Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>TTS Active</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleInspector}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold transition ${
                inspectorOpen
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-cyan-500/40 bg-slate-900 text-cyan-300 hover:bg-cyan-950/50'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Protocol Inspector</span>
              <span className="rounded-full bg-cyan-500/30 px-1.5 py-0.2 text-[10px] text-white">
                {protocolLogCount}
              </span>
            </button>

            <div className="flex items-center gap-2 pl-1 text-slate-300 font-medium">
              <Wifi className="h-3.5 w-3.5 text-cyan-400" />
              <span>{clockText}</span>
            </div>
          </div>
        </header>

        {/* Main Split-Screen Content */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Bottom Alexa+ Ambient Light Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-cyan-400 to-indigo-600 opacity-85" />
      </div>
    </div>
  );
}
