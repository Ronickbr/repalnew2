import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para o banco de dados
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          featured: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: number
          product_name: string
          slug: string
          description: string | null
          benefits: string | null
          category_id: number
          featured: boolean
          display_order: number
          featured_in_dropdown: boolean
          is_disabled: boolean
          featured_on_homepage: boolean
          clearance_sale: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          product_name: string
          slug: string
          description?: string | null
          benefits?: string | null
          category_id: number
          featured?: boolean
          display_order?: number
          featured_in_dropdown?: boolean
          is_disabled?: boolean
          featured_on_homepage?: boolean
          clearance_sale?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          product_name?: string
          slug?: string
          description?: string | null
          benefits?: string | null
          category_id?: number
          featured?: boolean
          display_order?: number
          featured_in_dropdown?: boolean
          is_disabled?: boolean
          featured_on_homepage?: boolean
          clearance_sale?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_images: {
        Row: {
          id: number
          product_id: number
          image_url: string
          alt_text: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: number
          product_id: number
          image_url: string
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: number
          product_id?: number
          image_url?: string
          alt_text?: string | null
          display_order?: number
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: number
          name: string
          email: string
          phone: string | null
          message: string | null
          product_name: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          phone?: string | null
          message?: string | null
          product_name?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          phone?: string | null
          message?: string | null
          product_name?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Database Types based on existing Supabase schema
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  parent_id?: number;
  is_parent?: boolean;
  level?: number;
}

export interface Product {
  id: string;
  product_name: string;
  slug: string;
  description?: string;
  specifications?: string;
  benefits?: string;
  category_id?: number;
  subcategory_id?: number;
  image_url?: string;
  featured: boolean;
  active: boolean;
  featured_in_dropdown?: boolean;
  is_disabled?: boolean;
  featured_on_homepage?: boolean;
  clearance_sale?: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  subcategory?: Category;
  images?: ProductImage[];
  product_images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: number;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary?: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  client_name: string;
  phone: string;
  email?: string;
  message?: string;
  product_name?: string;
  source?: string;
  status: 'novo' | 'contato' | 'orcado' | 'fechado' | 'perdido';
  created_at: string;
  updated_at: string;
}

// Product with images for queries that include images
export interface ProductWithImages extends Product {
  product_images?: ProductImage[];
}

// Insert Types
export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'images'>;
export type ProductImageInsert = Omit<ProductImage, 'id' | 'created_at'>;
export type LeadInsert = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;

// Update Types
export type CategoryUpdate = Partial<CategoryInsert>;
export type ProductUpdate = Partial<ProductInsert>;
export type ProductImageUpdate = Partial<ProductImageInsert>;
export type LeadUpdate = Partial<LeadInsert>;