'use client';

import { useEffect, useState } from 'react';

type Step = {
  title: string;
  detail: string;
  tool: string;
  code: string;
};

// 6 líneas exactas, máx ~30 caracteres por línea: no se envuelven, no brincan.
const STEPS: Step[] = [
  {
    title: 'Intent detected',
    detail: 'place_order',
    tool: 'intent.classify',
    code: `POST /v1/intents/classify
{ "message":
  "30 camisetas blancas" }

→ intent: place_order
→ confidence: 0.97`,
  },
  {
    title: 'Skill selected',
    detail: 'sales-assistant@1.1.1',
    tool: 'sales-assistant@1.1.1',
    code: `SELECT skill FROM runtime
WHERE name =
  'sales-assistant@1.1.1'

→ policy check: passed
→ guardrails: ok`,
  },
  {
    title: 'products.search',
    detail: '13ms',
    tool: 'products.search',
    code: `POST /v1/products/search
{ "query": "camisetas",
  "limit": 50 }

→ 200 OK · 48 items
→ 13ms`,
  },
  {
    title: 'quotes.create',
    detail: '18ms',
    tool: 'quotes.create',
    code: `POST /v1/quotes
{ "customer": "cus_1024",
  "quantity": 30 }

→ 201 CREATED
→ 18ms`,
  },
  {
    title: 'Quote created',
    detail: 'COT-2026-000052',
    tool: 'runtime.result',
    code: `RESULT QUOTE_CREATED
{ "quote_id":
  "COT-2026-000052",
  "status": "ready" }

→ trace stored`,
  },
  {
    title: 'Agent response',
    detail: 'sent',
    tool: 'whatsapp.send',
    code: `POST /v1/messages/send
{ "to": "customer",
  "text": "lista ✓" }

→ 200 OK
→ delivered`,
  },
];

const TRACE = [
  { label: 'Message', threshold: 0, lit: '◉', color: 'text-emerald-300' },
  { label: 'Intent', threshold: 0, lit: '●', color: 'text-blue-300' },
  { label: 'Skill', threshold: 1, lit: '●', color: 'text-blue-300' },
  { label: 'Tool', threshold: 2, lit: '●', color: 'text-blue-300' },
  { label: 'Result', threshold: 4, lit: '✓', color: 'text-emerald-300' },
  { label: 'Response', threshold: 5, lit: '✓', color: 'text-emerald-300' },
];

const LAST = STEPS.length - 1;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" className={className} aria-hidden="true">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
    </svg>
  );
}

