import React, { useMemo, useEffect } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from './Header';
import Footer from './Footer';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { logActivity } from '../lib/supabase';

const Layout: React.FC = () => {
  const { siteName, metaTitle, metaDescription, metaKeywords, canonicalBaseUrl } = useSiteSettings();
  const location = useLocation();
  const navigation = useNavigation();

  const rawOrigin = (canonicalBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')).trim();
  const origin = rawOrigin.replace(/\/+$/, '');
  let canonicalPath = location.pathname || '/';
  if (canonicalPath !== '/') {
    canonicalPath = canonicalPath.replace(/\/+$/, '') || '/';
  }
  if (canonicalPath === '/CategoryProducts') {
    canonicalPath = '/categorias';
  }
  const canonicalHref = origin ? `${origin}${canonicalPath}` : undefined;

  const isNavigating = navigation.state !== 'idle';

  useEffect(() => {
    const vidKey = 'repal_visitor_id';
    const visitLoggedKey = 'repal_visit_logged';
    let visitorId: string | null = null;
    try {
      visitorId = localStorage.getItem(vidKey);
    } catch {
      visitorId = null;
    }
    if (!visitorId) {
      visitorId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      try {
        localStorage.setItem(vidKey, visitorId);
      } catch {
        /* storage indisponível — não bloqueia o fluxo */
      }
    }
    let alreadyLogged: string | null = null;
    try {
      alreadyLogged = sessionStorage.getItem(visitLoggedKey);
    } catch {
      alreadyLogged = null;
    }
    if (!alreadyLogged) {
      const details = {
        visitor_id: visitorId,
        path: location.pathname,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      };
      try {
        logActivity({
          action: 'site_visit',
          resource_type: 'site',
          resource_id: 'repal',
          details: JSON.stringify(details),
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          status: 'success',
        });
      } catch {
        /* logActivity falhou — erro silencioso, sem impacto no usuário */
      }
      try {
        sessionStorage.setItem(visitLoggedKey, '1');
      } catch {
        /* storage indisponível — não bloqueia o fluxo */
      }
    }
  }, [location.pathname]);

  const contentStyle = useMemo<React.CSSProperties>(() => {
    if (!isNavigating) {
      return { transition: 'opacity 150ms ease-out, filter 150ms ease-out' };
    }
    return {
      opacity: 0.7,
      filter: 'blur(0.5px)',
      transition: 'opacity 100ms ease-out, filter 100ms ease-out',
      willChange: 'opacity, filter',
    } as React.CSSProperties;
  }, [isNavigating]);

  const pageTitle = useMemo(
    () => metaTitle || `${siteName || 'Repal Equipamentos'} - Equipamentos Gastronômicos Profissionais`,
    [metaTitle, siteName]
  );
  const pageDescription = useMemo(
    () =>
      metaDescription ||
      'Equipamentos gastronômicos profissionais de alta qualidade para restaurantes, padarias e cozinhas industriais. Fogões, fornos, geladeiras e muito mais.',
    [metaDescription]
  );
  const pageKeywords = useMemo(
    () =>
      metaKeywords ||
      'equipamentos gastronômicos, cozinha industrial, fogões profissionais, fornos industriais, geladeiras comerciais, equipamentos para restaurante',
    [metaKeywords]
  );
  const ogTitle = useMemo(
    () => metaTitle || `${siteName || 'Repal Equipamentos'} - Equipamentos Gastronômicos`,
    [metaTitle, siteName]
  );
  const ogDescription = useMemo(
    () =>
      metaDescription ||
      'Equipamentos gastronômicos profissionais de alta qualidade para sua cozinha industrial.',
    [metaDescription]
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta name="robots" content="index, follow" />
        {canonicalHref && <link rel="canonical" href={canonicalHref} />}
        {canonicalHref && <link rel="alternate" href={canonicalHref} hrefLang="pt-BR" />}
        {canonicalHref && <link rel="alternate" href={canonicalHref} hrefLang="x-default" />}
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <meta name="author" content={siteName || 'Repal Equipamentos'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="content-language" content="pt-BR" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-white" data-layout-root>
        <Header />
        <main
          className="flex-1"
          style={contentStyle}
          aria-busy={isNavigating || undefined}
          data-nav-state={navigation.state}
        >
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
