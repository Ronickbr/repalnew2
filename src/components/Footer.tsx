import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="text-white" style={{ backgroundColor: '#1c243c' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://i.imgur.com/rVJiu8W.png" 
                alt="Repal Equipamentos" 
                className="h-16 w-auto"
              />
            </div>
            <div className="text-white text-sm">
              <p className="font-semibold mb-2">Nossos Diferenciais</p>
              <p className="text-gray-300 text-xs leading-relaxed">
                Atendimento por consultores experientes, produtos da melhor qualidade e à pronta entrega, 
                localização privilegiada no centro da cidade, estacionamento conveniado ao lado, 
                preços competitivos, várias formas de negociação.
              </p>
            </div>
          </div>

          {/* Loja Curitiba */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">LOJA - CURITIBA</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-gray-300">(41) 3333-3692</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-gray-300">(41) 99941-2928</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <p>Av. Mal. Floriano Peixoto, 1780 -</p>
                  <p>Rebouças, Curitiba - PR, 80230-110</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-gray-300">contato@repalmarechal.com.br</span>
              </div>
            </div>
          </div>

          {/* Loja Londrina */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">LOJA - LONDRINA</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-gray-300">(43) 3324-2892</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-gray-300">(43) 98444-6097</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-white mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <p>R. Minas Gerais, 164 - Centro,</p>
                  <p>Londrina - PR, 86010-170</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-white flex-shrink-0" />
                <span className="text-sm text-gray-300">repallondrina@hotmail.com</span>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">FORMAS DE PAGAMENTOS</h4>
            <img 
              src="https://urucuna.com/wp-content/uploads/2021/02/bandeiras-cartoes-credito-300x99.png" 
              alt="Formas de Pagamento Aceitas" 
              className="w-full max-w-xs h-auto"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;