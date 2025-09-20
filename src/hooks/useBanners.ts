import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Banner {
  id: string;
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
        .from('banners')
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
        .from('banners')
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
      
      const { data, error } = await supabase
        .from('banners')
        .insert({
          ...bannerData,
          active: bannerData.active ?? true,
          sort_order: bannerData.sort_order ?? 0
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar banner:', error);
        throw new Error('Erro ao criar banner. Verifique os dados e tente novamente.');
      }
      
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
  const updateBanner = async (id: string, bannerData: UpdateBannerData): Promise<Banner | null> => {
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

      const { data, error } = await supabase
        .from('banners')
        .update(bannerData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar banner:', error);
        throw new Error('Erro ao atualizar banner. Verifique os dados e tente novamente.');
      }
      
      // Refresh banners list
      await fetchBanners();
      return data;
    } catch (err) {
      console.error('Error updating banner:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar banner');
      return null;
    }
  };

  // Delete a banner
  const deleteBanner = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh banners list
      await fetchBanners();
      
      return true;
    } catch (err) {
      console.error('Error deleting banner:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar banner');
      return false;
    }
  };

  // Toggle banner active status
  const toggleBannerStatus = async (id: string, active: boolean): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('banners')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh banners list
      await fetchBanners();
      
      return true;
    } catch (err) {
      console.error('Error toggling banner status:', err);
      setError(err instanceof Error ? err.message : 'Erro ao alterar status do banner');
      return false;
    }
  };

  // Update banner sort order
  const updateBannerOrder = async (id: string, sort_order: number): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('banners')
        .update({ sort_order })
        .eq('id', id);

      if (error) throw error;
      
      // Refresh banners list
      await fetchBanners();
      
      return true;
    } catch (err) {
      console.error('Error updating banner order:', err);
      setError(err instanceof Error ? err.message : 'Erro ao alterar ordem do banner');
      return false;
    }
  };

  // Upload image to Supabase Storage
  const uploadBannerImage = async (file: File): Promise<string | null> => {
    try {
      setError(null);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (err) {
      console.error('Error uploading banner image:', err);
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
        .from('banners')
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