'use client';

import { useAuth } from '@/lib/use-auth';
import Link from 'next/link';
import { SandboxStatusCard } from '@/components/dashboard/SandboxStatusCard';
import { useSandboxQR } from '@/lib/use-sandbox-qr';

export default function DashboardOverviewPage() {
  const auth = useAuth();

  const orgId =
    auth.status === 'authenticated'
      ? auth.data.organizations[0]?.id
      : undefined;

  const { data: sandboxQR } = useSandboxQR(orgId);

  if (auth.status !== 'authenticated') {
    return null; // useAuth maneja el loading y la redirección
  }

  const { user, organizations } = auth.data;
  const activeOrg = organizations[0];

  const sandboxConnected = sandboxQR?.status === 'connected';

  const checklist = [
    { label: 'Create your account', done: true },
    {
      label: 'Activate your sandbox',
      done: sandboxConnected,
      cta: sandboxConnected
        ? undefined
        : { href: '/dashboard/sandbox', label: 'View status' },
    },
    { label: 'Create your first agent', done: false, cta: { href: '/dashboard/agents', label: 'Create agent' } },
    { label: 'Send your first message', done: false, cta: { href: '/dashboard/quickstart', label: 'Quickstart' } },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Welcome back, {user.name}</h1>
        <p className="text-gray-400 mt-1">Here's what's happening in your workspace.</p>
      </div>

      {/* Workspace card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">Your workspace</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold text-white">{activeOrg?.name || '—'}</div>
            <div className="text-sm text-gray-400 capitalize">{activeOrg?.role}</div>
          </div>
          <Link
            href="/dashboard/api-keys"
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            API Keys
          </Link>
        </div>
      </div>

      {/* Sandbox status (H) */}
      <SandboxStatusCard
        orgId={activeOrg?.id}
        connected={sandboxConnected}
      />

      {/* Get started checklist */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Get started</h2>
        <ul className="space-y-3">
          {checklist.map((item, i) => (
            <li
              key={i}
              className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    item.done ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {item.done ? '✓' : '○'}
                </div>
                <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {item.label}
                </span>
              </div>
              {item.cta && !item.done && (
                <Link
                  href={item.cta.href}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  {item.cta.label} →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
