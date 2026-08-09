import crypto from 'crypto';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const BASE = process.env.TEST_BASE_URL || 'https://repalnew2.vercel.app';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltam VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const COOKIE = 'repal_admin_token';
const ts = Date.now().toString().slice(-6);
const EMAIL = `teste.crud.${ts}@repal.com.br`;
const PASS = 'Teste@1234';

let csrfToken = '';
let csrfCookie = '';
let sessionCookie = '';
const results = [];

function track(module, name, ok, status, note = '') {
  results.push({ module, name, ok, status, note });
  console.log(`${ok ? 'PASS' : 'FAIL'} [${module}] ${name} -> HTTP ${status}${note ? ` | ${note}` : ''}`);
}

async function api(method, urlPath, { body, formData } = {}) {
  const headers = {};
  const cookies = [];
  if (csrfCookie) cookies.push(csrfCookie);
  if (sessionCookie) cookies.push(sessionCookie);
  if (cookies.length) headers['Cookie'] = cookies.join('; ');
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers['x-csrf-token'] = csrfToken;

  let payload;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(BASE + urlPath, { method, headers, body: payload });

  const sc = res.headers.get('set-cookie');
  if (sc) {
    const first = sc.split(';')[0];
    const eq = first.indexOf('=');
    if (eq > 0) {
      const name = first.slice(0, eq).trim();
      const value = first.slice(eq + 1).trim();
      if (name === 'csrf_token') csrfCookie = `csrf_token=${value}`;
      else if (name === COOKIE) sessionCookie = `${COOKIE}=${value}`;
    }
  }

  let json = null;
  try { json = await res.json(); } catch { /* resposta não-JSON */ }
  return { status: res.status, json, ok: res.status < 400 && json?.success !== false };
}

