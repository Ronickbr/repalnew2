// Schema do banco de dados baseado na estrutura real do Supabase

export const TABLES = {
  // Tabela de banners
  banners: 'banners',
  
  // Tabela de categorias (sem parent_id - apenas categorias principais)
  categories: 'categories',
  
  // Tabela de subcategorias (relacionamento com categories)
  subcategories: 'subcategories',
  
  // Tabela de produtos
  products: 'products',
  
  // Tabela de imagens dos produtos
  product_images: 'product_images',
  
  // Tabela de marcas
  brands: 'brands',
  
  // Tabela de promoções
  promotions: 'promotions',
  
  // Tabela de produtos em promoção (relacionamento N:N)
  promotion_products: 'promotion_products',
  
  // Tabela de leads/contatos
  leads: 'leads',
  
  // Tabela de lojas
  stores: 'stores',
  
  // Tabela de usuários
  users: 'users',
  
  // Tabela de administradores
  admin_users: 'admin_users',
  
  // Tabela de perfis
  profiles: 'profiles',
  
  // Tabela de configurações do site
  site_settings: 'site_settings',
  
  // Tabela de logs de atividade
  activity_logs: 'activity_logs'
} as const;

export type TableKey = keyof typeof TABLES;

// Função auxiliar para obter o nome da tabela
export function table(key: TableKey) {
  return TABLES[key];
}