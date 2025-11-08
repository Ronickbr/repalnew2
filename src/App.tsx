
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import CategoryProducts from './pages/CategoryProducts';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';
import Login from './pages/Login';
import UserProfile from './pages/UserProfile';

import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppStoreSelector from './components/WhatsAppStoreSelector';
import { AuthProvider } from './hooks/useAuth';
import { WhatsAppProvider } from './contexts/WhatsAppContext';
import { queryClient } from './lib/react-query';

function App() {
  console.log('🚀 App: Aplicação iniciada!');
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <WhatsAppProvider>
            <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />

              <Route path="categorias/:categorySlug" element={<CategoryProducts />} />
              <Route path="categorias/:categorySlug/:subcategorySlug" element={<CategoryProducts />} />
              <Route path="produto/:slug" element={<ProductDetail />} />
          </Route>
          <Route path="/login" element={<Login />} />

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
                  <Admin />
                </ProtectedRoute>
              } 
            />
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
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;