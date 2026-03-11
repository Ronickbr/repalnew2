import React from 'react';
import { Search, Eye, ChevronLeft, ChevronRight, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import type { Lead } from '../../lib/supabase';
import { toast } from 'sonner';

interface LeadManagerProps {
  leads: Lead[];
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  paginatedLeads: Lead[];
  filteredLeads: Lead[];
  onSearchChange: (value: string) => void;
  onViewLead: (lead: Lead) => void;
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: (totalPages: number) => void;
  getTotalPages: (totalItems: number) => number;
  onUpdateStatus?: (id: string, status: string) => void;
}

const LeadManager: React.FC<LeadManagerProps> = ({
  searchTerm,
  currentPage,
  itemsPerPage,
  paginatedLeads,
  filteredLeads,
  onSearchChange,
  onViewLead,
  onPageChange,
  onPreviousPage,
  onNextPage,
  getTotalPages,
  onUpdateStatus
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'novo':
      case 'pendente':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-yellow-400"></span>
            Pendente
          </span>
        );
      case 'contato':
      case 'orcado':
      case 'ativo':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-green-400"></span>
            Ativo
          </span>
        );
      case 'fechado':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-blue-400"></span>
            Fechado
          </span>
        );
      case 'perdido':
      case 'inativo':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-red-400"></span>
            Inativo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-gray-400"></span>
            {status}
          </span>
        );
    }
  };

  const handleWhatsAppClick = (phone: string | null | undefined) => {
    if (!phone) {
      toast.error('Telefone não disponível');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestão de Leads</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#000080] focus:border-transparent w-full sm:w-80"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status de Acesso
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interesse Principal
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{lead.name}</span>
                      <span className="text-xs text-gray-500">Cadastrado em {new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 font-medium">{lead.phone || '-'}</span>
                      <span className="text-xs text-gray-500">{lead.email}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {lead.product_name ? (
                        <>
                          <span className="text-gray-500">Verificou: </span>
                          <span className="font-medium italic">{lead.product_name}</span>
                        </>
                      ) : (
                        <span className="text-gray-500 italic">{lead.message ? 'Mensagem enviada' : 'Aguardando interação'}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <button 
                        onClick={() => handleWhatsAppClick(lead.phone)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Chamar no WhatsApp"
                      >
                        <MessageCircle className="h-3 w-3 mr-1" />
                        WhatsApp
                      </button>
                      
                      <button 
                        onClick={() => onViewLead(lead)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000080]"
                        title="Ver Detalhes"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Detalhes
                      </button>

                      {onUpdateStatus && (
                        <>
                          <button 
                            onClick={() => onUpdateStatus(lead.id, 'contato')}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Marcar como Em Contato"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(lead.id, 'perdido')}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Marcar como Perdido"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination for Leads */}
        {filteredLeads.length > itemsPerPage && (
          <div className="px-3 sm:px-6 py-3 bg-gray-50 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-gray-700">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredLeads.length)} de {filteredLeads.length} leads
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={onPreviousPage}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              
              {Array.from({ length: getTotalPages(filteredLeads.length) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-2 sm:px-3 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium ${
                    currentPage === page
                      ? 'bg-[#000080] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => onNextPage(getTotalPages(filteredLeads.length))}
                disabled={currentPage === getTotalPages(filteredLeads.length)}
                className="p-1.5 sm:p-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadManager;
