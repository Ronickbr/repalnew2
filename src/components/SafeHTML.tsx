import React, { useMemo } from 'react';
import { sanitizeHtml, type SanitizeMode } from '../lib/utils';

interface SafeHTMLProps {
  html: string;
  className?: string;
  as?: React.ElementType;
  mode?: SanitizeMode;
}

/**
 * Componente seguro para renderizar HTML sanitizado.
 * Centraliza a configuração DOMPurify através de sanitizeHtml().
 * mode padrão: `strict` (tags editoriais básicas).
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({ html, className, as: Component = 'div', mode = 'strict' }) => {
  const sanitized = useMemo(() => sanitizeHtml(html, mode), [html, mode]);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
