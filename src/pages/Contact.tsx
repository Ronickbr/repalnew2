import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { table } from '../lib/schema';
import { useSiteSettings } from '../hooks/useSiteSettings';
import MyMapsComponent from '../components/MyMapsComponent';
import WhatsAppButton from '../components/WhatsAppButton';

const Contact: React.FC = () => {
  const { contactEmail, contactPhone, address } = useSiteSettings();
  const [formData, setFormData] = useState({
    client_name: '',
    email: '',
    phone: '',
    message: '',
    product_name: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState('entrega');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from(table('leads'))
        .insert({
          client_name: formData.client_name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          product_name: formData.product_name || 'Contato Geral'
        });

      if (error) throw error;

      setSubmitted(true);
      setFormData({
        client_name: '',
        email: '',
        phone: '',
        message: '',
        product_name: ''
      });
    } catch {
      // Erro já tratado pelo toast
      alert('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Endereço',
      details: address ? address.split(',').map(line => line.trim()) : [
        'Rua dos Equipamentos, 1234',
        'Distrito Industrial',
        'São Paulo - SP, 01234-567'
      ]
    },
    {
      icon: Phone,
      title: 'Telefones',
      details: [
        contactPhone || '(11) 99999-9999',
      ]
    },
    {
      icon: Mail,
      title: 'E-mails',
      details: [
        contactEmail || 'contato@repalequipamentos.com.br',
      ]
    },
    {
      icon: Clock,
      title: 'Horário de Funcionamento',
      details: [
        'Segunda a Sexta: 8h às 17h',
        'Sábado: 8h às 12h',
        'Domingo: Fechado'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-900 to-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Entre em Contato
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            Nossa equipe especializada está pronta para ajudar você a encontrar 
            as melhores soluções em equipamentos para sua cozinha industrial.
          </p>
        </div>
      </div>

      {/* Contact Form and Info */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Solicite um Orçamento
              </h2>
              <p className="text-gray-600 mb-8">
                Preencha o formulário abaixo e nossa equipe entrará em contato em breve.
              </p>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Check className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Mensagem enviada com sucesso!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Obrigado pelo seu interesse. Nossa equipe entrará em contato 
                    em breve para oferecer as melhores soluções para sua necessidade.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="bg-red-900 hover:bg-red-800 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300"
                  >
                    Enviar Nova Mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.client_name}
                        onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        placeholder="Seu nome completo"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Produto de Interesse
                      </label>
                      <input
                        type="text"
                        value={formData.product_name}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        placeholder="Ex: Fogão Industrial, Geladeira, etc."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem *
                    </label>
                    <textarea
                      rows={6}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                      placeholder="Conte-nos sobre sua necessidade, tipo de estabelecimento, quantidade de equipamentos, etc."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-red-900 hover:bg-red-800 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Enviar Mensagem</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Informações de Contato
              </h2>
              
              <div className="space-y-8">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="bg-red-100 rounded-lg p-3">
                        <IconComponent className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {info.title}
                        </h3>
                        <div className="space-y-1">
                          {info.details.map((detail, detailIndex) => (
                            <p key={detailIndex} className="text-gray-600">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Contact Buttons */}
              <div className="mt-12 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Contato Rápido
                </h3>
                
                <WhatsAppButton
                  className="w-full text-white px-6 py-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
                  message="Olá! Gostaria de solicitar um orçamento."
                >
                  
                  <span>WhatsApp</span>
                </WhatsAppButton>
                
                <a
                  href={`tel:${contactPhone?.replace(/\D/g, '') || '+5541999412928'}`}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white px-6 py-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
                >
                  <Phone className="h-6 w-6" />
                  <span>Ligar Agora</span>
                </a>
                
                <a
                  href={`mailto:${contactEmail || 'contato@repalequipamentos.com.br'}`}
                  className="w-full bg-gray-700 hover:bg-gray-800 text-white px-6 py-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-3"
                >
                  <Mail className="h-6 w-6" />
                  <span>Enviar E-mail</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nossa Localização
            </h2>
            <p className="text-xl text-gray-600">
              Visite nosso showroom e conheça de perto nossos equipamentos.
            </p>
          </div>
          
          <MyMapsComponent />
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-xl text-gray-600">
              Respostas para as dúvidas mais comuns sobre nossos produtos e serviços.
            </p>
          </div>
          
          {/* Tabs Navigation */}
          <div className="flex flex-wrap justify-center mb-8 bg-gray-100 rounded-lg p-2">
            <button
              onClick={() => setActiveTab('entrega')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 mx-1 mb-2 sm:mb-0 ${
                activeTab === 'entrega'
                  ? 'bg-red-900 text-white shadow-lg'
                  : 'text-gray-600 hover:text-red-900 hover:bg-white'
              }`}
            >
              Entrega &amp; Instalação
            </button>
            <button
              onClick={() => setActiveTab('garantia')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 mx-1 mb-2 sm:mb-0 ${
                activeTab === 'garantia'
                  ? 'bg-red-900 text-white shadow-lg'
                  : 'text-gray-600 hover:text-red-900 hover:bg-white'
              }`}
            >
              Garantia &amp; Manutenção
            </button>
            <button
              onClick={() => setActiveTab('produtos')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 mx-1 mb-2 sm:mb-0 ${
                activeTab === 'produtos'
                  ? 'bg-red-900 text-white shadow-lg'
                  : 'text-gray-600 hover:text-red-900 hover:bg-white'
              }`}
            >
              Produtos &amp; Serviços
            </button>
          </div>

          {/* Tab Content */}
          <div className="relative">
            {/* Entrega & Instalação Tab */}
            <div className={`transition-all duration-500 ${
              activeTab === 'entrega' 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-4 absolute inset-0 pointer-events-none'
            }`}>
              {activeTab === 'entrega' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Vocês fazem entrega em todo o Brasil?
                    </h3>
                    <p className="text-gray-600">
                      Sim, realizamos entregas em todo o território nacional. O prazo e valor 
                      do frete variam conforme a localização e o tipo de equipamento.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Oferecem serviço de instalação?
                    </h3>
                    <p className="text-gray-600">
                      Sim, temos equipe técnica especializada para instalação e configuração 
                      de todos os equipamentos que vendemos, garantindo o funcionamento perfeito.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Qual o prazo de entrega dos equipamentos?
                    </h3>
                    <p className="text-gray-600">
                      O prazo varia de acordo com o produto e localização. Equipamentos em estoque 
                      são entregues em 3-7 dias úteis. Produtos sob encomenda podem levar de 15-30 dias.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      A instalação está incluída no preço?
                    </h3>
                    <p className="text-gray-600">
                      A instalação básica está incluída para equipamentos de grande porte. 
                      Instalações especiais ou que requerem adaptações podem ter custo adicional.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Garantia & Manutenção Tab */}
            <div className={`transition-all duration-500 ${
              activeTab === 'garantia' 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-4 absolute inset-0 pointer-events-none'
            }`}>
              {activeTab === 'garantia' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Qual é o prazo de garantia dos equipamentos?
                    </h3>
                    <p className="text-gray-600">
                      A garantia varia conforme o fabricante e tipo de equipamento, 
                      geralmente entre 12 a 24 meses. Oferecemos também extensão de garantia.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Fazem manutenção preventiva?
                    </h3>
                    <p className="text-gray-600">
                      Sim, oferecemos planos de manutenção preventiva para garantir o 
                      funcionamento ideal dos equipamentos e prolongar sua vida útil.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      O que está coberto pela garantia?
                    </h3>
                    <p className="text-gray-600">
                      A garantia cobre defeitos de fabricação, peças e mão de obra. 
                      Não cobre danos por uso inadequado, desgaste natural ou acidentes.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Qual o tempo de resposta para assistência técnica?
                    </h3>
                    <p className="text-gray-600">
                      Nossa equipe técnica atende chamados em até 24 horas na Grande São Paulo 
                      e até 48 horas no interior e outras capitais.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Produtos & Serviços Tab */}
            <div className={`transition-all duration-500 ${
              activeTab === 'produtos' 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-4 absolute inset-0 pointer-events-none'
            }`}>
              {activeTab === 'produtos' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Quais tipos de equipamentos vocês vendem?
                    </h3>
                    <p className="text-gray-600">
                      Oferecemos linha completa de equipamentos para cozinha industrial: 
                      fogões, fornos, geladeiras, freezers, fritadeiras, chapas, coifas e muito mais.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Trabalham com equipamentos usados?
                    </h3>
                    <p className="text-gray-600">
                      Sim, temos uma seleção de equipamentos seminovos revisados e com garantia. 
                      Também fazemos avaliação para troca do seu equipamento usado.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Fazem projetos personalizados?
                    </h3>
                    <p className="text-gray-600">
                      Sim, nossa equipe desenvolve projetos completos para cozinhas industriais, 
                      desde o layout até a especificação dos equipamentos ideais.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Oferecem financiamento?
                    </h3>
                    <p className="text-gray-600">
                      Sim, trabalhamos com diversas modalidades de financiamento e parcelamento 
                      para facilitar a aquisição dos equipamentos para seu negócio.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-red-900 to-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Transforme sua Cozinha em uma Verdadeira Potência Gastronômica
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Entre em contato agora e descubra como nossos equipamentos podem 
            revolucionar sua operação culinária.
          </p>
          <WhatsAppButton
            message="Olá! Quero transformar minha cozinha em uma potência gastronômica."
            className="text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center space-x-2"
          >
            
            <span>Falar no WhatsApp Agora</span>
          </WhatsAppButton>
        </div>
      </div>
    </div>
  );
};

export default Contact;
