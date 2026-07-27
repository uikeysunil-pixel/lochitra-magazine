import Image from 'next/image'

interface CategoryIconProps {
  /** Category slug used to construct asset path: /static/images/icons/${slug}.webp */
  slug: string
  /** Standard icon render size in pixels (e.g. 18, 20, 48, 56) */
  size: number
  /** Additional CSS classes for styling / alignment */
  className?: string
  /** Whether the icon is purely decorative (defaults to true for standard badges/cards) */
  decorative?: boolean
  /** Accessible label when decorative is false */
  alt?: string
  /** Next.js Image priority loading flag */
  priority?: boolean
}

/**
 * Reusable CategoryIcon component — single source of truth for category icon rendering on Locitra.
 * Maps category slug dynamically to /static/images/icons/${slug}.webp
 */
export default function CategoryIcon({
  slug,
  size,
  className = '',
  decorative = true,
  alt = '',
  priority = false,
}: CategoryIconProps) {
  const src = `/static/images/icons/${slug}.webp`

  return (
    <Image
      src={src}
      alt={decorative ? '' : alt}
      aria-hidden={decorative ? 'true' : undefined}
      width={size}
      height={size}
      priority={priority}
      className={`object-contain ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  )
}
