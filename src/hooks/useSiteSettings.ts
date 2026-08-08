import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { queryKeys } from '../lib/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
    url?: string;
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
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    canonical_url?: string;
  };
  created_at?: string;
  updated_at?: string;
}

const EMPTY_SETTINGS: SiteSettings = {};

export const useSiteSettings = () => {
  const queryClient = useQueryClient();
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const query = useQuery<SiteSettings>({
    queryKey: queryKeys.siteSettings,
    queryFn: async () => {
      if (!isSupabaseConfigured) return EMPTY_SETTINGS;

      const { data, error: qError } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (qError) throw qError;

      return data ?? EMPTY_SETTINGS;
    },
    staleTime: Infinity,
    gcTime: Infinity,
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

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    const subscription: RealtimeChannel = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload: { new?: SiteSettings; old?: SiteSettings; eventType: string }) => {
          if (payload.eventType === 'DELETE') {
            queryClient.setQueryData(queryKeys.siteSettings, EMPTY_SETTINGS);
            return;
          }
          if (payload.new) {
            queryClient.setQueryData(queryKeys.siteSettings, payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, [queryClient]);

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
            .select()
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
            .select()
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
    gtmId: settings?.integrations?.google_tag_manager_id,
    geminiApiKey: settings?.integrations?.gemini_api_key,
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
