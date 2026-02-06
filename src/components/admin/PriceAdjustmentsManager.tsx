import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { table } from '../../lib/schema';
import { toast } from 'sonner';
import { 
  Search, 
  DollarSign, 
  Percent, 
  Save, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  brand: string;
  category_id: number;
  product_images?: { url: string }[];
}

interface Brand {
  id: string;
  name: string;
}

const PriceAdjustmentsManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'products' | 'brand'>('products');
  
  // Selection states
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // Adjustment states
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [operation, setOperation] = useState<'increase' | 'decrease'>('increase');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Preview state
  const [previewData, setPreviewData] = useState<{id: string, name: string, oldPrice: number, newPrice: number}[]>([]);

  useEffect(() => {
    fetchBrands();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (mode === 'brand') {
      if (selectedBrand) {
        const brandObj = brands.find(b => b.id === selectedBrand);
        if (brandObj) {
          const filtered = products.filter(p => p.brand === brandObj.name);
          setFilteredProducts(filtered);
          setSelectedProducts(filtered.map(p => p.id));
        } else {
          setFilteredProducts([]);
          setSelectedProducts([]);
        }
      } else {
        setFilteredProducts([]);
        setSelectedProducts([]);
      }
    } else {
      if (!searchTerm) {
        setFilteredProducts(products);
      } else {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = products.filter(product => 
          product.name.toLowerCase().includes(lowerTerm) || 
          (product.brand && product.brand.toLowerCase().includes(lowerTerm))
        );
        setFilteredProducts(filtered);
      }
    }
  }, [mode, selectedBrand, searchTerm, products, brands]);

  useEffect(() => {
    updatePreview();
  }, [selectedProducts, adjustmentType, adjustmentValue, operation, products]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from(table('brands'))
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
      toast.error('Erro ao carregar marcas');
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(table('products'))
        .select(`
          id, 
          name, 
          price, 
          brand, 
          category_id
        `)
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredProducts.map(p => p.id);
    // Add only ones not already selected
    const newSelected = [...new Set([...selectedProducts, ...ids])];
    setSelectedProducts(newSelected);
  };

  const handleDeselectAll = () => {
    setSelectedProducts([]);
  };

  const calculateNewPrice = (currentPrice: number) => {
    const value = parseFloat(adjustmentValue);
    if (isNaN(value) || value <= 0) return currentPrice;

    let change = 0;
    if (adjustmentType === 'percentage') {
      change = currentPrice * (value / 100);
    } else {
      change = value;
    }

    if (operation === 'decrease') {
      return Math.max(0, currentPrice - change);
    }
    return currentPrice + change;
  };

  const updatePreview = () => {
    if (!adjustmentValue || parseFloat(adjustmentValue) <= 0) {
      setPreviewData([]);
      return;
    }

    if (selectedProducts.length === 0) {
      setPreviewData([]);
      return;
    }

    const targetProducts = products.filter(p => selectedProducts.includes(p.id));

    const preview = targetProducts.map(p => ({
      id: p.id,
      name: p.name,
      oldPrice: p.price || 0,
      newPrice: calculateNewPrice(p.price || 0)
    }));

    setPreviewData(preview);
  };

  const handleApplyAdjustment = async () => {
    if (previewData.length === 0) return;
    
    if (!window.confirm(`Tem certeza que deseja atualizar o preço de ${previewData.length} produtos?`)) {
      return;
    }

    setLoading(true);
    try {
      // Process in batches to avoid huge requests
      const updates = previewData.map(item => ({
        id: item.id,
        price: item.newPrice,
        updated_at: new Date().toISOString()
      }));

      // Supabase doesn't support bulk update with different values easily in one query
      // unless we use upsert.
      const { error } = await supabase
        .from(table('products'))
        .upsert(updates, { onConflict: 'id' });

      if (error) throw error;

      toast.success(`${previewData.length} produtos atualizados com sucesso!`);
      
      // Refresh products
      await fetchProducts();
      setSelectedProducts([]);
      setAdjustmentValue('');
      setPreviewData([]);
      
    } catch (error) {
      console.error('Error updating prices:', error);
      toast.error('Erro ao atualizar preços');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Configuração do Reajuste</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Selection Mode */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aplicar reajuste em:
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => { setMode('products'); setSelectedBrand(''); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'products'
                      ? 'bg-blue-100 text-blue-700 border-blue-200 border'
                      : 'bg-white text-gray-600 border-gray-300 border hover:bg-gray-50'
                  }`}
                >
                  Selecionar Produtos
                </button>
                <button
                  onClick={() => { setMode('brand'); setSelectedProducts([]); }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === 'brand'
                      ? 'bg-blue-100 text-blue-700 border-blue-200 border'
                      : 'bg-white text-gray-600 border-gray-300 border hover:bg-gray-50'
                  }`}
                >
                  Por Fabricante (Marca)
                </button>
              </div>
            </div>

            {mode === 'brand' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecione o Fabricante
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Selecione...</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Produtos Selecionados ({selectedProducts.length})
                </label>
                {selectedProducts.length > 0 && (
                  <button 
                    onClick={handleDeselectAll}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
              
              <div className="h-64 border border-gray-200 rounded-md overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    {mode === 'brand' && !selectedBrand 
                      ? 'Selecione um fabricante para ver os produtos' 
                      : 'Nenhum produto encontrado'}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {/* Select All Option */}
                    <li className="bg-gray-50 p-2 flex items-center">
                      <button
                        onClick={handleSelectAllFiltered}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Selecionar todos os {filteredProducts.length} listados
                      </button>
                    </li>
                    {filteredProducts.map(product => (
                      <li 
                        key={product.id} 
                        className={`p-2 flex items-center hover:bg-gray-50 cursor-pointer ${selectedProducts.includes(product.id) ? 'bg-blue-50' : ''}`}
                        onClick={() => handleProductSelect(product.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => {}} // Handled by li click
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {product.brand && <span className="mr-2 text-blue-600">{product.brand}</span>}
                            R$ {product.price?.toFixed(2)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Adjustment Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Ajuste
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setOperation('increase')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    operation === 'increase'
                      ? 'bg-green-100 text-green-700 border-green-200 border'
                      : 'bg-white text-gray-600 border-gray-300 border hover:bg-gray-50'
                  }`}
                >
                  Aumento (+)
                </button>
                <button
                  onClick={() => setOperation('decrease')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    operation === 'decrease'
                      ? 'bg-red-100 text-red-700 border-red-200 border'
                      : 'bg-white text-gray-600 border-gray-300 border hover:bg-gray-50'
                  }`}
                >
                  Desconto (-)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modo
                </label>
                <div className="flex rounded-md shadow-sm">
                  <button
                    onClick={() => setAdjustmentType('percentage')}
                    className={`flex-1 inline-flex justify-center items-center px-4 py-2 rounded-l-md border text-sm font-medium ${
                      adjustmentType === 'percentage'
                        ? 'bg-gray-100 text-gray-900 border-gray-300 z-10'
                        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Percent className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setAdjustmentType('fixed')}
                    className={`flex-1 inline-flex justify-center items-center px-4 py-2 rounded-r-md border-t border-b border-r text-sm font-medium ${
                      adjustmentType === 'fixed'
                        ? 'bg-gray-100 text-gray-900 border-gray-300 z-10'
                        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor {adjustmentType === 'percentage' ? '(%)' : '(R$)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step={adjustmentType === 'percentage' ? "0.1" : "0.01"}
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Atenção: As alterações de preço são aplicadas imediatamente. Verifique a prévia abaixo antes de confirmar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewData.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Prévia do Reajuste ({previewData.length} produtos afetados)
            </h3>
            <button
              onClick={handleApplyAdjustment}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Aplicando...
                </>
              ) : (
                <>
                  <Save className="-ml-1 mr-2 h-4 w-4" />
                  Confirmar Alterações
                </>
              )}
            </button>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Atual
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Novo Preço
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diferença
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.slice(0, 100).map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      R$ {item.oldPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      R$ {item.newPrice.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      item.newPrice > item.oldPrice ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.newPrice > item.oldPrice ? '+' : ''}
                      R$ {(item.newPrice - item.oldPrice).toFixed(2)}
                      {' '}
                      ({(((item.newPrice - item.oldPrice) / item.oldPrice) * 100).toFixed(1)}%)
                    </td>
                  </tr>
                ))}
                {previewData.length > 100 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      ... e mais {previewData.length - 100} produtos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceAdjustmentsManager;
