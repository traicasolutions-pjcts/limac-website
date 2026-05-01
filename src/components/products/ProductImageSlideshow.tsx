'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Battery, ChevronLeft, ChevronRight } from 'lucide-react'

interface ProductImageSlideshowProps {
  images?: string[]
  alt: string
  fallbackLabel?: string
  className?: string
  imageClassName?: string
  sizes: string
  priority?: boolean
  showControls?: boolean
}

export default function ProductImageSlideshow({
  images,
  alt,
  fallbackLabel,
  className = '',
  imageClassName = 'object-cover',
  sizes,
  priority = false,
  showControls = true,
}: ProductImageSlideshowProps) {
  const imageList = useMemo(() => images?.filter(Boolean) ?? [], [images])
  const [activeIndex, setActiveIndex] = useState(0)
  const hasMultipleImages = imageList.length > 1

  useEffect(() => {
    setActiveIndex(0)
  }, [imageList.length])

  useEffect(() => {
    if (!hasMultipleImages) return undefined

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % imageList.length)
    }, 3500)

    return () => window.clearInterval(timer)
  }, [hasMultipleImages, imageList.length])

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + imageList.length) % imageList.length)
  }

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % imageList.length)
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {imageList[activeIndex] ? (
        <Image
          src={imageList[activeIndex]}
          alt={alt}
          fill
          sizes={sizes}
          className={imageClassName}
          priority={priority}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-limac-black text-center">
          <Battery size={36} className="text-limac-green/50 mb-1" />
          {fallbackLabel && <div className="text-limac-green text-sm font-bold">{fallbackLabel}</div>}
        </div>
      )}

      {hasMultipleImages && showControls && (
        <>
          <button
            type="button"
            aria-label="Previous product image"
            onClick={goToPrevious}
            className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next product image"
            onClick={goToNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {imageList.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                aria-label={`Show product image ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  activeIndex === index ? 'w-6 bg-limac-green' : 'w-1.5 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
