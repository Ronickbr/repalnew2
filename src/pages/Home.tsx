import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Truck, Shield, MessageCircle } from 'lucide-react';
import BannerCarousel from '../components/BannerCarousel';
import { supabase } from '../lib/supabase';
import { table } from '../lib/schema';
import { useBudget } from '../contexts/BudgetContext';
import { useLatestProducts } from '../hooks/useProducts';

import WhatsAppButton from '../components/WhatsAppButton';

interface FeaturedProduct {
  id: number;
  name: string;
  image_url: string | null;
  slug: string;
  category_id?: number;
  featured_on_homepage?: boolean;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

const Home: React.FC = () => {

  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useBudget();
  const { data: latestProducts, isLoading: loadingLatest } = useLatestProducts(6);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Primeiro tenta buscar produtos em destaque na homepage
        let { data: productsData, error: productsError } = await supabase
          .from(table('products'))
          .select(`
            id,
            name,
            description,
            image,
            slug,
            featured,
            category_id,
            featured_on_homepage,
            created_at
          `)
          .eq('featured', true)
          .eq('active', true)
          .limit(8);

        // Se não houver produtos em destaque na homepage, tenta apenas featured
        if (!productsData || productsData.length === 0) {
          console.log('🔄 Nenhum produto com featured=true, tentando apenas featured_on_homepage=true');
          const { data: featuredData, error: featuredError } = await supabase
            .from(table('products'))
            .select(`
              id,
              name,
              description,
              image,
              slug,
              featured,
              category_id,
              featured_on_homepage,
              created_at
            `)
            .eq('featured', false)
            .eq('featured_on_homepage', true)
            .eq('active', true)
            .limit(8);
          
          productsData = featuredData;
          productsError = featuredError;
        }

        // Se ainda não houver produtos, busca os mais recentes ativos
        if (!productsData || productsData.length === 0) {
          console.log('🔄 Nenhum produto com featured=true, buscando produtos ativos recentes');
          const { data: recentData, error: recentError } = await supabase
            .from(table('products'))
            .select(`
              id,
              name,
              description,
              image,
              slug,
              featured,
              category_id,
              featured_on_homepage,
              created_at
            `)
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(8);
          
          productsData = recentData;
          productsError = recentError;
        }

        if (productsError) {
          console.error('Erro ao buscar produtos em destaque:', productsError);
          return;
        }

        if (productsData) {
          console.log('📦 Produtos em destaque carregados:', productsData.length, 'produtos');
          const transformedProducts = productsData.map((product: any) => ({
            id: product.id,
            name: product.name,
            image_url: product.image,
            slug: product.slug,
            category_id: product.category_id,
            featured_on_homepage: product.featured_on_homepage,
            active: true,
            created_at: product.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          console.log('🔄 Produtos transformados:', transformedProducts.length, 'produtos');
          setFeaturedProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);





  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2" style={{borderColor: '#8B0000'}}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner Carousel */}
      <BannerCarousel />

      {/* Produtos Populares Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Produtos Populares</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.image_url || 'https://via.placeholder.com/400x400?text=Produto'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 mb-4">Equipamento profissional para seu negócio.</p>
                    <div className="space-y-3">
                      <Link
                        to={product.slug ? `/produto/${product.slug}` : '#'}
                        onClick={(e) => {
                          console.log('🎯 Link clicado - Product slug:', product.slug, 'Product name:', product.name);
                          console.log('🎯 URL completa:', product.slug ? `/produto/${product.slug}` : 'SEM SLUG');
                          if (!product.slug) {
                            console.error('❌ Produto sem slug!');
                            e.preventDefault();
                          }
                        }}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors block text-center"
                      >
                        Ver Detalhes
                      </Link>
                      <button 
                        onClick={() => addItem({
                          id: product.id.toString(),
                          name: product.name,
                          image: product.image_url || undefined
                        })}
                        className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                      >
                        Incluir na Lista
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8L9 7l-2 2 2 2 2 2 2-2 2-2 2 2 2 2-2 2-2 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum produto disponível</h3>
                  <p className="text-gray-600 mb-4">Em breve teremos produtos incríveis para você!</p>
                  <Link
                    to="/contato"
                    className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Entre em contato
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categorias Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Categorias</h2>
            <p className="text-gray-600">Confira nossas categorias online</p>
          </div>
          
          {/* Grid de Categorias */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Restaurantes */}
            <Link
              to="/categorias/bares-restaurantes"
              className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-64"
            >
              <div className="absolute inset-0">
                <img
                  src="/images/restaurante.png"
                  alt="Restaurantes"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40"></div>
              </div>
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold mb-2">Restaurantes</h3>
                <p className="text-gray-200 text-xs sm:text-sm mb-3">Equipamentos que trazem agilidade, eficiência e qualidade para sua cozinha profissional.</p>
                <span className="text-white text-xs sm:text-sm font-medium flex items-center">
                  Ver Mais <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </div>
            </Link>

            {/* Açougues */}
            <Link
              to="/categorias/acougue"
              className="group relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-64"
              style={{background: 'linear-gradient(to bottom right, #8B0000, #660000)'}}
            >
              <div className="absolute inset-0">
                <img
                  src="/images/açougue.png"
                  alt="Açougues"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0" style={{backgroundColor: '#8B0000', opacity: 0.4}}></div>
              </div>
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold mb-2">Açougues</h3>
                <p className="text-gray-200 text-xs sm:text-sm mb-3">Máquinas robustas para cortes perfeitos, mais produtividade e higiene no dia a dia.</p>
                <span className="text-white text-xs sm:text-sm font-medium flex items-center">
                  Ver Mais <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </div>
            </Link>

            {/* Padarias */}
            <Link
              to="/categorias/padaria-confeitaria"
              className="group relative bg-gradient-to-br from-yellow-600 to-orange-600 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-64"
            >
              <div className="absolute inset-0">
                <img
                  src="/images/padarias.png"
                  alt="Padarias"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-yellow-900/40"></div>
              </div>
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold mb-2">Padarias</h3>
                <p className="text-gray-200 text-xs sm:text-sm mb-3">Forno e masseiras de alto desempenho para produção rápida, padronizada e de qualidade.</p>
                <span className="text-white text-xs sm:text-sm font-medium flex items-center">
                  Ver Mais <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </div>
            </Link>

            {/* Todas as Linhas */}
            <Link
              to="/categorias"
              className="group relative bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-64"
            >
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80"
                  alt="Todas as Linhas"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gray-900/40"></div>
              </div>
              <div className="relative z-10 p-6 h-full flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold mb-2">Todas as Linhas</h3>
                <p className="text-gray-200 text-xs sm:text-sm mb-3">Variedade completa em equipamentos industriais para todos os tipos de negócio.</p>
                <span className="text-white text-xs sm:text-sm font-medium flex items-center">
                  Ver Mais <ArrowRight className="h-4 w-4 ml-1" />
                </span>
              </div>
            </Link>
          </div>


        </div>
      </section>

      {/* Seção Novidades */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Novidades</h2>
            <p className="text-gray-600">Conheça nossos últimos lançamentos</p>
          </div>
          
          {/* Loading State */}
          {loadingLatest && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderColor: '#8B0000'}}></div>
            </div>
          )}
          
          {/* Grid de Novidades */}
          {!loadingLatest && latestProducts && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestProducts.map((product, index) => (
                <div key={product.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
                  <div className="relative">
                    <img
                      src={product.product_images?.[0]?.image_url || product.image_url || 'https://via.placeholder.com/400x300?text=Produto'}
                      alt={product.name}
                      className="w-full h-48 object-contain bg-gray-50"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {index === 0 ? 'NOVO' : index === 1 ? 'LANÇAMENTO' : 'RECENTE'}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{product.name}</h3>
                    <div className="space-y-3">
                      <Link
                        to={product.slug ? `/produto/${product.slug}` : '#'}
                        onClick={(e) => {
                          console.log('🎯 Novidades - Link clicado - Product slug:', product.slug, 'Product name:', product.name);
                          console.log('🎯 Novidades - URL completa:', product.slug ? `/produto/${product.slug}` : 'SEM SLUG');
                          if (!product.slug) {
                            console.error('❌ Novidades - Produto sem slug!');
                            e.preventDefault();
                          }
                        }}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors block text-center"
                      >
                        Ver Detalhes
                      </Link>
                      <button 
                        onClick={() => addItem({
                          id: product.id.toString(),
                          name: product.name,
                          image: product.product_images?.[0]?.image_url || product.image_url || undefined
                        })}
                        className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                      >
                        Incluir na Lista
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}


        </div>
      </section>

      {/* Seção Final - Potência e Eficiência */}
      <section className="py-16 bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Potência e Eficiência na Sua Cozinha</h2>
              <p className="text-xl text-gray-300 mb-8">
                Equipamentos projetados para atender grandes demandas
              </p>
              <p className="text-gray-400 mb-8">
                Nossa linha de equipamentos comerciais oferece a combinação perfeita entre potência, 
                eficiência energética e durabilidade, garantindo o melhor desempenho para seu negócio.
              </p>
              <Link
                to="/contato"
                className="bg-yellow-500 text-black px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-colors inline-block"
              >
                Solicite Orçamento
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-700 rounded-xl p-6 text-center">
                <img
                  src="/images/h-fritadeira.png"
                  alt="Fritadeira"
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h4 className="font-bold">Fritadeiras</h4>
              </div>
              
              <div className="bg-gray-700 rounded-xl p-6 text-center">
                <img
                  src="/images/chapa-bifeteira.jpg"
                  alt="Chapas"
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
                <h4 className="font-bold">Chapas</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Redesigned */}
      <section className="py-12 bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#8B0000'}}>
                  <Truck className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-gray-900 leading-tight">Frete Rápido e Seguro</div>
                <div className="text-sm text-gray-600 font-medium leading-tight">Chega até você sem demora.</div>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#8B0000'}}>
                  <Award className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-gray-900 leading-tight">Padrão Profissional</div>
                <div className="text-sm text-gray-600 font-medium leading-tight">Tecnologia de nível industrial.</div>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
               <div className="flex-shrink-0">
                 <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#8B0000'}}>
                   <Shield className="h-6 w-6 text-white" />
                 </div>
               </div>
               <div className="flex-1 min-w-0">
                 <div className="text-lg font-bold text-gray-900 leading-tight">Proteção Total</div>
                 <div className="text-sm text-gray-600 font-medium leading-tight">Embalagens resistentes contra danos.</div>
               </div>
             </div>
             <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
               <div className="flex-shrink-0">
                 <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{backgroundColor: '#8B0000'}}>
                   <MessageCircle className="h-6 w-6 text-white" />
                 </div>
               </div>
               <div className="flex-1 min-w-0">
                 <div className="text-lg font-bold text-gray-900 leading-tight">Atendimento 24/7</div>
                 <div className="text-sm text-gray-600 font-medium leading-tight">Suporte para qualquer situação.</div>
               </div>
             </div>
          </div>
        </div>
      </section>



      {/* Partners/Suppliers Carousel Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nossos Parceiros de Confiança
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trabalhamos com as melhores marcas do mercado para oferecer equipamentos de alta qualidade
            </p>
          </div>
          
          {/* Carousel Container */}
          <div className="relative overflow-hidden">
            <div className="flex animate-scroll space-x-12 items-center">
              {/* First set of logos */}
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://gelopar.com.br/storage/logo/k9Cu7sKBfsqPP1ralzQrPDPxKFA5JcCeZhZWMZad.png"
                  alt="GELOPAR"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://d8vlg9z1oftyc.cloudfront.net/siemsen/image/media/5e3b022ac50ab-logo.jpg"
                  alt="SKYMSEN"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://www.simecan.com.br/fotos/1/136/Design%20sem%20nome.png"
                  alt="DAK"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://www.sulpack.com.br/img/logo.png"
                  alt="SULPACK"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://static.wixstatic.com/media/223c21_034535d90b1a4d09843eb98155a1a564~mv2.png/v1/crop/x_0,y_57,w_2282,h_869/fill/w_200,h_76,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/logoRGB_tita-03.png"
                  alt="TITA"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://i.imgur.com/ofWD079.png"
                  alt="PRATICA"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://i.imgur.com/VGxeoMm.png"
                  alt="LAYR"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://www.urano.com.br/wp-content/uploads/2024/06/logo_URANO-1024x239.png"
                  alt="URANO"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://www.cafmaquinas.com.br/public/images/logo-black.png"
                  alt="CAF"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://www.venanciometal.com.br/settings/1785113355577647.webp"
                  alt="VENANCIO"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
              
              <div className="flex-shrink-0 w-32 h-20 flex items-center justify-center bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <img
                  src="https://images.seeklogo.com/logo-png/26/1/gastromaq-logo-png_seeklogo-267299.png"
                  alt="GASTROMAQ"
                  className="max-w-full max-h-full object-contain filter grayscale hover:grayscale-0 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-white" style={{backgroundColor: '#8B0000'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para revolucionar sua cozinha?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Entre em contato conosco e descubra como nossos equipamentos podem 
            transformar seu negócio gastronômico em um verdadeiro sucesso.
          </p>
          <div className="flex justify-center">
            <WhatsAppButton
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
              message="Olá! Gostaria de saber mais sobre os equipamentos da Repal."
            >
              <span>Falar no WhatsApp</span>
              <ArrowRight className="h-5 w-5" />
            </WhatsAppButton>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;