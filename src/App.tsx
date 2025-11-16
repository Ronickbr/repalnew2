
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import Home from './pages/Home';
import CategoryProducts from './pages/CategoryProducts';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';
import TestUnifiedUpload from './pages/TestUnifiedUpload';
import TestPage from './pages/TestPage';
import AdminLayout from './layouts/AdminLayout';

import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppStoreSelector from './components/WhatsAppStoreSelector';
import { AuthProvider } from './hooks/useAuth';
import { WhatsAppProvider } from './contexts/WhatsAppContext';
import { BudgetProvider } from './contexts/BudgetContext';
import { queryClient } from './lib/react-query';



// Lazy load admin pages
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/admin/ProductsPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const BrandsPage = lazy(() => import('./pages/admin/BrandsPage'));
const BannersPage = lazy(() => import('./pages/admin/BannersPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const LeadsPage = lazy(() => import('./pages/admin/LeadsPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));

function App() {
  console.log('🚀 App: Aplicação iniciada!');
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <BudgetProvider>
            <WhatsAppProvider>
              <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="categorias/:categorySlug" element={<CategoryProducts />} />
              <Route path="categorias/:categorySlug/:subcategorySlug" element={<CategoryProducts />} />
              <Route path="CategoryProducts" element={<CategoryProducts />} />
              <Route path="produto/:slug" element={<ProductDetail />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/test-upload" element={<TestUnifiedUpload />} />
            <Route path="/test-db" element={<TestPage />} />
            <Route 
              path="/perfil" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div></div>}><DashboardPage /></Suspense>} />
              <Route path="products" element={<Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div></div>}><ProductsPage /></Suspense>} />
              <Route path="categories" element={<Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div></div>}><CategoriesPage /></Suspense>} />
              <Route path="brands" element={<Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div></div>}><BrandsPage /></Suspense>} />
              <Route path="banners" element={<Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div></div>}><BannersPage /></Suspense>} />
              <Route path="leads" element={<Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div></div>}><LeadsPage /></Suspense>} />
              <Route path="users" element={<Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div></div>}><UsersPage /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div></div>}><SettingsPage /></Suspense>} />
            </Route>
          </Routes>
              </Router>
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