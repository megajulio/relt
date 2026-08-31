'use client';

import { useAuth } from '@/lib/use-auth';
import { api } from '@/lib/api';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type ActivityEvent = {
  id: string;
  event_type: string;
  status: 'success' | 'failure' | 'error';
  actor: { type: string; id: string | null } | null;
  resource: { type: string; id: string | null } | null;
  metadata: Record<string, unknown>;
  request_id: string | null;
  trace_id: string | null;
  created_at: string;
};

type ActivityResponse = {
  data: ActivityEvent[];
  next_cursor: string | null;
};

const EVENT_TYPES = [
  'api_key.created',
  'api_key.revoked',
  'api_key.expired',
  'message.queued',
  'message.sent',
  'message.delivered',
  'message.failed',
  'webhook.received',
  'webhook.delivered',
  'webhook.failed',
  'webhook.retry',
  'provider.request',
  'provider.error',
  'auth.login',
  'auth.login_failed',
] as const;

const STATUS_OPTIONS = ['success', 'failure', 'error'] as const;

const DATE_RANGES = [
  { value: 'all', label: 'All time' },
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24h' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
] as const;

const EVENT_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  'api_key.created': { icon: '🔑', label: 'API key created', color: 'text-green-400' },
  'api_key.revoked': { icon: '🔑', label: 'API key revoked', color: 'text-red-400' },
  'api_key.expired': { icon: '🔑', label: 'API key expired', color: 'text-yellow-400' },
  'message.queued': { icon: '📨', label: 'Message queued', color: 'text-blue-400' },
  'message.sent': { icon: '📨', label: 'Message sent', color: 'text-blue-400' },
  'message.delivered': { icon: '📨', label: 'Message delivered', color: 'text-green-400' },
  'message.failed': { icon: '📨', label: 'Message failed', color: 'text-red-400' },
  'provider.request': { icon: '📡', label: 'Provider request', color: 'text-blue-400' },
  'provider.error': { icon: '📡', label: 'Provider error', color: 'text-red-400' },
  'webhook.received': { icon: '📥', label: 'Webhook received', color: 'text-yellow-400' },
  'webhook.delivered': { icon: '📤', label: 'Webhook delivered', color: 'text-green-400' },
  'webhook.failed': { icon: '📤', label: 'Webhook failed', color: 'text-red-400' },
  'webhook.retry': { icon: '📤', label: 'Webhook retry', color: 'text-yellow-400' },
  'auth.login': { icon: '👤', label: 'Login', color: 'text-green-400' },
  'auth.login_failed': { icon: '👤', label: 'Login failed', color: 'text-red-400' },
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function rangeToISO(range: string): { from: string | null; to: string | null } {
  if (range === 'all' || !range) return { from: null, to: null };
  const now = new Date();
  const ms: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const delta = ms[range];
  if (!delta) return { from: null, to: null };
  return {
    from: new Date(now.getTime() - delta).toISOString(),
    to: null, // intervalo [from, now+inf) es suficiente para presets
  };
}

