import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured, Lead } from '../../lib/supabase';
import { table } from '../../lib/schema';
// import DashboardStats from '../../components/admin/DashboardStats';
import DashboardCharts from '../../components/admin/DashboardCharts';
import RecentLeads from '../../components/admin/RecentLeads';
import { Users, Package, ShoppingCart, Eye, Filter, FileText, ArrowRight } from 'lucide-react';

interface DashboardData {
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  totalUsers: number;
  totalLeads: number;
  totalBanners: number;
  recentLeads: Lead[];
  totalVisitors: number;
  topProducts: { id: string; name: string; count: number }[];
  whatsappClicksByStore: { id: string; name: string; count: number }[];
  productsByCategory: { name: string; value: number }[];
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    totalProducts: 0,
    totalCategories: 0,
    totalBrands: 0,
    totalUsers: 0,
    totalLeads: 0,
    totalBanners: 0,
    recentLeads: [],
    totalVisitors: 0,
    topProducts: [],
    whatsappClicksByStore: [],
    productsByCategory: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured) {
        throw new Error('Supabase não está configurado');
      }

      // Buscar dados de múltiplas tabelas em paralelo
      const [
        productsData,
        categoriesData,
        brandsData,
        usersData,
        bannersData,
        storesRows,
        siteVisitsRows,
        productViewRows,
        whatsappClickRows,
        categoriesListRows,
        productsLightRows
      ] = await Promise.all([
        supabase.from(table('products')).select('*', { count: 'exact', head: true }),
        supabase.from(table('categories')).select('id', { count: 'exact', head: true }),
        supabase.from(table('brands')).select('*', { count: 'exact', head: true }),
        supabase.from(table('admin_users')).select('*', { count: 'exact', head: true }),
        supabase.from(table('banners')).select('*', { count: 'exact', head: true }),
        supabase.from(table('stores')).select('id, name').limit(1000),
        supabase.from(table('activity_logs')).select('details').eq('action', 'site_visit').limit(50000),
        supabase.from(table('activity_logs')).select('resource_id, details').eq('action', 'product_view').limit(50000),
        supabase.from(table('activity_logs')).select('resource_id, details').eq('action', 'whatsapp_click').limit(50000),
        supabase.from(table('categories')).select('id, name').eq('active', true).limit(1000),
        supabase.from(table('products')).select('category_id').eq('active', true).limit(50000)
      ]);

      // Buscar leads recentes
      const { data: leadsData, error: leadsError } = await supabase
        .from(table('leads'))
        .select('*', { count: 'exact', head: true });

      const { data: recentLeadsData, error: recentLeadsError } = await supabase
        .from(table('leads'))
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (leadsError) console.warn('Erro ao buscar leads:', leadsError);
      if (recentLeadsError) console.warn('Erro ao buscar leads recentes:', recentLeadsError);

      const categoryNameMap = new Map<string, string>();
      for (const c of (categoriesListRows.data || []) as any[]) {
        categoryNameMap.set(String(c.id), String(c.name || ''));
      }
      const categoryCountMap = new Map<string, number>();
      for (const p of (productsLightRows.data || []) as any[]) {
        const cid = p.category_id != null ? String(p.category_id) : '';
        if (!cid) continue;
        categoryCountMap.set(cid, (categoryCountMap.get(cid) || 0) + 1);
      }
      const productsByCategory = Array.from(categoryCountMap.entries())
        .map(([id, count]) => ({ name: categoryNameMap.get(id) || id, value: count }))
        .sort((a, b) => b.value - a.value);

      const uniqueVisitors = (() => {
        const arr = siteVisitsRows.data || [];
        const ids = new Set<string>();
        for (const r of arr as any[]) {
          const d = typeof r.details === 'string' ? (() => { try { return JSON.parse(r.details); } catch { return {}; } })() : r.details || {};
          if (d && d.visitor_id) ids.add(String(d.visitor_id));
        }
        return ids.size;
      })();

      const productCountsMap = new Map<string, { name: string; count: number }>();
      for (const r of (productViewRows.data || []) as any[]) {
        const id = String(r.resource_id);
        const d = typeof r.details === 'string' ? (() => { try { return JSON.parse(r.details); } catch { return {}; } })() : r.details || {};
        const name = d.product_name || d.name || '';
        const entry = productCountsMap.get(id) || { name, count: 0 };
        entry.count += 1;
        if (!entry.name && name) entry.name = name;
        productCountsMap.set(id, entry);
      }
      const topProducts = Array.from(productCountsMap.entries())
        .map(([id, v]) => ({ id, name: v.name || id, count: v.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const storeCountsMap = new Map<string, { name: string; count: number }>();
      for (const r of (whatsappClickRows.data || []) as any[]) {
        const id = String(r.resource_id);
        const d = typeof r.details === 'string' ? (() => { try { return JSON.parse(r.details); } catch { return {}; } })() : r.details || {};
        const name = d.store_name || '';
        const entry = storeCountsMap.get(id) || { name, count: 0 };
        entry.count += 1;
        if (!entry.name && name) entry.name = name;
        storeCountsMap.set(id, entry);
      }
      const storeNameMap = new Map<string, string>();
      for (const s of (storesRows.data || []) as any[]) {
        storeNameMap.set(String(s.id), String(s.name || ''));
      }

      const allStoresBase = Array.from(storeNameMap.entries()).map(([id, name]) => ({ id, name, count: 0 }));
      const countsFromLogs = Array.from(storeCountsMap.entries()).map(([id, v]) => ({ id, name: storeNameMap.get(id) || v.name || id, count: v.count }));
      const mergedStoreCountsMap = new Map<string, { id: string; name: string; count: number }>();
      for (const s of allStoresBase) mergedStoreCountsMap.set(s.id, s);
      for (const s of countsFromLogs) {
        const existing = mergedStoreCountsMap.get(s.id);
        mergedStoreCountsMap.set(s.id, { id: s.id, name: s.name || (existing ? existing.name : s.id), count: s.count });
      }
      const aggregatedByName = new Map<string, { id: string; name: string; count: number }>();
      for (const s of mergedStoreCountsMap.values()) {
        const norm = String(s.name || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const e = aggregatedByName.get(norm);
        if (e) {
          aggregatedByName.set(norm, { id: e.id, name: e.name, count: e.count + s.count });
        } else {
          aggregatedByName.set(norm, { id: norm || s.id, name: s.name, count: s.count });
        }
      }
      const whatsappClicksByStore = Array.from(aggregatedByName.values()).sort((a, b) => b.count - a.count);

      setData({
        totalProducts: productsData.count || 0,
        totalCategories: categoriesData.count || 0,
        totalBrands: brandsData.count || 0,
        totalUsers: usersData.count || 0,
        totalLeads: leadsData?.count || 0,
        totalBanners: bannersData.count || 0,
        recentLeads: recentLeadsData || [],
        totalVisitors: uniqueVisitors,
        topProducts,
        whatsappClicksByStore,
        productsByCategory
      });

    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 h-80"></div>
            <div className="bg-white rounded-lg shadow-sm p-6 h-80"></div>
          </div>
        </div>

      {/* Acesso Rápido a Relatórios e Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Relatórios e Análises</h3>
            </div>
            <button
              onClick={() => navigate('/admin/reports')}
              className="flex items-center space-x-2 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <span>Acessar</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            Visualize relatórios detalhados de vendas, desempenho de produtos, análise por categoria e métricas de usuários.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">Relatórios de Vendas</div>
              <div className="text-xs text-gray-600">Análise detalhada por período</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">Desempenho de Produtos</div>
              <div className="text-xs text-gray-600">Ranking e métricas</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">Análise por Categoria</div>
              <div className="text-xs text-gray-600">Performance por segmento</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">Métricas de Usuários</div>
              <div className="text-xs text-gray-600">Atividade e crescimento</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro ao carregar dashboard</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button 
            onClick={fetchDashboardData}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total de Produtos',
      value: data.totalProducts,
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Categorias',
      value: data.totalCategories,
      icon: Filter,
      color: 'green'
    },
    {
      title: 'Marcas',
      value: data.totalBrands,
      icon: ShoppingCart,
      color: 'purple'
    },
    {
      title: 'Usuários',
      value: data.totalUsers,
      icon: Users,
      color: 'orange'
    },
    {
      title: 'Leads',
      value: data.totalLeads,
      icon: Eye,
      color: 'indigo'
    },
    {
      title: 'Banners',
      value: data.totalBanners,
      icon: Eye,
      color: 'pink'
    }
  ];

  const extraCards = [
    {
      title: 'Visitantes',
      value: data.totalVisitors,
      icon: Users,
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="text-gray-600 mt-1">Visão geral do sistema e métricas principais</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="-ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...statsCards, ...extraCards].map((card, index) => {
          const IconComponent = card.icon;
          // const colorClasses = {
          //   blue: 'bg-blue-500 text-blue-500 border-blue-500',
          //   green: 'bg-green-500 text-green-500 border-green-500',
          //   purple: 'bg-purple-500 text-purple-500 border-purple-500',
          //   orange: 'bg-orange-500 text-orange-500 border-orange-500',
          //   indigo: 'bg-indigo-500 text-indigo-500 border-indigo-500',
          //   pink: 'bg-pink-500 text-pink-500 border-pink-500'
          // }[card.color];

          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <div className="flex items-baseline mt-1">
                    <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  </div>
                </div>
                <div className={`flex-shrink-0 p-3 rounded-full bg-opacity-10 border-2`}>
                  <IconComponent className={`h-6 w-6`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <DashboardCharts
          whatsappClicksByStore={data.whatsappClicksByStore.map((s) => ({ name: s.name, value: s.count }))}
          productsByCategory={data.productsByCategory}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Produtos mais acessados</h3>
          </div>
          <div className="divide-y">
            {data.topProducts.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div className="text-sm text-gray-700">{p.name}</div>
                <div className="text-sm font-semibold text-gray-900">{p.count}</div>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <div className="text-sm text-gray-500">Sem dados</div>
            )}
          </div>
        </div>
        <RecentLeads leads={data.recentLeads} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Cliques no WhatsApp por loja</h3>
          </div>
          <div className="divide-y">
            {data.whatsappClicksByStore.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3">
                <div className="text-sm text-gray-700">{s.name}</div>
                <div className="text-sm font-semibold text-gray-900">{s.count}</div>
              </div>
            ))}
            {data.whatsappClicksByStore.length === 0 && (
              <div className="text-sm text-gray-500">Sem dados</div>
            )}
          </div>
        </div>

      {/* Status do Sistema */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Status do Sistema</h3>
          <div className="h-5 w-5 text-green-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Banco de Dados</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Online
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">API</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Online
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cache</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Ativo
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Última atualização</span>
            <span className="text-xs text-gray-500">
              {new Date().toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DashboardPage;
