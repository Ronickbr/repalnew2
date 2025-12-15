import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Award, Clock, Star } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import WhatsAppButton from '../components/WhatsAppButton';

const About: React.FC = () => {
  const { siteName, siteDescription } = useSiteSettings();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const stats = [
    { number: '60+', label: 'Anos de Experiência' },
    { number: '5000+', label: 'Clientes Satisfeitos' },
    { number: '10000+', label: 'Equipamentos Vendidos' },
    { number: '24/7', label: 'Suporte Técnico' }
  ];

  const values = [
    {
      icon: Award,
      title: 'Qualidade',
      description: 'Oferecemos apenas equipamentos de alta qualidade, testados e aprovados por profissionais da área.'
    },
    {
      icon: Users,
      title: 'Atendimento',
      description: 'Nossa equipe especializada está sempre pronta para oferecer o melhor atendimento e suporte técnico.'
    },
    {
      icon: Clock,
      title: 'Agilidade',
      description: 'Processos otimizados para garantir entregas rápidas e instalações eficientes.'
    },
    {
      icon: Star,
      title: 'Excelência',
      description: 'Buscamos constantemente a excelência em todos os nossos serviços e produtos oferecidos.'
    }
  ];



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 
                className="text-5xl font-bold mb-6"
                style={isMobile ? { fontSize: '22px' } : {}}
              >
                Repal Equipamentos - Transformando Cozinhas há Mais de 60 Anos
              </h1>
              <p 
                className="text-xl text-gray-200 leading-relaxed mb-8"
                style={isMobile ? { fontSize: '18px' } : {}}
              >
                {siteDescription || 'A Repal Equipamentos é líder no fornecimento de equipamentos profissionais para cozinhas industriais, oferecendo soluções completas que transformam ambientes gastronômicos em verdadeiras potências culinárias.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/categorias"
                  className="bg-white text-red-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
                >
                  <span>Ver Categorias</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/contato"
                  className="bg-transparent border-2 border-white hover:bg-white hover:text-red-900 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 inline-flex items-center justify-center space-x-2"
                >
                  <span>Fale Conosco</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="/images/coz2.jpg"
                alt="Cozinha Industrial Moderna"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-red-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Nossa História
              </h2>
              <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
                <p>
                  Fundada em 1962, a Repal Equipamentos nasceu da visão de fornecer 
                  equipamentos de alta qualidade para o setor gastronômico brasileiro. 
                  Começamos como uma pequena empresa familiar e hoje somos referência 
                  nacional no segmento.
                </p>
                <p>
                  Ao longo dos anos, construímos relacionamentos sólidos com os principais 
                  fabricantes mundiais, garantindo que nossos clientes tenham acesso às 
                  mais modernas tecnologias em equipamentos para cozinha industrial.
                </p>
                <p>
                  Nossa missão é <strong>transformar cozinhas em verdadeiras potências 
                  gastronômicas</strong>, oferecendo não apenas equipamentos, mas soluções 
                  completas que incluem consultoria, instalação e suporte técnico especializado.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
              src="https://i.imgur.com/O4LVLnI.jpeg"
              alt="Loja Física da Repal Equipamentos"
              className="rounded-lg shadow-xl"
            />
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nossos Valores
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Os princípios que guiam nossa empresa e garantem a satisfação de nossos clientes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-all duration-300">
                  <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>



      {/* CTA Section */}
      <div className="bg-gradient-to-r from-red-900 to-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para Transformar sua Cozinha?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Entre em contato conosco e descubra como podemos ajudar você a criar 
            uma verdadeira potência gastronômica.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WhatsAppButton
              className="text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
              message={`Olá! Gostaria de saber mais sobre os equipamentos da ${siteName || 'Repal'}.`}
            >
              <span>WhatsApp</span>
              <ArrowRight className="h-5 w-5" />
            </WhatsAppButton>
            <Link
              to="/contato"
              className="bg-transparent border-2 border-white hover:bg-white hover:text-red-900 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
            >
              <span>Formulário de Contato</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