export default function ActivityPage() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filtros leídos desde URL
  const eventType = searchParams.get('event_type') || '';
  const status = searchParams.get('status') || '';
  const range = searchParams.get('range') || 'all';
  const searchParam = searchParams.get('search') || '';

  // Estados
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Search con debounce (estado local + ref para el timer)
  const [searchInput, setSearchInput] = useState(searchParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincronizar searchInput cuando viene desde URL
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/activity?${params.toString()}`);
  };

  const buildPath = (cursor?: string): string => {
    const params = new URLSearchParams();
    if (eventType) params.set('event_type', eventType);
    if (status) params.set('status', status);
    if (searchParam) params.set('search', searchParam);
    const { from, to } = rangeToISO(range);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (cursor) params.set('cursor', cursor);
    params.set('limit', '50');
    return `/control/v1/activity?${params.toString()}`;
  };

  // Fetch inicial + cuando cambian filtros (resetea cursor)
  useEffect(() => {
    if (auth.status !== 'authenticated') {
      setLoading(false);
      return;
    }

    const fetchActivity = async () => {
      setLoading(true);
      setError(null);
      setExpandedId(null);
      try {
        const data = await api.get<ActivityResponse>(buildPath());
        setEvents(data.data);
        setNextCursor(data.next_cursor);
      } catch (err: any) {
        setError(err.message || 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status, eventType, status, range, searchParam]);

  // Debounce del input de búsqueda
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== searchParam) {
        updateParam('search', searchInput);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await api.get<ActivityResponse>(buildPath(nextCursor));
      setEvents((prev) => [...prev, ...data.data]);
      setNextCursor(data.next_cursor);
    } catch (err: any) {
      setError(err.message || 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const clearAll = () => {
    router.push('/dashboard/activity');
    setSearchInput('');
  };

  const hasFilters = useMemo(
    () => Boolean(eventType || status || range !== 'all' || searchParam),
    [eventType, status, range, searchParam]
  );

  if (auth.status !== 'authenticated') return null;

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Activity</h1>
        <p className="text-gray-400 mt-1">What happened in your account and resources.</p>
      </div>

      {/* Filtros */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <input
              type="text"
              placeholder="event type, metadata..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Event type */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Event type</label>
            <select
              value={eventType}
              onChange={(e) => updateParam('event_type', e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-600"
            >
              <option value="">All events</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => updateParam('status', e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-600"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date range</label>
            <select
              value={range}
              onChange={(e) => updateParam('range', e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-600"
            >
              {DATE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-3 pt-3 border-t border-gray-800 flex justify-end">
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading events...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-400">
            Error: {error}
            <br />
            <span className="text-sm text-gray-500">
              Make sure the backend is running on port 3001.
            </span>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {hasFilters ? 'No events match your filters.' : 'No activity yet.'}
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {events.map((event) => {
              const config = EVENT_CONFIG[event.event_type] || {
                icon: '📄',
                label: event.event_type,
                color: 'text-gray-400',
              };
              const isExpanded = expandedId === event.id;

              return (
                <li key={event.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 text-xl ${config.color}`}>{config.icon}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{config.label}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            event.status === 'success'
                              ? 'border-green-800 text-green-400 bg-green-900/20'
                              : event.status === 'failure'
                                ? 'border-red-800 text-red-400 bg-red-900/20'
                                : 'border-yellow-800 text-yellow-400 bg-yellow-900/20'
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-400 mt-1">{timeAgo(event.created_at)}</div>

                      {(event.request_id || event.trace_id) && (
                        <div className="flex gap-4 mt-2 text-xs font-mono">
                          {event.request_id && (
                            <button
                              onClick={() => copyToClipboard(`req-${event.id}`, event.request_id!)}
                              className="flex items-center gap-1 text-gray-500 hover:text-blue-400 transition-colors"
                              title="Click to copy request ID"
                            >
                              <span>req:</span>
                              <span className="text-gray-300">{event.request_id.slice(0, 8)}...</span>
                              <span className="text-green-400">
                                {copied === `req-${event.id}` ? 'copied!' : ''}
                              </span>
                            </button>
                          )}
                          {event.trace_id && (
                            <button
                              onClick={() => copyToClipboard(`trace-${event.id}`, event.trace_id!)}
                              className="flex items-center gap-1 text-gray-500 hover:text-blue-400 transition-colors"
                              title="Click to copy trace ID"
                            >
                              <span>trace:</span>
                              <span className="text-gray-300">{event.trace_id.slice(0, 8)}...</span>
                              <span className="text-green-400">
                                {copied === `trace-${event.id}` ? 'copied!' : ''}
                              </span>
                            </button>
                          )}
                        </div>
                      )}

                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : event.id)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                        >
                          {isExpanded ? 'Hide details' : 'View metadata'}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 bg-gray-950 border border-gray-800 rounded-lg p-3 overflow-x-auto">
                            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-center">
            {nextCursor ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm text-blue-400 hover:text-blue-300 font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            ) : (
              <span className="text-sm text-gray-500">End of history</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
