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

type IconName = 'key' | 'mail' | 'signal' | 'inbox' | 'send' | 'user' | 'doc';

const EVENT_CONFIG: Record<string, { icon: IconName; label: string; color: string }> = {
  'api_key.created': { icon: 'key', label: 'API key created', color: 'text-green-400' },
  'api_key.revoked': { icon: 'key', label: 'API key revoked', color: 'text-red-400' },
  'api_key.expired': { icon: 'key', label: 'API key expired', color: 'text-yellow-400' },
  'message.queued': { icon: 'mail', label: 'Message queued', color: 'text-blue-400' },
  'message.sent': { icon: 'mail', label: 'Message sent', color: 'text-blue-400' },
  'message.delivered': { icon: 'mail', label: 'Message delivered', color: 'text-green-400' },
  'message.failed': { icon: 'mail', label: 'Message failed', color: 'text-red-400' },
  'provider.request': { icon: 'signal', label: 'Provider request', color: 'text-blue-400' },
  'provider.error': { icon: 'signal', label: 'Provider error', color: 'text-red-400' },
  'webhook.received': { icon: 'inbox', label: 'Webhook received', color: 'text-yellow-400' },
  'webhook.delivered': { icon: 'send', label: 'Webhook delivered', color: 'text-green-400' },
  'webhook.failed': { icon: 'send', label: 'Webhook failed', color: 'text-red-400' },
  'webhook.retry': { icon: 'send', label: 'Webhook retry', color: 'text-yellow-400' },
  'auth.login': { icon: 'user', label: 'Login', color: 'text-green-400' },
  'auth.login_failed': { icon: 'user', label: 'Login failed', color: 'text-red-400' },
};

function EventIcon({ name, className }: { name: IconName; className?: string }) {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;

  if (name === 'key')
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke}>
        <circle cx="8" cy="16" r="4" />
        <path d="M10.9 13.1 20 4m-4.5 0H20v4.5" />
      </svg>
    );
  if (name === 'mail')
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7.5 9 6 9-6" />
      </svg>
    );
  if (name === 'signal')
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke}>
        <path d="M5 11a8 8 0 0 1 8 8" />
        <path d="M5 5a14 14 0 0 1 14 14" />
        <circle cx="5.5" cy="18.5" r="1.5" />
      </svg>
    );
  if (name === 'inbox')
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke}>
        <path d="M22 12h-6l-2 3h-4l-2-3H2" />
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    );
  if (name === 'send')
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke}>
        <path d="m22 2-7 20-4-9-9-4z" />
        <path d="M22 2 11 13" />
      </svg>
    );
  if (name === 'user')
    return (
      <svg viewBox="0 0 24 24" className={className} {...stroke}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20a8 8 0 0 1 16 0" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={className} {...stroke}>
      <path d="M6 2h9l5 5v15H6z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

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
    to: null,
  };
}

