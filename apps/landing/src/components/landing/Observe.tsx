'use client';

import { useState } from 'react';

type ExecutionStep = {
  id: string;
  kind: string;
  label: string;
  value: string;
  meta: string;
  detail: string;
  facts: { k: string; v: string }[];
};

const executionSteps: ExecutionStep[] = [
  {
    id: 'message',
    kind: 'Message',
    label: 'Message',
    value: 'Necesito 30 camisetas blancas.',
    meta: '10:24',
    detail:
      'Inbound customer message received and normalized by the messaging pipeline.',
    facts: [
      { k: 'Channel', v: 'whatsapp' },
      { k: 'Message ID', v: 'msg_8f21' },
      { k: 'Pipeline', v: 'normalized' },
    ],
  },
  {
    id: 'intent',
    kind: 'Intent',
    label: 'Intent',
    value: 'place_order',
    meta: '10:24',
    detail:
      'The Agent identified the customer goal and prepared the execution path.',
    facts: [
      { k: 'Confidence', v: '0.97' },
      { k: 'Execution path', v: 'prepared' },
    ],
  },
  {
    id: 'skill',
    kind: 'Skill',
    label: 'Skill',
    value: 'sales-assistant@1.1.1',
    meta: '10:24',
    detail:
      'The versioned Skill defines the commercial behavior used for this execution.',
    facts: [
      { k: 'Version', v: '1.1.1' },
      { k: 'Policy check', v: 'passed' },
    ],
  },
  {
    id: 'search',
    kind: 'Tool',
    label: 'Tool',
    value: 'products.search',
    meta: '13ms',
    detail:
      'The Agent searched the product catalog before creating the quote.',
    facts: [
      { k: 'Duration', v: '13ms' },
      { k: 'Operation', v: 'Product lookup' },
      { k: 'Result', v: '48 items found' },
    ],
  },
  {
    id: 'quote',
    kind: 'Tool',
    label: 'Tool',
    value: 'quotes.create',
    meta: '18ms',
    detail:
      'The Agent created the quote using the selected product and requested quantity.',
    facts: [
      { k: 'Duration', v: '18ms' },
      { k: 'Input', v: 'quantity: 30' },
      { k: 'Result', v: '201 CREATED' },
    ],
  },
  {
    id: 'result',
    kind: 'Result',
    label: 'Result',
    value: 'COT-2026-000052',
    meta: 'created',
    detail:
      'A real execution result produced a persisted quotation identifier.',
    facts: [
      { k: 'Status', v: 'Created' },
      { k: 'Execution', v: 'Completed' },
    ],
  },
  {
    id: 'response',
    kind: 'Response',
    label: 'Response',
    value: 'sent',
    meta: 'complete',
    detail:
      'The Agent generated the customer-facing response after tool execution.',
    facts: [
      { k: 'Channel', v: 'whatsapp' },
      { k: 'Delivery', v: 'delivered' },
    ],
  },
];

const kindColor: Record<string, string> = {
  Tool: 'text-blue-300',
  Result: 'text-emerald-300',
};

