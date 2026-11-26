'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/use-auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { DashboardAuthProvider } from '@/components/dashboard/DashboardAuthProvider';
import { isPlatformAdmin } from '@/lib/platform';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useT } from '@/i18n/provider';

// Orden #62 · ANEXO-62-A (D3): los datos de módulo guardan la CLAVE del catálogo,
// no el texto; el texto se resuelve en el render con `t()`.
const NAV_ITEMS = [
  { href: '/dashboard', labelKey: 'nav.overview', exact: true },
  { href: '/dashboard/agents', labelKey: 'nav.agents' },
  { href: '/dashboard/business-instructions', labelKey: 'nav.businessInstructions' },
  { href: '/dashboard/skills', labelKey: 'nav.skills' },
  { href: '/dashboard/tools', labelKey: 'nav.tools' },
  { href: '/dashboard/api-keys', labelKey: 'nav.apiKeys' },
  { href: '/dashboard/activity', labelKey: 'nav.activity' },
  { href: '/dashboard/quickstart', labelKey: 'nav.quickstart' },
];


/** Solo aparece si el servidor confirma que la sesión es de un administrador de plataforma. */
const PLATFORM_NAV_ITEM = { href: '/dashboard/platform/clients', labelKey: 'nav.platform' };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  const auth = useAuth();
  const pathname = usePathname();
  const [showPlatform, setShowPlatform] = useState(false);

  useEffect(() => {
    let cancelled = false;
    isPlatformAdmin().then((ok) => {
      if (!cancelled) setShowPlatform(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (auth.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">{t("dashboard.loading")}</div>
      </div>
    );
  }

  if (auth.status === 'unauthenticated') {
    return null; // useAuth ya redirigió a /login
  }

  if (auth.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-red-500/20 bg-gray-900 p-6 text-center">
          <h1 className="text-lg font-semibold text-white">
            {t("dashboard.unable-to-load-your-session")}
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            {auth.error.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t("dashboard.try-again")}
          </button>
        </div>
      </div>
    );
  }

  // Después de los guards, TypeScript sabe que auth.status === 'authenticated'
  const { user, organizations } = auth.data;
  const activeOrg = organizations[0];

  return (
    <DashboardAuthProvider
      data={auth.data}
      logout={auth.logout}
    >
      <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
<Image
  src="/images/relt-logo.png"
  alt={t("dashboard.relt-logo")}
  width={150} 
  height={32}
  // Agrega esto para complacer al optimizador
  style={{ width: 'auto' }} 
  // Usa solo la altura que desees
  className="h-8" 
  priority
/>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {(showPlatform ? [...NAV_ITEMS, PLATFORM_NAV_ITEM] : NAV_ITEMS).map((item) => {
            const isActive = 'exact' in item && item.exact
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
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2">{t("dashboard.workspace")}</div>
          <div className="text-sm text-white truncate">{activeOrg?.name || '—'}</div>
          <div className="text-xs text-gray-500 capitalize">{activeOrg?.role}</div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-8">
          <div className="text-sm text-gray-400">
            {t("dashboard.welcome-back")} <span className="text-white">{user.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <button
              onClick={auth.logout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t("dashboard.logout")}
            </button>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
    </DashboardAuthProvider>
  );
}
