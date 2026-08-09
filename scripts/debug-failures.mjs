import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('envs faltando'); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const ts = Date.now().toString().slice(-6);

async function main() {
  let catId;
  {
    const { data, error } = await supabase.from('categories').insert([{ name: `Debug Cat ${ts}`, slug: `debug-cat-${ts}` }]).select('id').single();
    if (error) { console.log('1. create category -> ERRO:', error.message); return; }
    catId = data.id;
    console.log('1. create category -> OK id=' + catId);
  }

  {
    const productNoSlug = { name: `Debug Prod ${ts}`, category_id: catId, price: 1, description: 'x', active: true };
    const { data, error } = await supabase.from('products').insert([productNoSlug]).select('id').single();
    console.log('2. insert product SEM slug ->', error ? 'ERRO: ' + error.message + ' | code=' + error.code : 'OK id=' + data.id);
    if (!error) await supabase.from('products').delete().eq('id', data.id);
  }

  {
    const productWithSlug = { name: `Debug Prod 2 ${ts}`, slug: `debug-prod-${ts}`, category_id: catId, price: 1, description: 'x', active: true };
    const { data, error } = await supabase.from('products').insert([productWithSlug]).select('id').single();
    console.log('3. insert product COM slug ->', error ? 'ERRO: ' + error.message + ' | code=' + error.code : 'OK id=' + data.id);
    if (!error) await supabase.from('products').delete().eq('id', data.id);
  }

  {
    const row = { id: crypto.randomUUID ? undefined : undefined, email: `dbg.is_active.${ts}@repal.com.br`, name: 'Debug', role: 'user', is_active: true, active: true, password_hash: 'x', created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('admin_users').insert([row]).select('id').single();
    console.log('4. insert admin_users COM is_active ->', error ? 'ERRO: ' + error.message : 'OK id=' + data.id);
    if (!error) await supabase.from('admin_users').delete().eq('id', data.id);
  }

  {
    const row = { id: crypto.randomUUID ? undefined : undefined, email: `dbg.2.${ts}@repal.com.br`, name: 'Debug', role: 'user', active: true, password_hash: 'x', created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('admin_users').insert([row]).select('id').single();
    console.log('5. insert admin_users SEM is_active ->', error ? 'ERRO: ' + error.message : 'OK id=' + data.id);
    if (!error) await supabase.from('admin_users').delete().eq('id', data.id);
  }

  {
    const { data, error } = await supabase.from('site_settings').update({ site_name: `Debug ${ts}` }).eq('id', 1).select('id').single();
    console.log('6. update site_settings site_name (id=1) ->', error ? 'ERRO: ' + error.message + ' | code=' + error.code : 'OK id=' + data.id);
    if (!error) await supabase.from('site_settings').update({ site_name: 'Debug' }).eq('id', 1);
  }

  {
    const { data, error } = await supabase.from('admin_logs').insert([{ admin_id: '00000000-0000-0000-0000-000000000000', action: 'debug', details: {}, ip_address: 'x', user_agent: 'x' }]).select('id').single();
    console.log('7. insert admin_logs ->', error ? 'ERRO: ' + error.message + ' | code=' + error.code : 'OK id=' + data.id);
    if (!error) await supabase.from('admin_logs').delete().eq('id', data.id);
  }

  await supabase.from('categories').delete().eq('id', catId);
  console.log('cleanup ok');
}

main().catch((e) => { console.error('fatal', e); process.exit(1); });
