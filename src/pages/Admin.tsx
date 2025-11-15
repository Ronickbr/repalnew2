import React from 'react';
import { Navigate } from 'react-router-dom';

// Componente Admin simplificado que redireciona para a nova estrutura de rotas
const Admin: React.FC = () => {
  return <Navigate to="/admin" replace />;
};

export default Admin;