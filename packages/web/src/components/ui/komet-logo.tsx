import Image from "next/image";

interface KometLogoProps {
  size?: "sm" | "md" | "lg";
  /** Additional Tailwind classes */
  className?: string;
  /** Set true for above-the-fold logos */
  priority?: boolean;
}

const sizes = {
  sm: { w: 64, h: 51 },
  md: { w: 128, h: 101 },
  lg: { w: 240, h: 190 },
} as const;

/**
 * Komet brand logo — circular gradient K with glow.
 * Uses next/image for optimization.
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
 * Icon-only version — transparent K, no background.
 * For use in icon arrays, nav items, etc.
 */
export function KometLogoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <Image
      src="/logo-komet-icon.png"
      alt="Komet"
      width={64}
      height={64}
      className={`object-contain ${className}`}
    />
  );
}
