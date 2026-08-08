import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import '../styles/wysiwyg-editor.css';
import { sanitizeHtml } from '../lib/utils';

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
  const lastEmittedRef = useRef<string>('');

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const prevSibling = container.previousElementSibling as HTMLElement | null;
      if (prevSibling && prevSibling.classList.contains('ql-toolbar')) {
        prevSibling.remove();
      }
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
          clipboard: {
            matchVisual: false,
          },
        },
        placeholder,
      });

      const initialHtml = (value || '').trim();
      if (initialHtml) {
        const safe = sanitizeHtml(initialHtml, 'editor');
        quillRef.current.clipboard.dangerouslyPasteHTML(safe);
      }

      quillRef.current.on('text-change', (_delta, _oldDelta, source) => {
        const rawHtml = quillRef.current?.root.innerHTML || '';
        const safeHtml = sanitizeHtml(rawHtml, 'editor');
        if (lastEmittedRef.current !== safeHtml) {
          lastEmittedRef.current = safeHtml;
          onChange(safeHtml);
        }
        void source;
      });
    }

    return () => {
      const quill = quillRef.current;
      const cleanupContainer = container;
      if (quill) {
        quill.off('text-change');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!placeholder) return;
    const quill = quillRef.current;
    if (!quill) return;
    try {
      (quill as unknown as { root?: HTMLElement }).root?.setAttribute?.('data-placeholder', placeholder);
    } catch {
      /* noop */
    }
  }, [placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const currentHtml = quill.root.innerHTML || '';
    const nextHtml = value || '';
    const currentSafe = sanitizeHtml(currentHtml, 'editor');
    const nextSafe = sanitizeHtml(nextHtml, 'editor');

    if (currentSafe !== nextSafe) {
      lastEmittedRef.current = nextSafe;
      quill.clipboard.dangerouslyPasteHTML(nextSafe);
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
