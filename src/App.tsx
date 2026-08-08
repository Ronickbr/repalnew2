
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { lazy, Suspense, memo } from 'react';
import Layout from './components/Layout';
import PageSkeleton from './components/PageSkeleton';

import AdminLayout from './layouts/AdminLayout';

import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppStoreSelector from './components/WhatsAppStoreSelector';
import { AuthProvider } from './hooks/useAuth';
import { WhatsAppProvider } from './contexts/WhatsAppContext';
import { BudgetProvider } from './contexts/BudgetContext';
import { queryClient } from './lib/react-query';

import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from '@vercel/speed-insights/react'

/* =========================
   PUBLIC PAGES (code-split)
   ========================= */
const Home = lazy(() => import('./pages/Home'));
const CategoriesIndex = lazy(() => import('./pages/CategoriesIndex'));
const CategoryProducts = lazy(() => import('./pages/CategoryProducts'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));

/* =========================
   ADMIN PAGES (code-split)
   ========================= */
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const BrandsPage = lazy(() => import('./pages/admin/BrandsPage'));
const BannersPage = lazy(() => import('./pages/admin/BannersPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const LeadsPage = lazy(() => import('./pages/admin/LeadsPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const PriceAdjustmentsPage = lazy(() => import('./pages/admin/PriceAdjustmentsPage'));

function SuspenseWithSkeleton({
  children,
  type,
  items,
}: {
  children: React.ReactNode;
  type?: 'home' | 'category' | 'detail' | 'list' | 'text' | 'admin';
  items?: number;
}) {
  return (
    <Suspense fallback={<PageSkeleton type={type} items={items} />}>
      {children}
    </Suspense>
  );
}
const SS = memo(SuspenseWithSkeleton);

const SpinAdmin = memo(function SpinAdmin() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900" />
    </div>
  );
});

function App() {
  return <AppContent />;
}

function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <BudgetProvider>
            <WhatsAppProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<SS type="home"><Home /></SS>} />
                    <Route path="categorias" element={<SS type="list" items={10}><CategoriesIndex /></SS>} />
                    <Route path="categorias/:categorySlug" element={<SS type="category"><CategoryProducts /></SS>} />
                    <Route path="categorias/:categorySlug/:subcategorySlug" element={<SS type="category"><CategoryProducts /></SS>} />
                    <Route path="produto/:slug" element={<SS type="detail"><ProductDetail /></SS>} />
                    <Route path="sobre" element={<SS type="text" items={12}><About /></SS>} />
                    <Route path="contato" element={<SS type="list" items={4}><Contact /></SS>} />
                    <Route
                      path="perfil"
                      element={
                        <ProtectedRoute requireAdmin={false}>
                          <SS type="list" items={6}><UserProfile /></SS>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="minha-conta"
                      element={<Navigate to="/perfil" replace />}
                    />
                    <Route path="*" element={<SS type="text" items={3}><NotFound /></SS>} />
                  </Route>
                  <Route path="/login" element={<SS type="list" items={4}><Login /></SS>} />
                  <Route path="/cadastro" element={<SS type="list" items={6}><Register /></SS>} />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Suspense fallback={<SpinAdmin />}><DashboardPage /></Suspense>} />
                    <Route path="products" element={<Suspense fallback={<SpinAdmin />}><ProductsPage /></Suspense>} />
                    <Route path="products/adjustments" element={<Suspense fallback={<SpinAdmin />}><PriceAdjustmentsPage /></Suspense>} />
                    <Route path="categories" element={<Suspense fallback={<SpinAdmin />}><CategoriesPage /></Suspense>} />
                    <Route path="brands" element={<Suspense fallback={<SpinAdmin />}><BrandsPage /></Suspense>} />
                    <Route path="banners" element={<Suspense fallback={<SpinAdmin />}><BannersPage /></Suspense>} />
                    <Route path="leads" element={<Suspense fallback={<SpinAdmin />}><LeadsPage /></Suspense>} />
                    <Route path="users" element={<Suspense fallback={<SpinAdmin />}><UsersPage /></Suspense>} />
                    <Route path="settings" element={<Suspense fallback={<SpinAdmin />}><SettingsPage /></Suspense>} />
                  </Route>
                </Routes>
              </Router>
              <Analytics />
              <SpeedInsights />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#333',
                    border: '1px solid #e5e7eb',
                  },
                }}
              />
              <WhatsAppStoreSelector />
            </WhatsAppProvider>
          </BudgetProvider>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
