import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';

export const logAdminActivity = async (admin, action, details = {}) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ADMIN LOG] ${admin.email || admin.id}: ${action}`, JSON.stringify(details));
    }

    if (!isSupabaseConfigured) return;

    // Tentar pegar ID real se for string 'dev-admin' (no caso do supabase estar configurado mas auth bypass ativado? não, se bypass tá on, não grava log no banco geralmente ou grava com id fake se tabela aceitar)
    // Se o admin.id for 'dev-admin', vai dar erro de FK no banco se não existir usuário.
    // Vou assumir que se isSupabaseConfigured é true, estamos usando usuários reais, ou o dev-admin não deve tentar inserir.
    
    if (admin.id === 'dev-admin') {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Log não persistido no banco pois é dev-admin');
        }
        return;
    }

    const supabase = getServiceClient();
    await supabase.from('admin_logs').insert([{
      admin_id: admin.id,
      action,
      details,
      ip_address: 'SERVER', 
      user_agent: 'API'
    }]);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
        console.error('Erro ao logar atividade:', err);
    }
  }
};
