'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';
import { getAgent, type AgentDetail } from '@/lib/agents';
import AgentConfigForm from '@/components/agent-config-form';
import AgentSkillsForm from '@/components/agent-skills-form';
import AgentToolsForm from '@/components/agent-tools-form';
import AgentMemoryForm from '@/components/agent-memory-form';
import AgentChannelsForm from '@/components/agent-channels-form';
import AgentStatusControl from '@/components/agent-status-control';

const TABS = ['General', 'Configuration', 'Skills', 'Tools', 'Channels', 'Memory'] as const;
type Tab = (typeof TABS)[number];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  archived: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-gray-800 last:border-0">
      <div className="text-sm text-gray-500 shrink-0">{label}</div>
      <div className="text-sm text-gray-200 text-right break-all">
        {value === undefined || value === null || value === '' ? '—' : value}
      </div>
    </div>
  );
}

function BoolBadge({ value }: { value?: boolean }) {
  if (value === undefined) return <>—</>;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
        value ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400'
      }`}
    >
      {value ? 'ON' : 'OFF'}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-mono">
      {children}
    </span>
  );
}

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const auth = useAuth();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('General');

  useEffect(() => {
    if (auth.status !== 'authenticated' || !id) return;
    setLoading(true);
    getAgent(id)
      .then(setAgent)
      .catch((err) => setError(err.message || 'Error loading agent'))
      .finally(() => setLoading(false));
  }, [auth.status, id]);

  if (auth.status !== 'authenticated') return null;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back link */}
      <Link href="/dashboard/agents" className="text-sm text-blue-400 hover:text-blue-300">
        ← Back to Agents
      </Link>

      {loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-400">
          Loading agent...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-300 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && agent && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
              <div className="text-sm text-gray-500 font-mono mt-1">{agent.key}</div>
            </div>
            <AgentStatusControl agent={agent} onUpdated={setAgent} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-800">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === t
                    ? 'bg-gray-900 text-blue-400 border border-gray-800 border-b-0'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            {tab === 'General' && (
              <div>
                <Row label="Name" value={agent.name} />
                <Row label="Key" value={<span className="font-mono">{agent.key}</span>} />
                <Row label="Status" value={<span className="capitalize">{agent.status}</span>} />
                <Row label="Default skill" value={agent.defaultSkill} />
                <Row label="Created" value={new Date(agent.createdAt).toLocaleString()} />
                <Row label="Updated" value={new Date(agent.updatedAt).toLocaleString()} />
              </div>
            )}

            {tab === 'Configuration' && (
              <AgentConfigForm agent={agent} onSaved={setAgent} />
            )}

            {tab === 'Skills' && (
              <AgentSkillsForm agent={agent} onSaved={setAgent} />
            )}

            {tab === 'Tools' && (
              <AgentToolsForm agent={agent} onSaved={setAgent} />
            )}

            {tab === 'Channels' && (
              <AgentChannelsForm agent={agent} onSaved={setAgent} />
            )}

            {tab === 'Memory' && (
              <AgentMemoryForm agent={agent} onSaved={setAgent} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
