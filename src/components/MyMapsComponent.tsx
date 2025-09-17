import React from 'react';

interface MyMapsComponentProps {
  className?: string;
}

const MyMapsComponent: React.FC<MyMapsComponentProps> = ({ className = '' }) => {
  // URL do Google My Maps configurada
  const mapEmbedUrl = 'https://www.google.com/maps/d/u/2/embed?mid=1DUHTC70cRul1dTkvbTX2HXPDksZjATY&ehbc=2E312F';
  


  return (
    <div className={`w-full h-96 ${className}`}>
      {/* Iframe do Google My Maps */}
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg">
        <iframe
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localização das Lojas Repal"
          className="rounded-2xl"
          onError={() => {
            // Em caso de erro, mostra o fallback
            // Erro já tratado pelo fallback
          }}
        />
      </div>
      

    </div>
  );
};

export default MyMapsComponent;