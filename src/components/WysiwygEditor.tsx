import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../styles/wysiwyg-editor.css';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  placeholder = 'Digite a descrição...',
  className = '',
  required = false
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);

  // Inicializar editor Quill uma única vez
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Prevenir duplicação em StrictMode: limpar qualquer resquício de inicializações anteriores
      // Remove toolbars anteriores inseridas pelo Quill
      const prevSibling = container.previousElementSibling as HTMLElement | null;
      if (prevSibling && prevSibling.classList.contains('ql-toolbar')) {
        prevSibling.remove();
      }
      // Limpar conteúdo do container antes de inicializar
      container.innerHTML = '';
    }

    if (containerRef.current && !quillRef.current) {
      quillRef.current = new Quill(containerRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean']
          ],
        },
        placeholder,
      });

      // Definir conteúdo inicial a partir da prop
      const initialHtml = (value || '').trim();
      if (initialHtml) {
        quillRef.current.clipboard.dangerouslyPasteHTML(initialHtml);
      }

      // Propagar mudanças do usuário
      quillRef.current.on('text-change', (_delta, _oldDelta, source) => {
        if (source === 'user') {
          const html = quillRef.current?.root.innerHTML || '';
          onChange(html);
        }
      });
    }

    // Cleanup
    return () => {
      const quill = quillRef.current;
      const cleanupContainer = container;
      if (quill) {
        quill.off('text-change');
        // Remover toolbar e conteúdo para evitar duplicação em novos mounts
        const toolbar = quill.root.parentElement?.previousElementSibling as HTMLElement | null;
        if (toolbar && toolbar.classList.contains('ql-toolbar')) {
          toolbar.remove();
        }
        quillRef.current = null;
      }
      if (cleanupContainer) {
        cleanupContainer.innerHTML = '';
        const prevSibling = cleanupContainer.previousElementSibling as HTMLElement | null;
        if (prevSibling && prevSibling.classList.contains('ql-toolbar')) {
          prevSibling.remove();
        }
      }
    };
  }, [onChange, placeholder, value]);

  // Sincronizar alterações externas (por exemplo, geração via IA)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const currentHtml = quill.root.innerHTML || '';
    const nextHtml = value || '';

    if (currentHtml !== nextHtml) {
      quill.clipboard.dangerouslyPasteHTML(nextHtml);
    }
  }, [value]);

  return (
    <div className={`wysiwyg-editor ${className}`}>
      <div
        ref={containerRef}
        style={{
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          minHeight: '120px'
        }}
      />
      {required && !(value || '').trim() && (
        <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
      )}
    </div>
  );
};

export default WysiwygEditor;