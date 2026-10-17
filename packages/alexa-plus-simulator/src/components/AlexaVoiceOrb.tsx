'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';

interface AlexaVoiceOrbProps {
  status: 'idle' | 'listening' | 'thinking' | 'speaking';
  onVoiceTranscript: (transcript: string) => void;
}

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

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-[#0B1328] via-[#111B38] to-[#0B1328] p-3.5">
      <div className="flex items-center gap-3.5">
        {/* Animated Glowing Cyan/Indigo Alexa+ Orb */}
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-violet-500 blur-md transition-all duration-500 ${
              activeState === 'idle'
                ? 'opacity-45 scale-95'
                : 'opacity-95 scale-110 animate-pulse'
            }`}
          />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-inner ring-2 ring-white/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">
              Alexa+ Kitchen Concierge
            </span>
            <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
              {activeState === 'thinking'
                ? 'Invoking MCP Tools...'
                : activeState === 'speaking'
                ? 'Speaking...'
                : activeState === 'listening'
                ? 'Listening...'
                : 'Ready'}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            “Alexa, scan my expiring pantry items &amp; compare grocery carts”
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleMicToggle}
        title="Speak to Alexa+ (Web Speech API)"
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
          isListeningMic
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
            : 'border border-cyan-500/40 bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/25'
        }`}
      >
        {isListeningMic ? (
          <>
            <MicOff className="h-4 w-4" />
            <span>Stop</span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            <span>Push to Talk</span>
          </>
        )}
      </button>
    </div>
  );
}
