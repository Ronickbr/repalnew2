import React, { useState } from 'react';
import { Package, PieChart, Activity, MessageCircle } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface DashboardChartsProps {
  productsByCategory?: ChartData[];
  whatsappClicksByStore?: ChartData[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  productsByCategory = [],
  whatsappClicksByStore = [],
  // conversionRate = 0
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'whatsapp'>('products');

  const defaultProductsData: ChartData[] = [];


  const chartData = {
    products: productsByCategory.length > 0 ? productsByCategory : defaultProductsData,
    whatsapp: whatsappClicksByStore.length > 0 ? whatsappClicksByStore : []
  };

  const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1', '#14B8A6', '#DB2777', '#F97316', '#22C55E'];
  const getColorForName = (name: string) => {
    let acc = 0;
    for (let i = 0; i < name.length; i++) acc = (acc + name.charCodeAt(i)) % 9973;
    return palette[acc % palette.length];
  };
  const productsColored = chartData.products.map((c, idx) => ({ ...c, color: c.color || getColorForName(c.name || String(idx)) }));

  const maxWhatsAppValue = Math.max(...chartData.whatsapp.map(d => d.value));

  const formatValue = (value: number) => new Intl.NumberFormat('pt-BR').format(value);


  const renderProductsChart = () => {
    const total = productsColored.reduce((sum, item) => sum + item.value, 0);
    if (chartData.products.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Produtos por Categoria</h3>
          </div>
          <div className="text-sm text-gray-500">Sem dados</div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Produtos por Categoria</h3>
          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              Total: {total} produtos
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                {productsColored.map((category, index) => {
                  const percentage = (category.value / total) * 100;
                  const circumference = 2 * Math.PI * 40;
                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                  const offset = productsColored.slice(0, index).reduce((sum, item) => {
                    const itemPercentage = (item.value / total) * 100;
                    return sum + (itemPercentage / 100) * circumference;
                  }, 0);

                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke={category.color || '#3B82F6'}
                      strokeWidth="20"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={-offset}
                      className="transition-all duration-300 hover:stroke-width-22"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {total}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {productsColored.map((category, index) => (
              <div key={index} className="flex items-center justify-between group">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3 group-hover:scale-125 transition-transform"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  />
                  <div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {category.name}
                    </span>
                    <div className="text-xs text-gray-500">
                      {((category.value / total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{category.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderWhatsAppChart = () => {
    if (chartData.whatsapp.length === 0) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cliques no WhatsApp por Loja</h3>
          </div>
          <div className="text-sm text-gray-500">Sem dados</div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Cliques no WhatsApp por Loja</h3>
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              Total: {formatValue(chartData.whatsapp.reduce((sum, item) => sum + item.value, 0))}
            </span>
          </div>
        </div>
        <div className="h-64 flex items-end justify-between space-x-2">
          {chartData.whatsapp.map((store, index) => (
            <div key={index} className="flex-1 flex flex-col items-center group">
              <div className="w-full bg-gray-200 rounded-t relative overflow-hidden">
                <div
                  className="bg-gradient-to-t from-green-600 to-green-500 rounded-t transition-all duration-300 group-hover:from-green-700 group-hover:to-green-600"
                  style={{
                    height: `${(store.value / Math.max(1, maxWhatsAppValue)) * 180}px`,
                    minHeight: '20px'
                  }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1">
                    {formatValue(store.value)} cliques
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center mt-2 space-y-1">
                <div className="text-xs font-medium text-gray-700">{formatValue(store.value)}</div>
                <div className="text-xs text-gray-500">{store.name}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {chartData.whatsapp.map((store, index) => (
            <div key={`legend-${index}`} className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600" />
                <span className="text-sm text-gray-700">{store.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{formatValue(store.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'products'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Produtos</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'whatsapp'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
            </div>
          </button>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <Activity className="h-4 w-4 mr-1" />
          <span>Atualizado agora</span>
        </div>
      </div>

      {/* Chart Content */}
      <div className="min-h-[400px]">
        {activeTab === 'products' && renderProductsChart()}
        {activeTab === 'whatsapp' && renderWhatsAppChart()}
      </div>

      {/* Chart Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Dados em tempo real
            </span>
            <span>•</span>
            <span>Período: Últimos 30 dias</span>
          </div>
          <button className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
            Ver relatório completo →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
