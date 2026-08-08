import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { fetchIntegrations } from './lib/integrations.ts';

const SUPABASE_URL_PUBLIC = import.meta.env.VITE_SUPABASE_URL as string | undefined;

function injectPreconnects() {
  if (typeof document === 'undefined') return;
  const preconnects: Array<{ href: string; crossorigin?: boolean }> = [
    { href: 'https://i.imgur.com', crossorigin: true },
  ];
  if (SUPABASE_URL_PUBLIC) {
    try {
      const url = new URL(SUPABASE_URL_PUBLIC);
      preconnects.push({ href: `${url.protocol}//${url.host}`, crossorigin: true });
    } catch {
      /* noop */
    }
  }
  const existingHrefs = new Set<string>();
  try {
    const tags = document.querySelectorAll<HTMLLinkElement>('link[rel="preconnect"], link[rel="dns-prefetch"]');
    tags.forEach((l) => { if (l.href) existingHrefs.add(l.href); });
  } catch { /* noop */ }

  for (const p of preconnects) {
    try {
      if (existingHrefs.has(p.href)) continue;
      const pc = document.createElement('link');
      pc.rel = 'preconnect';
      pc.href = p.href;
      if (p.crossorigin) pc.crossOrigin = 'anonymous';
      document.head.appendChild(pc);
      const dns = document.createElement('link');
      dns.rel = 'dns-prefetch';
      dns.href = p.href;
      document.head.appendChild(dns);
    } catch { /* noop */ }
  }
}

async function bootstrap() {
  try {
    const container = document.getElementById('root');
    if (!container) return;

    injectPreconnects();

    const root = ReactDOM.createRoot(container);

    const timeoutMs = 3000;
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms`)), ms)),
      ]);

    try {
      const integrations = await withTimeout(fetchIntegrations(), timeoutMs);
      (window as unknown as { __INTEGRATIONS__?: unknown }).__INTEGRATIONS__ = integrations;
    } catch (err) {
      console.warn(
        'Não foi possível carregar integrações no bootstrap:',
        err instanceof Error ? err.message : 'timeout/erro',
      );
    }

    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch (err) {
    console.error('Falha no bootstrap da aplicação:', err);
  }
}

void bootstrap();
