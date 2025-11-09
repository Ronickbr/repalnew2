import React, { useEffect, useState } from 'react';
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
  const [ReactQuill, setReactQuill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar ReactQuill apenas no cliente
    const loadReactQuill = async () => {
      try {
        // Importar CSS
        await import('react-quill/dist/quill.snow.css');
        
        // Importar componente
        const module = await import('react-quill');
        setReactQuill(() => module.default);
      } catch (error) {
        console.error('Erro ao carregar ReactQuill:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReactQuill();
  }, []);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  if (isLoading || !ReactQuill) {
    return (
      <div className={`wysiwyg-editor ${className}`}>
        <div 
          className="p-4 border rounded bg-white min-h-[120px] flex items-center justify-center text-gray-500"
          style={{
            backgroundColor: 'white',
            borderRadius: '6px',
            border: '1px solid #d1d5db'
          }}
        >
          Carregando editor...
        </div>
        {required && !value.trim() && (
          <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
        )}
      </div>
    );
  }

  return (
    <div className={`wysiwyg-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #d1d5db'
        }}
      />
      {required && !value.trim() && (
        <p className="text-red-500 text-sm mt-1">Este campo é obrigatório</p>
      )}
    </div>
  );
};

export default WysiwygEditor;