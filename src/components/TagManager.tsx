import { useEffect } from 'react';

interface TagManagerProps {
  gtmId?: string;
}

export const TagManager: React.FC<TagManagerProps> = ({ gtmId }) => {
  useEffect(() => {
    if (!gtmId) return;

    // Verificar se o script já foi adicionado
    const existingScript = document.getElementById('gtm-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Adicionar script do GTM no head
    const script = document.createElement('script');
    script.id = 'gtm-script';
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');
    `;
    document.head.appendChild(script);

    // Adicionar noscript no body (para usuários sem JavaScript)
    const existingNoScript = document.getElementById('gtm-noscript');
    if (existingNoScript) {
      existingNoScript.remove();
    }

    const noScript = document.createElement('noscript');
    noScript.id = 'gtm-noscript';
    noScript.innerHTML = `
      <iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>
    `;
    
    // Adicionar o noscript após o body ser carregado
    const insertNoScript = () => {
      if (document.body) {
        document.body.insertBefore(noScript, document.body.firstChild);
      } else {
        // Se o body ainda não estiver disponível, tentar novamente
        setTimeout(insertNoScript, 100);
      }
    };
    insertNoScript();

    return () => {
      // Cleanup ao desmontar o componente
      const scriptElement = document.getElementById('gtm-script');
      const noScriptElement = document.getElementById('gtm-noscript');
      if (scriptElement) scriptElement.remove();
      if (noScriptElement) noScriptElement.remove();
    };
  }, [gtmId]);

  return null;
};

export default TagManager;