'use client';

import { useAuth } from '@/lib/use-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', exact: true },
  { href: '/dashboard/api-keys', label: 'API Keys' },
  { href: '/dashboard/activity', label: 'Activity' },
  { href: '/dashboard/quickstart', label: 'Quickstart' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();

  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (auth.status === 'unauthenticated') {
    return null; // useAuth ya redirigió a /login
  }

  // Después de los guards, TypeScript sabe que auth.status === 'authenticated'
  const { user, organizations } = auth.data;
  const activeOrg = organizations[0];

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <Link href="/" className="text-2xl font-bold text-white">
            relt
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2">Workspace</div>
          <div className="text-sm text-white truncate">{activeOrg?.name || '—'}</div>
          <div className="text-xs text-gray-500 capitalize">{activeOrg?.role}</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-8">
          <div className="text-sm text-gray-400">
            Welcome back, <span className="text-white">{user.name}</span>
          </div>
          <button
            onClick={auth.logout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
