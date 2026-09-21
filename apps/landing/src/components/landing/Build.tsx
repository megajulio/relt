'use client';

import { useMemo, useState } from 'react';

const buildGroups = [
  {
    key: 'intelligence',
    label: 'Intelligence',
    items: [
      {
        key: 'skills',
        title: 'Skills',
        text: 'Versioned capabilities that define what your Agent knows how to do.',
        example: 'sales-assistant@1.1.1',
        detail:
          'Skills package reusable, versioned behavior so your Agent can specialize without changing the runtime.',
      },
      {
        key: 'memory',
        title: 'Memory',
        text: 'Keep useful customer and conversation context across interactions.',
        example: 'conversation.context',
        detail:
          'Memory preserves the context an Agent needs across messages and interactions.',
      },
      {
        key: 'multimodal',
        title: 'Multimodal',
        text: 'Work with text, audio, images and documents in one Agent runtime.',
        example: 'text · audio · image',
        detail:
          'One runtime can process different message types and normalize them before the Agent acts.',
      },
    ],
  },
  {
    key: 'action',
    label: 'Action',
    items: [
      {
        key: 'tools',
        title: 'Tools',
        text: 'Connect real actions, APIs and business systems to your Agent.',
        example: 'products.search()',
        detail:
          'Tools let the Agent move beyond conversation and execute real actions in your systems.',
      },
    ],
  },
  {
    key: 'control',
    label: 'Control',
    items: [
      {
        key: 'policies',
        title: 'Policies',
        text: 'Control what an Agent is allowed to execute before tools run.',
        example: 'policy.check → passed',
        detail:
          'Policies and permissions determine whether an Agent is authorized to execute an action.',
      },
    ],
  },
  {
    key: 'execution',
    label: 'Runtime',
    items: [
      {
        key: 'execution',
        title: 'Execution',
        text: 'Trace every step from message to tool call, result and response.',
        example: 'message → result',
        detail:
          'Execution connects intent, skills, tools, results and responses into an observable runtime flow.',
      },
    ],
  },
];

type BuildItem = {
  key: string;
  title: string;
  text: string;
  example: string;
  detail: string;
};
type BuildKey = BuildItem['key'];

const categoryStyles = {
  intelligence: {
    label: 'text-blue-400',
    activeBorder: 'border-blue-400/40',
    activeBackground: 'bg-blue-400/[0.055]',
    glow: 'hover:shadow-[0_18px_60px_rgba(37,99,235,0.10)]',
  },
  action: {
    label: 'text-violet-300',
    activeBorder: 'border-violet-400/35',
    activeBackground: 'bg-violet-400/[0.04]',
    glow: 'hover:shadow-[0_18px_60px_rgba(139,92,246,0.08)]',
  },
  control: {
    label: 'text-amber-300',
    activeBorder: 'border-amber-400/30',
    activeBackground: 'bg-amber-400/[0.035]',
    glow: 'hover:shadow-[0_18px_60px_rgba(245,158,11,0.06)]',
  },
  execution: {
    label: 'text-blue-300',
    activeBorder: 'border-blue-400/50',
    activeBackground: 'bg-blue-400/[0.07]',
    glow: 'hover:shadow-[0_18px_60px_rgba(37,99,235,0.14)]',
  },
} as const;

const TREE_FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817]';

