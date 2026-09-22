'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/use-auth';
import Link from 'next/link';
import { listAgents, type Agent } from '@/lib/agents';

const STATUS_STYLES: Record<Agent['status'], string> = {
  active: 'bg-green-500/20 text-green-400 border border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  archived: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
};

export default function AgentsPage() {
  const auth = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status !== 'authenticated') return;

    listAgents()
      .then(setAgents)
      .catch((err) => setError(err.message || 'Error loading agents'))
      .finally(() => setLoading(false));
  }, [auth.status]);

  if (auth.status !== 'authenticated') {
    return null;
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agents</h1>
          <p className="text-gray-400 mt-1">Manage your AI agents and their configurations.</p>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-400">Loading agents...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="text-red-400 font-medium mb-1">Error</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}

      {!loading && !error && agents.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-400 mb-2">No agents yet</div>
          <div className="text-gray-500 text-sm">Create your first agent to get started.</div>
        </div>
      )}

      {!loading && !error && agents.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skill
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model Strategy
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{agent.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{agent.key}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium capitalize ${STATUS_STYLES[agent.status]}`}
                    >
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">{agent.config.skillBinding?.skill || agent.defaultSkill}</div>
                    {agent.config.skillBinding?.version && (
                      <div className="text-xs text-gray-500">v{agent.config.skillBinding.version}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300 capitalize">{agent.config.modelStrategy || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/agents/${agent.id}`}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
