export interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  featured: boolean;
  image_url?: string;
  product_images?: ProductImage[];
  images?: ProductImage[];
  category_id?: string;
  created_at?: string;
  updated_at?: string;
  featured_in_dropdown?: boolean;
  is_disabled?: boolean;
  featured_on_homepage?: boolean;
  specifications?: string;
  tags?: string[];
  short_description?: string;
}

export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  featured: boolean;
  image_url?: string;
  product_images?: ProductImage[];
  images?: ProductImage[];
  category_id?: string;
  subcategory_id?: string;
  created_at?: string;
  updated_at?: string;
  active: boolean;
  featured_in_dropdown?: boolean;
  is_disabled?: boolean;
  featured_on_homepage?: boolean;
  specifications?: string;
  technical_specifications?: string | Record<string, unknown> | unknown[];
  short_description?: string;
  key_features?: string[];
  additional_images?: string[];
  brand?: string;
  model?: string;
  sku_code?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  tags?: string[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  categories?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SearchResult {
  id: string;
  name: string;
  category?: string;
  image_url?: string;
  product_images?: ProductImage[];
  slug: string;
}
