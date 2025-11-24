// Schema do banco de dados baseado na estrutura real do Supabase

const TABLES = {
  // Tabela de banners
  banners: {
    name: 'banners',
    columns: {
      id: 'id',
      title: 'title',
      description: 'description',
      image_url: 'image_url',
      link_url: 'link_url',
      start_date: 'start_date',
      end_date: 'end_date',
      clicks: 'clicks',
      impressions: 'impressions',
      sort_order: 'sort_order',
      active: 'active',
      created_at: 'created_at',
      updated_at: 'updated_at'
    }
  },

  categories: {
    name: 'categories',
    columns: {
      id: 'id',
      name: 'name',
      slug: 'slug',
      parent_id: 'parent_id',
      active: 'active',
      sort_order: 'sort_order',
      featured_product_id: 'featured_product_id',
      created_at: 'created_at',
      updated_at: 'updated_at'
    }
  },

  // Tabela de produtos
  products: {
    name: 'products',
    columns: {
      id: 'id',
      name: 'name',
      slug: 'slug',
      description: 'description',
      category_id: 'category_id',
      subcategory_id: 'subcategory_id',
      brand: 'brand',
      image: 'image',
      specifications_html: 'specifications_html',
      seo_title: 'seo_title',
      seo_description: 'seo_description',
      seo_keywords: 'seo_keywords',
      featured: 'featured',
      active: 'active',
      featured_on_homepage: 'featured_on_homepage',
      featured_in_dropdown: 'featured_in_dropdown',
      is_disabled: 'is_disabled',
      created_at: 'created_at',
      updated_at: 'updated_at'
    }
  },

  // Tabela de imagens dos produtos
  product_images: {
    name: 'product_images',
    columns: {
      id: 'id',
      product_id: 'product_id',
      url: 'url',
      sort_order: 'sort_order',
      created_at: 'created_at'
    }
  },

  // Tabela de marcas
  brands: {
    name: 'brands',
    columns: {
      id: 'id',
      name: 'name',
      slug: 'slug',
      logo_url: 'logo_url',
      created_at: 'created_at',
      updated_at: 'updated_at'
    }
  },

  // Tabela de promoções
  promotions: {
    name: 'promotions',
    columns: {
      id: 'id',
      title: 'title',
      description: 'description',
      discount_percentage: 'discount_percentage',
      start_date: 'start_date',
      end_date: 'end_date',
      active: 'active',
      created_at: 'created_at',
      updated_at: 'updated_at'
    }
  },

  // Tabela de produtos em promoção (relacionamento N:N)
  promotion_products: {
    name: 'promotion_products',
    columns: {
      promotion_id: 'promotion_id',
      product_id: 'product_id'
    }
  },

  // Tabela de leads/contatos
  leads: {
    name: 'leads',
    columns: {
      id: 'id',
      name: 'name',
      email: 'email',
      phone: 'phone',
      message: 'message',
      status: 'status',
      created_at: 'created_at',
      updated_at: 'updated_at'
    }
  },

  // Tabela de lojas
  stores: {
    name: 'stores',
    columns: {
      id: 'id',
      name: 'name',
      whatsapp_number: 'whatsapp_number',
      email: 'email',
      phone: 'phone',
      address: 'address',
      active: 'active',
      created_at: 'created_at',
      updated_at: 'updated_at'
    }
  },

  // Tabela de usuários
  users: {
    name: 'users',
    columns: {
      id: 'id',
      name: 'name',
      email: 'email',
      phone: 'phone',
      role: 'role',
      avatar: 'avatar',
      is_active: 'is_active',
      created_at: 'created_at',
      last_login: 'last_login'
    }
  },

  // Tabela de administradores
  admin_users: {
    name: 'admin_users',
    columns: {
      id: 'id',
      email: 'email',
      password_hash: 'password_hash',
      name: 'name',
      role: 'role',
      active: 'active',
      created_at: 'created_at',
      updated_at: 'updated_at'
    }
  },

  // Tabela de configurações do site
  site_settings: {
    name: 'site_settings',
    columns: {
      id: 'id',
      site_info: 'site_info',
      integrations: 'integrations',
      maintenance: 'maintenance',
      theme: 'theme',
      contact: 'contact',
      social_media: 'social_media',
      seo: 'seo',
      created_at: 'created_at',
      updated_at: 'updated_at'
    }
  },

  // Tabela de logs de atividade
  activity_logs: {
    name: 'activity_logs',
    columns: {
      id: 'id',
      user_id: 'user_id',
      action: 'action',
      resource_type: 'resource_type',
      resource_id: 'resource_id',
      details: 'details',
      ip_address: 'ip_address',
      user_agent: 'user_agent',
      status: 'status',
      created_at: 'created_at'
    }
  }
};

// Função auxiliar para obter o nome da tabela
function table(tableName) {
  return TABLES[tableName]?.name || tableName;
}

// Função auxiliar para obter colunas
function columns(tableName) {
  return TABLES[tableName]?.columns || {};
}

// Exportar para uso
module.exports = {
  TABLES,
  table,
  columns
};
