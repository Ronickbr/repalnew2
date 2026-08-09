import fs from 'fs'
import path from 'path'
import readline from 'readline'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

// Carregar variáveis de ambiente (.env ou .env.production)
try {
  const envPath = fs.existsSync(path.join(process.cwd(), '.env'))
    ? path.join(process.cwd(), '.env')
    : (fs.existsSync(path.join(process.cwd(), '.env.production'))
        ? path.join(process.cwd(), '.env.production')
        : undefined)
  if (envPath) dotenv.config({ path: envPath })
  else dotenv.config()
} catch {
  dotenv.config()
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erro: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_SERVICE_ROLE_KEY) são obrigatórios no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

const read = (rl, question) => new Promise((resolve) => rl.question(question, resolve))

async function main() {
  const args = process.argv.slice(2)
  const argValue = (flag) => {
    const i = args.indexOf(flag)
    return i >= 0 && args[i + 1] ? args[i + 1] : null
  }

  const email = argValue('--email') || process.env.ADMIN_EMAIL || (await (async () => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const value = await read(rl, 'Email do administrador (padrão: admin@repal.com): ')
    rl.close()
    return value.trim() || 'admin@repal.com'
  })())

  let password = argValue('--password') || process.env.ADMIN_PASSWORD || ''
  if (!password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    password = await read(rl, 'Nova senha do administrador: ')
    rl.close()
  }

  if (!password || password.length < 8) {
    console.error('Erro: a senha precisa ter no mínimo 8 caracteres.')
    process.exit(1)
  }

  // 1) Atualizar hash na tabela admin_users (usada pelo backend /api/auth/login)
  const hash = await bcrypt.hash(password, 10)
  const { data: adminRow, error: adminErr } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (adminErr || !adminRow) {
    console.error(`Erro: usuário '${email}' não encontrado em admin_users.`, adminErr?.message || '')
    process.exit(1)
  }
  const { error: updateErr } = await supabase
    .from('admin_users')
    .update({ password_hash: hash })
    .eq('id', adminRow.id)
  if (updateErr) {
    console.error('Erro ao atualizar admin_users:', updateErr.message)
    process.exit(1)
  }
  console.log(`✓ admin_users atualizado (${email})`)

  // 2) Atualizar senha no Supabase Auth (usada pela sessão do painel/frontend)
  const { data: authList, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) {
    console.error('Erro ao listar usuários do Supabase Auth:', listErr.message)
    process.exit(1)
  }
  const authUser = authList.users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase())
  if (!authUser) {
    console.warn('⚠ Não encontrado no Supabase Auth (só admin_users foi atualizado).')
  } else {
    const { error: pwErr } = await supabase.auth.admin.updateUserById(authUser.id, { password })
    if (pwErr) {
      console.error('Erro ao atualizar senha no Supabase Auth:', pwErr.message)
      process.exit(1)
    }
    console.log(`✓ Supabase Auth atualizado (${email})`)
  }

  console.log('Senha sincronizada com sucesso. Faça login no painel com a nova senha.')
}

main().catch((err) => {
  console.error('Erro inesperado:', err)
  process.exit(1)
})
