'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';
import { getAgent, type AgentDetail } from '@/lib/agents';
import AgentConfigForm from '@/components/agent-config-form';
import AgentSkillsForm from '@/components/agent-skills-form';
import AgentToolsForm from '@/components/agent-tools-form';
import AgentMemoryForm from '@/components/agent-memory-form';
import AgentChannelsForm from '@/components/agent-channels-form';
import AgentStatusControl from '@/components/agent-status-control';
import AgentGeneralForm from '@/components/agent-general-form';

const TABS = ['General', 'Configuration', 'Skills', 'Tools', 'Channels', 'Memory'] as const;
type Tab = (typeof TABS)[number];


export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  useDashboardAuth();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('General');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getAgent(id)
      .then(setAgent)
      .catch((err) => setError(err.message || 'Error loading agent'))
      .finally(() => setLoading(false));
  }, [id]);

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
              <AgentGeneralForm agent={agent} onSaved={setAgent} />
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