function ExecutionTrace({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const selectedStep =
    executionSteps.find((step) => step.id === selectedId) ??
    executionSteps[0];

  return (
    <div className="mt-12 overflow-hidden rounded-2xl border border-blue-400/15 bg-slate-950/60 shadow-[0_0_80px_rgba(37,99,235,0.06)]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping motion-reduce:animate-none" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>

          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
            Example execution
          </span>
        </div>

        <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
          Complete
        </span>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-5 sm:p-7">
          <div className="relative">
            <div
              className="absolute bottom-3 left-[10px] top-3 w-px bg-white/10"
              aria-hidden="true"
            />

            <div className="space-y-1">
              {executionSteps.map((step) => {
                const active = selectedId === step.id;
                const isResult = step.id === 'result' || step.id === 'response';

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => onSelect(step.id)}
                    aria-pressed={active}
                    className={[
                      'group relative flex w-full items-start gap-4 rounded-xl p-3 text-left',
                      'transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50',
                      active ? 'bg-blue-400/[0.07]' : 'hover:bg-white/[0.025]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'relative z-10 mt-1 grid h-[21px] w-[21px] shrink-0 place-items-center rounded-full border',
                        active
                          ? 'border-blue-400/70 bg-blue-400/15'
                          : isResult
                            ? 'border-emerald-400/30 bg-emerald-400/[0.04]'
                            : 'border-white/10 bg-slate-950',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      <span
                        className={[
                          'h-1.5 w-1.5 rounded-full',
                          active
                            ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.85)]'
                            : isResult
                              ? 'bg-emerald-400'
                              : 'bg-slate-500',
                        ].join(' ')}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={[
                            'text-sm font-medium',
                            active ? 'text-white' : 'text-slate-300 group-hover:text-white',
                          ].join(' ')}
                        >
                          {step.label}
                        </span>

                        <span className="font-mono text-[10px] text-slate-600">
                          {step.meta}
                        </span>
                      </span>

                      <span
                        className={[
                          'mt-1 block font-mono text-xs',
                          active ? 'text-blue-300' : 'text-slate-500',
                        ].join(' ')}
                      >
                        {step.value}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-white/[0.015] p-5 lg:border-l lg:border-t-0 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  kindColor[selectedStep.kind] ?? 'text-slate-600'
                }`}
              >
                {selectedStep.kind}
              </p>

              <h3 className="mt-2 break-words font-mono text-lg font-semibold text-white">
                {selectedStep.value}
              </h3>
            </div>

            <span className="shrink-0 rounded-full border border-blue-400/15 bg-blue-400/[0.04] px-3 py-1 font-mono text-[10px] text-blue-300">
              {selectedStep.meta}
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="space-y-2">
              {selectedStep.facts.map((fact) => (
                <div key={fact.k} className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-600">{fact.k}</span>
                  <span className="text-right font-mono text-slate-300">{fact.v}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-400">{selectedStep.detail}</p>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            Traced by RELT Agent Execution
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/15 px-5 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 font-mono text-[11px] uppercase tracking-[0.14em] sm:flex-nowrap">
          {executionSteps.map((step, index) => (
            <span key={step.id} className="flex items-center gap-3">
              <span className={selectedId === step.id ? 'text-blue-300' : 'text-slate-600'}>
                {step.label}
              </span>

              {index < executionSteps.length - 1 && <span className="text-slate-700">→</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
  accent = false,
}: {
  label: string;
  value: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <article
      className="
        rounded-2xl
        border border-white/10
        bg-slate-900/65
        p-6
        transition-all duration-300
        hover:-translate-y-1
        hover:border-white/15
        hover:bg-slate-900/85
        motion-reduce:transform-none
        motion-reduce:transition-none
      "
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        {label}
      </div>

      <div
        className={['mt-3 text-3xl font-semibold', accent ? 'text-blue-300' : 'text-white'].join(' ')}
      >
        {value}
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}

export default function Observe() {
  const [selectedId, setSelectedId] = useState<string>('message');

  return (
    <section
      id="observe"
      className="border-t border-white/10 py-24 lg:py-28"
      aria-labelledby="observe-title"
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
              Observe
            </p>

            <h2
              id="observe-title"
              className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl"
            >
          



               See what your <span className="text-blue-500">Agents </span>are doing in <span className="text-blue-500">Production. </span>  {' '}
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
              Trace every Agent run from intent to action, result and response.
            </p>
          </div>

        
      
        
        </div>

        <ExecutionTrace selectedId={selectedId} onSelect={setSelectedId} />

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <MetricCard
            label="API"
            value="100%"
            description="Latest observed production availability."
          />

          <MetricCard
            label="API p95"
            value="~10ms"
            description="Latest observed control-plane latency."
          />

          <MetricCard
            label="Telemetry"
            value="Prometheus"
            description="SLOs, alerts and execution telemetry."
            accent
          />
        </div>
      </div>
    </section>
  );
}
