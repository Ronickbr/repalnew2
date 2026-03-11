import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { table } from '../../lib/schema';
import LeadManager from '../../components/admin/LeadManager';
import LeadModal from '../../components/admin/LeadModal';
import { Lead } from '../../lib/supabase';
import { toast } from 'sonner';

const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for LeadManager
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const itemsPerPage = 10;

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

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from(table('leads'))
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setLeads(leads.map(lead => 
        lead.id === id ? { ...lead, status: status as any } : lead
      ));
      toast.success(`Status atualizado para ${status}`);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleViewLead = (lead: Lead) => {
    setViewingLead(lead);
    setIsModalOpen(true);
  };

  const generateMockLeads = async () => {
    try {
      setLoading(true);
      const statuses = ['novo', 'contato', 'orcado', 'fechado', 'perdido'];
      const products = ['iPhone 13', 'Samsung Galaxy S21', 'MacBook Pro', 'Dell XPS', 'iPad Air'];
      
      const mockLeads = Array.from({ length: 5 }).map(() => ({
        name: `Lead Teste ${Math.floor(Math.random() * 1000)}`,
        email: `teste${Math.floor(Math.random() * 10000)}@exemplo.com`,
        phone: `119${Math.floor(Math.random() * 100000000)}`,
        message: 'Lead gerado automaticamente para testes do sistema.',
        product_name: products[Math.floor(Math.random() * products.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from(table('leads'))
        .insert(mockLeads);

      if (error) throw error;

      toast.success('5 leads de teste gerados com sucesso!');
      fetchLeads();
    } catch (err) {
      console.error('Erro ao gerar leads:', err);
      toast.error('Erro ao gerar leads de teste');
    } finally {
      setLoading(false);
    }
  };

  const deleteMockLeads = async () => {
    if (!window.confirm('Tem certeza que deseja excluir todos os leads de teste?')) {
      return;
    }

    try {
      setLoading(true);
      const { error, count } = await supabase
        .from(table('leads'))
        .delete({ count: 'exact' })
        .eq('message', 'Lead gerado automaticamente para testes do sistema.');

      if (error) throw error;

      toast.success(`${count} leads de teste excluídos com sucesso!`);
      fetchLeads();
    } catch (err) {
      console.error('Erro ao excluir leads de teste:', err);
      toast.error('Erro ao excluir leads de teste');
    } finally {
      setLoading(false);
    }
  };

  // Filter and Pagination Logic
  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.phone && lead.phone.includes(searchTerm))
  );

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
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
      <div className="flex justify-end gap-3">
        <button
          onClick={deleteMockLeads}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors shadow-sm text-sm font-medium"
        >
          Excluir Leads de Teste
        </button>
        <button
          onClick={generateMockLeads}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
        >
          Gerar 5 Leads de Teste
        </button>
      </div>
      <LeadManager
        leads={leads}
        searchTerm={searchTerm}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        paginatedLeads={paginatedLeads}
        filteredLeads={filteredLeads}
        onSearchChange={setSearchTerm}
        onViewLead={handleViewLead}
        onPageChange={handlePageChange}
        onPreviousPage={() => handlePageChange(Math.max(1, currentPage - 1))}
        onNextPage={(total) => handlePageChange(Math.min(total, currentPage + 1))}
        getTotalPages={() => totalPages}
        onUpdateStatus={handleUpdateStatus}
      />

      <LeadModal
        isOpen={isModalOpen}
        viewingLead={viewingLead}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default LeadsPage;
