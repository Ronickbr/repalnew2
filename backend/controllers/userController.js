import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { isSupabaseConfigured, getServiceClient } from '../config/supabase.js';
import { logAdminActivity } from '../utils/logger.js';

const sanitizeUser = (user) => {
  if (!user) return user;
  const { password_hash, totp_secret, ...safe } = user;
  return safe;
};

export const getUsers = async (req, res) => {
  try {
    if (!isSupabaseConfigured) {
      return res.json({ success: true, data: [] });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data: data.map(sanitizeUser) });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const createUser = async (req, res) => {
  try {
    const adminUser = req.admin;
    const { user } = req.body || {};
    if (!user || !user.email || !user.name) {
      return res.status(400).json({ success: false, error: 'Dados do usuário inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = {
        ...user,
        id: `dev-${Math.random().toString(36).slice(2)}`,
        created_at: new Date().toISOString()
      };
      await logAdminActivity(adminUser, 'create_user_dev', { email: user.email });
      return res.json({ success: true, data: sanitizeUser(fake) });
    }

    const supabase = getServiceClient();
    const emailLower = String(user.email).toLowerCase().trim();

    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', emailLower)
      .maybeSingle();
    if (existing) {
      return res.status(409).json({ success: false, error: 'Este email já está em uso' });
    }

    const { id, password, ...payload } = user;
    const tempPassword = password || generateTemporaryPassword();

    // Criar usuário no Supabase Auth (service role) para permitir login
    let authUserId = null;
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: emailLower,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { role: payload.role || 'user' }
      });
      if (!authError && authData?.user) {
        authUserId = authData.user.id;
      } else if (authError) {
        console.warn('Falha ao criar auth user:', authError.message);
      }
    } catch (authErr) {
      console.warn('Exceção ao criar auth user:', authErr instanceof Error ? authErr.message : String(authErr));
    }

    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const row = {
      id: authUserId || cryptoRandomId(),
      name: payload.name,
      email: emailLower,
      phone: payload.phone || null,
      role: payload.role || 'user',
      is_active: payload.is_active ?? true,
      active: payload.active ?? true,
      avatar: payload.avatar || null,
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    };

    const { data: inserted, error: insertError } = await supabase
      .from('admin_users')
      .insert([row])
      .select('*')
      .single();
    if (insertError) {
      console.error('Erro ao criar usuário:', insertError);
      return res.status(500).json({ success: false, error: 'Erro interno ao criar usuário' });
    }
    await logAdminActivity(adminUser, 'create_user', { email: emailLower });
    return res.json({ success: true, data: sanitizeUser(inserted), tempPassword });
  } catch (err) {
    console.error('Erro interno no controller de usuários:', err);
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { user } = req.body || {};
    if (!id || !user || Object.keys(user).length === 0) {
      return res.status(400).json({ success: false, error: 'Dados do usuário inválidos' });
    }
    if (!isSupabaseConfigured) {
      const fake = { id, ...user, updated_at: new Date().toISOString() };
      await logAdminActivity(adminUser, 'update_user_dev', { user_id: id });
      return res.json({ success: true, data: sanitizeUser(fake) });
    }

    const supabase = getServiceClient();
    const { id: _ignore, password, ...payload } = user;
    const updatePayload = { ...payload };
    if (password) {
      updatePayload.password_hash = await bcrypt.hash(password, 10);
    }

    const { data: updated, error: updateError } = await supabase
      .from('admin_users')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();
    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError);
      return res.status(500).json({ success: false, error: 'Erro interno ao atualizar usuário' });
    }
    await logAdminActivity(adminUser, 'update_user', { user_id: id });
    return res.json({ success: true, data: sanitizeUser(updated) });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    const { is_active } = req.body || {};
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'toggle_user_status_dev', { user_id: id, is_active });
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    const value = typeof is_active === 'boolean' ? is_active : !(req.body?.active === false);
    const { error } = await supabase
      .from('admin_users')
      .update({ is_active: value, active: value })
      .eq('id', id);
    if (error) {
      console.error('Erro ao alterar status do usuário:', error);
      return res.status(500).json({ success: false, error: 'Erro interno ao alterar status do usuário' });
    }
    await logAdminActivity(adminUser, 'toggle_user_status', { user_id: id, is_active: value });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const adminUser = req.admin;
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: 'ID inválido' });
    }
    if (id === adminUser.id) {
      return res.status(400).json({ success: false, error: 'Você não pode excluir a si mesmo' });
    }
    if (!isSupabaseConfigured) {
      await logAdminActivity(adminUser, 'delete_user_dev', { user_id: id });
      return res.json({ success: true });
    }
    const supabase = getServiceClient();
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      if (authError && authError.message !== 'User not found') {
        console.warn('Falha ao deletar auth user:', authError.message);
      }
    } catch (authErr) {
      console.warn('Exceção ao deletar auth user:', authErr instanceof Error ? authErr.message : String(authErr));
    }
    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar usuário:', error);
      return res.status(500).json({ success: false, error: 'Erro interno ao deletar usuário' });
    }
    await logAdminActivity(adminUser, 'delete_user', { user_id: id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

const cryptoRandomId = () => crypto.randomUUID();

const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
};
