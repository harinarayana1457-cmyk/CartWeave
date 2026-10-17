'use client';

import React, { useState } from 'react';
import { Send, Sparkles, Play, CheckCircle2 } from 'lucide-react';
import { AlexaVoiceOrb } from './AlexaVoiceOrb';

export interface ChatTurn {
  id: string;
  role: 'user' | 'alexa';
  text: string;
  timestamp: string;
  toolsInvoked?: string[];
}

export const JUDGE_DEMO_SCENARIOS = [
  {
    id: 'scenario-1',
    stepLabel: '1. Pantry + 3-Day Meal Plan',
    utterance:
      'Scan my pantry for expiring items and plan 3 high-protein vegetarian dinners under $38.',
  },
  {
    id: 'scenario-2',
    stepLabel: '2. 3-Store Price Arbitrage',
    utterance:
      'Compare Amazon Fresh vs. Whole Foods for the missing ingredients.',
  },
  {
    id: 'scenario-3',
    stepLabel: '3. Dairy-Free <520 kcal Swap',
    utterance:
      'Swap Day 2 for a dairy-free dish under 520 calories and recalculate.',
  },
  {
    id: 'scenario-4',
    stepLabel: '4. One-Tap Smart Checkout',
    utterance:
      'Checkout the Amazon Fresh basket for the 6:00 PM – 7:00 PM delivery window.',
  },
];

interface ConversationPaneProps {
  turns: ChatTurn[];
  orbStatus: 'idle' | 'listening' | 'thinking' | 'speaking';
  onSendUtterance: (utterance: string) => Promise<void>;
  isBusy: boolean;
}

export function ConversationPane({
  turns,
  orbStatus,
  onSendUtterance,
  isBusy,
}: ConversationPaneProps) {
  const [inputText, setInputText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isBusy) return;
    setInputText('');
    await onSendUtterance(trimmed);
  };

  return (
    <aside className="w-full lg:w-[36%] border-b lg:border-b-0 lg:border-r border-slate-800/90 bg-[#080D1A] p-4 flex flex-col justify-between gap-4">
      <div className="space-y-3.5 flex-1 flex flex-col min-h-0">
        {/* Alexa+ Voice Orb */}
        <AlexaVoiceOrb
          status={orbStatus}
          onVoiceTranscript={(text) => {
            onSendUtterance(text);
          }}
        />

        {/* 4 One-Click Judge Demo Scenario Chips */}
        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              One-Click Judge Demo Scenarios
            </span>
            <span className="text-[10px] text-slate-400">
              Stateful Multi-Turn MCP
            </span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {JUDGE_DEMO_SCENARIOS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                disabled={isBusy}
                onClick={() => onSendUtterance(chip.utterance)}
                className="group flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-left text-xs transition hover:border-cyan-500/50 hover:bg-cyan-950/25 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition" />
                <div>
                  <div className="font-semibold text-cyan-300 text-[11px]">
                    {chip.stepLabel}
                  </div>
                  <div className="text-slate-200 line-clamp-2">
                    “{chip.utterance}”
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Multi-turn Conversation Transcript */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[340px] lg:max-h-[390px]">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`rounded-2xl p-3 text-xs leading-relaxed ${
                turn.role === 'user'
                  ? 'ml-6 border border-indigo-500/30 bg-indigo-950/40 text-indigo-100'
                  : 'mr-4 border border-cyan-500/25 bg-slate-900/90 text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-cyan-300">
                  {turn.role === 'user' ? 'Household Member' : 'Alexa+ (CartWeave)'}
                </span>
                <span>{turn.timestamp}</span>
              </div>
              <p>{turn.text}</p>
              {turn.toolsInvoked && turn.toolsInvoked.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-800/80">
                  {turn.toolsInvoked.map((tool, i) => (
                    <span
                      key={`${tool}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md bg-cyan-500/15 px-2 py-0.5 font-mono text-[10px] text-cyan-300 border border-cyan-500/30"
                    >
                      <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Utterance Input Box */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isBusy}
          placeholder="Ask Alexa+ about expiring pantry items, macros, or store prices..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isBusy || !inputText.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:opacity-95 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Send</span>
        </button>
      </form>
    </aside>
  );
}
