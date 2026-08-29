'use client';

import { useState, useEffect, FormEvent } from 'react';
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  type ApiKey,
  type CreateApiKeyResponse,
} from '@/lib/api-keys';

type ViewState =
  | { kind: 'list' }
  | { kind: 'creating' }
  | { kind: 'reveal'; response: CreateApiKeyResponse }
  | { kind: 'confirm-revoke'; target: ApiKey };

function formatDate(iso: string | null): string {
  if (!iso) return 'Never used';
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<ViewState>({ kind: 'list' });
  const [name, setName] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await listApiKeys();
      setKeys(data);
    } catch (err: any) {
      setError(err.message || 'Error loading API keys');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const response = await createApiKey(name.trim());
      setView({ kind: 'reveal', response });
      setName('');
    } catch (err: any) {
      setError(err.message || 'Error creating API key');
    }
  }

  async function handleRevokeConfirm() {
    if (view.kind !== 'confirm-revoke') return;
    try {
      await revokeApiKey(view.target.id);
      setView({ kind: 'list' });
      await load();
    } catch (err: any) {
      setError(err.message || 'Error revoking API key');
      setView({ kind: 'list' });
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback silencioso
    }
  }

  // --- REVEAL VIEW (mostrar key una sola vez) ---
  if (view.kind === 'reveal') {
    const { response } = view;
    return (
      <div className="max-w-2xl">
        <div className="bg-gray-900 border border-amber-500/40 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xl">
              🔑
            </div>
            <h1 className="text-2xl font-bold text-white">API Key Created</h1>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-200 font-medium">
              ⚠️ Copy this key now. For security reasons you won't be able to see it again.
            </p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-xs uppercase tracking-wide text-gray-500">Name</div>
            <div className="text-white">{response.name}</div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="text-xs uppercase tracking-wide text-gray-500">API Key</div>
            <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-lg p-3">
              <code className="flex-1 text-sm text-green-400 font-mono break-all">
                {response.key}
              </code>
              <button
                onClick={() => copyToClipboard(response.key)}
                className="shrink-0 bg-gray-800 hover:bg-gray-700 text-white text-sm px-3 py-1.5 rounded-md transition-colors"
              >
                📋 Copy
              </button>
            </div>
          </div>

          <button
            onClick={() => setView({ kind: 'list' })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            I've copied my key
          </button>
        </div>
      </div>
    );
  }

  // --- CONFIRM REVOKE VIEW ---
  if (view.kind === 'confirm-revoke') {
    const { target } = view;
    return (
      <div className="max-w-lg">
        <div className="bg-gray-900 border border-red-500/40 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-2">Revoke API Key?</h2>
          <p className="text-gray-400 mb-6">
            Applications using <span className="text-white font-mono">{target.keyPrefix}...</span>{' '}
            will immediately stop working.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setView({ kind: 'list' })}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRevokeConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Revoke Key
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW (principal) ---
  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">API Keys</h1>
          <p className="text-gray-400 mt-1">
            API keys let your application authenticate with Relt.
          </p>
        </div>
        <button
          onClick={() => setView({ kind: 'creating' })}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
        >
          + Create API Key
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Create form */}
      {view.kind === 'creating' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create API Key</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Production"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                This name helps you identify the key later.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setView({ kind: 'list' });
                  setName('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
              >
                Create API Key
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-gray-400 text-center py-12">Loading API keys...</div>
      )}

      {/* Empty state */}
      {!loading && keys.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">🔑</div>
          <h3 className="text-lg font-semibold text-white mb-1">No API keys yet</h3>
          <p className="text-gray-400 text-sm mb-5">
            Create your first API key to start sending messages.
          </p>
          <button
            onClick={() => setView({ kind: 'creating' })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors"
          >
            + Create your first API key
          </button>
        </div>
      )}

      {/* List */}
      {!loading && keys.length > 0 && (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{key.name}</div>
                <div className="flex items-center gap-3 mt-1.5 text-sm">
                  <code className="font-mono text-green-400">{key.keyPrefix}...</code>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-400">
                    Created {formatDate(key.createdAt)}
                  </span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-400">{formatDate(key.lastUsedAt)}</span>
                </div>
              </div>

              <button
                onClick={() => setView({ kind: 'confirm-revoke', target: key })}
                className="ml-4 text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
