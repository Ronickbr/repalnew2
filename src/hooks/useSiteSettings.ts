import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSettings {
  id?: number;
  site_info?: {
    site_name?: string;
    site_description?: string;
    logo_url?: string;
    name?: string;
    description?: string;
    logo?: string;
    favicon_url?: string;
    favicon?: string;
  };
  integrations?: {
    google_tag_manager_id?: string;
    google_analytics_id?: string;
    facebook_pixel_id?: string;
    gemini_api_key?: string;
  };
  maintenance?: {
    is_maintenance_mode?: boolean;
    maintenance_message?: string;
  };
  theme?: {
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  seo?: {
    default_title?: string;
    default_description?: string;
    default_keywords?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Primeiro vamos verificar se existe algum registro
      const { data: allData, error: allError } = await supabase
        .from('site_settings')
        .select('*');

      console.log('=== DEBUG useSiteSettings ===');
      console.log('Dados brutos do Supabase:', allData);
      console.log('Erro do Supabase:', allError);

      if (allData && allData.length > 0) {
        const data = allData[0];
        console.log('Primeiro registro encontrado:', data);
        console.log('site_info:', data.site_info);
        console.log('logo do site_info:', data.site_info?.logo);
        setSettings(data);
      } else {
        console.log('Nenhuma configuração encontrada');
        setSettings({});
      }
    } catch (err) {
      console.error('Erro ao buscar configurações do site:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    
    // Adicionar listener para mudanças em tempo real
    const subscription = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload: { new?: SiteSettings }) => {
          if (payload.new) {
            setSettings(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      setLoading(true);
      setError(null);

      if (settings?.id) {
        // Atualizar configurações existentes
        const { data, error: updateError } = await supabase
          .from('site_settings')
          .update(newSettings)
          .eq('id', settings.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setSettings(data);
      } else {
        // Criar novas configurações
        const { data, error: insertError } = await supabase
          .from('site_settings')
          .insert([{
            ...newSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(data);
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar configurações';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    gtmId: settings?.integrations?.google_tag_manager_id,
    geminiApiKey: settings?.integrations?.gemini_api_key,
    // Propriedades para compatibilidade com componentes existentes
    siteName: settings?.site_info?.site_name || settings?.site_info?.name,
    siteDescription: settings?.site_info?.site_description || settings?.site_info?.description,
    logoUrl: settings?.site_info?.logo || settings?.site_info?.logo_url,
    faviconUrl: settings?.site_info?.favicon_url || settings?.site_info?.favicon,
    metaTitle: settings?.seo?.default_title,
    metaDescription: settings?.seo?.default_description,
    metaKeywords: settings?.seo?.default_keywords,
    contactEmail: settings?.contact?.email,
    contactPhone: settings?.contact?.phone,
    address: settings?.contact?.address
  };
};

export default useSiteSettings;