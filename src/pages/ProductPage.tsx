import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MessageCircle, Star, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { table } from '../lib/schema';
import type { Product, ProductImage } from '../lib/supabase';
import WhatsAppButton from '../components/WhatsAppButton';
import { Helmet } from 'react-helmet-async';
import { sanitizeMetaDescription } from '../lib/seo';
import { SafeHTML } from '../components/SafeHTML';

const ProductPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      if (!slug) return;

      try {
        // Fetch product with category info
        const { data: productData } = await supabase
          .from(table('products'))
          .select(`
            *,
            category:categories(id, name, slug)
          `)
          .eq('slug', slug)
          .eq('active', true)
          .single();

        if (productData) {
          setProduct(productData);

          // Fetch product images
          const { data: imagesData } = await supabase
            .from(table('product_images'))
            .select('*')
            .eq('product_id', productData.id)
            .order('id');

          if (imagesData) {
            setImages(imagesData);
          }
        }
      } catch {
        // Erro já tratado pelo estado
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [slug]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from(table('leads'))
        .insert({
          client_name: formData.client_name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          name: product.name,
          source: 'product_page'
        });

      if (error) throw error;

      setSubmitted(true);
      setFormData({ client_name: '', email: '', phone: '', message: '' });
    } catch {
      // Erro já tratado pelo toast
      alert('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h1>
          <Link
            to="/categorias"
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Voltar para categorias
          </Link>
        </div>
      </div>
    );
  }

  const whatsappMessage = `Olá! Gostaria de saber mais sobre o produto: ${product.name} `;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{product.name}</title>
        <meta name="description" content={sanitizeMetaDescription(product.description || '')} />
        <meta property="og:type" content="product" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: sanitizeMetaDescription(product.description || ''),
            image: images.map(i => i.image_url).filter(Boolean),
            category: product.category ? product.category.name : undefined,
            brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
            offers: {
              '@type': 'Offer',
              price: product.price || 0,
              priceCurrency: 'BRL',
              availability: 'https://schema.org/InStock',
              url: window.location.href
            }
          })}
        </script>
      </Helmet>
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              Início
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/categorias" className="text-gray-500 hover:text-gray-700">
              Categorias
            </Link>
            {product.category && (
              <>
                <span className="text-gray-400">/</span>
                <Link 
                  to={`/categorias/${product.category.slug}`} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <div>
            <div className="mb-6">
              <img
                src={images[selectedImageIndex]?.image_url || 'https://via.placeholder.com/600x600?text=Produto'}
                alt={images[selectedImageIndex]?.alt_text || product.name}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-red-500 ring-2 ring-red-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <Link
              to={product.category ? `/categorias/${product.category.slug}` : '/categorias'}
              className="inline-flex items-center text-red-600 hover:text-red-700 font-medium mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para {product.category?.name || 'categorias'}
            </Link>

            {product.featured && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <Star className="h-4 w-4 mr-1" />
                  Produto em Destaque
                </span>
              </div>
            )}

            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {product.name}
            </h1>

            <div className="prose prose-lg text-gray-600 mb-8">
              <SafeHTML 
                  className="prose prose-gray max-w-none"
                  html={product.description || ''}
                />
            </div>
            <h2 className="sr-only">Descrição do Produto</h2>

            {/* Features */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Características:</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Equipamento profissional de alta qualidade
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Ideal para cozinhas comerciais
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Garantia e suporte técnico especializado
                </li>
                <li className="flex items-center text-gray-600">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  Entrega e instalação disponível
                </li>
              </ul>
            </div>

            {/* Contact Actions */}
            <div className="space-y-4">
              <WhatsAppButton
                className="w-full text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-3"
                message={whatsappMessage}
              >
                <MessageCircle className="h-6 w-6" />
                <span>Consultar no WhatsApp</span>
              </WhatsAppButton>
              
              <button
                onClick={() => setShowContactForm(!showContactForm)}
                className="w-full bg-red-900 hover:bg-red-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 inline-flex items-center justify-center space-x-3"
              >
                <Mail className="h-6 w-6" />
                <span>Solicitar Orçamento</span>
              </button>
              
              <a
                href="tel:+5511999999999"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 inline-flex items-center justify-center space-x-3"
              >
                <Phone className="h-6 w-6" />
                <span>Ligar Agora</span>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        {showContactForm && (
          <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Solicitar Orçamento - {product.name}
            </h2>
            
            {submitted ? (
              <div className="text-center py-8">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Solicitação enviada com sucesso!
                </h3>
                <p className="text-gray-600">
                  Nossa equipe entrará em contato em breve.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setShowContactForm(false);
                  }}
                  className="mt-4 text-red-600 hover:text-red-700 font-medium"
                >
                  Fechar
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={`Gostaria de receber um orçamento para ${product.name}...`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2 flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-900 hover:bg-red-800 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300"
                  >
                    {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Por que escolher a Repal Equipamentos?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Qualidade Garantida
              </h3>
              <p className="text-gray-600">
                Equipamentos de alta qualidade com garantia e suporte técnico especializado.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Atendimento Especializado
              </h3>
              <p className="text-gray-600">
                Nossa equipe está pronta para ajudar você a escolher o equipamento ideal.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Entrega e Instalação
              </h3>
              <p className="text-gray-600">
                Serviços completos de entrega e instalação para sua comodidade.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
