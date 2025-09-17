import React from 'react';
import { Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from './Header';
import Footer from './Footer';
import { useSiteSettings } from '../hooks/useSiteSettings';

const Layout: React.FC = () => {
  const { siteName, metaTitle, metaDescription, metaKeywords } = useSiteSettings();

  return (
    <>
      <Helmet>
        <title>{metaTitle || `${siteName || 'Repal Equipamentos'} - Equipamentos Gastronômicos Profissionais`}</title>
        <meta name="description" content={metaDescription || 'Equipamentos gastronômicos profissionais de alta qualidade para restaurantes, padarias e cozinhas industriais. Fogões, fornos, geladeiras e muito mais.'} />
        <meta name="keywords" content={metaKeywords || 'equipamentos gastronômicos, cozinha industrial, fogões profissionais, fornos industriais, geladeiras comerciais, equipamentos para restaurante'} />
        <meta name="author" content={siteName || 'Repal Equipamentos'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content={metaTitle || `${siteName || 'Repal Equipamentos'} - Equipamentos Gastronômicos`} />
        <meta property="og:description" content={metaDescription || 'Equipamentos gastronômicos profissionais de alta qualidade para sua cozinha industrial.'} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle || `${siteName || 'Repal Equipamentos'} - Equipamentos Gastronômicos`} />
        <meta name="twitter:description" content={metaDescription || 'Equipamentos gastronômicos profissionais de alta qualidade para sua cozinha industrial.'} />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-white">
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