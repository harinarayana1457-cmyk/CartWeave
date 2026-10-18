'use client';

import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cx } from './ui';

interface AlexaVoiceOrbProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  onVoiceTranscript: (transcript: string) => void;
}

const STATUS_COPY: Record<AlexaVoiceOrbProps['status'], { label: string; hint: string }> = {
  idle: { label: 'Ready', hint: 'Say “Alexa, what’s expiring in my fridge?”' },
  listening: { label: 'Listening…', hint: 'Go ahead, I’m listening.' },
  thinking: { label: 'Invoking MCP tools…', hint: 'Chaining CartWeave tools on your session.' },
  speaking: { label: 'Speaking…', hint: 'Reading your plan aloud.' },
};

export function AlexaVoiceOrb({
  status,
  onVoiceTranscript,
}: AlexaVoiceOrbProps) {
  const [isListeningMic, setIsListeningMic] = useState(false);

  const handleMicToggle = () => {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onVoiceTranscript(
        'Scan my pantry for expiring items and plan 3 high-protein vegetarian dinners under $38.'
      );
      return;
    }

    if (isListeningMic) {
      setIsListeningMic(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningMic(true);
      recognition.onresult = (event: {
        results: Array<Array<{ transcript: string }>>;
      }) => {
        const text = event.results?.[0]?.[0]?.transcript;
        setIsListeningMic(false);
        if (text) {
          onVoiceTranscript(text);
        }
      };
      recognition.onerror = () => {
        setIsListeningMic(false);
      };
      recognition.onend = () => {
        setIsListeningMic(false);
      };
      recognition.start();
    } catch {
      setIsListeningMic(false);
    }
  };

  const activeState = isListeningMic ? 'listening' : status;
  const isActive = activeState !== 'idle';
  const copy = STATUS_COPY[activeState];

  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-4">
      <div
        aria-hidden="true"
        className={cx(
          'pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full blur-3xl transition-opacity duration-700',
          isActive ? 'bg-cyan-400/25 opacity-100' : 'bg-cyan-400/10 opacity-70'
        )}
      />

      <div className="relative flex items-center gap-4">
        {/* Animated Alexa+ Orb */}
        <div aria-hidden="true" className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <div
            className={cx(
              'absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#22d3ee,#6366f1,#a855f7,#22d3ee)] blur-[6px]',
              activeState === 'thinking' ? 'animate-spin-fast opacity-100' : 'animate-spin-slow',
              isActive ? 'opacity-100' : 'opacity-55'
            )}
          />
          <div className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-surface ring-1 ring-white/20">
            {/* Voice waveform bars */}
            <div className="flex h-6 items-center gap-[3px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={cx(
                    'w-[3px] origin-center rounded-full bg-gradient-to-b from-cyan-300 to-indigo-400',
                    activeState === 'speaking' || activeState === 'listening'
                      ? 'h-6 animate-wave'
                      : activeState === 'thinking'
                      ? 'h-3 animate-pulse'
                      : 'h-2'
                  )}
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white">Alexa+ Kitchen Concierge</span>
          </div>
          <p role="status" aria-live="polite" className="mt-0.5 text-sm font-semibold text-cyan-300">
            {copy.label}
          </p>
          <p className="mt-0.5 truncate text-xs text-fg-muted">{copy.hint}</p>
        </div>

        <button
          type="button"
          onClick={handleMicToggle}
          aria-pressed={isListeningMic}
          aria-label={isListeningMic ? 'Stop listening' : 'Push to talk to Alexa'}
          title="Speak to Alexa+ (Web Speech API)"
          className={cx(
            'relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow,transform] duration-200 ease-out-expo active:scale-95',
            isListeningMic
              ? 'bg-rose-500 text-white shadow-[0_0_0_6px_rgba(244,63,94,0.2)]'
              : 'bg-gradient-to-br from-cyan-400 to-indigo-500 text-white shadow-glow hover:brightness-110'
          )}
        >
          {isListeningMic && (
            <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-rose-500/40" />
          )}
          {isListeningMic ? (
            <MicOff aria-hidden="true" className="relative h-6 w-6" />
          ) : (
            <Mic aria-hidden="true" className="relative h-6 w-6" />
          )}
        </button>
      </div>
    </div>
  );
}
