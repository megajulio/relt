'use client';

import { useState } from 'react';
import { useT } from '@/i18n/provider';

type DeveloperItem = {
  /** Identificador estable (clave de `developerExamples`); no se muestra. */
  id: string;
  /** Claves del catálogo: el texto se resuelve con `t()`. */
  titleKey: string;
  state: 'Available' | 'Preview' | 'Roadmap';
  textKey: string;
};

const developerItems: DeveloperItem[] = [
  {
    id: 'API',
    titleKey: 'landing.developers.api.title',
    state: 'Available',
    textKey: 'landing.developers.api.text',
  },
  {
    id: 'Webhooks',
    titleKey: 'landing.developers.webhooks.title',
    state: 'Available',
    textKey: 'landing.developers.webhooks.text',
  },
  {
    id: 'SDK',
    titleKey: 'landing.developers.sdk.title',
    state: 'Preview',
    textKey: 'landing.developers.sdk.text',
  },
  {
    id: 'n8n',
    titleKey: 'landing.developers.n8n.title',
    state: 'Roadmap',
    textKey: 'landing.developers.n8n.text',
  },
  {
    id: 'MCP',
    titleKey: 'landing.developers.mcp.title',
    state: 'Roadmap',
    textKey: 'landing.developers.mcp.text',
  },
  {
    id: 'Embeds',
    titleKey: 'landing.developers.embeds.title',
    state: 'Roadmap',
    textKey: 'landing.developers.embeds.text',
  },
];

const developerExamples: Record<
  string,
  {
    labelKey: string;
    language: string;
    descriptionKey: string;
    highlights: string[];
    code: string;
  }
> = {
  API: {
    labelKey: 'landing.developers.api.label',
    language: 'HTTP · JSON',
    descriptionKey: 'landing.developers.api.description',
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
    labelKey: 'landing.developers.webhooks.label',
    language: 'Webhooks',
    descriptionKey: 'landing.developers.webhooks.description',
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
    labelKey: 'landing.developers.sdk.label',
    language: 'TypeScript · Node.js',
    descriptionKey: 'landing.developers.sdk.description',
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
    labelKey: 'landing.developers.n8n.label',
    language: 'n8n',
    descriptionKey: 'landing.developers.n8n.description',
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
    labelKey: 'landing.developers.mcp.label',
    language: 'MCP',
    descriptionKey: 'landing.developers.mcp.description',
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
    labelKey: 'landing.developers.embeds.label',
    language: 'Platform',
    descriptionKey: 'landing.developers.embeds.description',
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
  const t = useT();
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
      {t('landing.developers.state.' + state.toLowerCase())}
    </span>
  );
}

export default function Developers() {
  const t = useT();
  const [selectedId, setSelectedId] = useState('API');

  const selectedItem =
    developerItems.find((item) => item.id === selectedId) ??
    developerItems[0];

  const selectedExample =
    developerExamples[selectedId] ?? developerExamples.API;

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
            {t("landing.developers.developers")}
          </p>

          <h2
            id="developers-title"
            className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl"
          >
            

            <span className="text-blue-500">{t("landing.developers.build")} </span>{t("landing.developers.with")} <span className="text-blue-500">{t("landing.developers.relt")} </span>{t("landing.developers.extend-it-as-you-grow")} {' '}
          </h2>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            {t("landing.developers.use-the-api-receive-reliable-events-and-extend-relt-thro")}
          </p>
        </div>

        {/* Capability selector */}
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {developerItems.map((item) => {
            const active = selectedId === item.id;
            const isRoadmap = item.state === 'Roadmap';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
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
                    {t(item.titleKey)}
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
                  {t(item.textKey)}
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
                    {t("landing.developers.coming-in-the-developer-platform")}
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
                {t("landing.developers.selected-capability")}
              </p>

              <h3 className="mt-1 text-lg font-semibold text-white">
                {t(selectedItem.titleKey)}
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
                {t(selectedExample.labelKey)}
              </p>

              <p className="mt-4 text-lg font-medium leading-7 text-slate-200">
                {t(selectedExample.descriptionKey)}
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
                  <span className="text-xs text-slate-600">{t("landing.developers.example")}</span>
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
            href="#developers"
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
            {t("landing.developers.explore-the-api")}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