function ArchitectureTree({
  selectedKey,
  onSelect,
  selectedItem,
}: {
  selectedKey: BuildKey;
  onSelect: (key: BuildKey) => void;
  selectedItem: BuildItem;
}) {
  const activeCat =
    buildGroups.find((g) => g.items.some((i) => i.key === selectedKey))?.key ?? '';

  return (
    <div className="rounded-2xl border border-blue-400/20 bg-blue-400/[0.035] p-6 font-mono text-sm shadow-[0_0_40px_rgba(37,99,235,0.08)] sm:p-7">
      <div className="flex items-center gap-3 text-base text-blue-300">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg border border-blue-400/30 bg-blue-400/10 text-xs"
          aria-hidden="true"
        >
          ∙
        </span>
        <span>Agent</span>
      </div>

      <div className="ml-3 mt-5 border-l border-blue-400/25 pl-5 sm:ml-4 sm:pl-6">
        {/* Intelligence */}
        <div className="relative pb-5">
          <span
            className={`absolute -left-[27px] top-2 h-px w-5 sm:-left-[31px] sm:w-6 ${
              activeCat === 'intelligence' ? 'bg-blue-400/70' : 'bg-blue-400/30'
            }`}
          />
          <div
            className={`text-[10px] uppercase tracking-[0.16em] transition-colors duration-300 ${
              activeCat === 'intelligence' ? 'text-blue-400 font-semibold' : 'text-slate-500'
            }`}
          >
            intelligence
          </div>
          <div className="mt-3 space-y-1.5">
            {(['skills', 'memory', 'multimodal'] as const).map((key) => {
              const item = buildGroups[0].items.find((entry) => entry.key === key);
              if (!item) return null;
              const active = selectedKey === key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelect(item.key)}
                  className={[
                    'block w-full rounded-md px-2 py-1 text-left transition-all duration-200',
                    TREE_FOCUS,
                    active
                      ? 'bg-blue-400/10 text-blue-300'
                      : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200',
                  ].join(' ')}
                  aria-pressed={active}
                >
                  <span className="mr-2 text-slate-600">└</span>
                  {item.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action */}
        <div className="relative border-t border-white/10 py-5">
          <span
            className={`absolute -left-[27px] top-7 h-px w-5 sm:-left-[31px] sm:w-6 ${
              activeCat === 'action' ? 'bg-violet-400/70' : 'bg-blue-400/30'
            }`}
          />
          <div
            className={`text-[10px] uppercase tracking-[0.16em] transition-colors duration-300 ${
              activeCat === 'action' ? 'text-violet-300 font-semibold' : 'text-slate-500'
            }`}
          >
            action
          </div>
          <button
            type="button"
            onClick={() => onSelect('tools')}
            className={[
              'mt-3 block w-full rounded-md px-2 py-1 text-left transition-all duration-200',
              TREE_FOCUS,
              selectedKey === 'tools'
                ? 'bg-violet-400/10 text-violet-300'
                : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200',
            ].join(' ')}
            aria-pressed={selectedKey === 'tools'}
          >
            <span className="mr-2 text-slate-600">└</span>
            Tools
          </button>
        </div>

        {/* Control */}
        <div className="relative border-t border-white/10 py-5">
          <span
            className={`absolute -left-[27px] top-7 h-px w-5 sm:-left-[31px] sm:w-6 ${
              activeCat === 'control' ? 'bg-amber-400/70' : 'bg-blue-400/30'
            }`}
          />
          <div
            className={`text-[10px] uppercase tracking-[0.16em] transition-colors duration-300 ${
              activeCat === 'control' ? 'text-amber-300 font-semibold' : 'text-slate-500'
            }`}
          >
            control
          </div>
          <button
            type="button"
            onClick={() => onSelect('policies')}
            className={[
              'mt-3 block w-full rounded-md px-2 py-1 text-left transition-all duration-200',
              TREE_FOCUS,
              selectedKey === 'policies'
                ? 'bg-amber-400/10 text-amber-300'
                : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200',
            ].join(' ')}
            aria-pressed={selectedKey === 'policies'}
          >
            <span className="mr-2 text-slate-600">└</span>
            Policies
          </button>
        </div>

        {/* Execution */}
        <div className="relative border-t border-blue-400/20 pt-5">
          <span
            className={`absolute -left-[27px] top-7 h-px w-5 sm:-left-[31px] sm:w-6 ${
              activeCat === 'execution' ? 'bg-blue-400/80' : 'bg-blue-400/50'
            }`}
          />
          <button
            type="button"
            onClick={() => onSelect('execution')}
            className={[
              'group flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-all duration-200',
              TREE_FOCUS,
              selectedKey === 'execution'
                ? 'bg-blue-400/10 text-blue-200'
                : 'text-blue-300 hover:bg-white/[0.03]',
            ].join(' ')}
            aria-pressed={selectedKey === 'execution'}
          >
            <span
              className={[
                'h-2 w-2 rounded-full transition-all duration-300',
                selectedKey === 'execution'
                  ? 'bg-blue-400 shadow-[0_0_14px_rgba(96,165,250,0.95)]'
                  : 'bg-blue-400/60',
              ].join(' ')}
              aria-hidden="true"
            />
            Execution
          </button>
          <p className="mt-2 font-sans text-xs leading-5 text-slate-500">
            The observable runtime where the Agent turns context into action.
          </p>
        </div>
      </div>

      <div key={selectedItem.key} className="animate-flow-in mt-6 border-t border-white/10 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-600">
              Selected capability
            </p>
            <p className="mt-1 font-sans text-sm font-semibold text-white">
              {selectedItem.title}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[10px] text-blue-300">
            {selectedItem.example}
          </span>
        </div>
        <p className="mt-3 font-sans text-xs leading-5 text-slate-500">
          {selectedItem.detail}
        </p>
      </div>
    </div>
  );
}

function CapabilityCard({
  group,
  item,
  active,
  onSelect,
}: {
  group: (typeof buildGroups)[number];
  item: BuildItem;
  active: boolean;
  onSelect: (key: BuildKey) => void;
}) {
  const styles = categoryStyles[group.key as keyof typeof categoryStyles];
  const isExecution = group.key === 'execution';

  return (
    <button
      type="button"
      onClick={() => onSelect(item.key)}
      aria-pressed={active}
      className={[
        'group relative rounded-2xl border p-5 text-left',
        'transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817]',
        active
          ? `${styles.activeBorder} ${styles.activeBackground} -translate-y-1`
          : 'border-white/10 bg-slate-900/60 hover:-translate-y-1 hover:border-white/15 hover:bg-slate-900',
        styles.glow,
        'motion-reduce:transform-none motion-reduce:transition-none',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${styles.label}`}
        >
          {group.label}
        </span>

        <div className="flex items-center gap-2">
          {isExecution && (
            <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300">
              Core runtime
            </span>
          )}

          <span
            className={[
              'text-[10px] font-medium uppercase tracking-wider transition-opacity duration-300',
              active ? 'text-blue-300 opacity-100' : 'opacity-0',
            ].join(' ')}
          >
            Selected
          </span>

          <span
            className={[
              'h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300',
              active
                ? 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]'
                : 'bg-slate-700',
            ].join(' ')}
            aria-hidden="true"
          />
        </div>
      </div>

      <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{item.text}</p>

      <div
        className={[
          'mt-4 rounded-lg border px-3 py-2 font-mono text-[11px]',
          active ? 'border-white/10 bg-black/25' : 'border-white/10 bg-black/20',
        ].join(' ')}
      >
        <span className="text-slate-600">example</span>{' '}
        <span className={active || isExecution ? 'text-blue-300' : 'text-slate-300'}>
          {item.example}
        </span>
      </div>
    </button>
  );
}

export default function Build() {
  const [selectedKey, setSelectedKey] = useState<BuildKey>('skills');

  const allItems = useMemo(() => buildGroups.flatMap((group) => group.items), []);

  const selectedItem =
    allItems.find((item) => item.key === selectedKey) ?? allItems[0];

  const getGroupForItem = (item: BuildItem) =>
    buildGroups.find((group) => group.items.some((entry) => entry.key === item.key))!;

  return (
    <section
      id="agents"
      className="border-t border-white/10 py-24 lg:py-28"
      aria-labelledby="build-title"
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-400">
              Build
            </p>

            <h2
              id="build-title"
              className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl"
            >
              
             Give your <span className="text-blue-500">Agent </span>everything it needs to act. {' '}
            </h2>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400 lg:text-lg lg:leading-8">
              RELT combines agent intelligence with the controls required to execute real work safely.
            </p>
          </div>

        </div>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          Click a capability to explore
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-14">
          <ArchitectureTree
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            selectedItem={selectedItem}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            {buildGroups.flatMap((group) =>
              group.items.map((item) => (
                <CapabilityCard
                  key={`${group.key}-${item.title}`}
                  group={group}
                  item={item}
                  active={selectedKey === item.key}
                  onSelect={setSelectedKey}
                />
              )),
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
          <span
            className={
              getGroupForItem(selectedItem).key === 'intelligence'
                ? 'text-blue-300'
                : undefined
            }
          >
            Intelligence
          </span>
          <span className="text-slate-700">→</span>
          <span
            className={
              getGroupForItem(selectedItem).key === 'action'
                ? 'text-violet-300'
                : undefined
            }
          >
            Action
          </span>
          <span className="text-slate-700">→</span>
          <span
            className={
              getGroupForItem(selectedItem).key === 'control'
                ? 'text-amber-300'
                : undefined
            }
          >
            Control
          </span>
          <span className="text-slate-700">→</span>
          <span
            className={
              getGroupForItem(selectedItem).key === 'execution'
                ? 'text-blue-300'
                : 'text-slate-400'
            }
          >
            Observable execution
          </span>
        </div>
      </div>
    </section>
  );
}
