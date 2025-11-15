import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { table } from '../lib/schema';

export interface SiteSettings {
  id: number;
  site_name: string;
  site_description: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

const defaultSettings: SiteSettings = {
  id: 1,
  site_name: 'Repal Representações',
  site_description: 'Sua empresa de confiança em representações comerciais',
  meta_title: 'Repal Representações - Soluções Comerciais',
  meta_description: 'A Repal oferece as melhores soluções em representações comerciais com qualidade e confiança.',
  meta_keywords: 'representações, comercial, vendas, produtos, qualidade',
  contact_email: 'contato@repal.com.br',
  contact_phone: '(11) 99999-9999',
  address: 'São Paulo, SP - Brasil',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from(table('site_settings'))
        .select('*')
        .limit(1)
        .single();

      if (fetchError) {
        // Erro já tratado pelo estado
        // Usar configurações padrão em caso de erro
        setSettings(defaultSettings);
      } else if (data) {
        setSettings(data);
      }
    } catch (err) {
      // Erro já tratado pelo estado
      setError('Erro ao carregar configurações do site');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Omit<SiteSettings, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from(table('site_settings'))
        .update(newSettings)
        .eq('id', settings.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (data) {
        setSettings(data);
      }

      return { success: true, data };
    } catch (err: unknown) {
      // Erro já tratado pelo estado
      
      let errorMessage = 'Erro desconhecido';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshSettings = () => {
    fetchSettings();
  };

  useEffect(() => {
    fetchSettings();

    // Configurar listener para mudanças em tempo real
    const subscription = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table('site_settings')
        },
        () => {
          // Configurações atualizadas
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings,
    // Helpers para acessar configurações específicas
    siteName: settings.site_name,
    siteDescription: settings.site_description,
    metaTitle: settings.meta_title || settings.site_name,
    metaDescription: settings.meta_description || settings.site_description,
    metaKeywords: settings.meta_keywords,
    contactEmail: settings.contact_email,
    contactPhone: settings.contact_phone,
    address: settings.address
  };
};

export default useSiteSettings;