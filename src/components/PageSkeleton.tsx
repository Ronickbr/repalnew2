import { memo } from 'react';

export type SkeletonType = 'home' | 'category' | 'detail' | 'list' | 'admin' | 'text' | 'image';

interface PageSkeletonProps {
  type?: SkeletonType;
  items?: number;
  className?: string;
}

const shimmerKeyframes = `
@keyframes repal-skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.repal-skeleton-base {
  background: linear-gradient(
    90deg,
    rgba(229, 231, 235, 0.6) 0%,
    rgba(243, 244, 246, 1) 50%,
    rgba(229, 231, 235, 0.6) 100%
  );
  background-size: 200% 100%;
  animation: repal-skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 0.5rem;
}
@media (prefers-reduced-motion: reduce) {
  .repal-skeleton-base { animation: none; }
}
`;

function injectSkeletonStyles() {
  if (typeof document === 'undefined') return;
  const id = 'repal-skeleton-css';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}

const SkeletonBox = memo(function SkeletonBox({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`repal-skeleton-base ${className ?? ''}`} style={style} aria-hidden />;
});

function TextLines({ lines = 3, width }: { lines?: number; width?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className="h-3"
          style={{ width: width ?? (i === lines - 1 ? '60%' : i % 2 === 0 ? '100%' : '85%') }}
        />
      ))}
    </div>
  );
}

function ProductCardSkeleton({ showBadge = true }: { showBadge?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden">
        <SkeletonBox className="absolute inset-0 rounded-none" />
        {showBadge && (
          <SkeletonBox className="absolute top-2 left-2 h-5 w-12 rounded-full" />
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col gap-2 flex-1">
        <SkeletonBox className="h-3 w-16" />
        <SkeletonBox className="h-4 sm:h-5 rounded" />
        <TextLines lines={2} />
        <div className="flex items-end justify-between mt-auto pt-2">
          <div className="flex flex-col gap-1">
            <SkeletonBox className="h-4 w-14" />
            <SkeletonBox className="h-6 w-24 rounded-lg" />
          </div>
          <SkeletonBox className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8 sm:space-y-12 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <section>
        <SkeletonBox className="w-full h-[200px] sm:h-[320px] lg:h-[440px] rounded-2xl" />
      </section>
      <section className="space-y-3 sm:space-y-5">
        <SkeletonBox className="h-7 sm:h-9 w-48 sm:w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
      <section className="space-y-3 sm:space-y-5">
        <SkeletonBox className="h-7 sm:h-9 w-64 sm:w-80" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CategorySkeleton({ items = 12 }: { items?: number }) {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      <SkeletonBox className="h-4 w-52" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SkeletonBox className="h-9 sm:h-11 w-64 sm:w-96" />
        <div className="flex gap-2">
          <SkeletonBox className="h-9 sm:h-11 w-28 rounded-xl" />
          <SkeletonBox className="h-9 sm:h-11 w-36 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: items }).map((_, i) => (
          <ProductCardSkeleton key={i} showBadge={false} />
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        <div className="space-y-4">
          <SkeletonBox className="w-full aspect-[4/3] rounded-2xl" />
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBox key={i} className="w-full aspect-square rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-5 sm:space-y-6">
          <SkeletonBox className="h-7 sm:h-8 w-32" />
          <SkeletonBox className="h-8 sm:h-10 w-full" />
          <SkeletonBox className="h-10 w-44" />
          <TextLines lines={6} />
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <SkeletonBox className="h-12 sm:h-14 w-full sm:w-40 rounded-xl" />
            <SkeletonBox className="h-12 sm:h-14 w-full sm:w-52 rounded-xl" />
          </div>
        </div>
      </div>
      <section className="mt-12 sm:mt-16 space-y-4 sm:space-y-6">
        <SkeletonBox className="h-7 sm:h-9 w-52 sm:w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ListSkeleton({ items = 6 }: { items?: number }) {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex gap-3 sm:gap-4 items-start">
          <SkeletonBox className="w-20 h-20 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-5 sm:h-6 w-3/4" />
            <TextLines lines={2} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TextSkeleton({ lines = 4, width }: { lines?: number; width?: string }) {
  return (
    <div className="py-3 sm:py-5 space-y-2">
      <TextLines lines={lines} width={width} />
    </div>
  );
}

function ImageSkeleton({ className, aspect = 'square' }: { className?: string; aspect?: 'square' | '4/3' | '16/9' }) {
  const aspectClass = aspect === 'square' ? 'aspect-square' : aspect === '4/3' ? 'aspect-[4/3]' : 'aspect-video';
  return <SkeletonBox className={`${aspectClass} ${className ?? ''}`} />;
}

function AdminSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBox className="h-8 w-48" />
          <SkeletonBox className="h-4 w-80" />
        </div>
        <SkeletonBox className="h-10 w-32 rounded-xl" />
      </div>
      <div className="mt-8 bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex gap-2 flex-wrap">
          <SkeletonBox className="h-9 w-48 rounded-xl" />
          <SkeletonBox className="h-9 w-28 rounded-xl ml-auto" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
              <SkeletonBox className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl" />
              <div className="flex-1 space-y-1">
                <SkeletonBox className="h-4 w-40" />
                <SkeletonBox className="h-3 w-60" />
              </div>
              <SkeletonBox className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton({ type = 'list', items = 8, className }: PageSkeletonProps) {
  injectSkeletonStyles();
  const wrap = className ?? '';

  if (type === 'home') return <div className={wrap}><HomeSkeleton /></div>;
  if (type === 'category') return <div className={wrap}><CategorySkeleton items={items} /></div>;
  if (type === 'detail') return <div className={wrap}><DetailSkeleton /></div>;
  if (type === 'text') return <div className={wrap}><TextSkeleton lines={items} /></div>;
  if (type === 'image') return <div className={wrap}><ImageSkeleton /></div>;
  if (type === 'admin') return <div className={wrap}><AdminSkeleton /></div>;
  return <div className={wrap}><ListSkeleton items={items} /></div>;
}

export default memo(PageSkeleton);
