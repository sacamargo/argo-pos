import { BRAND_LOGO, BUSINESS_NAME } from "@/shared/constants/branding";
import { cn } from "@/shared/lib/cn";

type BrandAvatarProps = {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
};

const SIZE_CLASS = {
  sm: "size-8",
  md: "size-12",
  lg: "size-28",
  xl: "size-40",
} as const;

const SRC = {
  sm: BRAND_LOGO.small,
  md: BRAND_LOGO.small,
  lg: BRAND_LOGO.medium,
  xl: BRAND_LOGO.full,
} as const;

/** Circular business photo (Windows-login style when large). */
export function BrandAvatar({
  size = "sm",
  className,
  alt = BUSINESS_NAME,
}: BrandAvatarProps) {
  return (
    <img
      src={SRC[size]}
      alt={alt}
      className={cn(
        "shrink-0 rounded-full object-cover ring-2 ring-border shadow-sm",
        SIZE_CLASS[size],
        className,
      )}
      draggable={false}
    />
  );
}
