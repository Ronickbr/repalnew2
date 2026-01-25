import React from 'react';
import DOMPurify from 'dompurify';

interface SafeHTMLProps {
  html: string;
  className?: string;
  as?: React.ElementType; // Allow rendering as span, div, etc.
}

/**
 * Componente seguro para renderizar HTML sanitizado.
 * Centraliza a configuração do DOMPurify para prevenir XSS.
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({ html, className, as: Component = 'div' }) => {
  const sanitized = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'class', 'style'], 
    // Permitir target="_blank" mas forçar rel="noopener noreferrer" se necessário, 
    // mas DOMPurify já cuida de muitos vetores.
  });

  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
