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
  let lastError: Error | null = null;
  for (const p of paths) {
    const url = `${apiBase}${p}`;
    try {
      const resp = await fetch(url, options);
      const json = await resp.json().catch(() => ({}));
      if (resp.status === 405 || resp.status === 404) continue;
      if (!resp.ok || json.success === false) {
        const msg = json.error || `Erro HTTP ${resp.status}`;
        throw new Error(msg);
      }
      return json;
    } catch (e) {
      lastError = e as Error;
    }
  }
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
  const resp = await fetch(url, options);
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok || json.success === false) {
    const msg = json.error || `Erro HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return json;
};
