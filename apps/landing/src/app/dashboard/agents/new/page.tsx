'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDashboardAuth } from '@/components/dashboard/DashboardAuthProvider';
import { createAgent, type CreateAgentInput } from '@/lib/agents';
import { listSkills, type SkillListItem } from '@/lib/skills';

const inputCls =
  'w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500';

const labelCls = 'block text-sm font-medium text-gray-400 mb-1';

export default function CreateAgentPage() {
  const router = useRouter();
  useDashboardAuth();

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [defaultSkill, setDefaultSkill] = useState('general');
  const [status, setStatus] = useState<'active' | 'paused' | 'archived'>('active');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<SkillListItem[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listSkills()
      .then((items) => {
        if (cancelled) return;

        setSkills(items);
        setSkillsError(null);

        if (!items.some((skill) => skill.name === 'general')) {
          setSkillsError('The required "general" skill is not available.');
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setSkillsError(
            loadError instanceof Error ? loadError.message : 'Failed to load skills',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSkillsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !key.trim()) {
      setError('Name and key are required');
      return;
    }

    setSaving(true);

    try {
      const input: CreateAgentInput = {
        name: name.trim(),
        key: key.trim(),
        defaultSkill: defaultSkill || 'general',
        status,
        config: {
          systemPrompt: systemPrompt || undefined,
        },
      };

      const agent = await createAgent(input);
      router.push(`/dashboard/agents/${agent.id}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to create agent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard/agents" className="text-sm text-blue-400 hover:text-blue-300">
        ← Back to Agents
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Create Agent</h1>
        <p className="text-gray-400 mt-1">Set up a new AI agent for your workspace.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {/* Name */}
        <div>
          <label className={labelCls}>Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Support Agent"
            className={inputCls}
            disabled={saving}
            required
          />
        </div>

        {/* Key */}
        <div>
          <label className={labelCls}>Key *</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="support-agent"
            className={inputCls}
            disabled={saving}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Unique identifier (lowercase, hyphens)</p>
        </div>

        {/* Default Skill */}
        <div>
          <label className={labelCls}>Default Skill</label>
          <select
            value={defaultSkill}
            onChange={(e) => setDefaultSkill(e.target.value)}
            className={inputCls}
            disabled={saving || skillsLoading || !!skillsError}
          >
            {skillsLoading ? (
              <option value="general">Loading skills...</option>
            ) : skills.length === 0 ? (
              <option value="general">Skills unavailable</option>
            ) : (
              skills.map((skill) => (
                <option key={skill.name} value={skill.name}>
                  {skill.name}
                </option>
              ))
            )}
          </select>
          {skillsError && (
            <p className="text-xs text-red-400 mt-1">{skillsError}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className={labelCls}>Initial Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'paused' | 'archived')}
            className={inputCls}
            disabled={saving}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* System Prompt */}
        <div>
          <label className={labelCls}>System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful support assistant..."
            className={inputCls}
            rows={4}
            disabled={saving}
          />
        </div>

        {/* Model Strategy */}
        <div>
          <label className={labelCls}>Model Strategy</label>
          <select value="backend" className={inputCls} disabled>
            <option value="backend">Managed by backend</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            La estrategia efectiva se resuelve en el runtime del backend.
          </p>
        </div>

        {/* Reasoning Model */}
        <div>
          <label className={labelCls}>Reasoning Model</label>
          <input
            type="text"
            value=""
            placeholder="lo elige ModelStrategy"
            className={inputCls}
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">lo elige ModelStrategy</p>
        </div>

        {/* Response Model */}
        <div>
          <label className={labelCls}>Response Model</label>
          <input
            type="text"
            value=""
            placeholder="lo elige ModelStrategy"
            className={inputCls}
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">lo elige ModelStrategy</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={
              saving ||
              skillsLoading ||
              !!skillsError ||
              !skills.some((skill) => skill.name === defaultSkill)
            }
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Creating...' : 'Create Agent'}
          </button>
          <Link
            href="/dashboard/agents"
            className="bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
