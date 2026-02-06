import React from 'react';
import { X } from 'lucide-react';
import { Lead } from '../../lib/supabase';

interface LeadModalProps {
  isOpen: boolean;
  viewingLead: Lead | null;
  onClose: () => void;
}

const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  viewingLead,
  onClose
}) => {
  if (!isOpen || !viewingLead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalhes do Lead
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <p className="text-gray-900">{viewingLead.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{viewingLead.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <p className="text-gray-900">{viewingLead.phone || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produto de Interesse
                </label>
                <p className="text-gray-900">{viewingLead.product_name || '-'}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem
              </label>
              <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                {viewingLead.message || 'Nenhuma mensagem fornecida.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Criação
              </label>
              <p className="text-gray-900">
                {new Date(viewingLead.created_at).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadModal;