import { env } from 'cloudflare:workers';
import { configuredProductApi } from '../../src/product-api';
import OnboardingView from './view';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Your curiosity — Polymatik AI' };

export default function OnboardingPage() {
  return (
    <OnboardingView
      expanded={configuredProductApi(env).catalogVersion === 'v2'}
    />
  );
}
