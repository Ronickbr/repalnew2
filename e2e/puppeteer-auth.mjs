import puppeteer from 'puppeteer'

const TARGET = process.env.TARGET_URL || 'https://www.repalmarechal.com.br'

const log = (...args) => console.log('[E2E]', ...args)

;(async () => {
  log('Iniciando testes E2E em', TARGET)
  const executablePath = await puppeteer.executablePath()
  const browser = await puppeteer.launch({ headless: 'new', executablePath })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')
  page.setDefaultNavigationTimeout(60000)

  // 1) CSRF token
  try {
    const resp = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/auth/csrf-token`, { credentials: 'include' })
      return { status: r.status, ok: r.ok, json: await r.json().catch(() => ({})) }
    }, TARGET)
    log('CSRF status:', resp.status, 'payload:', resp.json)
    if (!resp.ok) throw new Error('Falha ao obter CSRF')
  } catch (e) {
    log('Erro CSRF:', e.message)
  }

  // 2) Login endpoint (espera 401 com credenciais inválidas, não 405)
  try {
    const resp = await page.evaluate(async (base) => {
      const r = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid@repal.com.br', password: 'wrong' })
      })
      let payload = {}
      try { payload = await r.json() } catch {}
      return { status: r.status, ok: r.ok, json: payload }
    }, TARGET)
    log('Login status:', resp.status, 'payload:', resp.json)
    if (resp.status === 405) throw new Error('Rota /api/auth/login retornou 405')
  } catch (e) {
    log('Erro Login:', e.message)
  }

  // 3) Fluxo UI: acessar /login, preencher e tentar enviar
  try {
    await page.goto(`${TARGET}/login`, { waitUntil: 'domcontentloaded' })
    await page.type('#email', 'invalid@repal.com.br')
    await page.type('#password', 'wrong')
    const responses = []
    page.on('response', (res) => {
      const url = res.url()
      if (url.includes('/api/auth/login')) {
        responses.push({ url, status: res.status() })
      }
    })
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNetworkIdle({ idleTime: 800, timeout: 5000 }).catch(() => null)
    ])
    log('UI login responses:', responses)
  } catch (e) {
    log('Erro UI:', e.message)
  }

  await browser.close()
  log('E2E finalizado')
})()

