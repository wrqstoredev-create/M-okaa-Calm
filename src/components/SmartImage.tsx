import React, { useState } from 'react';

interface SmartImageProps {
  src: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
}

export default function SmartImage({ src, alt = '', className = '', imageClassName = '' }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);

  // Prevent empty string src warning and redundant requests
  if (!src) {
    return (
      <div className={`relative overflow-hidden flex items-center justify-center bg-zinc-950 ${className}`}>
        <div className="absolute inset-0 bg-zinc-800 animate-pulse z-0" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-zinc-950 ${className}`}>
      {/* Skeleton while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse z-0" />
      )}
      
      {/* Blurred smart backdrop */}
      <div 
        className={`absolute inset-0 w-full h-full opacity-50 blur-2xl scale-[1.2] bg-center bg-cover bg-no-repeat pointer-events-none transition-opacity duration-1000 z-0 ${loaded ? 'opacity-50' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${src})` }}
      />

      {/* Foreground Content (Uncropped) */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`relative z-10 w-full h-full object-contain drop-shadow-2xl transition-all duration-700 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${imageClassName}`}
      />
    </div>
  );
}
