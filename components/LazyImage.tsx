import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  /** Enable blur-up effect: shows a blurred placeholder that sharpens on load */
  blurUp?: boolean;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Lazy-loading image component using Intersection Observer
 * Supports blur-up placeholder effect for smooth perceived loading
 */
export function LazyImage({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23e2e8f0" width="400" height="300"/%3E%3C/svg%3E',
  blurUp = false,
  threshold = 0.1,
  rootMargin = '100px',
  className = '',
  style,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Skip if no IntersectionObserver support (SSR or old browsers)
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  const blurStyle = blurUp
    ? {
        filter: isLoaded ? 'blur(0px)' : 'blur(20px)',
        transform: isLoaded ? 'scale(1)' : 'scale(1.1)',
        transition: 'filter 0.4s ease-out, transform 0.4s ease-out, opacity 0.4s ease-out',
        ...style,
      }
    : style;

  return (
    <img
      ref={imgRef}
      src={isInView ? src : placeholder}
      alt={alt}
      className={`transition-opacity duration-300 ${
        isLoaded || blurUp ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={blurStyle}
      onLoad={() => setIsLoaded(true)}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
