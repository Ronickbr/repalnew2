import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from './Header';
import Footer from './Footer';
import GlobalPopup from './GlobalPopup';
import PopupManager from './PopupManager';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { logActivity } from '../lib/supabase';

const Layout: React.FC = () => {
  const { siteName, metaTitle, metaDescription, metaKeywords, canonicalBaseUrl } = useSiteSettings();
  const location = useLocation();
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

  React.useEffect(() => {
    const vidKey = 'repal_visitor_id';
    const visitLoggedKey = 'repal_visit_logged';
    let visitorId = localStorage.getItem(vidKey);
    if (!visitorId) {
      visitorId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(vidKey, visitorId);
    }
    const alreadyLogged = localStorage.getItem(visitLoggedKey);
    if (!alreadyLogged) {
      const details = {
        visitor_id: visitorId,
        path: location.pathname,
        referrer: document.referrer || undefined,
      };
      logActivity({
        action: 'site_visit',
        resource_type: 'site',
        resource_id: 'repal',
        details: JSON.stringify(details),
        user_agent: navigator.userAgent,
        status: 'success',
      })
      localStorage.setItem(visitLoggedKey, '1');
    }
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>{metaTitle || `${siteName || 'Repal Equipamentos'} - Equipamentos Gastronômicos Profissionais`}</title>
        <meta name="description" content={metaDescription || 'Equipamentos gastronômicos profissionais de alta qualidade para restaurantes, padarias e cozinhas industriais. Fogões, fornos, geladeiras e muito mais.'} />
        <meta name="keywords" content={metaKeywords || 'equipamentos gastronômicos, cozinha industrial, fogões profissionais, fornos industriais, geladeiras comerciais, equipamentos para restaurante'} />
        <meta name="robots" content="index, follow" />
        {canonicalHref && <link rel="canonical" href={canonicalHref} />}
        {canonicalHref && <link rel="alternate" href={canonicalHref} hrefLang="pt-BR" />}
        {canonicalHref && <link rel="alternate" href={canonicalHref} hrefLang="x-default" />}
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <meta name="author" content={siteName || 'Repal Equipamentos'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="content-language" content="pt-BR" />
        <meta property="og:title" content={metaTitle || `${siteName || 'Repal Equipamentos'} - Equipamentos Gastronômicos`} />
        <meta property="og:description" content={metaDescription || 'Equipamentos gastronômicos profissionais de alta qualidade para sua cozinha industrial.'} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle || `${siteName || 'Repal Equipamentos'} - Equipamentos Gastronômicos`} />
        <meta name="twitter:description" content={metaDescription || 'Equipamentos gastronômicos profissionais de alta qualidade para sua cozinha industrial.'} />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-white">
        <PopupManager />
        <GlobalPopup />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Layout;
