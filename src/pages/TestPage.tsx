import React from 'react';
import { DatabaseTest } from '../components/DatabaseTest';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Teste de Estrutura do Banco de Dados
        </h1>
        <DatabaseTest />
      </div>
    </div>
  );
};

export default TestPage;