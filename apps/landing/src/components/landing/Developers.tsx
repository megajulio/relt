'use client';

import { useState } from 'react';

type DeveloperItem = {
  title: string;
  state: 'Available' | 'Preview' | 'Roadmap';
  text: string;
};

const developerItems: DeveloperItem[] = [
  {
    title: 'API',
    state: 'Available',
    text: 'Send and receive WhatsApp messages through one API.',
  },
  {
    title: 'Webhooks',
    state: 'Available',
    text: 'Receive reliable event delivery from your conversations.',
  },
  {
    title: 'SDK',
    state: 'Preview',
    text: 'Build integrations directly into your application.',
  },
  {
    title: 'n8n',
    state: 'Roadmap',
    text: 'Connect RELT workflows to your automation stack.',
  },
  {
    title: 'MCP',
    state: 'Roadmap',
    text: 'Extend your development workflow with RELT tools.',
  },
  {
    title: 'Embeds',
    state: 'Roadmap',
    text: 'Bring RELT capabilities directly into your product.',
  },
];

const developerExamples: Record<
  string,
  {
    label: string;
    language: string;
    description: string;
    highlights: string[];
    code: string;
  }
> = {
  API: {
    label: 'Send a WhatsApp message',
    language: 'HTTP · JSON',
    description: 'Send messages directly through the RELT API.',
    highlights: ['POST /v1/messages', 'JSON request / response', 'Bearer token auth'],
    code: `POST https://api.relt.dev/v1/messages

Authorization: Bearer \${RELT_API_KEY}
Content-Type: application/json

{
  "to": "+573001234567",
  "text": "Hello from RELT"
}`,
  },

  Webhooks: {
    label: 'Receive an event',
    language: 'Webhooks',
    description: 'Receive conversation and messaging events in your application.',
    highlights: ['X-Webhook-Signature header', 'message.received events', 'conversationId + messageId refs'],
    code: `POST /webhooks/relt

X-Webhook-Signature: <signature>

{
  "event": "message.received",
  "conversationId": "conv_123",
  "messageId": "msg_456"
}`,
  },

  SDK: {
    label: 'SDK integration',
    language: 'TypeScript · Node.js',
    description: 'Use the RELT SDK to integrate messaging into your application.',
    highlights: ['Typed TypeScript client', 'relt.messages.send()', 'Node.js runtime'],
    code: `import { Relt } from '@relt/sdk';

const relt = new Relt({
  apiKey: process.env.RELT_API_KEY,
});

const result = await relt.messages.send({
  to: '+573001234567',
  text: 'Hello from RELT',
});

console.log(result.id);`,
  },

  n8n: {
    label: 'Workflow automation',
    language: 'n8n',
    description: 'Connect RELT events and actions to automation workflows.',
    highlights: ['Webhook-triggered workflows', 'RELT events as workflow inputs', 'Downstream business actions'],
    code: `RELT
  ↓
Webhook
  ↓
n8n
  ↓
Your workflow
  ↓
Business action`,
  },
  MCP: {
    label: 'Developer tools',
    language: 'MCP',
    description: 'Expose RELT capabilities to supported development agents.',
    highlights: ['RELT tools exposed over MCP', 'Agent-initiated calls', 'Dev-workflow integration'],
    code: `Agent
  ↓
MCP
  ↓
RELT tools
  ↓
Messages
  ↓
Business systems`,
  },

  Embeds: {
    label: 'Embedded experience',
    language: 'Platform',
    description: 'Bring RELT capabilities directly into your own product.',
    highlights: ['In-product agent experiences', 'WhatsApp delivery underneath', 'Customer-facing flows'],
    code: `Your product
  ↓
Embedded RELT experience
  ↓
Agent
  ↓
WhatsApp
  ↓
Customer`,
  },
};

function StateBadge({
  state,
}: {
  state: DeveloperItem['state'];
}) {
  const styles = {
    Available:
      'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
    Preview:
      'border-blue-400/20 bg-blue-400/10 text-blue-300',
    Roadmap:
      'border-white/10 bg-white/[0.02] text-slate-500',
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${styles[state]}`}
    >
      {state}
    </span>
  );
}

export default function Developers() {
  const [selectedTitle, setSelectedTitle] = useState('API');

  const selectedItem =
    developerItems.find((item) => item.title === selectedTitle) ??
    developerItems[0];

  const selectedExample =
    developerExamples[selectedTitle] ?? developerExamples.API;

  return (
    <section
      id="developers"
      className="border-t border-white/10 py-24 lg:py-28"
      aria-labelledby="developers-title"
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
            Developers
          </p>

          <h2
            id="developers-title"
            className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            

            <span className="text-blue-500">Build </span>with <span className="text-blue-500">RELT. </span>Extend it as you Grow. {' '}
          </h2>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Use the API, receive reliable events, and extend RELT through the
            developer platform as it grows.
          </p>
        </div>

        {/* Capability selector */}
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {developerItems.map((item) => {
            const active = selectedTitle === item.title;
            const isRoadmap = item.state === 'Roadmap';

            return (
              <button
                key={item.title}
                type="button"
                onClick={() => setSelectedTitle(item.title)}
                disabled={isRoadmap}
                aria-pressed={active}
                className={[
                  'group rounded-2xl border p-6 text-left',
                  'transition-all duration-300',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50',
                  isRoadmap
                    ? 'cursor-default border-white/10 bg-slate-900/40 opacity-80'
                    : active
                      ? 'border-blue-400/40 bg-blue-400/[0.055] -translate-y-1 shadow-[0_18px_60px_rgba(37,99,235,0.08)]'
                      : 'border-white/10 bg-slate-900/60 hover:-translate-y-1 hover:border-blue-400/25 hover:bg-slate-900',
                  'motion-reduce:transform-none motion-reduce:transition-none',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                        isRoadmap
                          ? 'bg-slate-700'
                          : active
                            ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.7)]'
                            : 'bg-slate-600 group-hover:bg-slate-500'
                      }`}
                    />
                    <StateBadge state={item.state} />
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {item.text}
                </p>

                {!isRoadmap && (
                  <div
                    className={[
                      'mt-5 text-xs font-semibold transition-colors',
                      active
                        ? 'text-blue-300'
                        : 'text-slate-600 group-hover:text-slate-400',
                    ].join(' ')}
                  >
                    {active ? 'Selected →' : 'Explore →'}
                  </div>
                )}

                {isRoadmap && (
                  <div className="mt-5 text-[11px] uppercase tracking-[0.12em] text-slate-600">
                    Coming in the developer platform
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {/* Selected capability */}
        <div className="mt-8 rounded-2xl border border-blue-400/15 bg-slate-950/55 shadow-[0_0_80px_rgba(37,99,235,0.04)]">
          {/* Panel header */}
          <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-600">
                Selected capability
              </p>

              <h3 className="mt-1 text-lg font-semibold text-white">
                {selectedItem.title}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <StateBadge state={selectedItem.state} />

              <span className="text-xs text-slate-500">
                {selectedExample.language}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
            {/* Description */}
            <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.16em] text-blue-400">
                {selectedExample.label}
              </p>

              <p className="mt-4 text-lg font-medium leading-7 text-slate-200">
                {selectedExample.description}
              </p>

              <div className="mt-6 space-y-3 text-sm text-slate-500">
                {selectedExample.highlights.map((h, i) => (
                  <div key={h} className="flex items-center gap-3">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-blue-400' : i === 1 ? 'bg-blue-400/60' : 'bg-blue-400/30'}`}
                    />
                    {h}
                  </div>
                ))}
              </div>
            </div>

            {/* Code */}
            <div className="min-w-0">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <span className="text-xs text-slate-600">Example</span>
                </div>

                <span className="font-mono text-[10px] text-slate-600">
                  {selectedExample.language}
                </span>
              </div>

              <pre className="min-h-[220px] overflow-x-auto p-6 font-mono text-xs leading-7 text-slate-300 sm:p-7">
                <code>{selectedExample.code}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Docs CTA */}
        <div className="mt-6">
          <a
            href="#start"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-semibold
              text-blue-300
              transition-colors
              duration-200
              hover:text-blue-200
            "
          >
            View developer docs
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
