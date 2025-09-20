import { useState, useEffect, useCallback } from 'react';
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

  // Navigate to next banner
  const nextBanner = useCallback(() => {
    if (banners.length > 0) {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }
  }, [banners.length]);

  // Navigate to previous banner
  const prevBanner = useCallback(() => {
    if (banners.length > 0) {
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? banners.length - 1 : prevIndex - 1
      );
    }
  }, [banners.length]);

  // Go to specific banner
  const goToBanner = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || isHovered || banners.length <= 1) return;

    const interval = setInterval(nextBanner, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isPlaying, isHovered, nextBanner, autoPlayInterval, banners.length]);

  // Reset current index if banners change
  useEffect(() => {
    if (banners.length > 0 && currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          prevBanner();
          break;
        case 'ArrowRight':
          nextBanner();
          break;
        case ' ':
          event.preventDefault();
          togglePlayPause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextBanner, prevBanner, togglePlayPause]);

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
      <div className={`relative w-full h-64 md:h-96 bg-gray-200 animate-pulse rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500">Carregando banners...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative w-full h-64 md:h-96 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-600">Erro ao carregar banners: {error}</div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className={`relative w-full h-64 md:h-96 bg-gray-100 border border-gray-200 rounded-lg ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-600">Nenhum banner disponível</div>
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div 
      className={`relative w-full h-64 md:h-96 overflow-hidden rounded-lg shadow-lg group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Banner Image */}
      <div 
        className={`relative w-full h-full transition-transform duration-300 ${
          currentBanner.link_url ? 'cursor-pointer' : 'cursor-default'
        }`}
        onClick={() => handleBannerClick(currentBanner)}
      >
        <img
          src={currentBanner.image_url}
          alt={currentBanner.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            console.error('Erro ao carregar imagem do banner:', currentBanner.image_url);
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgNzVIMjI1VjEyNUgxNzVWNzVaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMDAgOTBMMjEwIDEwNUgxOTBMMjAwIDkwWiIgZmlsbD0iI0Y5RkFGQiIvPgo8L3N2Zz4K';
            e.currentTarget.alt = 'Imagem não encontrada';
          }}
          onLoad={() => {
            // Imagem carregada com sucesso
          }}
        />

      </div>

      {/* Navigation Controls */}
      {showControls && banners.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={prevBanner}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Banner anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next Button */}
          <button
            onClick={nextBanner}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Próximo banner"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Play/Pause Button */}
          {autoPlay && (
            <button
              onClick={togglePlayPause}
              className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100"
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
        </>
      )}

      {/* Indicators */}
      {showIndicators && banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToBanner(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {autoPlay && isPlaying && !isHovered && banners.length > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-30">
          <div 
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width: '100%',
              animation: `progress ${autoPlayInterval}ms linear infinite`
            }}
          />
        </div>
      )}


    </div>
  );
}