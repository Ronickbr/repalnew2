import React from 'react';
import { Helmet } from 'react-helmet-async';
import PriceAdjustmentsManager from '../../components/admin/PriceAdjustmentsManager';

const PriceAdjustmentsPage: React.FC = () => {
  return (
    <div className="container mx-auto">
      <Helmet>
        <title>Reajustes de Preço | Admin</title>
      </Helmet>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reajustes de Preço</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie reajustes de preço em massa por produto ou fabricante.
        </p>
      </div>

      <PriceAdjustmentsManager />
    </div>
  );
};

export default PriceAdjustmentsPage;
