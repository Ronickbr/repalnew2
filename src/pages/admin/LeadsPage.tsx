import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { table } from '../../lib/schema';
import { RecentLeads } from '../../components/admin';

interface Lead {
  id: number;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  created_at: string;
  status?: string;
}

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured) {
        throw new Error('Supabase não está configurado');
      }

      const { data, error } = await supabase
        .from(table('leads'))
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setLeads(data || []);
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
        <p>{error}</p>
        <button 
          onClick={fetchLeads}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Leads</h2>
          <p className="text-gray-600 mt-1">Visualize e gerencie os leads capturados no site</p>
        </div>
        <div className="p-6">
          <RecentLeads leads={leads} />
        </div>
      </div>
    </div>
  );
};

export default LeadsPage;