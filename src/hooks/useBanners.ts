import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';
import { table } from '../lib/schema';

// Variáveis de ambiente para verificação
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBannerData {
  title: string;
  image_url: string;
  link_url?: string;
  active?: boolean;
  sort_order?: number;
}

export interface UpdateBannerData {
  title?: string;
  image_url?: string;
  link_url?: string;
  active?: boolean;
  sort_order?: number;
}

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all banners
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from(table('banners'))
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Erro ao buscar banners:', error);
        setError('Erro ao carregar banners. Tente novamente.');
        throw error;
      }
      
      setBanners(data || []);
    } catch (error) {
      console.error('Erro ao buscar banners:', error);
      setError('Erro ao carregar banners. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch only active banners for public display
  const fetchActiveBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from(table('banners'))
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      setBanners(data || []);
    } catch (err) {
      console.error('Error fetching active banners:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para validar URLs
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Create a new banner
  const createBanner = async (bannerData: CreateBannerData): Promise<Banner | null> => {
    try {
      setError(null);
      
      // Validações
      if (!bannerData.title?.trim()) {
        throw new Error('Título é obrigatório');
      }
      if (!bannerData.image_url?.trim()) {
        throw new Error('URL da imagem é obrigatória');
      }
      if (bannerData.link_url && bannerData.link_url.trim() && !isValidUrl(bannerData.link_url)) {
        throw new Error('URL do link inválida');
      }
      if (!isValidUrl(bannerData.image_url)) {
        throw new Error('URL da imagem inválida');
      }
      
      
      
      // Tentar via API admin (bypassa RLS e aplica CSRF)
      const response = await apiFetch('/api/admin/banners', {
        method: 'POST',
        body: JSON.stringify({
          banner: {
            title: bannerData.title.trim(),
            image_url: bannerData.image_url.trim(),
            link_url: bannerData.link_url?.trim() || null,
            active: bannerData.active ?? true,
            sort_order: bannerData.sort_order ?? 0
          }
        })
      }, true);
      const data = response?.data as Banner;
      
      
      
      // Refresh banners list
      await fetchBanners();
      
      return data;
    } catch (err) {
      console.error('Error creating banner:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar banner');
      return null;
    }
  };

  // Update an existing banner
  const updateBanner = async (id: number, bannerData: UpdateBannerData): Promise<Banner | null> => {
    try {
      setError(null);
      
      // Validações
      if (bannerData.title !== undefined && !bannerData.title?.trim()) {
        throw new Error('Título não pode estar vazio');
      }
      if (bannerData.image_url !== undefined && !bannerData.image_url?.trim()) {
        throw new Error('URL da imagem não pode estar vazia');
      }
      if (bannerData.link_url && bannerData.link_url.trim() && !isValidUrl(bannerData.link_url)) {
        throw new Error('URL do link inválida');
      }
      if (bannerData.image_url && !isValidUrl(bannerData.image_url)) {
        throw new Error('URL da imagem inválida');
      }

      const response = await apiFetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ banner: bannerData })
      }, true);
      const data = response?.data as Banner;
      
      // Refresh banners list
      await fetchBanners();
      return data;
    } catch (err) {
      
      setError(err instanceof Error ? err.message : 'Erro ao atualizar banner');
      return null;
    }
  };

  // Delete a banner
  const deleteBanner = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/admin/banners/${id}`, { method: 'DELETE' }, true);
      
      // Refresh banners list
      await fetchBanners();
      
      return true;
    } catch (err) {
        
      setError(err instanceof Error ? err.message : 'Erro ao deletar banner');
      return false;
    }
  };

  // Toggle banner active status
  const toggleBannerStatus = async (id: number, active: boolean): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/admin/banners/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ active })
      }, true);
      
      // Refresh banners list
      await fetchBanners();
      
      return true;
    } catch (err) {
      
      setError(err instanceof Error ? err.message : 'Erro ao alterar status do banner');
      return false;
    }
  };

  // Update banner sort order
  const updateBannerOrder = async (id: number, sort_order: number): Promise<boolean> => {
    try {
      setError(null);
      await apiFetch(`/api/admin/banners/${id}/order`, {
        method: 'PATCH',
        body: JSON.stringify({ sort_order })
      }, true);
      
      // Refresh banners list
      await fetchBanners();
      
      return true;
    } catch (err) {
      
      setError(err instanceof Error ? err.message : 'Erro ao alterar ordem do banner');
      return false;
    }
  };

  // Upload image to Supabase Storage
  const uploadBannerImage = async (file: File): Promise<string | null> => {
    try {
      setError(null);
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuração do Supabase incompleta');
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}-${Math.random().toString(36).slice(2, 11)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadError) {
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          throw new Error("Bucket 'banners' não encontrado ou sem acesso");
        }
        if (uploadError.message?.toLowerCase().includes('permission')) {
          throw new Error('Sem permissão para enviar arquivos ao Storage');
        }
        throw new Error(uploadError.message || 'Falha no upload');
      }
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);
      return publicUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da imagem');
      return null;
    }
  };

  // Load banners on mount
  useEffect(() => {
    fetchBanners();
  }, []);

  return {
    banners,
    loading,
    error,
    fetchBanners,
    fetchActiveBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    updateBannerOrder,
    uploadBannerImage,
    refetch: fetchBanners
  };
}

// Hook specifically for active banners (public use)
export function useActiveBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from(table('banners'))
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      setBanners(data || []);
    } catch (err) {
      console.error('Error fetching active banners:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBanners();
  }, []);

  return {
    banners,
    loading,
    error,
    refetch: fetchActiveBanners
  };
}
