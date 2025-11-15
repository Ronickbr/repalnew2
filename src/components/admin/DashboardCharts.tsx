import React, { useState } from 'react';
import { Users, Package, DollarSign, BarChart3, PieChart, Activity } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  color?: string;
  growth?: number;
}

interface DashboardChartsProps {
  leadsByDay?: ChartData[];
  productsByCategory?: ChartData[];
  revenueByMonth?: ChartData[];
  conversionRate?: number;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  leadsByDay = [],
  productsByCategory = [],
  revenueByMonth = [],
  // conversionRate = 0
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'products' | 'revenue'>('leads');

  const defaultLeadsData = [
    { name: 'Seg', value: 12, growth: 15 },
    { name: 'Ter', value: 19, growth: 8 },
    { name: 'Qua', value: 8, growth: -20 },
    { name: 'Qui', value: 15, growth: 12 },
    { name: 'Sex', value: 22, growth: 25 },
    { name: 'Sáb', value: 18, growth: 5 },
    { name: 'Dom', value: 5, growth: -15 }
  ];

  const defaultProductsData = [
    { name: 'Cozinha', value: 45, color: '#3B82F6', growth: 12 },
    { name: 'Açougue', value: 32, color: '#10B981', growth: 8 },
    { name: 'Padaria', value: 28, color: '#F59E0B', growth: -5 },
    { name: 'Bar', value: 19, color: '#EF4444', growth: 15 },
    { name: 'Outros', value: 15, color: '#8B5CF6', growth: 3 }
  ];

  const defaultRevenueData = [
    { name: 'Jan', value: 45000, growth: 12 },
    { name: 'Fev', value: 52000, growth: 15 },
    { name: 'Mar', value: 48000, growth: -8 },
    { name: 'Abr', value: 61000, growth: 27 },
    { name: 'Mai', value: 58000, growth: -5 },
    { name: 'Jun', value: 67000, growth: 15 }
  ];

  const chartData = {
    leads: leadsByDay.length > 0 ? leadsByDay : defaultLeadsData,
    products: productsByCategory.length > 0 ? productsByCategory : defaultProductsData,
    revenue: revenueByMonth.length > 0 ? revenueByMonth : defaultRevenueData
  };

  const maxLeadsValue = Math.max(...chartData.leads.map(d => d.value));
  const maxRevenueValue = Math.max(...chartData.revenue.map(d => d.value));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? '+' : '';
    const color = growth >= 0 ? 'text-green-600' : 'text-red-600';
    const bgColor = growth >= 0 ? 'bg-green-50' : 'bg-red-50';
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${color}`}>
        {sign}{growth}%
      </span>
    );
  };

  const renderLeadsChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Leads por Dia</h3>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            Total: {chartData.leads.reduce((sum, item) => sum + item.value, 0)}
          </span>
        </div>
      </div>
      
      <div className="h-64 flex items-end justify-between space-x-2">
        {chartData.leads.map((day, index) => (
          <div key={index} className="flex-1 flex flex-col items-center group">
            <div className="w-full bg-gray-200 rounded-t relative overflow-hidden">
              <div
                className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-500"
                style={{
                  height: `${(day.value / maxLeadsValue) * 180}px`,
                  minHeight: '20px'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1">
                  {day.value} leads
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center mt-2 space-y-1">
              <div className="text-xs font-medium text-gray-700">{day.value}</div>
              <div className="text-xs text-gray-500">{day.name}</div>
              {day.growth !== undefined && formatGrowth(day.growth)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProductsChart = () => {
    const total = chartData.products.reduce((sum, item) => sum + item.value, 0);
    
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
                {chartData.products.map((category, index) => {
                  const percentage = (category.value / total) * 100;
                  const circumference = 2 * Math.PI * 40;
                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                  const offset = chartData.products.slice(0, index).reduce((sum, item) => {
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
            {chartData.products.map((category, index) => (
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
                  {category.growth !== undefined && formatGrowth(category.growth)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueChart = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Receita Mensal</h3>
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-500">
            Média: {formatCurrency(chartData.revenue.reduce((sum, item) => sum + item.value, 0) / chartData.revenue.length)}
          </span>
        </div>
      </div>
      
      <div className="h-64 relative">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="0"
              y1={i * 40}
              x2="400"
              y2={i * 40}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}
          
          {/* Line chart */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            points={chartData.revenue.map((month, index) => {
              const x = (index / (chartData.revenue.length - 1)) * 380 + 10;
              const y = 190 - (month.value / maxRevenueValue) * 180;
              return `${x},${y}`;
            }).join(' ')}
            className="transition-all duration-300"
          />
          
          {/* Data points */}
          {chartData.revenue.map((month, index) => {
            const x = (index / (chartData.revenue.length - 1)) * 380 + 10;
            const y = 190 - (month.value / maxRevenueValue) * 180;
            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#10b981"
                  className="hover:r-6 transition-all duration-200 cursor-pointer"
                />
                <text
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 font-medium"
                >
                  {formatCurrency(month.value)}
                </text>
                {month.growth !== undefined && (
                  <text
                    x={x}
                    y={y + 20}
                    textAnchor="middle"
                    className={`text-xs font-medium ${
                      month.growth >= 0 ? 'fill-green-600' : 'fill-red-600'
                    }`}
                  >
                    {month.growth >= 0 ? '+' : ''}{month.growth}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <div className="flex justify-between mt-2">
          {chartData.revenue.map((month, index) => (
            <div key={index} className="text-xs text-gray-500 text-center flex-1">
              {month.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'leads'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Leads</span>
            </div>
          </button>
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
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'revenue'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Receita</span>
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
        {activeTab === 'leads' && renderLeadsChart()}
        {activeTab === 'products' && renderProductsChart()}
        {activeTab === 'revenue' && renderRevenueChart()}
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