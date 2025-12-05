import React, { useEffect, useState } from 'react';
import BrandManager from '../../components/admin/BrandManager';
import { isSupabaseConfigured } from '../../lib/supabase';
import { apiFetch } from '../../lib/api';

const BrandsPage: React.FC = () => {
  const [backendDevMode, setBackendDevMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await apiFetch('/api/auth/me');
        const dev = !!me?.data && String(me.data.id) === 'dev-admin';
        setBackendDevMode(dev);
      } catch {
        setBackendDevMode(false);
      }
    })();
  }, []);

  return (
    <div>
      {!isSupabaseConfigured && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
          Supabase não configurado no frontend. Uploads podem falhar e marcas podem não persistir.
        </div>
      )}
      {backendDevMode && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded">
          Backend em modo dev/bypass. Registros podem ser fictícios e não persistir no banco.
        </div>
      )}
      <BrandManager />
    </div>
  );
};

export default BrandsPage;
