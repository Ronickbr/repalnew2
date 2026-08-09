import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

const MOCK_LEAD_MARKER = 'Lead gerado automaticamente para testes do sistema.';

export const getLeads = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const updateLeadStatus = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { status } = req.body || {};
    if (!id || !status) {
      return res.status(400).json({ success: false, error: 'ID ou status inválido' });
    }
    if (!isSupabaseConfigured) {
      const fake = { id, status, updated_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'update_lead_status_dev', { lead_id: id, status });
      return res.json({ success: true, data: fake });
    }
    const supabase = getServiceClient();
    const { data: updated, error: updateError } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (updateError) {
      console.error('Erro ao atualizar status do lead:', updateError);
      return res.status(500).json({ success: false, error: 'Erro interno ao atualizar status do lead' });
    }
    await logAdminActivity(adminUser, 'update_lead_status', { lead_id: id, status });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const createMockLeads = async (req, res) => {
  try {
    const adminUser = req.admin;
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'create_mock_leads_dev', {});
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const statuses = ['novo', 'contato', 'orcado', 'fechado', 'perdido'];
    const products = ['iPhone 13', 'Samsung Galaxy S21', 'MacBook Pro', 'Dell XPS', 'iPad Air'];

    const mockLeads = Array.from({ length: 5 }).map(() => {
      const now = new Date().toISOString();
      return {
        name: `Lead Teste ${Math.floor(Math.random() * 1000)}`,
        email: `teste${Math.floor(Math.random() * 10000)}@exemplo.com`,
        phone: `119${Math.floor(Math.random() * 100000000)}`,
        message: MOCK_LEAD_MARKER,
        product_name: products[Math.floor(Math.random() * products.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: now,
        updated_at: now
      };
    });

    const { error } = await supabase.from('leads').insert(mockLeads);
    if (error) {
      console.error('Erro ao gerar leads de teste:', error);
      return res.status(500).json({ success: false, error: 'Erro interno ao gerar leads de teste' });
    }
    await logAdminActivity(adminUser, 'create_mock_leads', {});
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const deleteMockLeads = async (req, res) => {
  try {
    const adminUser = req.admin;
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_mock_leads_dev', {});
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const { error, count } = await supabase
      .from('leads')
      .delete({ count: 'exact' })
      .eq('message', MOCK_LEAD_MARKER);

    if (error) {
      console.error('Erro ao excluir leads de teste:', error);
      return res.status(500).json({ success: false, error: 'Erro interno ao excluir leads de teste' });
    }
    await logAdminActivity(adminUser, 'delete_mock_leads', { count });
    return res.json({ success: true, count });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_lead_dev', { lead_id: id });
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar lead:', error);
      return res.status(500).json({ success: false, error: 'Erro interno ao deletar lead' });
    }
    await logAdminActivity(adminUser, 'delete_lead', { lead_id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};
