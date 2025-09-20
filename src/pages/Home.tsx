import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Truck, Shield, MessageCircle } from 'lucide-react';
import BannerCarousel from '../components/BannerCarousel';
import { supabase } from '../lib/supabase';
import type { Product } from '../lib/supabase';

import WhatsAppButton from '../components/WhatsAppButton';

const Home: React.FC = () => {

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: productsData } = await supabase
          .from('products')
          .select(`
            id,
            product_name,
            description,
            image_url,
            slug,
            featured,
            category_id,
            categories!products_category_id_fkey(name)
          `)
          .eq('featured', true)
          .limit(4);

        if (productsData) {
          const transformedProducts = productsData.map(product => ({
            ...product,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
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

      {/* Produtos Populares Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Produtos Populares</h2>
            <Link
              to="/categorias"
              className="text-white px-6 py-2 rounded-lg font-medium transition-colors"
              style={{backgroundColor: '#8B0000'}}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#660000'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#8B0000'}
            >
              Veja todos os produtos
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/produto/${product.slug}`}
                className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={product.image_url || 'https://via.placeholder.com/400x400?text=Produto'}
                    alt={product.product_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 transition-colors line-clamp-2 group-hover:" onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#8B0000'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = ''}>
                    {product.product_name}
                  </h3>
                  <div className="font-medium text-sm" style={{color: '#8B0000'}}>
                    Consulte o preço
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WhatsAppButton
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
              message="Olá! Gostaria de saber mais sobre os equipamentos da Repal."
            >
              <span>Falar no WhatsApp</span>
              <ArrowRight className="h-5 w-5" />
            </WhatsAppButton>
            <Link
              to="/contato"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
              onMouseEnter={(e) => {(e.target as HTMLElement).style.backgroundColor = 'white'; (e.target as HTMLElement).style.color = '#8B0000';}}
              onMouseLeave={(e) => {(e.target as HTMLElement).style.backgroundColor = 'transparent'; (e.target as HTMLElement).style.color = 'white';}}
            >
              <span>Formulário de Contato</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;