import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { table } from '../lib/schema'
import { queryKeys } from '../lib/react-query'
import type { Lead } from '../lib/supabase'
import { toast } from 'sonner'

interface CreateLeadData {
  name: string
  phone: string
  email?: string
  message?: string
  product_name?: string
  source?: string
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (leadData: CreateLeadData): Promise<Lead> => {
      const { data, error } = await supabase
        .from(table('leads'))
        .insert([leadData])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Erro ao criar lead: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads })
      toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.')
    },
    onError: (error) => {
      toast.error(`Erro ao enviar mensagem: ${error.message}`)
    },
  })
}

export function useLeads() {
  return useQuery({
    queryKey: queryKeys.leads,
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from(table('leads'))
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`Erro ao buscar leads: ${error.message}`)
      }
      
      return data || []
    },
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }): Promise<Lead> => {
      const { data, error } = await supabase
        .from(table('leads'))
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Erro ao atualizar status do lead: ${error.message}`)
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads })
      toast.success('Status do lead atualizado com sucesso!')
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`)
    },
  })
}