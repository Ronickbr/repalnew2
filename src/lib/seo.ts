export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return !!parsed.protocol && !!parsed.hostname;
  } catch {
    return false;
  }
};

export const formatCanonicalUrl = (url: string): string => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    parsed = new URL(`https://${trimmed}`);
  }
  const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  const protocol = isLocalhost ? parsed.protocol : 'https:';
  const hostname = parsed.hostname.toLowerCase();
  const port = isLocalhost && parsed.port ? `:${parsed.port}` : '';
  const pathname = parsed.pathname.replace(/\/+$/, '');
  return `${protocol}//${hostname}${port}${pathname || ''}`;
};

export const sanitizeMetaTitle = (title?: string): string => {
  const t = (title || '').trim();
  return t.length > 60 ? t.slice(0, 60) : t;
};

export const sanitizeMetaDescription = (description?: string): string => {
  const raw = (description || '').replace(/<[^>]*>/g, '');
  const normalized = raw.replace(/\s+/g, ' ').trim();
  return normalized.length > 160 ? normalized.slice(0, 160) : normalized;
};

export const stripHtmlNormalize = (text?: string): string => {
  const raw = (text || '').replace(/<[^>]*>/g, '');
  return raw.replace(/\s+/g, ' ').trim();
};

export const normalizeKeywords = (keywords?: string): string => {
  const list = (keywords || '')
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);

  const unique: string[] = [];
  for (const k of list) {
    if (!unique.includes(k)) unique.push(k);
  }
  const limited = unique.slice(0, 50);
  let joined = limited.join(', ');
  if (joined.length > 500) {
    joined = joined.slice(0, 500);
  }
  return joined;
};
