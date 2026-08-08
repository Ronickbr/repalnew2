import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import DOMPurify from 'dompurify'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type SanitizeMode = 'strict' | 'editor' | 'inline'

export const SANITIZE_STRICT_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'blockquote', 'pre', 'code',
  'span', 'div', 'hr',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'img', 'figure', 'figcaption',
]

export const SANITIZE_EDITOR_ATTRS: Record<string, string[]> = {
  '*': ['class', 'style', 'title', 'dir', 'lang'],
  'a': ['href', 'target', 'rel', 'name', 'download'],
  'img': ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
  'td': ['colspan', 'rowspan', 'align', 'valign'],
  'th': ['colspan', 'rowspan', 'align', 'valign', 'scope'],
  'ol': ['type', 'start', 'reversed'],
  'ul': ['type'],
  'code': ['class'],
  'pre': ['class'],
}

/**
 * Sanitiza HTML contra XSS usando DOMPurify centralizado.
 * - `strict` (padrão): tags editoriais básicas. Recomendado para conteúdo vindo de DB renderizado em páginas públicas (ex: SafeHTML).
 * - `editor`: tags + atributos usados pelo Quill/Wysiwyg (inclui img, tabelas, class/style para negrito/itálico inline).
 * - `inline`: apenas span, b, i, strong, em, br, a — sem blocos.
 */
export function sanitizeHtml(html: unknown, mode: SanitizeMode = 'strict'): string {
  if (html == null) return ''
  const raw = typeof html === 'string' ? html : String(html)
  if (!raw.trim()) return ''

  const baseCfg: Record<string, unknown> = {
    USE_PROFILES: { html: false },
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOW_DATA_ATTR: false,
    WHOLE_DOCUMENT: false,
    FORBID_ATTR: ['onabort','onblur','onchange','onclick','ondblclick','onerror','onfocus','onkeydown','onkeypress','onkeyup','onload','onmousedown','onmousemove','onmouseout','onmouseover','onmouseup','onreset','onresize','onscroll','onselect','onsubmit','onunload','onpointerdown','onpointermove','onpointerup','ontouchstart','ontouchmove','ontouchend','ondragstart','ondrag','ondrop','oninput'],
    FORBID_TAGS: ['iframe', 'object', 'embed', 'applet', 'script', 'style', 'base', 'form', 'input', 'button', 'textarea', 'select', 'option', 'link', 'meta', 'frameset', 'frame', 'video', 'audio', 'source', 'track', 'canvas', 'svg', 'math', 'template', 'slot', 'xmp'],
    ADD_TAGS: [],
    ADD_ATTR: [],
  }

  if (mode === 'editor') {
    baseCfg.ALLOWED_TAGS = SANITIZE_STRICT_TAGS
    baseCfg.ALLOWED_ATTR = SANITIZE_EDITOR_ATTRS
    baseCfg.ALLOW_DATA_ATTR = false
    baseCfg.ALLOW_URI_RE = /^(https?:|mailto:|tel:|#|\/)/i
  } else if (mode === 'inline') {
    baseCfg.ALLOWED_TAGS = ['span', 'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'br', 'a', 'code']
    baseCfg.ALLOWED_ATTR = {
      '*': ['class', 'title'],
      'a': ['href', 'target', 'rel', 'name'],
      'code': ['class'],
    }
  } else {
    baseCfg.ALLOWED_TAGS = SANITIZE_STRICT_TAGS
    baseCfg.ALLOWED_ATTR = {
      '*': ['class', 'title', 'dir', 'lang'],
      'a': ['href', 'target', 'rel', 'name'],
      'img': ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
      'td': ['colspan', 'rowspan'],
      'th': ['colspan', 'rowspan', 'scope'],
      'ol': ['type', 'start'],
      'ul': ['type'],
      'code': ['class'],
      'pre': ['class'],
    }
    baseCfg.ALLOW_DATA_ATTR = false
    baseCfg.ALLOW_URI_RE = /^(https?:|mailto:|tel:|#|\/)/i
  }

  try {
    return DOMPurify.sanitize(raw, baseCfg as Parameters<typeof DOMPurify.sanitize>[1])
  } catch (err) {
    console.warn('[sanitizeHtml] DOMPurify falhou, fallback strip tags:', err instanceof Error ? err.message : err)
    return raw.replace(/<[^>]+>/g, '').trim()
  }
}

/**
 * Remove ALL HTML tags (texto puro).
 */
export function stripHtml(html: unknown): string {
  if (html == null) return ''
  const raw = typeof html === 'string' ? html : String(html)
  try {
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: false }, ALLOWED_TAGS: [] }).trim()
  } catch {
    return raw.replace(/<[^>]+>/g, '').trim()
  }
}
