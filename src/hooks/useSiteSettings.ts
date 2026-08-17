import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { queryKeys } from '../lib/react-query';

export interface PublicSiteSettings {
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
    url?: string;
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
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    canonical_url?: string;
  };
  updated_at?: string;
}

export type SiteSettings = PublicSiteSettings;

const EMPTY_SETTINGS: PublicSiteSettings = {};

const PUBLIC_SETTINGS_FIELDS = `
  id,
  site_info,
  maintenance,
  theme,
  contact,
  social_media,
  seo,
  updated_at
`;

export const useSiteSettings = () => {
  const queryClient = useQueryClient();
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const query = useQuery<PublicSiteSettings>({
    queryKey: queryKeys.siteSettings,
    queryFn: async () => {
      if (!isSupabaseConfigured) return EMPTY_SETTINGS;

      const { data, error: qError } = await supabase
        .from('site_settings')
        .select(PUBLIC_SETTINGS_FIELDS)
        .limit(1)
        .maybeSingle();

      if (qError) throw qError;

      return data ?? EMPTY_SETTINGS;
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const settings = query.data ?? null;
  const loading = query.isPending || updateLoading;
  const error = (query.error?.message ?? updateError) || null;

  const fetchSettings = useCallback(async () => {
    setUpdateError(null);
    try {
      await query.refetch();
    } catch (err) {
      console.warn('[useSiteSettings] fetchSettings falhou:', err);
    }
  }, [query]);

  const updateSettings = useCallback(
    async (newSettings: Partial<SiteSettings>) => {
      try {
        setUpdateLoading(true);
        setUpdateError(null);

        let resultData: SiteSettings | null = null;

        if (settings?.id) {
          const { data, error: sError } = await supabase
            .from('site_settings')
            .update(newSettings)
            .eq('id', settings.id)
            .select(PUBLIC_SETTINGS_FIELDS)
            .maybeSingle();

          if (sError) throw sError;
          resultData = data ?? null;
        } else {
          const { data, error: insertError } = await supabase
            .from('site_settings')
            .insert([
              {
                ...newSettings,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ])
            .select(PUBLIC_SETTINGS_FIELDS)
            .maybeSingle();

          if (insertError) throw insertError;
          resultData = data ?? null;
        }

        if (resultData) {
          queryClient.setQueryData(queryKeys.siteSettings, resultData);
        }

        return { success: true as const };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao atualizar configurações';
        setUpdateError(errorMessage);
        console.error('[useSiteSettings] updateSettings erro:', { err, newSettings });
        return { success: false as const, error: errorMessage };
      } finally {
        setUpdateLoading(false);
      }
    },
    [settings?.id, queryClient]
  );

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    gtmId: undefined,
    geminiApiKey: undefined,
    siteName: settings?.site_info?.site_name || settings?.site_info?.name,
    siteDescription: settings?.site_info?.site_description || settings?.site_info?.description,
    logoUrl: settings?.site_info?.logo || settings?.site_info?.logo_url,
    faviconUrl: settings?.site_info?.favicon_url || settings?.site_info?.favicon,
    metaTitle: settings?.seo?.meta_title || settings?.seo?.default_title,
    metaDescription: settings?.seo?.meta_description || settings?.seo?.default_description,
    metaKeywords: settings?.seo?.meta_keywords || settings?.seo?.default_keywords,
    canonicalBaseUrl: settings?.seo?.canonical_url || settings?.site_info?.url,
    contactEmail: settings?.contact?.email,
    contactPhone: settings?.contact?.phone,
    address: settings?.contact?.address,
  };
};

export default useSiteSettings;
