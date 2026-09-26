/**
 * SmartImage.tsx — Performance Optimized
 *
 * Changes vs. original:
 * ─────────────────────────────────────────────────────────────────────
 * 1. Native lazy loading  → loading="lazy" + decoding="async"
 *    Browser only fetches the image when it's ~1 screen away from viewport.
 *
 * 2. Intersection Observer fallback
 *    For browsers that support it natively, loading="lazy" is enough.
 *    The observer here adds an extra layer: the blurred backdrop only
 *    renders once the image enters the viewport, saving GPU work.
 *
 * 3. Priority prop — set to true for LCP images (hero, first product card)
 *    → loading="eager" + fetchpriority="high" for instant load.
 *
 * 4. Aspect-ratio container via paddingBottom trick (no layout shift = CLS=0)
 *    Pass aspect="square" | "video" | "portrait" | undefined (auto)
 *
 * 5. onError fallback — shows a styled placeholder instead of broken image icon
 */

import React, { useState, useRef, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

type Aspect = 'square' | 'video' | 'portrait' | 'auto';

interface SmartImageProps {
  src: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  /** Set true for LCP / above-the-fold images — disables lazy loading */
  priority?: boolean;
  /** Fixed aspect ratio to prevent layout shift (CLS) */
  aspect?: Aspect;
}

const ASPECT_PADDING: Record<Aspect, string> = {
  square:   'aspect-square',
  video:    'aspect-video',
  portrait: 'aspect-[3/4]',
  auto:     '',
};

export default function SmartImage({
  src,
  alt = '',
  className = '',
  imageClassName = '',
  priority = false,
  aspect = 'auto',
}: SmartImageProps) {
  const [loaded,  setLoaded]  = useState(false);
  const [errored, setErrored] = useState(false);
  const [inView,  setInView]  = useState(priority); // priority images start as "in view"
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Intersection Observer — activate backdrop only when visible ── */
  useEffect(() => {
    if (priority || !containerRef.current) return;

    const el = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: '200px' }, // start loading 200px before entering viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  /* ── Empty src guard ─────────────────────────────────────────── */
  if (!src) {
    return (
      <div
        className={`relative overflow-hidden flex items-center justify-center bg-zinc-900 ${ASPECT_PADDING[aspect]} ${className}`}
      >
        <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden flex items-center justify-center bg-zinc-900 ${ASPECT_PADDING[aspect]} ${className}`}
    >
      {/* ── Skeleton pulse (while loading) ──────────────────────── */}
      {!loaded && !errored && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse z-0" />
      )}

      {/* ── Error fallback ───────────────────────────────────────── */}
      {errored && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-600 gap-2 z-10">
          <ImageOff size={24} />
          <span className="text-[10px] font-black">تعذّر التحميل</span>
        </div>
      )}

      {/* ── Blurred backdrop (colour wash, only rendered when in view) */}
      {inView && !errored && (
        <div
          className={`absolute inset-0 opacity-50 blur-2xl scale-[1.2] bg-center bg-cover bg-no-repeat pointer-events-none transition-opacity duration-1000 z-0 ${loaded ? 'opacity-50' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${src})` }}
          aria-hidden="true"
        />
      )}

      {/* ── Main image ──────────────────────────────────────────── */}
      {inView && (
        <img
          src={src}
          alt={alt}
          /* Native lazy loading — browser decides when to fetch */
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          /* @ts-ignore — fetchpriority is a valid HTML attribute */
          fetchpriority={priority ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={[
            'relative z-10 w-full h-full object-contain drop-shadow-2xl transition-all duration-700',
            loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
            imageClassName,
          ].join(' ')}
        />
      )}
    </div>
  );
}
