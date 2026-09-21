import type { Metadata } from 'next';
import LandingV2 from '../components/landing/LandingV2';

export const metadata: Metadata = {
  title: 'RELT — AI agents for WhatsApp',
  description:
    'Build AI agents that actually do the work on WhatsApp. Connect, execute, observe and improve.',
};

export default function HomePage() {
  return <LandingV2 />;
}
