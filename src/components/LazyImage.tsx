'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface LazyImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
}: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (!isIntersecting && !priority) {
    return (
      <div
        ref={elementRef}
        className={`lazy-placeholder ${className}`}
        style={{ width, height }}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  return (
    <div ref={elementRef} className="relative">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleImageLoad}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      {!imageLoaded && (
        <div
          className={`lazy-placeholder absolute inset-0 ${className}`}
          style={{ width, height }}
          aria-label={`Loading ${alt}`}
        />
      )}
    </div>
  );
}
