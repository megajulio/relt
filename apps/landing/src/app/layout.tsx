import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getMessages, translate } from "@/i18n";
import { I18nProvider } from "@/i18n/provider";
import { getActiveLocale } from "@/i18n/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getActiveLocale();
  return {
    title: translate(locale, "app.title"),
    description: translate(locale, "app.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Orden #62 · ANEXO-62-A (D2/D7): el idioma sale de la petición, así que el
  // layout es dinámico y `<html lang>` sigue siempre al idioma activo.
  const locale = await getActiveLocale();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <I18nProvider locale={locale} messages={getMessages(locale)}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
