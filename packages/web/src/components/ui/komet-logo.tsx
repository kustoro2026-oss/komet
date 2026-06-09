import Image from "next/image";

interface KometLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: 16,
  md: 24,
  lg: 40,
} as const;

export function KometLogo({ size = "md", className = "" }: KometLogoProps) {
  const px = sizes[size];
  return (
    <Image
      src="/logo-komet.png"
      alt="Komet"
      width={px}
      height={px}
      className={`rounded-lg object-contain ${className}`}
    />
  );
}

/** Icon version — for use in icon arrays where className controls sizing */
export function KometLogoIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <Image
      src="/logo-komet.png"
      alt="Komet"
      width={24}
      height={24}
      className={`rounded object-contain ${className}`}
    />
  );
}