async function main() {
  const testStart = new Date().toISOString();
  const { data: sRows } = await supabase.from('site_settings').select('*').limit(1);
  const settingsBackup = sRows && sRows.length ? { ...sRows[0] } : null;
  console.log(`site_settings backup: ${settingsBackup ? `id=${settingsBackup.id}` : 'nenhum (tabela vazia)'}`);

  let adminId;
  {
    const hash = await bcrypt.hash(PASS, 10);
    adminId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error } = await supabase.from('admin_users').insert({
      id: adminId, email: EMAIL, name: 'Teste CRUD Temp', role: 'super_admin',
      active: true, password_hash: hash,
      created_at: now, updated_at: now,
    });
    if (error) throw new Error('Falha ao criar admin temporario: ' + error.message);
  }
  console.log(`Admin temporario: ${EMAIL}\nBase: ${BASE}\n`);

  const restoreSettings = async () => {
    try {
      if (settingsBackup) {
        const { id, created_at, updated_at, ...rest } = settingsBackup;
        const { error } = await supabase.from('site_settings').update(rest).eq('id', id);
        if (error) throw error;
        console.log('info: site_settings restaurados (backup)');
      } else {
        const { data: rows } = await supabase.from('site_settings').select('id');
        for (const r of rows || []) {
          await supabase.from('site_settings').delete().eq('id', r.id);
        }
        if (rows?.length) console.log(`info: ${rows.length} linhas de site_settings criadas no teste foram removidas`);
      }
    } catch (e) {
      console.warn('AVISO: falha ao restaurar site_settings:', e.message);
    }
  };

  // estado p/ cleanup
  let catA = null, catACreated = false, catB = null;
  let brandId = null, brandId2 = null;
  let bannerId = null;
  let p1 = null, p2 = null;
  let storeId = null;
  let userId = null;

  try {
    // ================= AUTH =================
    console.log('-- Auth --');
    const csrfRes = await api('GET', '/api/auth/csrf-token');
    if (csrfRes.json?.csrfToken) csrfToken = csrfRes.json.csrfToken;
    track('Auth', 'GET /csrf-token', csrfRes.ok && !!csrfToken, csrfRes.status);

    const loginRes = await api('POST', '/api/auth/login', { body: { email: EMAIL, password: PASS } });
    const loginOk = loginRes.ok && !!sessionCookie && loginRes.json?.user?.email === EMAIL;
    track('Auth', 'POST /login (cookie)', loginOk, loginRes.status, loginOk ? '' : JSON.stringify(loginRes.json));

    const meRes = await api('GET', '/api/auth/me');
    track('Auth', 'GET /me autenticado', meRes.ok && meRes.json?.data?.email === EMAIL, meRes.status);

    const savedSession = sessionCookie;
    sessionCookie = '';
    const unauth = await api('GET', '/api/admin/dashboard');
    track('Auth', 'GET /dashboard sem cookie', unauth.status === 401, unauth.status);
    sessionCookie = savedSession;

    // ================= DASHBOARD =================
    console.log('\n-- Dashboard --');
    const dash = await api('GET', '/api/admin/dashboard');
    track('Dashboard', 'GET /dashboard', dash.ok && dash.json?.data != null, dash.status);

    // ================= CATEGORIAS =================
    console.log('\n-- Categorias --');
    const catList1 = await api('GET', '/api/admin/categories');
    track('Categorias', 'GET list', catList1.ok && Array.isArray(catList1.json?.data), catList1.status);

    const catACreate = await api('POST', '/api/admin/categories', {
      body: { category: { name: `Cat Teste A ${ts}`, slug: `cat-teste-a-${ts}` } },
    });
    if (catACreate.json?.data?.id) { catA = catACreate.json.data; catACreated = true; }
    track('Categorias', 'POST create A', catACreate.ok && !!catA, catACreate.status);

    const catBCreate = await api('POST', '/api/admin/categories', {
      body: { category: { name: `Cat Teste B ${ts}`, slug: `cat-teste-b-${ts}` } },
    });
    if (catBCreate.json?.data?.id) catB = catBCreate.json.data;
    track('Categorias', 'POST create B', catBCreate.ok && !!catB, catBCreate.status);

    if (catB) {
      const catUpdate = await api('PUT', `/api/admin/categories/${catB.id}`, {
        body: { category: { name: `Cat Teste B Editada ${ts}` } },
      });
      track('Categorias', 'PUT update B', catUpdate.ok && catUpdate.json?.data?.name?.includes('Editada'), catUpdate.status);

      const catBulk = await api('POST', '/api/admin/categories/bulk-delete', { body: { ids: [catB.id] } });
      track('Categorias', 'POST bulk-delete B', catBulk.ok, catBulk.status);
      catB = null;
    }

    // ================= MARCAS =================
    console.log('\n-- Marcas --');
    const brandList = await api('GET', '/api/admin/brands');
    track('Marcas', 'GET list', brandList.ok && Array.isArray(brandList.json?.data), brandList.status);

    const brandCreate = await api('POST', '/api/admin/brands', {
      body: { brand: { name: `Marca Teste ${ts}`, slug: `marca-teste-${ts}` } },
    });
    if (brandCreate.json?.data?.id) brandId = brandCreate.json.data.id;
    track('Marcas', 'POST create', brandCreate.ok && !!brandId, brandCreate.status);

    const brandCreate2 = await api('POST', '/api/admin/brands', {
      body: { brand: { name: `Marca Teste 2 ${ts}`, slug: `marca-teste-2-${ts}` } },
    });
    if (brandCreate2.json?.data?.id) brandId2 = brandCreate2.json.data.id;
    track('Marcas', 'POST create 2', brandCreate2.ok && !!brandId2, brandCreate2.status);

    if (brandId) {
      const brandUpdate = await api('PUT', `/api/admin/brands/${brandId}`, {
        body: { brand: { name: `Marca Teste Editada ${ts}` } },
      });
      track('Marcas', 'PUT update', brandUpdate.ok, brandUpdate.status);

      const brandBulk = await api('POST', '/api/admin/brands/bulk-delete', { body: { ids: [brandId] } });
      track('Marcas', 'POST bulk-delete', brandBulk.ok, brandBulk.status);
      brandId = null;
    }
    if (brandId2) {
      const brandDel = await api('DELETE', `/api/admin/brands/${brandId2}`);
      track('Marcas', 'DELETE single', brandDel.ok, brandDel.status);
      brandId2 = null;
    }

    // ================= BANNERS =================
    console.log('\n-- Banners --');
    const bannerList = await api('GET', '/api/admin/banners');
    track('Banners', 'GET list', bannerList.ok && Array.isArray(bannerList.json?.data), bannerList.status);

    const bannerCreate = await api('POST', '/api/admin/banners', {
      body: { banner: { image_url: `${BASE}/img/placeholder.png`, title: `Banner Teste ${ts}`, sort_order: 99 } },
    });
    if (bannerCreate.json?.data?.id) bannerId = bannerCreate.json.data.id;
    track('Banners', 'POST create', bannerCreate.ok && !!bannerId, bannerCreate.status);

    if (bannerId) {
      const bannerUpdate = await api('PUT', `/api/admin/banners/${bannerId}`, {
        body: { banner: { title: `Banner Teste Editado ${ts}` } },
      });
      track('Banners', 'PUT update', bannerUpdate.ok, bannerUpdate.status);

      const bannerDel = await api('DELETE', `/api/admin/banners/${bannerId}`);
      track('Banners', 'DELETE', bannerDel.ok, bannerDel.status);
      bannerId = null;
    }

    // ================= PRODUTOS =================
    console.log('\n-- Produtos --');
    if (!catA) {
      const fallback = await api('GET', '/api/admin/categories');
      const first = Array.isArray(fallback.json?.data) && fallback.json.data.find((c) => c.parent_id == null);
      if (first) catA = first;
    }
    track('Produtos', 'categoria valida p/ criar', !!catA, catA ? 200 : 500, catA ? `catId=${catA.id}` : 'nenhuma encontrada');

    const prodList = await api('GET', '/api/admin/products');
    track('Produtos', 'GET list', prodList.ok && Array.isArray(prodList.json?.data), prodList.status);

    if (catA) {
      const base = { name: `Produto Teste CRUD ${ts}`, slug: `produto-teste-crud-${ts}`, category_id: catA.id, price: 1234.5, description: 'criado pelo script de testes', active: true };
      const p1Create = await api('POST', '/api/admin/products', { body: { product: base } });
      if (p1Create.json?.data?.id) p1 = p1Create.json.data;
      track('Produtos', 'POST create com slug (fix sequencia)', p1Create.ok && !!p1, p1Create.status, p1 ? `id=${p1.id}` : JSON.stringify(p1Create.json));

      const p2Create = await api('POST', '/api/admin/products', { body: { product: { ...base, name: `Produto Teste CRUD 2 ${ts}`, slug: `produto-teste-crud-2-${ts}` } } });
      if (p2Create.json?.data?.id) p2 = p2Create.json.data;
      track('Produtos', 'POST create 2', p2Create.ok && !!p2, p2Create.status, p2 ? `id=${p2.id}` : JSON.stringify(p2Create.json));

      if (p1) {
        const prodUpdate = await api('PUT', `/api/admin/products/${p1.id}`, {
          body: { product: { price: 2345.5, description: 'atualizado pelo script' } },
        });
        track('Produtos', 'PUT update', prodUpdate.ok && Number(prodUpdate.json?.data?.price) === 2345.5, prodUpdate.status, prodUpdate.json?.data?.price ? `price=${prodUpdate.json.data.price}` : '');

        const search = await api('GET', `/api/admin/products?search=${encodeURIComponent('Produto Teste CRUD')}`);
        const found = Array.isArray(search.json?.data) && search.json.data.some((p) => String(p.id) === String(p1.id));
        track('Produtos', 'GET list ?search', search.ok && found, search.status);
      }

      if (p2) {
        const bulkPrice = await api('PUT', '/api/admin/products/bulk-update', {
          body: { updates: [{ id: p2.id, price: 999.99 }] },
        });
        track('Produtos', 'PUT bulk-update preco', bulkPrice.ok && bulkPrice.json?.data?.updated >= 1, bulkPrice.status, bulkPrice.json?.data ? JSON.stringify(bulkPrice.json.data) : '');

        const bulkDel = await api('POST', '/api/admin/products/bulk-delete', { body: { ids: [p2.id] } });
        track('Produtos', 'POST bulk-delete', bulkDel.ok, bulkDel.status);
        p2 = null;
      }

      if (p1) {
        const prodDel = await api('DELETE', `/api/admin/products/${p1.id}`);
        track('Produtos', 'DELETE single', prodDel.ok, prodDel.status);
        p1 = null;
      }
    }

    // ================= LEADS =================
    console.log('\n-- Leads --');
    const mock = await api('POST', '/api/admin/leads/mock');
    track('Leads', 'POST /mock', mock.ok, mock.status);

    const leadList = await api('GET', '/api/admin/leads');
    const marker = 'Lead gerado automaticamente para testes do sistema.';
    const mocks = Array.isArray(leadList.json?.data) ? leadList.json.data.filter((l) => l.message === marker) : [];
    track('Leads', 'GET list contem mocks', leadList.ok && mocks.length > 0, leadList.status, `${mocks.length} mocks`);

    if (mocks.length >= 2) {
      const st = await api('PATCH', `/api/admin/leads/${mocks[0].id}/status`, { body: { status: 'fechado' } });
      track('Leads', 'PATCH status', st.ok && st.json?.data?.status === 'fechado', st.status);

      const del = await api('DELETE', `/api/admin/leads/${mocks[1].id}`);
      track('Leads', 'DELETE single (mock)', del.ok, del.status);
    }

    const delMock = await api('POST', '/api/admin/leads/delete-mock');
    track('Leads', 'POST /delete-mock', delMock.ok, delMock.status);

    // ================= USUARIOS =================
    console.log('\n-- Usuarios --');
    const userList = await api('GET', '/api/admin/users');
    track('Usuarios', 'GET list', userList.ok && Array.isArray(userList.json?.data), userList.status);

    const userEmail = `crud.user.${ts}@repal.com.br`;
    const userCreate = await api('POST', '/api/admin/users', {
      body: { user: { email: userEmail, name: 'Usuario Teste CRUD', password: 'Senha@1234', role: 'admin' } },
    });
    if (userCreate.json?.data?.id) userId = userCreate.json.data.id;
    track('Usuarios', 'POST create', userCreate.ok && !!userId, userCreate.status, userCreate.ok ? '' : JSON.stringify(userCreate.json));

    if (userId) {
      const userUpdate = await api('PUT', `/api/admin/users/${userId}`, { body: { user: { name: 'Usuario Teste Editado' } } });
      track('Usuarios', 'PUT update', userUpdate.ok && userUpdate.json?.data?.name === 'Usuario Teste Editado', userUpdate.status);

      const userOff = await api('PATCH', `/api/admin/users/${userId}/status`, { body: { is_active: false } });
      track('Usuarios', 'PATCH status inativo', userOff.ok, userOff.status);

      const userOn = await api('PATCH', `/api/admin/users/${userId}/status`, { body: { is_active: true } });
      track('Usuarios', 'PATCH status ativo', userOn.ok, userOn.status);

      const userDel = await api('DELETE', `/api/admin/users/${userId}`);
      track('Usuarios', 'DELETE', userDel.ok, userDel.status);
      userId = null;
    }

    // ================= CONFIGURACOES =================
    console.log('\n-- Configuracoes --');
    const ssGet = await api('GET', '/api/admin/settings/site-settings');
    track('Config', 'GET site-settings', ssGet.ok, ssGet.status);
    const originalSiteInfo = ssGet.json?.data?.site_info || {};
    const originalSiteName = originalSiteInfo.name;

    const testInfo = { ...originalSiteInfo, name: `Nome Teste CRUD ${ts}` };
    const ssPut = await api('PUT', '/api/admin/settings/site-settings', {
      body: { settings: { site_info: testInfo } },
    });
    track('Config', 'PUT site-settings site_info.name', ssPut.ok && ssPut.json?.data?.site_info?.name?.includes('Nome Teste'), ssPut.status, ssPut.json?.data?.site_info?.name ? `agora="${ssPut.json.data.site_info.name}"` : JSON.stringify(ssPut.json));

    const ssGet2 = await api('GET', '/api/admin/settings/site-settings');
    track('Config', 'GET confirma mudanca', ssGet2.ok && ssGet2.json?.data?.site_info?.name?.includes('Nome Teste'), ssGet2.status);

    if (ssPut.ok) {
      const restore = await api('PUT', '/api/admin/settings/site-settings', {
        body: { settings: { site_info: originalSiteInfo } },
      });
      track('Config', 'PUT restaura site_info.name', restore.ok, restore.status);
    }

    const storeList = await api('GET', '/api/admin/settings/stores');
    track('Config', 'GET stores', storeList.ok && Array.isArray(storeList.json?.data), storeList.status);

    const storeCreate = await api('POST', '/api/admin/settings/stores', { body: { store: { name: `Loja Teste ${ts}` } } });
    if (storeCreate.json?.data?.id) storeId = storeCreate.json.data.id;
    track('Config', 'POST store create', storeCreate.ok && !!storeId, storeCreate.status);

    if (storeId) {
      const storeUpdate = await api('PUT', `/api/admin/settings/stores/${storeId}`, {
        body: { store: { name: `Loja Teste Editada ${ts}` } },
      });
      track('Config', 'PUT store update', storeUpdate.ok, storeUpdate.status);

      const storeDel = await api('DELETE', `/api/admin/settings/stores/${storeId}`);
      track('Config', 'DELETE store', storeDel.ok, storeDel.status);
      storeId = null;
    }

    // ================= INTEGRACOES =================
    console.log('\n-- Integracoes --');
    const intGet = await api('GET', '/api/integrations');
    track('Integracoes', 'GET', intGet.ok && intGet.json?.data != null, intGet.status);

    const intPut = await api('POST', '/api/integrations', {
      body: { integrations: { openrouter_model: 'google/gemini-2.5-flash', teste_crud: `x-${ts}` } },
    });
    track('Integracoes', 'POST update', intPut.ok, intPut.status, intPut.json?.data ? JSON.stringify(intPut.json.data) : '');

    // ================= SEO =================
    console.log('\n-- SEO --');
    const robots = await api('POST', '/api/seo/robots', { body: { content: 'User-agent: *\nAllow: /\n' } });
    track('SEO', 'POST /robots', robots.ok, robots.status);

    const sitemap = await api('POST', '/api/seo/sitemap', { body: { enabled: true } });
    track('SEO', 'POST /sitemap', sitemap.ok, sitemap.status);

    // ================= IA =================
    console.log('\n-- IA --');
    const hasKey = !!(process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY
      || process.env.VITE_OPENROUTER_API_KEY || process.env.VITE_GEMINI_API_KEY);
    const ai = await api('POST', '/api/ai/generate-content', { body: { prompt: 'Diga apenas: OK' } });
    const aiOk = ai.ok || ai.status === 500;
    track('IA', 'POST /generate-content', aiOk, ai.status, hasKey ? '' : 'sem chave de IA no .env (HTTP 500 esperado)');

    // ================= UPLOAD =================
    console.log('\n-- Upload --');
    const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    const fd = new FormData();
    fd.append('image', new Blob([pngBytes], { type: 'image/png' }), `teste_${ts}.png`);
    const up = await api('POST', '/api/upload-image', { formData: fd });
    track('Upload', 'POST imagem', up.ok && !!up.json?.imageUrl, up.status, up.json?.imageUrl || up.json?.error || 'FS read-only esperado na Vercel');

    // ================= CSRF NEGATIVO =================
    console.log('\n-- CSRF --');
    const savedCsrf = csrfToken;
    csrfToken = 'token-errado';
    const badCsrf = await api('POST', '/api/admin/categories', {
      body: { category: { name: `x ${ts}`, slug: `x-${ts}` } },
    });
    track('CSRF', 'mutacao com x-csrf errado', badCsrf.status === 403, badCsrf.status);
    csrfToken = savedCsrf;
  } finally {
    // ================= CLEANUP =================
    console.log('\n-- Cleanup --');
    await restoreSettings();

    if (catACreated && catA) {
      const r = await api('DELETE', `/api/admin/categories/${catA.id}`);
      console.log(`info: delete categoria ${catA.id}: HTTP ${r.status}`);
    }
    if (p1) {
      const r = await api('DELETE', `/api/admin/products/${p1.id}`);
      console.log(`info: delete produto ${p1.id}: HTTP ${r.status}`);
    }
    if (p2) {
      const r = await api('POST', '/api/admin/products/bulk-delete', { body: { ids: [p2.id] } });
      console.log(`info: bulk-delete produto ${p2.id}: HTTP ${r.status}`);
    }
    if (bannerId) { const r = await api('DELETE', `/api/admin/banners/${bannerId}`); console.log(`info: delete banner ${bannerId}: HTTP ${r.status}`); }
    if (brandId) { const r = await api('DELETE', `/api/admin/brands/${brandId}`); console.log(`info: delete marca ${brandId}: HTTP ${r.status}`); }
    if (brandId2) { const r = await api('DELETE', `/api/admin/brands/${brandId2}`); console.log(`info: delete marca ${brandId2}: HTTP ${r.status}`); }
    if (catB) { const r = await api('DELETE', `/api/admin/categories/${catB.id}`); console.log(`info: delete categoria ${catB.id}: HTTP ${r.status}`); }
    if (storeId) { const r = await api('DELETE', `/api/admin/settings/stores/${storeId}`); console.log(`info: delete loja ${storeId}: HTTP ${r.status}`); }
    if (userId) { const r = await api('DELETE', `/api/admin/users/${userId}`); console.log(`info: delete usuario ${userId}: HTTP ${r.status}`); }

    await api('POST', '/api/admin/leads/delete-mock');

    const { error: delErr } = await supabase.from('admin_users').delete().eq('id', adminId);
    if (delErr) console.warn('AVISO: falha ao remover admin temporario:', delErr.message);
    const { error: logErr } = await supabase.from('admin_logs').delete().eq('admin_id', adminId);
    if (logErr) console.warn('AVISO: falha ao remover admin_logs temporarios:', logErr.message);

    const { data: leftover, error: checkErr } = await supabase.from('admin_users').select('email').eq('email', EMAIL);
    if (!checkErr && leftover?.length) {
      console.warn('AVISO: admin temporario ainda existe!');
    }
  }

  // ================= RELATORIO =================
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log('\n================= RESUMO =================');
  for (const r of results) {
    const icon = r.ok ? 'OK' : 'XX';
    console.log(`${icon.padEnd(4)} [${r.module.padEnd(13)}] ${r.name.padEnd(52)} -> ${r.ok ? 'passou' : 'FALHOU'}${r.note ? ` | ${r.note}` : ''}`);
  }
  console.log(`\nTotal: ${results.length} | Passaram: ${passed} | Falharam: ${failed.length}`);
  if (failed.length) {
    console.log('\nFalhas:');
    for (const f of failed) {
      console.log(`  - [${f.module}] ${f.name} (HTTP ${f.status}) ${f.note}`);
    }
  }
  console.log(`Fim do teste em ${testStart}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
