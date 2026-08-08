import React, { useCallback, memo, useEffect, useRef, forwardRef } from 'react';
import { Link, LinkProps, useLocation, useMatch } from 'react-router-dom';
import { queryClient } from '../lib/react-query';

type SmartLinkProps = LinkProps & {
  prefetchQueryKeys?: unknown[];
  prefetchDelay?: number;
  variant?: 'default' | 'unstyled';
  prefetchOnViewport?: boolean;
};

function prefetchChunkByPath(pathname: string) {
  try {
    const clean = pathname.split('?')[0] || '/';
    const moduleMap: Record<string, () => Promise<unknown>> = {
      '/': () => import('../pages/Home'),
      '/categorias': () => import('../pages/CategoriesIndex'),
      '/sobre': () => import('../pages/About'),
      '/contato': () => import('../pages/Contact'),
      '/login': () => import('../pages/Login'),
      '/registro': () => import('../pages/Register'),
      '/cadastro': () => import('../pages/Register'),
      '/perfil': () => import('../pages/UserProfile'),
    };

    for (const prefix of Object.keys(moduleMap)) {
      if (clean === prefix || clean.startsWith(`${prefix}/`)) {
        const loader = moduleMap[prefix];
        if (typeof loader === 'function') {
          loader().catch(() => undefined);
        }
        break;
      }
    }

    if (clean.startsWith('/categorias/')) {
      moduleMap['/categorias']?.().catch(() => undefined);
    }
    if (clean.startsWith('/produto/')) {
      import('../pages/ProductDetail').catch(() => undefined);
    }
  } catch {
    /* prefetch não crítico — falha silenciosa permitida */
  }
}

const SmartLinkInner = forwardRef<HTMLAnchorElement, SmartLinkProps>((props, forwardedRef) => {
  const {
    to,
    prefetchQueryKeys,
    prefetchDelay = 120,
    prefetchOnViewport = true,
    children,
    onMouseEnter,
    onFocus,
    onTouchStart,
    ...rest
  } = props;

  const location = useLocation();
  const timerRef = useRef<number | undefined>(undefined);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const prefetchedRef = useRef(false);

  const isStringTo = typeof to === 'string';
  const matchPath = isStringTo ? to.split('?')[0] : '__no_smartlink_match__';
  const matchEnd = isStringTo ? to === '/' : false;
  const matchResult = useMatch({ path: matchPath, end: matchEnd });
  const isActive = isStringTo ? !!matchResult : false;

  const toPath = typeof to === 'string' ? to : to.pathname || '/';

  const runPrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;

    try {
      prefetchChunkByPath(toPath);
    } catch {
      /* prefetch de chunk não crítico — falha silenciosa permitida */
    }

    if (prefetchQueryKeys && prefetchQueryKeys.length > 0) {
      prefetchQueryKeys.forEach((qk) => {
        try {
          const queryKey = Array.isArray(qk) ? (qk as readonly unknown[]) : [qk];
          queryClient.prefetchQuery({ queryKey }).catch(() => undefined);
        } catch {
          /* noop */
        }
      });
    }
  }, [toPath, prefetchQueryKeys]);

  const schedulePrefetch = useCallback(() => {
    if (prefetchedRef.current) return;
    if (prefetchDelay <= 0) {
      runPrefetch();
      return;
    }
    timerRef.current = window.setTimeout(() => runPrefetch(), prefetchDelay);
  }, [prefetchDelay, runPrefetch]);

  const cancelPrefetch = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!prefetchOnViewport) return undefined;
    const el = linkRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runPrefetch();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [prefetchOnViewport, runPrefetch]);

  useEffect(() => {
    return () => cancelPrefetch();
  }, [cancelPrefetch]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      schedulePrefetch();
      onMouseEnter?.(e);
    },
    [schedulePrefetch, onMouseEnter]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      runPrefetch();
      onFocus?.(e);
    },
    [runPrefetch, onFocus]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLAnchorElement>) => {
      runPrefetch();
      onTouchStart?.(e);
    },
    [runPrefetch, onTouchStart]
  );

  const setRefs = useCallback((node: HTMLAnchorElement | null) => {
    linkRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      (forwardedRef as React.MutableRefObject<HTMLAnchorElement | null>).current = node;
    }
  }, [forwardedRef]);

  void location;
  void isActive;

  return (
    <Link
      ref={setRefs}
      to={to}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={cancelPrefetch}
      onFocus={handleFocus}
      onBlur={cancelPrefetch}
      onTouchStart={handleTouchStart}
      data-smart-link
      {...rest}
    >
      {children}
    </Link>
  );
});
SmartLinkInner.displayName = 'SmartLinkInner';

const MemoizedSmartLink = memo(SmartLinkInner);
MemoizedSmartLink.displayName = 'SmartLink';

export default MemoizedSmartLink;
