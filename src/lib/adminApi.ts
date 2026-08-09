import { apiFetch } from './api';

interface AdminApiListParams {
  search?: string;
  category_id?: string | number | null;
  subcategory_id?: string | number | null;
  featured?: string | boolean | null;
  active?: string | boolean | null;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

const qs = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const str = searchParams.toString();
  return str ? `?${str}` : '';
};

export const adminApi = {
  // Produtos
  getProducts: (params: AdminApiListParams = {}) =>
    apiFetch(`/api/admin/products${qs(params as unknown as Record<string, unknown>)}`, {}, false),
  createProduct: (product: Record<string, unknown>, additionalImages?: string[]) =>
    apiFetch('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify({ product, additionalImages: additionalImages || [] })
    }, true),
  updateProduct: (id: string, product: Record<string, unknown>, additionalImages?: string[]) =>
    apiFetch(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ product, additionalImages: additionalImages || [] })
    }, true),
  deleteProduct: (id: string) =>
    apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' }, true),
  bulkDeleteProducts: (ids: string[]) =>
    apiFetch('/api/admin/products/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    }, true),
  bulkUpdatePrice: (updates: { id: string | number; price: number }[]) =>
    apiFetch('/api/admin/products/bulk-update', {
      method: 'PUT',
      body: JSON.stringify({ updates })
    }, true),

  // Categorias
  getCategories: () =>
    apiFetch('/api/admin/categories', {}, false),
  createCategory: (category: Record<string, unknown>) =>
    apiFetch('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ category })
    }, true),
  updateCategory: (id: string, category: Record<string, unknown>) =>
    apiFetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ category })
    }, true),
  deleteCategory: (id: string) =>
    apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' }, true),
  bulkDeleteCategories: (ids: string[]) =>
    apiFetch('/api/admin/categories/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    }, true),

  // Marcas
  getBrands: () =>
    apiFetch('/api/admin/brands', {}, false),
  createBrand: (brand: Record<string, unknown>) =>
    apiFetch('/api/admin/brands', {
      method: 'POST',
      body: JSON.stringify({ brand })
    }, true),
  updateBrand: (id: string, brand: Record<string, unknown>) =>
    apiFetch(`/api/admin/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ brand })
    }, true),
  deleteBrand: (id: string) =>
    apiFetch(`/api/admin/brands/${id}`, { method: 'DELETE' }, true),
  bulkDeleteBrands: (ids: string[]) =>
    apiFetch('/api/admin/brands/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids })
    }, true),

  // Configurações do site
  getSettings: () =>
    apiFetch('/api/admin/settings/site-settings', {}, false),
  updateSettings: (settings: Record<string, unknown>) =>
    apiFetch('/api/admin/settings/site-settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    }, true),

  // Lojas
  getStores: () =>
    apiFetch('/api/admin/settings/stores', {}, false),
  createStore: (store: Record<string, unknown>) =>
    apiFetch('/api/admin/settings/stores', {
      method: 'POST',
      body: JSON.stringify({ store })
    }, true),
  updateStore: (id: string, store: Record<string, unknown>) =>
    apiFetch(`/api/admin/settings/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ store })
    }, true),
  deleteStore: (id: string) =>
    apiFetch(`/api/admin/settings/stores/${id}`, { method: 'DELETE' }, true),

  // Leads
  getLeads: () =>
    apiFetch('/api/admin/leads', {}, false),
  updateLeadStatus: (id: string, status: string) =>
    apiFetch(`/api/admin/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }, true),
  deleteLead: (id: string) =>
    apiFetch(`/api/admin/leads/${id}`, { method: 'DELETE' }, true),
  createMockLeads: () =>
    apiFetch('/api/admin/leads/mock', { method: 'POST' }, true),
  deleteMockLeads: () =>
    apiFetch('/api/admin/leads/delete-mock', { method: 'POST' }, true),

  // Usuários administradores
  getUsers: () =>
    apiFetch('/api/admin/users', {}, false),
  createUser: (user: Record<string, unknown>) =>
    apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ user })
    }, true),
  updateUser: (id: string, user: Record<string, unknown>) =>
    apiFetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ user })
    }, true),
  toggleUserStatus: (id: string, is_active: boolean) =>
    apiFetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active })
    }, true),
  deleteUser: (id: string) =>
    apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' }, true),

  // Dashboard
  getDashboard: () =>
    apiFetch('/api/admin/dashboard', {}, false)
};

export const unwrapData = <T>(json: { success: boolean; data: T }): T => json.data;
