import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import { getSupabaseImageUrl } from '../lib/utils';

type ImageVariant = 'card' | 'hero' | 'detail' | 'raw';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
  placeholder?: 'blur' | 'dominant';
  variant?: ImageVariant;
  fetchpriority?: 'high' | 'low' | 'auto';
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

const SUPABASE_WIDTHS = [320, 640, 960, 1280, 1920] as const;
const IMGUR_SIZES: { suffix: string; w: number }[] = [
  { suffix: 'm', w: 320 },
  { suffix: 'l', w: 640 },
  { suffix: 'h', w: 1024 },
];

const SIZES_BY_VARIANT: Record<ImageVariant, string> = {
  card: '(min-width: 1280px) 288px, (min-width: 1024px) 24vw, (min-width: 768px) 36vw, (min-width: 640px) 44vw, 92vw',
  hero: '(min-width: 1536px) 1536px, (min-width: 1280px) 1280px, (min-width: 1024px) 1024px, (min-width: 768px) 768px, 100vw',
  detail: '(min-width: 1536px) 768px, (min-width: 1024px) 50vw, (min-width: 768px) 640px, 92vw',
  raw: '(min-width: 1280px) 1200px, (min-width: 768px) 720px, 92vw',
};

const VARIANT_FETCH_PRIORITY: Record<ImageVariant, 'high' | 'auto' | 'low'> = {
  hero: 'high',
  detail: 'high',
  card: 'auto',
  raw: 'auto',
};

const VARIANT_LOADING: Record<ImageVariant, 'eager' | 'lazy'> = {
  hero: 'eager',
  detail: 'eager',
  card: 'lazy',
  raw: 'lazy',
};

const isSupabaseStorageUrl = (url: string): boolean =>
  url.includes('supabase.co') || url.includes('/storage/v1/');

const isImgurUrl = (url: string): boolean => /^https?:\/\/i\.imgur\.com\//i.test(url);

interface UrlComponents {
  base: string;
  query: string;
  ext: string;
}

const splitImgurUrl = (url: string): UrlComponents | null => {
  try {
    const u = new URL(url);
    const pathname = u.pathname.replace(/^\/+/, '');
    const lastDot = pathname.lastIndexOf('.');
    if (lastDot < 0) return null;
    const base = pathname.slice(0, lastDot);
    const ext = pathname.slice(lastDot);
    return { base, query: u.search, ext };
  } catch {
    return null;
  }
};

const buildSrcSet = (src: string): { srcset?: string; sizes?: string; fallbackSrc: string } => {
  if (!src) return { fallbackSrc: src };

  if (isSupabaseStorageUrl(src)) {
    try {
      const set = SUPABASE_WIDTHS.map((w) => {
        const transformed = getSupabaseImageUrl(src, { width: w, quality: 80, resize: 'contain' });
        return `${transformed} ${w}w`;
      }).join(', ');
      return {
        srcset: set,
        fallbackSrc: getSupabaseImageUrl(src, { width: 1280, quality: 80, resize: 'contain' }),
      };
    } catch {
      return { fallbackSrc: src };
    }
  }

  if (isImgurUrl(src)) {
    const parts = splitImgurUrl(src);
    if (!parts) return { fallbackSrc: src };

    const entries: string[] = [];
    for (const s of IMGUR_SIZES) {
      entries.push(`https://i.imgur.com/${parts.base}${s.suffix}${parts.ext}${parts.query} ${s.w}w`);
    }
    entries.push(`https://i.imgur.com/${parts.base}${parts.ext}${parts.query} 1920w`);
    return {
      srcset: entries.join(', '),
      fallbackSrc: `https://i.imgur.com/${parts.base}l${parts.ext}${parts.query}`,
    };
  }

  return { fallbackSrc: src };
};

function OptimizedImageInner(props: OptimizedImageProps) {
  const {
    src,
    alt,
    className = '',
    loading: loadingProp,
    width,
    height,
    placeholder = 'blur',
    variant = 'raw',
    fetchpriority: fetchPriorityProp,
    onError,
    onLoad,
  } = props;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [fallbackSet, setFallbackSet] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return undefined;

    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !cancelled) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  const { srcset, sizes: generatedSizes, fallbackSrc } = useMemo(() => buildSrcSet(src), [src]);

  const sizes = SIZES_BY_VARIANT[variant];
  const effectiveLoading = loadingProp ?? VARIANT_LOADING[variant];
  const effectiveFetchPriority = fetchPriorityProp ?? VARIANT_FETCH_PRIORITY[variant];
  const finalSrc = srcset ? fallbackSrc : src;

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoaded(true);
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (!fallbackSet) {
        setFallbackSet(true);
        const target = e.currentTarget;
        target.onerror = null;
        target.src = src;
        target.removeAttribute('srcset');
        target.removeAttribute('sizes');
        return;
      }
      setIsError(true);
      onError?.(e);
    },
    [onError, fallbackSet, src]
  );

  const getPlaceholderColor = useCallback(() => {
    if (!src) return '#f3f4f6';
    const hash = src.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 95%)`;
  }, [src]);

  if (isError) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center`}
        style={{ width, height }}
        role="img"
        aria-label={`${alt || 'imagem'} indisponível`}
      >
        <span className="text-gray-400 text-xs px-2 text-center">Imagem indisponível</span>
      </div>
    );
  }

  const placeholderBg = placeholder === 'dominant' ? getPlaceholderColor() : '#f3f4f6';

  return (
    <div
      ref={wrapperRef}
      className={`${className} relative overflow-hidden`}
      style={{ backgroundColor: placeholderBg, width, height }}
      data-optimized
    >
      {!isLoaded && (
        <div
          aria-hidden
          className={`absolute inset-0 ${placeholder === 'blur' ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: placeholderBg }}
        />
      )}

      {isInView && (
        <img
          ref={imgRef}
          src={finalSrc}
          srcSet={srcset}
          sizes={generatedSizes ?? sizes}
          alt={alt}
          loading={effectiveLoading}
          decoding="async"
          fetchPriority={effectiveFetchPriority}
          className={`w-full h-full object-cover transition-opacity duration-300 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
}

function propsAreEqual(prev: OptimizedImageProps, next: OptimizedImageProps): boolean {
  return (
    prev.src === next.src &&
    prev.alt === next.alt &&
    prev.className === next.className &&
    prev.loading === next.loading &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.placeholder === next.placeholder &&
    prev.variant === next.variant &&
    prev.fetchpriority === next.fetchpriority &&
    prev.onError === next.onError &&
    prev.onLoad === next.onLoad
  );
}

const MemoizedOptimizedImage = memo(OptimizedImageInner, propsAreEqual);
MemoizedOptimizedImage.displayName = 'OptimizedImage';

export default MemoizedOptimizedImage as React.FC<OptimizedImageProps>;
