import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError,
  className,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(img);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const shouldShowImage = isInView && !hasError;
  const shouldShowPlaceholder = !isLoaded && shouldShowImage;
  const shouldShowFallback = hasError && fallback;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder */}
      {shouldShowPlaceholder && placeholder && (
        <img
          src={placeholder}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            'filter blur-sm scale-110 transition-opacity duration-300',
            isLoaded ? 'opacity-0' : 'opacity-100'
          )}
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      {shouldShowImage && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          {...props}
        />
      )}

      {/* Fallback */}
      {shouldShowFallback && (
        <img
          src={fallback}
          alt={alt}
          className="w-full h-full object-cover"
          {...props}
        />
      )}

      {/* Loading skeleton */}
      {!shouldShowImage && !shouldShowFallback && (
        <div
          ref={imgRef}
          className={cn(
            'w-full h-full bg-gray-200 animate-pulse',
            'flex items-center justify-center text-gray-400'
          )}
          role="img"
          aria-label={`Loading ${alt}`}
        >
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

// Hook for preloading images
export const useImagePreloader = (urls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadImage = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set(prev).add(url));
          resolve();
        };
        img.onerror = () => {
          setFailedImages(prev => new Set(prev).add(url));
          reject();
        };
        img.src = url;
      });
    };

    const preloadAll = async () => {
      const promises = urls.map(url => 
        preloadImage(url).catch(() => {}) // Ignore errors
      );
      await Promise.allSettled(promises);
    };

    if (urls.length > 0) {
      preloadAll();
    }
  }, [urls]);

  return {
    loadedImages,
    failedImages,
    isLoaded: (url: string) => loadedImages.has(url),
    hasFailed: (url: string) => failedImages.has(url),
  };
};

// Progressive image component with multiple sizes
export interface ProgressiveImageProps extends LazyImageProps {
  srcSet?: string;
  sizes?: string;
  lowQualitySrc?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  srcSet,
  sizes,
  lowQualitySrc,
  alt,
  className,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || src);
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);

  useEffect(() => {
    if (lowQualitySrc && lowQualitySrc !== src) {
      // Preload high quality image
      const img = new Image();
      img.onload = () => {
        setCurrentSrc(src);
        setIsHighQualityLoaded(true);
      };
      img.src = src;
      if (srcSet) img.srcset = srcSet;
    }
  }, [src, srcSet, lowQualitySrc]);

  return (
    <LazyImage
      src={currentSrc}
      alt={alt}
      className={cn(
        className,
        lowQualitySrc && !isHighQualityLoaded && 'filter blur-sm'
      )}
      {...props}
    />
  );
};