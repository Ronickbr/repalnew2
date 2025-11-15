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
      
      console.log('Criando banner com dados:', bannerData);
      
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
        console.error('Erro ao criar banner:', error);
        throw new Error(`Erro ao criar banner: ${error.message}`);
      }
      
      console.log('Banner criado com sucesso:', data);
      
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

      const { data, error } = await supabase
        .from(table('banners'))
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
  const deleteBanner = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from(table('banners'))
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
  const toggleBannerStatus = async (id: number, active: boolean): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from(table('banners'))
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
  const updateBannerOrder = async (id: number, sort_order: number): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from(table('banners'))
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
      
      // Verificar se Supabase está configurado
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase não está configurado corretamente');
        throw new Error('Configuração do Supabase incompleta');
      }
      
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key configured:', !!supabaseAnonKey);
      
      // Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      console.log('Uploading banner image:', file.name, 'User:', user.id);
      
      // Método direto: tentar upload sem verificar buckets
      // Isso evita problemas de permissão para listar buckets
      try {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `banner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        console.log('Tentando upload direto para bucket banners, filename:', fileName);
        console.log('File details:', { 
          name: file.name, 
          size: file.size, 
          type: file.type,
          lastModified: file.lastModified 
        });
        
        // Tentar upload direto
        const { error: uploadError } = await supabase.storage
          .from('banners')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload direto falhou:', uploadError);
          
          // Se falhar por causa do bucket, tentar criar
          if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
            console.log('Bucket pode não existir, tentando criar...');
            
            // Tentar criar bucket via RPC
            try {
              const { error: createError } = await supabase.rpc('create_bucket_if_not_exists', {
                bucket_name: 'banners',
                is_public: true,
                file_size_limit: 5242880,
                allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
              });
              
              if (createError) {
                console.error('Erro ao criar bucket via RPC:', createError);
              } else {
                console.log('Bucket criado com sucesso via RPC, tentando upload novamente...');
                
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
        
        console.log('Upload bem-sucedido!');
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('banners')
          .getPublicUrl(fileName);
        
        console.log('Upload successful, public URL:', publicUrl);
        return publicUrl;
        
      } catch (directError) {
        console.error('Erro no método direto:', directError);
        
        // Se o método direto falhar, tentar o método tradicional
        console.log('Tentando método tradicional com verificação de buckets...');
        
        // Verificar se o bucket existe
        let buckets;
        try {
          const { data, error: bucketError } = await supabase.storage.listBuckets();
          if (bucketError) {
            console.error('Error listing buckets:', bucketError);
            throw new Error('Sem permissão para listar buckets. Verifique as configurações do Supabase.');
          }
          buckets = data;
        } catch (listError) {
          console.error('Exception listing buckets:', listError);
          throw new Error('Erro ao listar buckets. O usuário pode não ter permissões adequadas.');
        }
        
        if (!buckets || buckets.length === 0) {
          console.error('No buckets found or user lacks permissions');
          throw new Error('Nenhum bucket encontrado. Verifique as permissões do usuário.');
        }
        
        const bannerBucket = buckets.find((bucket: any) => bucket.id === 'banners');
        if (!bannerBucket) {
          console.error('Banner bucket not found. Available buckets:', buckets.map((bucket: any) => bucket.id));
          throw new Error(`Bucket 'banners' não encontrado.`);
        }
        
        console.log('Banner bucket found:', bannerBucket.id, 'Public:', bannerBucket.public);
        
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `banner-${Date.now()}.${fileExt}`;
        
        console.log('Uploading to bucket banners, filename:', fileName);
        
        // Tentar upload com retry
        let uploadError = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`Upload attempt ${attempt}...`);
            
            const { error } = await supabase.storage
              .from('banners')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              console.error(`Upload attempt ${attempt} failed:`, error);
              uploadError = error;
              
              if (error.message?.includes('network') || error.message?.includes('fetch')) {
                console.log('Waiting 1 second before retry...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
              
              throw error;
            }
            
            console.log(`Upload attempt ${attempt} successful!`);
            uploadError = null;
            break;
            
          } catch (err) {
            console.error(`Upload attempt ${attempt} exception:`, err);
            uploadError = err;
            
            if (attempt === 2) {
              throw err;
            }
          }
        }

        if (uploadError) {
          console.error('All upload attempts failed:', uploadError);
          throw uploadError;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('banners')
          .getPublicUrl(fileName);
        
        console.log('Upload successful, public URL:', publicUrl);
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