import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Calendar, Mail, Phone, ShoppingBag } from 'lucide-react';
import { Lead } from '../../lib/supabase';

interface RecentLeadsProps {
  leads: Lead[];
}

const RecentLeads: React.FC<RecentLeadsProps> = ({ leads }) => {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'novo':
        return 'bg-blue-100 text-blue-800';
      case 'contato':
        return 'bg-yellow-100 text-yellow-800';
      case 'orcado':
        return 'bg-purple-100 text-purple-800';
      case 'fechado':
        return 'bg-green-100 text-green-800';
      case 'perdido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'novo':
        return 'Novo';
      case 'contato':
        return 'Em Contato';
      case 'orcado':
        return 'Orçado';
      case 'fechado':
        return 'Fechado';
      case 'perdido':
        return 'Perdido';
      default:
        return status;
    }
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Leads Recentes</h3>
          <User className="h-5 w-5 text-gray-400" />
        </div>
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum lead recente encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Leads Recentes</h3>
          <User className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {leads.map((lead) => (
          <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {lead.name}
                    </p>
                    {lead.product_name && (
                      <div className="flex items-center mt-1 text-xs text-indigo-600 font-medium">
                        <ShoppingBag className="h-3 w-3 mr-1" />
                        <span className="truncate">Interesse: {lead.product_name}</span>
                      </div>
                    )}
                    <div className="flex items-center mt-1 space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate">{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-4 flex flex-col items-end space-y-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                  {getStatusLabel(lead.status)}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(lead.created_at)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={() => navigate('/admin/leads')}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          Ver todos os leads →
        </button>
      </div>
    </div>
  );
};


export default RecentLeads;