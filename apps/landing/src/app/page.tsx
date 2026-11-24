import type { Metadata } from 'next';
import LandingV2 from '../components/landing/LandingV2';
import { translate } from '@/i18n';
import { getActiveLocale } from '@/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getActiveLocale();
  return {
    title: translate(locale, 'landing.meta.title'),
    description: translate(locale, 'landing.meta.description'),
  };
}

export default function HomePage() {
  return <LandingV2 />;
}
