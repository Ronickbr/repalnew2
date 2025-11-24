import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface TestResult {
  categories: any[];
  subcategories: any[];
  products: any[];
  errors: string[];
}

export const DatabaseTest: React.FC = () => {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testDatabase = async () => {
      const testResult: TestResult = {
        categories: [],
        subcategories: [],
        products: [],
        errors: []
      };

      try {
        // Testar categorias
        console.log('🧪 Testando categorias...');
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .limit(5);
        
        if (categoriesError) {
          testResult.errors.push(`Categorias: ${categoriesError.message}`);
        } else {
          testResult.categories = categoriesData || [];
          console.log('✅ Categorias encontradas:', categoriesData?.length || 0);
          console.log('📋 Primeira categoria:', categoriesData?.[0]);
        }

        // Testar subcategorias via categories (parent_id)
        console.log('🧪 Testando subcategorias (via categories.parent_id)...');
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('categories')
          .select('*')
          .not('parent_id', 'is', null)
          .limit(5);
        
        if (subcategoriesError) {
          testResult.errors.push(`Subcategorias (via categories): ${subcategoriesError.message}`);
        } else {
          testResult.subcategories = subcategoriesData || [];
          console.log('✅ Subcategorias encontradas:', subcategoriesData?.length || 0);
        }

        // Testar produtos com subcategory_id
        console.log('🧪 Testando produtos com subcategory_id...');
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, category_id, subcategory_id')
          .not('subcategory_id', 'is', null)
          .limit(5);
        
        if (productsError) {
          testResult.errors.push(`Produtos: ${productsError.message}`);
        } else {
          testResult.products = productsData || [];
          console.log('✅ Produtos com subcategoria:', productsData?.length || 0);
          console.log('📋 Primeiro produto:', productsData?.[0]);
        }

        // Verificar estrutura da tabela categories
        console.log('🧪 Verificando estrutura de categories...');
        const { data: categoryStructure } = await supabase
          .from('categories')
          .select('*')
          .limit(1);
        
        if (categoryStructure && categoryStructure.length > 0) {
          console.log('🔍 Colunas em categories:', Object.keys(categoryStructure[0]));
        }

      } catch (error: any) {
        testResult.errors.push(`Geral: ${error.message}`);
        console.error('❌ Erro geral:', error);
      }

      setResult(testResult);
      setLoading(false);
    };

    testDatabase();
  }, []);

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Testando Banco de Dados...</h3>
        <p className="text-yellow-700">Verificando estrutura das tabelas...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Erro no Teste</h3>
        <p className="text-red-700">Não foi possível obter resultados do teste.</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">Resultados do Teste de Banco</h3>
      
      {result.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="font-semibold text-red-800 mb-2">Erros Encontrados:</h4>
          <ul className="text-red-700 space-y-1">
            {result.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">Categorias</h4>
          <p className="text-2xl font-bold text-blue-600">{result.categories.length}</p>
          {result.categories.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Primeira: <span className="font-medium">{result.categories[0].name}</span></p>
              {result.categories[0].parent_id && <p>Tem parent_id: {result.categories[0].parent_id}</p>}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">Subcategorias</h4>
          <p className="text-2xl font-bold text-green-600">{result.subcategories.length}</p>
          {result.subcategories.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Primeira: <span className="font-medium">{result.subcategories[0].name}</span></p>
              <p>Parent ID: {result.subcategories[0].parent_id}</p>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">Produtos c/ Subcategoria</h4>
          <p className="text-2xl font-bold text-purple-600">{result.products.length}</p>
          {result.products.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Primeiro: <span className="font-medium">{result.products[0].name}</span></p>
              <p>Subcategory ID: {result.products[0].subcategory_id}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <h4 className="font-semibold text-yellow-800 mb-2">Diagnóstico:</h4>
        <div className="text-yellow-700 text-sm space-y-1">
          {result.subcategories.length === 0 ? (
            <p>⚠️ Não há categorias filhas (subcategorias) cadastradas.</p>
          ) : (
            <p>✅ Subcategorias carregadas via categories.parent_id.</p>
          )}
          
          {result.categories.length > 0 && (
            <p>📊 Categorias carregadas: use o modelo com <code className="bg-yellow-100 px-1 rounded">parent_id</code> ou <code className="bg-yellow-100 px-1 rounded">subcategories</code></p>
          )}
          
          {result.products.length > 0 && (
            <p>🎯 Produtos com subcategoria encontrados!</p>
          )}
        </div>
      </div>
    </div>
  );
};
