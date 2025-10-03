import React from 'react';
import { useCategories } from '../hooks/useCategories';

const TestCategories: React.FC = () => {
  const { data: categories, isLoading, error } = useCategories();

  console.log('🔍 TestCategories: categories:', categories);
  console.log('🔍 TestCategories: isLoading:', isLoading);
  console.log('🔍 TestCategories: error:', error);

  if (isLoading) return <div>Carregando categorias...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Teste de Categorias</h1>
      <div className="space-y-4">
        {categories?.map((category) => (
          <div key={category.id} className="border p-4 rounded">
            <h2 className="text-lg font-semibold">
              {category.name} (ID: {category.id}, Slug: {category.slug})
            </h2>
            <p>Parent ID: {category.parent_id || 'null'}</p>
            <p>Is Parent: {category.is_parent ? 'true' : 'false'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestCategories;