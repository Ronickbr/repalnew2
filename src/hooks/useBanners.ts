import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
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
  
  // Use secure fallback or relative path if possible, but for now just removing hardcoded http
  const apiBase = (import.meta as any).env?.VITE_BACKEND_URL || '';

  const getCsrf = async (): Promise<string | null> => {
    try {
      const r = await fetch(`${apiBase}/api/auth/csrf-token`, { credentials: 'include' });
      if (!r.ok) return null;
      const j = await r.json();
      return j?.csrfToken || null;
    } catch {
      return null;
    }
  };

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
      
      
      
      const csrf = await getCsrf();
      let created: Banner | null = null;
      if (csrf) {
        try {
          const resp = await fetch(`${apiBase}/api/admin/banners`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
            credentials: 'include',
            body: JSON.stringify({ banner: {
              title: bannerData.title.trim(),
              image_url: bannerData.image_url.trim(),
              link_url: bannerData.link_url?.trim() || null,
              active: bannerData.active ?? true,
              sort_order: bannerData.sort_order ?? 0
            } })
          });
          if (resp.ok) {
            const j = await resp.json();
            created = j?.data || null;
          }
        } catch {}
      }
      if (!created) {
        const { data, error } = await supabase
          .from(table('banners'))
          .insert({
            title: bannerData.title.trim(),
            image_url: bannerData.image_url.trim(),
            link_url: bannerData.link_url?.trim() || null,
            active: bannerData.active ?? true,
            sort_order: bannerData.sort_order ?? 0
          })
          .select()
          .single();
        if (error) {
          throw new Error(`Erro ao criar banner: ${error.message}`);
        }
        created = data as Banner;
      }
      
      
      
      // Refresh banners list
      await fetchBanners();
      
      return created;
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

      const csrf = await getCsrf();
      let updated: Banner | null = null;
      if (csrf) {
        try {
          const resp = await fetch(`${apiBase}/api/admin/banners/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
            credentials: 'include',
            body: JSON.stringify({ banner: bannerData })
          });
          if (resp.ok) {
            const j = await resp.json();
            updated = j?.data || null;
          }
        } catch {}
      }
      if (!updated) {
        const { data, error } = await supabase
          .from(table('banners'))
          .update(bannerData)
          .eq('id', id)
          .select()
          .single();
        if (error) {
          throw new Error('Erro ao atualizar banner. Verifique os dados e tente novamente.');
        }
        updated = data as Banner;
      }
      
      // Refresh banners list
      await fetchBanners();
      return updated;
    } catch (err) {
      
      setError(err instanceof Error ? err.message : 'Erro ao atualizar banner');
      return null;
    }
  };

  // Delete a banner
  const deleteBanner = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      const csrf = await getCsrf();
      let ok = false;
      if (csrf) {
        try {
          const resp = await fetch(`${apiBase}/api/admin/banners/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRF-Token': csrf },
            credentials: 'include'
          });
          ok = resp.ok;
        } catch {}
      }
      if (!ok) {
        const { error } = await supabase
          .from(table('banners'))
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
      
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
      const csrf = await getCsrf();
      let ok = false;
      if (csrf) {
        try {
          const resp = await fetch(`${apiBase}/api/admin/banners/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
            credentials: 'include',
            body: JSON.stringify({ banner: { active } })
          });
          ok = resp.ok;
        } catch {}
      }
      if (!ok) {
        const { error } = await supabase
          .from(table('banners'))
          .update({ active })
          .eq('id', id);
        if (error) throw error;
      }
      
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
      const csrf = await getCsrf();
      let ok = false;
      if (csrf) {
        try {
          const resp = await fetch(`${apiBase}/api/admin/banners/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
            credentials: 'include',
            body: JSON.stringify({ banner: { sort_order } })
          });
          ok = resp.ok;
        } catch {}
      }
      if (!ok) {
        const { error } = await supabase
          .from(table('banners'))
          .update({ sort_order })
          .eq('id', id);
        if (error) throw error;
      }
      
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
      
      // Verificar se Supabase está configurado
      if (!supabaseUrl || !supabaseAnonKey) {
        
        throw new Error('Configuração do Supabase incompleta');
      }
      
      
      
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      
      
      // Método direto: tentar upload sem verificar buckets
      // Isso evita problemas de permissão para listar buckets
      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `banner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        
        
        // Tentar upload direto
        const { error: uploadError } = await supabase.storage
          .from('banners')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          
          
          // Se falhar por causa do bucket, tentar criar
          if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
            
            
            // Tentar criar bucket via RPC
            try {
              const { error: createError } = await supabase.rpc('create_bucket_if_not_exists', {
                bucket_name: 'banners',
                is_public: true,
                file_size_limit: 5242880,
                allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
              });
              
              if (createError) {
                
              } else {
                
                
                // Tentar upload novamente
                const { error: retryError } = await supabase.storage
                  .from('banners')
                  .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                  });
                  
                if (retryError) {
                  throw retryError;
                }
              }
            } catch (rpcError) {
              console.error('Erro ao criar bucket:', rpcError);
              throw new Error('Não foi possível criar o bucket banners. Por favor, crie manualmente no dashboard.');
            }
          } else {
            throw uploadError;
          }
        }
        
        
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('banners')
          .getPublicUrl(fileName);
        
        
        return publicUrl;
        
      } catch (directError) {
        
        
        // Se o método direto falhar, tentar o método tradicional
        
        
        // Verificar se o bucket existe
        let buckets;
        try {
          const { data, error: bucketError } = await supabase.storage.listBuckets();
          if (bucketError) {
            
            throw new Error('Sem permissão para listar buckets. Verifique as configurações do Supabase.');
          }
          buckets = data;
        } catch (listError) {
          
          throw new Error('Erro ao listar buckets. O usuário pode não ter permissões adequadas.');
        }
        
        if (!buckets || buckets.length === 0) {
          
          throw new Error('Nenhum bucket encontrado. Verifique as permissões do usuário.');
        }
        
        const bannerBucket = buckets.find((bucket: any) => bucket.id === 'banners');
        if (!bannerBucket) {
          
          throw new Error(`Bucket 'banners' não encontrado.`);
        }
        
        
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `banner-${Date.now()}.${fileExt}`;
        
        
        
        // Tentar upload com retry
        let uploadError = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            
            
            const { error } = await supabase.storage
              .from('banners')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              
              uploadError = error;
              
              if (error.message?.includes('network') || error.message?.includes('fetch')) {
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
              
              throw error;
            }
            
            
            uploadError = null;
            break;
            
          } catch (err) {
            
            uploadError = err;
            
            if (attempt === 2) {
              throw err;
            }
          }
        }

        if (uploadError) {
          
          throw uploadError;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('banners')
          .getPublicUrl(fileName);
        
        
        return publicUrl;
      }
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
