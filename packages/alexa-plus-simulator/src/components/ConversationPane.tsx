'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, CheckCircle2, ArrowRight, Hand } from 'lucide-react';
import { AlexaVoiceOrb } from './AlexaVoiceOrb';
import { cx, SectionLabel } from './ui';

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
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Keep newest turn in view
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns.length, isBusy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isBusy) return;
    setInputText('');
    await onSendUtterance(trimmed);
  };

  return (
    <aside
      aria-label="Alexa conversation"
      className="w-full lg:w-[38%] xl:w-[36%] border-b lg:border-b-0 lg:border-r border-white/[0.06] bg-surface/40 p-4 sm:p-5 flex flex-col gap-4"
    >
      {/* Alexa+ Voice Orb */}
      <AlexaVoiceOrb
        status={orbStatus}
        onVoiceTranscript={(text) => {
          onSendUtterance(text);
        }}
      />

      {/* 4 One-Click Judge Demo Scenario Chips */}
      <section aria-labelledby="demo-scenarios-label" className="space-y-2.5">
        <SectionLabel
          icon={<Sparkles className="h-3.5 w-3.5" />}
          trailing={<span className="text-xs text-fg-muted">Stateful multi-turn MCP</span>}
        >
          <span id="demo-scenarios-label">Judge demo · tap in order</span>
        </SectionLabel>

        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
          {JUDGE_DEMO_SCENARIOS.map((chip, idx) => {
            const [, ...labelParts] = chip.stepLabel.split('. ');
            return (
              <li key={chip.id}>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onSendUtterance(chip.utterance)}
                  className="group glass flex h-full w-full items-start gap-3 rounded-2xl p-3 text-left transition-[background-color,border-color,box-shadow] duration-200 hover:border-cyan-400/40 hover:bg-cyan-400/[0.06] disabled:opacity-45"
                >
                  <span
                    aria-hidden="true"
                    className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 text-sm font-bold text-cyan-200 ring-1 ring-inset ring-cyan-400/30 transition-colors group-hover:bg-cyan-400 group-hover:text-slate-950"
                  >
                    {idx + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold text-white">
                      {labelParts.join('. ') || chip.stepLabel}
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-fg-muted opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-fg-muted">
                      “{chip.utterance}”
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Multi-turn Conversation Transcript */}
      <div
        ref={transcriptRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation transcript"
        className="min-h-[220px] flex-1 space-y-3 overflow-y-auto pr-1 lg:max-h-[420px]"
      >
        {turns.map((turn) => {
          const isUser = turn.role === 'user';
          const isTouch = isUser && turn.text.startsWith('[Touch Action]');
          const text = isTouch ? turn.text.replace('[Touch Action] ', '') : turn.text;
          return (
            <div
              key={turn.id}
              className={cx('flex animate-fade-up gap-2.5', isUser ? 'justify-end' : 'justify-start')}
            >
              {!isUser && (
                <span
                  aria-hidden="true"
                  className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-white"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
              )}
              <div
                className={cx(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  isUser
                    ? 'rounded-br-md bg-indigo-500/20 text-indigo-50 ring-1 ring-inset ring-indigo-400/30'
                    : 'glass rounded-bl-md text-slate-100'
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <span className={cx('font-semibold', isUser ? 'text-indigo-200' : 'text-cyan-300')}>
                    {isUser ? 'You' : 'Alexa+'}
                  </span>
                  <span className="tabular text-fg-muted">{turn.timestamp}</span>
                </div>
                {isTouch && (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-indigo-200">
                    <Hand aria-hidden="true" className="h-3 w-3" />
                    Touch action
                  </span>
                )}
                <p>{text}</p>
                {turn.toolsInvoked && turn.toolsInvoked.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-2.5">
                    {turn.toolsInvoked.map((tool, i) => (
                      <span
                        key={`${tool}-${i}`}
                        className="inline-flex items-center gap-1 rounded-md bg-cyan-400/10 px-2 py-0.5 font-mono text-[11px] text-cyan-200 ring-1 ring-inset ring-cyan-400/20"
                      >
                        <CheckCircle2 aria-hidden="true" className="h-3 w-3 text-emerald-400" />
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator while tools are running */}
        {isBusy && (
          <div className="flex animate-fade-up items-center gap-2.5" aria-label="Alexa is working">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 text-white"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="glass flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-cyan-300"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Utterance Input Box */}
      <form onSubmit={handleSubmit} className="glass flex items-center gap-2 rounded-2xl p-1.5">
        <label htmlFor="alexa-utterance" className="sr-only">
          Ask Alexa+
        </label>
        <input
          id="alexa-utterance"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isBusy}
          autoComplete="off"
          placeholder="Ask about expiring items, macros, or store prices…"
          className="min-h-11 flex-1 rounded-xl bg-transparent px-3 text-sm text-white placeholder:text-fg-muted focus:outline-none focus-visible:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isBusy || !inputText.trim()}
          aria-label="Send to Alexa"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent shadow-glow-accent transition-[background-color,opacity] duration-200 hover:bg-emerald-400 disabled:opacity-35 disabled:shadow-none"
        >
          <Send aria-hidden="true" className="h-4 w-4" />
        </button>
      </form>
    </aside>
  );
}
