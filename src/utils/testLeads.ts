import { supabase } from '../lib/supabase';
import { table } from '../lib/schema';

// Teste simples para verificar se a tabela leads está funcionando
export async function testLeadsTable() {
  try {
    console.log('🧪 Testando tabela leads...');
    
    // Testar contagem de leads
    const { count, error: countError } = await supabase
      .from(table('leads'))
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar leads:', countError);
      return false;
    }
    
    console.log(`✅ Contagem de leads: ${count}`);
    
    // Testar busca de leads recentes
    const { data: leads, error: leadsError } = await supabase
      .from(table('leads'))
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (leadsError) {
      console.error('❌ Erro ao buscar leads:', leadsError);
      return false;
    }
    
    console.log(`✅ Leads encontrados: ${leads?.length || 0}`);
    if (leads && leads.length > 0) {
      console.log('📋 Primeiro lead:', leads[0]);
    }
    
    console.log('✅ Tabela leads está funcionando corretamente!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste da tabela leads:', error);
    return false;
  }
}