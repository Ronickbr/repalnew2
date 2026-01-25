import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useActiveBanners } from '../hooks/useBanners';

interface BannerCarouselProps {
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
}

export default function BannerCarousel({
  autoPlay = true,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  className = ''
}: BannerCarouselProps) {
  const { banners, loading, error } = useActiveBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Debounced navigation to prevent rapid clicking
  const debouncedNavigation = useCallback((callback: () => void) => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    if (!isTransitioning) {
      setIsTransitioning(true);
      callback();
      
      navigationTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }
  }, [isTransitioning]);

  // Preload images for smooth transitions
  const preloadImage = useCallback((index: number) => {
    if (banners[index] && !preloadedImages.has(index)) {
      const img = new Image();
      img.onload = () => {
        setPreloadedImages(prev => new Set(prev).add(index));
      };
      img.src = banners[index].image_url;
    }
  }, [banners, preloadedImages]);

  // Navigate to next banner
  const nextBanner = useCallback(() => {
    if (banners.length > 0) {
      debouncedNavigation(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex === banners.length - 1 ? 0 : prevIndex + 1;
          // Preload next image
          const preloadIndex = nextIndex === banners.length - 1 ? 0 : nextIndex + 1;
          preloadImage(preloadIndex);
          return nextIndex;
        });
      });
    }
  }, [banners.length, debouncedNavigation, preloadImage]);

  // Navigate to previous banner
  const prevBanner = useCallback(() => {
    if (banners.length > 0) {
      debouncedNavigation(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex === 0 ? banners.length - 1 : prevIndex - 1;
          // Preload previous image
          const preloadIndex = nextIndex === 0 ? banners.length - 1 : nextIndex - 1;
          preloadImage(preloadIndex);
          return nextIndex;
        });
      });
    }
  }, [banners.length, debouncedNavigation, preloadImage]);

  // Go to specific banner
  const goToBanner = useCallback((index: number) => {
    if (index !== currentIndex) {
      debouncedNavigation(() => {
        setCurrentIndex(index);
        // Preload adjacent images
        preloadImage((index + 1) % banners.length);
        preloadImage(index === 0 ? banners.length - 1 : index - 1);
      });
    }
  }, [currentIndex, debouncedNavigation, preloadImage, banners.length]);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Auto-play functionality with smooth progress animation
  useEffect(() => {
    if (!isPlaying || isHovered || banners.length <= 1) return;

    let startTime: number;
    let animationId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / autoPlayInterval, 1);

      if (progressRef.current) {
        progressRef.current.style.width = `${progress * 100}%`;
      }

      if (progress >= 1) {
        nextBanner();
        startTime = currentTime;
      }

      if (isPlaying && !isHovered) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    const progressEl = progressRef.current;
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (progressEl) {
        progressEl.style.width = '0%';
      }
    };
  }, [isPlaying, isHovered, nextBanner, autoPlayInterval, banners.length]);

  // Reset current index if banners change
  useEffect(() => {
    if (banners.length > 0 && currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  // Preload initial images
  useEffect(() => {
    if (banners.length > 0) {
      // Preload current and next images
      preloadImage(currentIndex);
      preloadImage((currentIndex + 1) % banners.length);
      if (banners.length > 2) {
        preloadImage(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
      }
    }
  }, [banners, currentIndex, preloadImage]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!carouselRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Preload all images when carousel comes into view
            banners.forEach((_, index) => {
              preloadImage(index);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(carouselRef.current);

    return () => {
      observer.disconnect();
    };
  }, [banners, preloadImage]);

  // Handle keyboard navigation with focus management
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle keyboard events when carousel is focused or contains focus
      if (!carouselRef.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevBanner();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextBanner();
          break;
        case ' ':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'Home':
          event.preventDefault();
          goToBanner(0);
          break;
        case 'End':
          event.preventDefault();
          goToBanner(banners.length - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextBanner, prevBanner, togglePlayPause, goToBanner, banners.length]);

  // Handle reduced motion preference
  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Handle banner click
  const handleBannerClick = (banner: typeof banners[0]) => {
    if (banner.link_url) {
      // Check if it's an external link
      if (banner.link_url.startsWith('http')) {
        window.open(banner.link_url, '_blank', 'noopener,noreferrer');
      } else {
        // Internal link - use router navigation
        window.location.href = banner.link_url;
      }
    }
  };

  if (loading) {
    return (
      <div className={`relative w-full h-28 sm:h-40 md:h-56 lg:h-64 xl:h-[22rem] 2xl:h-[26rem] bg-gray-200 animate-pulse rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm sm:text-base">Carregando banners...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative w-full h-28 sm:h-40 md:h-56 lg:h-64 xl:h-[22rem] 2xl:h-[26rem] bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-600 text-sm sm:text-base text-center px-4">Erro ao carregar banners: {error}</div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className={`relative w-full h-28 sm:h-40 md:h-56 lg:h-64 xl:h-[22rem] 2xl:h-[26rem] bg-gray-100 border border-gray-200 rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-600 text-sm sm:text-base">Nenhum banner disponível</div>
        </div>
      </div>
    );
  }

  const transitionDuration = prefersReducedMotion() ? 0 : 500;

  return (
    <div 
      ref={carouselRef}
      className={`relative w-full h-28 sm:h-40 md:h-56 lg:h-64 xl:h-[22rem] 2xl:h-[26rem] overflow-hidden rounded-lg shadow-lg group focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="region"
      aria-label="Carrossel de banners"
      aria-live="polite"
    >
      {/* Banner Container with Slide Transition */}
      <div 
        className="relative w-full h-full"
        style={{
          transform: `translate3d(-${currentIndex * 100}%, 0, 0)`,
          transition: prefersReducedMotion() ? 'none' : `transform ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          willChange: 'transform'
        }}
      >
        {banners.map((banner, index) => (
          <div
            key={`${banner.id}-${index}`}
            className={`absolute top-0 left-0 w-full h-full ${
              banner.link_url ? 'cursor-pointer' : 'cursor-default'
            }`}
            style={{
              transform: `translate3d(${index * 100}%, 0, 0)`,
              willChange: 'transform'
            }}
            onClick={() => handleBannerClick(banner)}
          >
            <picture>
              <source
                media="(min-width: 1536px)"
                srcSet={`${banner.image_url}?w=1536&h=512&fit=crop&auto=format&q=80 1x, ${banner.image_url}?w=3072&h=1024&fit=crop&auto=format&q=80 2x`}
              />
              <source
                media="(min-width: 1280px)"
                srcSet={`${banner.image_url}?w=1280&h=448&fit=contain&auto=format&q=80 1x, ${banner.image_url}?w=2560&h=896&fit=contain&auto=format&q=80 2x`}
              />
              <source
                media="(min-width: 1024px)"
                srcSet={`${banner.image_url}?w=1024&h=384&fit=contain&auto=format&q=80 1x, ${banner.image_url}?w=2048&h=768&fit=contain&auto=format&q=80 2x`}
              />
              <source
                media="(min-width: 768px)"
                srcSet={`${banner.image_url}?w=768&h=320&fit=contain&auto=format&q=80 1x, ${banner.image_url}?w=1536&h=640&fit=contain&auto=format&q=80 2x`}
              />
              <source
                media="(min-width: 640px)"
                srcSet={`${banner.image_url}?w=640&h=256&fit=contain&auto=format&q=80 1x, ${banner.image_url}?w=1280&h=512&fit=contain&auto=format&q=80 2x`}
              />
              <img
                src={`${banner.image_url}?w=480&h=192&fit=contain&auto=format&q=80`}
                alt={banner.title}
                className="w-full h-full object-contain bg-gray-100"
                loading={index === currentIndex ? "eager" : "lazy"}
                decoding="async"
                onError={(e) => {
                  console.error('Erro ao carregar imagem do banner:', banner.image_url);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgNzVIMjI1VjEyNUgxNzVWNzVaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMDAgOTBMMjEwIDEwNUgxOTBMMjAwIDkwWiIgZmlsbD0iI0Y5RkFGQiIvPgo8L3N2Zz4K';
                  e.currentTarget.alt = 'Imagem não encontrada';
                }}
                onLoad={() => {
                  setPreloadedImages(prev => new Set(prev).add(index));
                }}
              />
            </picture>
            
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {showControls && banners.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={prevBanner}
            disabled={isTransitioning}
            className={`absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 
              bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm
              hover:from-black/80 hover:to-black/60 
              text-white p-2 sm:p-3 rounded-full 
              transition-all duration-300 ease-out
              opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
              hover:scale-110 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-white/50
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              shadow-lg hover:shadow-xl`}
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Next Button */}
          <button
            onClick={nextBanner}
            disabled={isTransitioning}
            className={`absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 
              bg-gradient-to-l from-black/60 to-black/40 backdrop-blur-sm
              hover:from-black/80 hover:to-black/60 
              text-white p-2 sm:p-3 rounded-full 
              transition-all duration-300 ease-out
              opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
              hover:scale-110 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-white/50
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              shadow-lg hover:shadow-xl`}
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Play/Pause Button */}
          {autoPlay && (
            <button
              onClick={togglePlayPause}
              className={`absolute top-2 sm:top-4 right-2 sm:right-4 
                bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm
                hover:from-black/80 hover:to-black/60 
                text-white p-2 sm:p-2.5 rounded-full 
                transition-all duration-300 ease-out
                opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                hover:scale-110 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-white/50
                shadow-lg hover:shadow-xl`}
              aria-label={isPlaying ? 'Pausar reprodução automática' : 'Iniciar reprodução automática'}
            >
              {isPlaying ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4" />}
            </button>
          )}
        </>
      )}

      {/* Indicators */}
      {showIndicators && banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 transform -translate-x-1/2 hidden sm:flex space-x-1.5 sm:space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToBanner(index)}
              disabled={isTransitioning}
              className={`relative overflow-hidden rounded-full transition-all duration-300 ease-out
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/20
                disabled:cursor-not-allowed
                ${index === currentIndex
                  ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-white shadow-lg'
                  : 'w-2 sm:w-3 h-2 sm:h-2.5 bg-white/60 hover:bg-white/80 hover:w-4 sm:hover:w-5'
                }`}
              aria-label={`Ir para banner ${index + 1} de ${banners.length}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            >
              {index === currentIndex && (
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-white/80 to-white rounded-full"
                  style={{
                    animation: prefersReducedMotion() ? 'none' : 'pulse 2s ease-in-out infinite'
                  }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {autoPlay && isPlaying && !isHovered && banners.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 sm:h-1 bg-gradient-to-r from-black/20 via-black/30 to-black/20">
          <div 
            ref={progressRef}
            className="h-full bg-gradient-to-r from-white/80 via-white to-white/80 shadow-sm"
            style={{
              width: '0%',
              transition: prefersReducedMotion() ? 'none' : 'width 100ms ease-out',
              willChange: 'width'
            }}
          />
        </div>
      )}


    </div>
  );
}

// Add custom CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

if (!document.head.querySelector('style[data-banner-carousel]')) {
  style.setAttribute('data-banner-carousel', 'true');
  document.head.appendChild(style);
}