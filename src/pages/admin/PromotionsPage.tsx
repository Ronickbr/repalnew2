import React from 'react';
import { Helmet } from 'react-helmet-async';
import PromotionManager from '../../components/admin/PromotionManager';

const PromotionsPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Gerenciar Promoções | Admin</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <PromotionManager />
      </div>
    </>
  );
};

export default PromotionsPage;
