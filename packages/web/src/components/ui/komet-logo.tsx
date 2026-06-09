import Image from "next/image";

interface KometLogoProps {
  /** Predefined size — sm=64, md=128, lg=240 */
  size?: "sm" | "md" | "lg";
  /** Additional Tailwind classes (e.g. for margin) */
  className?: string;
  /** Set true for above-the-fold logos to skip lazy loading */
  priority?: boolean;
}

const sizes = {
  sm: { w: 64, h: 49 },
  md: { w: 128, h: 97 },
  lg: { w: 240, h: 182 },
} as const;

/**
 * Komet brand logo — transparent background, responsive sizes.
 * Uses next/image for automatic optimization.
 */
export function KometLogo({ size = "md", className = "", priority = false }: KometLogoProps) {
  const { w, h } = sizes[size];
  return (
    <Image
      src="/logo-komet.png"
      alt="Komet"
      width={w}
      height={h}
      priority={priority}
      className={`object-contain ${className}`}
    />
  );
}

/**
 * Icon version — for use in icon arrays where className controls sizing.
 * Accepts Tailwind sizing classes like h-5 w-5.
 */
export function KometLogoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <Image
      src="/logo-komet.png"
      alt="Komet"
      width={64}
      height={49}
      className={`object-contain ${className}`}
    />
  );
}
