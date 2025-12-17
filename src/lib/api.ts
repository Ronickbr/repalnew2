export const apiBase = import.meta.env.VITE_API_BASE_URL || '';

let csrfTokenCache: string | null = null;

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

export const ensureCsrf = async (): Promise<string> => {
  const fromCookie = readCookie('csrf_token');
  if (fromCookie) {
    csrfTokenCache = fromCookie;
    return fromCookie;
  }
  const candidates = [`${apiBase}/api/auth/csrf-token`, `${apiBase}/api/auth-csrf-token`];
  let resp: Response | null = null;
  for (const url of candidates) {
    try {
      const r = await fetch(url, { method: 'GET', credentials: 'include' });
      if (r.status !== 405 && r.status !== 404) { resp = r; break; }
    } catch {
      //
    }
  }
  if (!resp) throw new Error('Falha ao obter CSRF');
  const json = await resp.json();
  if (!resp.ok || !json.success) throw new Error(json.error || 'Falha ao obter CSRF');
  csrfTokenCache = json.csrfToken;
  return csrfTokenCache!;
};

export const apiFetchAny = async (paths: string[], init: RequestInit = {}, requireCsrf: boolean = false) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const options: RequestInit = {
    ...init,
    credentials: 'include',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  };
  if (requireCsrf) {
    const token = csrfTokenCache || (await ensureCsrf());
    (options.headers as Record<string, string>)['X-CSRF-Token'] = token;
  }
  let lastError: Error | null = null;
  let lastStatus: number | null = null;
  for (const p of paths) {
    const url = `${apiBase}${p}`;
    try {
      const resp = await fetch(url, options);
      const json = await resp.json().catch(() => ({}));
      if (resp.status === 405 || resp.status === 404) { lastStatus = resp.status; continue; }
      if (!resp.ok || json.success === false) {
        const msg = json.error || `Erro HTTP ${resp.status}`;
        throw new Error(msg);
      }
      clearTimeout(timeout);
      return json;
    } catch {
      lastError = new Error('Falha na requisição');
    }
  }
  if (lastStatus === 405) throw new Error('Serviço indisponível (405). Tente novamente em instantes.');
  if (lastStatus === 404) throw new Error('Endpoint não encontrado (404).');
  throw lastError || new Error('Falha na requisição');
};

export const apiFetch = async (path: string, init: RequestInit = {}, requireCsrf: boolean = false) => {
  const url = `${apiBase}${path}`;
  const options: RequestInit = {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  };
  if (requireCsrf) {
    const token = csrfTokenCache || (await ensureCsrf());
    (options.headers as Record<string, string>)['X-CSRF-Token'] = token;
  }
  
  // Retry logic with exponential backoff for 429 errors
  let resp: Response | null = null;
  const maxRetries = 3;
  const baseDelay = 2000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    resp = await fetch(url, options);

    if (resp.status === 429 && attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt); // 2000, 4000, 8000
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    break; // If not 429 or max retries reached, break loop
  }

  if (!resp) throw new Error('Falha na requisição');

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || json.success === false) {
    const msg = json.error || `Erro HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return json;
};