export default function ActivityPage() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventType = searchParams.get('event_type') || '';
  const status = searchParams.get('status') || '';
  const range = searchParams.get('range') || 'all';
  const searchParam = searchParams.get('search') || '';

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [searchInput, setSearchInput] = useState(searchParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, [auth.status, eventType, status, range, searchParam, reloadKey]);

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
            Observability
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white">Activity</h1>
          <p className="mt-1 text-gray-400">
            What happened across your account, messages and webhooks.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          Live · {events.length} event{events.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">
              Search
            </label>
            <input
              type="text"
              placeholder="event type, metadata..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">
              Event type
            </label>
            <select
              value={eventType}
              onChange={(e) => updateParam('event_type', e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-blue-600 focus:outline-none"
            >
              <option value="">All events</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => updateParam('status', e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-blue-600 focus:outline-none"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-gray-500">
              Date range
            </label>
            <select
              value={range}
              onChange={(e) => updateParam('range', e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white focus:border-blue-600 focus:outline-none"
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
          <div className="mt-3 flex justify-end border-t border-gray-800 pt-3">
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 transition-colors hover:text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        {loading ? (
          <div className="divide-y divide-gray-800">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 p-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-800" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-40 animate-pulse rounded bg-gray-800" />
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-800/70" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-red-900/50 bg-red-950/30 text-red-400">
              <EventIcon name="signal" className="h-5 w-5" />
            </div>
            <div className="mt-4 font-medium text-white">We couldn't load your activity</div>
            <p className="mt-1 text-sm text-gray-400">{error}</p>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-5 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition hover:border-blue-600 hover:text-blue-300"
            >
              Try again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-gray-800 bg-gray-950 text-gray-500">
              <EventIcon name="inbox" className="h-5 w-5" />
            </div>
            <div className="mt-4 font-medium text-white">
              {hasFilters ? 'No events match your filters.' : 'No activity yet.'}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {hasFilters
                ? 'Try adjusting or clearing the filters above.'
                : 'Events will appear here as soon as something happens in your account.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {events.map((event) => {
              const config = EVENT_CONFIG[event.event_type] || {
                icon: 'doc' as IconName,
                label: event.event_type,
                color: 'text-gray-400',
              };
              const isExpanded = expandedId === event.id;

              return (
                <li key={event.id} className="p-4 transition-colors hover:bg-gray-800/40">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-800 bg-gray-950 ${config.color}`}
                    >
                      <EventIcon name={config.icon} className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-white">{config.label}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${
                            event.status === 'success'
                              ? 'border-green-800 bg-green-900/20 text-green-400'
                              : event.status === 'failure'
                                ? 'border-red-800 bg-red-900/20 text-red-400'
                                : 'border-yellow-800 bg-yellow-900/20 text-yellow-400'
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {event.status}
                        </span>
                      </div>

                      <div className="mt-1 text-sm text-gray-400">{timeAgo(event.created_at)}</div>

                      {(event.request_id || event.trace_id) && (
                        <div className="mt-2 flex flex-wrap gap-2 font-mono text-[11px]">
                          {event.request_id && (
                            <button
                              onClick={() => copyToClipboard(`req-${event.id}`, event.request_id!)}
                              className="inline-flex items-center gap-2 rounded-md border border-gray-800 bg-gray-950 px-2 py-1 text-gray-400 transition hover:border-blue-600/50 hover:text-blue-300"
                              title="Click to copy request ID"
                            >
                              <span className="text-gray-600">req:</span>
                              <span className="text-gray-300">{event.request_id.slice(0, 8)}…</span>
                              <span className="text-green-400">
                                {copied === `req-${event.id}` ? 'copied!' : 'copy'}
                              </span>
                            </button>
                          )}
                          {event.trace_id && (
                            <button
                              onClick={() => copyToClipboard(`trace-${event.id}`, event.trace_id!)}
                              className="inline-flex items-center gap-2 rounded-md border border-gray-800 bg-gray-950 px-2 py-1 text-gray-400 transition hover:border-blue-600/50 hover:text-blue-300"
                              title="Click to copy trace ID"
                            >
                              <span className="text-gray-600">trace:</span>
                              <span className="text-gray-300">{event.trace_id.slice(0, 8)}…</span>
                              <span className="text-green-400">
                                {copied === `trace-${event.id}` ? 'copied!' : 'copy'}
                              </span>
                            </button>
                          )}
                        </div>
                      )}

                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : event.id)}
                          className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
                        >
                          {isExpanded ? 'Hide details' : 'View metadata'}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 overflow-x-auto">
                            <div className="flex items-center justify-between rounded-t-lg border border-gray-800 bg-gray-900 px-3 py-2">
                              <span className="font-mono text-[11px] uppercase tracking-wider text-gray-500">
                                metadata
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    `meta-${event.id}`,
                                    JSON.stringify(event.metadata, null, 2)
                                  )
                                }
                                className="text-[11px] text-gray-500 transition hover:text-blue-300"
                              >
                                {copied === `meta-${event.id}` ? 'copied!' : 'copy json'}
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap rounded-b-lg border border-t-0 border-gray-800 bg-gray-950 p-3 font-mono text-xs text-gray-300">
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
          <div className="flex justify-center border-t border-gray-800 bg-gray-900/50 p-4">
            {nextCursor ? (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg px-4 py-2 text-sm font-medium text-blue-400 transition hover:bg-gray-800 hover:text-blue-300 disabled:opacity-50"
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
