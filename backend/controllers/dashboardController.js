import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';

const safeJson = (raw) => {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw || {};
};

export const getDashboardData = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        data: {
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
        }
      });
    }

    const supabase = getServiceClient();

    const safeCount = (tableName, countQuery = '') => supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .order('created_at', { ascending: false })
      .limit(0)
      .then(({ count, error }) => (error ? null : count));

    const [productsCount, categoriesCount, brandsCount, usersCount, bannersCount] = await Promise.all([
      safeCount('products'),
      safeCount('categories'),
      safeCount('brands'),
      safeCount('admin_users'),
      safeCount('banners')
    ]);

    // Leads
    let leadsCount = 0;
    let recentLeads = [];
    try {
      const { count, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      if (!countError) leadsCount = count || 0;
    } catch {
      leadsCount = 0;
    }
    try {
      const { data, error: recentError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (!recentError) recentLeads = data || [];
    } catch {
      recentLeads = [];
    }

    // Lojas (nome por id)
    let storeNameMap = new Map();
    try {
      const { data } = await supabase.from('stores').select('id, name').limit(1000);
      if (data) {
        storeNameMap = new Map(data.map(s => [String(s.id), String(s.name || '')]));
      }
    } catch {
      storeNameMap = new Map();
    }

    // activity_logs (pode não existir — tratar com tolerância)
    let siteVisitRows = [];
    let productViewRows = [];
    let whatsappClickRows = [];
    try {
      const { data } = await supabase.from('activity_logs').select('details').eq('action', 'site_visit').limit(50000);
      siteVisitRows = data || [];
    } catch {
      siteVisitRows = [];
    }
    try {
      const { data } = await supabase.from('activity_logs').select('resource_id, details').eq('action', 'product_view').limit(50000);
      productViewRows = data || [];
    } catch {
      productViewRows = [];
    }
    try {
      const { data } = await supabase.from('activity_logs').select('resource_id, details').eq('action', 'whatsapp_click').limit(50000);
      whatsappClickRows = data || [];
    } catch {
      whatsappClickRows = [];
    }

    // Visitantes únicos
    const visitorIds = new Set();
    for (const r of siteVisitRows) {
      const d = safeJson(r.details);
      if (d && d.visitor_id) visitorIds.add(String(d.visitor_id));
    }
    const totalVisitors = visitorIds.size;

    // Top produtos acessados
    const productCountsMap = new Map();
    for (const r of productViewRows) {
      const id = String(r.resource_id);
      const d = safeJson(r.details);
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

    // Cliques no WhatsApp por loja
    const storeCountsMap = new Map();
    for (const r of whatsappClickRows) {
      const id = String(r.resource_id);
      const d = safeJson(r.details);
      const name = d.store_name || '';
      const entry = storeCountsMap.get(id) || { name, count: 0 };
      entry.count += 1;
      if (!entry.name && name) entry.name = name;
      storeCountsMap.set(id, entry);
    }
    const mergedStoreCountsMap = new Map();
    for (const [id, name] of storeNameMap.entries()) {
      mergedStoreCountsMap.set(id, { id, name, count: 0 });
    }
    for (const [id, v] of storeCountsMap.entries()) {
      const existing = mergedStoreCountsMap.get(id);
      mergedStoreCountsMap.set(id, { id, name: v.name || (existing ? existing.name : id), count: v.count });
    }
    const aggregatedByName = new Map();
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

    // Produtos por categoria
    let categoryNameMap = new Map();
    let productsLightRows = [];
    try {
      const { data } = await supabase.from('categories').select('id, name').eq('active', true).limit(1000);
      if (data) categoryNameMap = new Map(data.map(c => [String(c.id), String(c.name || '')]));
    } catch {
      categoryNameMap = new Map();
    }
    try {
      const { data } = await supabase.from('products').select('category_id').eq('active', true).limit(50000);
      productsLightRows = data || [];
    } catch {
      productsLightRows = [];
    }
    const categoryCountMap = new Map();
    for (const p of productsLightRows) {
      const cid = p.category_id != null ? String(p.category_id) : '';
      if (!cid) continue;
      categoryCountMap.set(cid, (categoryCountMap.get(cid) || 0) + 1);
    }
    const productsByCategory = Array.from(categoryCountMap.entries())
      .map(([id, count]) => ({ name: categoryNameMap.get(id) || id, value: count }))
      .sort((a, b) => b.value - a.value);

    return res.json({
      success: true,
      data: {
        totalProducts: productsCount || 0,
        totalCategories: categoriesCount || 0,
        totalBrands: brandsCount || 0,
        totalUsers: usersCount || 0,
        totalLeads: leadsCount,
        totalBanners: bannersCount || 0,
        recentLeads,
        totalVisitors,
        topProducts,
        whatsappClicksByStore,
        productsByCategory
      }
    });
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao carregar dashboard' });
  }
};