function WhatsAppPanel({ done }: { done: boolean }) {
  return (
    <section
      aria-label="WhatsApp conversation"
      className="flex flex-col border-b border-white/10 lg:border-b-0 lg:border-r"
    >
      {/* Header estilo WhatsApp */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-semibold text-slate-100">Customer</div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Online
            </div>
          </div>
        </div>
        <span className="text-[11px] text-slate-500">Now</span>
      </div>

      {/* Viewport de chat: altura fija, anclado abajo como un chat real */}
      <div className="relative min-h-[268px] flex-1 overflow-hidden bg-[#0b141a] px-4 py-3">

        <div className="flex h-full flex-col gap-2">
          <span className="self-center rounded-full bg-slate-900/70 px-2.5 py-0.5 text-[10px] text-slate-500">Today</span>
          <div className="w-fit max-w-[85%] rounded-xl rounded-tl-sm bg-[#1f2c33] px-3.5 py-2.5">
            <p className="text-sm leading-6 text-slate-100">Necesito 30 Camisetas Blancas.</p>
            <div className="mt-0.5 text-right text-[10px] text-slate-500">10:24</div>
          </div>

          {!done && (
            <div className="flex w-fit items-center gap-2.5 rounded-xl rounded-tl-sm bg-[#1f2c33] px-3.5 py-3">
              <span className="flex gap-1" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-300" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-300 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-300 [animation-delay:300ms]" />
              </span>
              <span className="whitespace-nowrap text-xs text-blue-300">Agent is processing…</span>
            </div>
          )}

          {done && (
            <div className="ml-auto w-fit max-w-[85%] rounded-xl rounded-tr-sm bg-blue-600 px-3.5 py-2.5 shadow-[0_0_18px_rgba(59,130,246,0.25)]">
              <div className="mb-1 text-[11px] font-semibold text-blue-100">RELT Agent</div>
              <p className="text-sm leading-6 text-white">
                Tu cotización está lista🧐. ¿Deseas proceder con el pedido?
              </p>
              <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-blue-200">
                10:24
                <svg
                  viewBox="0 0 16 12"
                  className="h-3 w-3.5 text-sky-300"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m1.5 6.5 3 3L10 3.5" />
                  <path d="m6.5 9.5 3-3L15 3.5" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barra de input estilo WhatsApp */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-slate-900/60 px-3 py-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <WhatsAppIcon className="h-4 w-4" />
        </span>
        <div className="flex flex-1 items-center justify-between rounded-full bg-slate-950/80 px-4 py-2">
          <span className="truncate whitespace-nowrap text-xs text-slate-500">Type a message…</span>
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m22 2-7 20-4-9-9-4z" />
            <path d="M22 2 11 13" />
          </svg>
        </span>
      </div>

      {/* Strip dev discreto */}
    </section>
  );
}

export default function AgentDemo() {
  const [step, setStep] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduced) {
      setStep(LAST);
      return;
    }
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const tick = (current: number) => {
      if (!alive) return;
      if (current < LAST) {
        t = setTimeout(() => {
          setStep(current + 1);
          tick(current + 1);
        }, 900);
      } else {
        t = setTimeout(() => {
          setStep(0);
          tick(0);
        }, 4200);
      }
    };
    tick(0);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [reduced, replayKey]);

  const current = STEPS[step];
  const done = step === LAST;

  return (
    <section
      id="agent-demo"
      aria-labelledby="agent-demo-title"
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_0_36px_rgba(37,99,235,0.22)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_20%,rgba(37,99,235,0.15),transparent_35%)]" />

      <header className="relative flex items-center justify-between border-b border-white/10 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden="true" />
          <h2 id="agent-demo-title" className="ml-3 text-xs font-semibold tracking-wide text-slate-300 sm:text-sm">
            REAL AGENT DEMO
          </h2>
        </div>
        <div
          className={`flex min-w-[96px] items-center justify-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${
            done
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
              : 'border-blue-400/30 bg-blue-400/10 text-blue-300'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${done ? 'bg-emerald-300' : 'animate-pulse bg-blue-300'}`}
            aria-hidden="true"
          />
          {done ? 'Completed' : 'Live'}
        </div>
      </header>

      <div className="relative grid lg:grid-cols-[0.95fr_1.05fr_1.05fr]">
        <WhatsAppPanel done={done} />

        {/* Timeline */}
        <section aria-label="Execution flow" className="border-b border-white/10 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Flow</h3>
            <span
              className={`min-w-[88px] rounded-full border px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                done
                  ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                  : 'border-blue-400/20 bg-blue-400/10 text-blue-300'
              }`}
            >
              {done ? 'Completed' : 'Running'}
            </span>
          </div>

          <ol aria-live="polite" className="relative space-y-1">
            <div className="absolute bottom-5 left-[13px] top-5 w-px bg-gradient-to-b from-blue-500/80 to-blue-500/15" aria-hidden="true" />
            {STEPS.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'active' : 'pending';
              return (
                <li
                  key={s.title}
                  className={`relative flex gap-3 rounded-xl p-2 transition-colors duration-300 ${
                    state === 'active' ? 'bg-blue-400/10 ring-1 ring-blue-400/20' : ''
                  }`}
                >
                  <span
                    className={`relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs transition-colors duration-300 ${
                      state === 'done'
                        ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                        : state === 'active'
                          ? 'animate-pulse-blue border-blue-400/50 bg-blue-500/20 text-blue-200'
                          : 'border-white/15 bg-slate-900 text-slate-500'
                    }`}
                    aria-hidden="true"
                  >
                    {state === 'done' ? '✓' : state === 'active' ? '●' : '○'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`truncate text-sm font-medium transition-colors duration-300 ${
                          state === 'done' ? 'text-slate-200' : state === 'active' ? 'text-slate-100' : 'text-slate-400'
                        }`}
                      >
                        {s.title}
                      </span>
                      <span className={`shrink-0 text-[11px] transition-colors duration-300 ${state === 'pending' ? 'text-slate-600' : 'text-slate-500'}`}>
                        {state === 'pending' ? '—' : '10:24'}
                      </span>
                    </div>
                    <p
                      className={`mt-0.5 truncate font-mono text-[11px] transition-colors duration-300 ${
                        state === 'active' ? 'text-blue-300' : state === 'done' ? 'text-slate-500' : 'text-slate-600'
                      }`}
                    >
                      {s.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Detail */}
        <section aria-label="Execution detail" className="bg-slate-950/50 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Detail</h3>
            <span
              className={`min-w-[88px] rounded-full border px-2 py-1 text-center text-[10px] font-semibold transition-colors duration-300 ${
                done
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  : 'border-blue-400/30 bg-blue-400/10 text-blue-300'
              }`}
            >
              {done ? 'COMPLETED' : 'ACTIVE'}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-[11px] leading-6 text-slate-400">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <span className="truncate font-semibold text-blue-300">{current.tool}</span>
              <span className={`shrink-0 transition-colors duration-300 ${done ? 'text-emerald-300' : 'text-blue-300'}`}>
                {done ? '✓ SUCCESS' : '● RUNNING'}
              </span>
            </div>
            <pre className="h-36 overflow-hidden whitespace-pre">{current.code}</pre>
            <div className="mt-4 border-t border-white/10 pt-3 text-emerald-300">→ Agent runtime connected</div>
          </div>

          <button
            type="button"
            onClick={() => {
              setStep(0);
              setReplayKey((k) => k + 1);
            }}
            className="mt-5 w-full rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-400"
          >
            Replay execution
          </button>
        </section>
      </div>

      <footer aria-label="Execution trace summary" className="relative border-t border-white/10 bg-black/20 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-y-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
          {TRACE.map((t, i) => {
            const lit = step >= t.threshold;
            return (
              <div key={t.label} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 transition-colors duration-300 ${lit ? 'text-slate-300' : 'text-slate-600'}`}>
                  <span className={lit ? t.color : 'text-slate-600'} aria-hidden="true">
                    {lit ? t.lit : '○'}
                  </span>
                  <span>{t.label}</span>
                  <small className="inline-block w-14 font-mono normal-case text-slate-500">{lit ? '10:24' : 'pending'}</small>
                </div>
                {i < TRACE.length - 1 && <span className="hidden text-blue-400 sm:inline">→</span>}
              </div>
            );
          })}
        </div>
      </footer>
    </section>
  );
}
