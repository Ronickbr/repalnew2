import React, { useEffect, useRef } from 'react';

interface ResourcePrefetchProps {
  images?: string[];
  fonts?: string[];
  styles?: string[];
  scripts?: string[];
}

export const ResourcePrefetch: React.FC<ResourcePrefetchProps> = ({ 
  images = [], 
  fonts = [], 
  styles = [], 
  scripts = [] 
}) => {
  const linkRefs = useRef<HTMLLinkElement[]>([]);

  useEffect(() => {
    // Prefetch images
    images.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = src;
      link.as = 'image';
      document.head.appendChild(link);
      linkRefs.current.push(link);
    });

    // Prefetch fonts
    fonts.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'font';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      linkRefs.current.push(link);
    });

    // Prefetch styles
    styles.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      link.as = 'style';
      document.head.appendChild(link);
      linkRefs.current.push(link);
    });

    // Prefetch scripts
    scripts.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = src;
      link.as = 'script';
      document.head.appendChild(link);
      linkRefs.current.push(link);
    });

    // Cleanup
    const addedLinks = [...linkRefs.current];
    return () => {
      addedLinks.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
      linkRefs.current = [];
    };
  }, [images, fonts, styles, scripts]);

  return null;
};

// Hook para prefetch de imagens específicas
export const useImagePrefetch = (imageUrls: string[]) => {
  useEffect(() => {
    const imagePromises = imageUrls.map(url => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
    });

    Promise.allSettled(imagePromises).then(() => {
      
    });
  }, [imageUrls]);
};

// Hook para prefetch de páginas
export const usePagePrefetch = (urls: string[]) => {
  useEffect(() => {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });

    return () => {
      // Limpar links de prefetch
      const links = document.querySelectorAll('link[rel="prefetch"]');
      links.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
    };
  }, [urls]);
};

// Componente para lazy load de imagens com prefetch
export const OptimizedImageWithPrefetch: React.FC<{
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}> = ({ src, alt, className, loading = 'lazy', fetchPriority = 'auto' }) => {
  useImagePrefetch([src]);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
    />
  );
};

export default ResourcePrefetch;
