import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category, Product } from '../lib/supabase';
import WhatsAppButton from '../components/WhatsAppButton';

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!slug) return;

      setLoading(true);
      
      try {
        // Fetch category
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .single();

        if (categoryError) {
          // Erro já tratado pelo estado
          return;
        }

        if (categoryData) {
          setCategory(categoryData);

          // Fetch products for this category (including products from subcategories)
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select(`
              *,
              category:categories!products_category_id_fkey(name, slug)
            `)
            .or(`category_id.eq.${categoryData.id},subcategory_id.eq.${categoryData.id}`)
            .eq('active', true)
            .order('product_name');

          if (productsError) {
            // Erro já tratado pelo estado
            setProducts([]);
            setFilteredProducts([]);
          } else {
            const products = productsData || [];
            setProducts(products);
            setFilteredProducts(products);
          }
        }
      } catch {
        // Erro já tratado pelo estado
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-900"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Categoria não encontrada</h1>
          <Link
            to="/categorias"
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Voltar para categorias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              Início
            </Link>
            <span className="text-gray-400">/</span>
            <Link to="/categorias" className="text-gray-500 hover:text-gray-700">
              Categorias
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Link
                to="/categorias"
                className="inline-flex items-center text-red-600 hover:text-red-700 font-medium mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para categorias
              </Link>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {category.name}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                {category.description}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{products.length} produto{products.length !== 1 ? 's' : ''} disponível{products.length !== 1 ? 'eis' : ''}</span>
              </div>
            </div>
            <div className="relative">
              <img
                src={`https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`}
                alt={category.name}
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar produtos nesta categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente ajustar o termo de busca.' 
                : 'Esta categoria ainda não possui produtos cadastrados.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-red-600 hover:text-red-700 font-medium"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Mostrando {filteredProducts.length} de {products.length} produtos
                {searchTerm && ` para "${searchTerm}"`}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`/produto/${product.slug}`}
                  className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.image_url || `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80`}
                      alt={product.product_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-red-900 transition-colors">
                      {product.product_name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                      <div 
                          className="prose prose-gray max-w-none text-sm"
                          dangerouslySetInnerHTML={{ __html: product.description || '' }}
                        />
                    </p>
                    {product.featured && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Produto em Destaque
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-red-900 font-medium">Ver Detalhes</span>
                      <ArrowRight className="h-4 w-4 text-red-900 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* CTA Section */}
        <div className="mt-20 bg-red-900 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Precisa de mais informações?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Nossa equipe especializada está pronta para ajudar você a escolher 
            o equipamento ideal para sua cozinha.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WhatsAppButton
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
              message={`Olá! Gostaria de saber mais sobre os produtos da categoria ${category.name}.`}
            >
              <span>Falar no WhatsApp</span>
              <ArrowRight className="h-5 w-5" />
            </WhatsAppButton>
            <Link
              to="/contato"
              className="bg-transparent border-2 border-white hover:bg-white hover:text-red-900 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center space-x-2"
            >
              <span>Formulário de Contato</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;