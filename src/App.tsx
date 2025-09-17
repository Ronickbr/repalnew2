import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import AllCategories from './pages/AllCategories';
import Category from './pages/Category';
import ProductDetail from './pages/ProductDetail';
import Contact from './pages/Contact';
import About from './pages/About';
import Admin from './pages/Admin';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppStoreSelector from './components/WhatsAppStoreSelector';
import { AuthProvider } from './hooks/useAuth';
import { WhatsAppProvider } from './contexts/WhatsAppContext';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <WhatsAppProvider>
          <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="categorias" element={<AllCategories />} />
              <Route path="categoria/:slug" element={<Category />} />
              <Route path="produto/:slug" element={<ProductDetail />} />
              <Route path="sobre" element={<About />} />
              <Route path="contato" element={<Contact />} />
            </Route>
            <Route path="/login" element={<Login />} />
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
  );
}

export default App;