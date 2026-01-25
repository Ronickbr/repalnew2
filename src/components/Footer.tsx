import React, { useEffect, useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

const Footer: React.FC = () => {
  const { logoUrl, siteName } = useSiteSettings();
  const defaultLogo = "https://i.imgur.com/rVJiu8W.png";
  const [logoSrc, setLogoSrc] = useState<string>(defaultLogo);
  useEffect(() => {
    const configured = (logoUrl && typeof logoUrl === 'string' && logoUrl.trim()) ? logoUrl.trim() : '';
    setLogoSrc(configured || defaultLogo);
  }, [logoUrl]);
  return (
    <footer className="text-white bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src={logoSrc} 
                alt={siteName || "Repal Equipamentos"} 
                className="h-12 sm:h-16 w-auto"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setLogoSrc(defaultLogo)}
              />
            </div>
            <div className="text-white text-sm">
              <p className="font-semibold mb-1 sm:mb-2">Nossos Diferenciais</p>
              <p className="text-gray-300 text-xs leading-relaxed">
                Atendimento por consultores experientes, produtos da melhor qualidade e à pronta entrega, 
                localização privilegiada no centro da cidade, estacionamento conveniado ao lado, 
                preços competitivos, várias formas de negociação.
              </p>
            </div>
          </div>

          {/* Loja Curitiba */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white">LOJA - CURITIBA</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-300">(41) 3333-3692</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-300">(41) 99941-2928</span>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-white mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-gray-300">
                  <p>Av. Mal. Floriano Peixoto, 1780 -</p>
                  <p>Rebouças, Curitiba - PR, 80230-110</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-300">contato@repalmarechal.com.br</span>
              </div>
            </div>
          </div>

          {/* Loja Londrina */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white">LOJA - LONDRINA</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-300">(43) 3324-2892</span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-300">(43) 98444-6097</span>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-white mt-0.5 flex-shrink-0" />
                <div className="text-xs sm:text-sm text-gray-300">
                  <p>R. Minas Gerais, 164 - Centro,</p>
                  <p>Londrina - PR, 86010-170</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-300">repallondrina@hotmail.com</span>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-white">FORMAS DE PAGAMENTOS</h3>
            <img 
              src="https://urucuna.com/wp-content/uploads/2021/02/bandeiras-cartoes-credito-300x99.png" 
              alt="Formas de Pagamento Aceitas" 
              className="w-full max-w-[200px] sm:max-w-xs h-auto"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
