/**
 * Client branding for this install.
 * Display title: `Argo POS - {businessName}`.
 * Logo files live in `public/brand/`.
 */
export const APP_PRODUCT_NAME = "Argo POS";

/** Establishment / business display name. */
export const BUSINESS_NAME = "Zúmbalo";

/** Full window / header title. */
export function formatAppTitle(businessName: string = BUSINESS_NAME): string {
  return `${APP_PRODUCT_NAME} - ${businessName}`;
}

export const BRAND_LOGO = {
  /** Full-res source for login avatar. */
  full: "/brand/business-logo.jpg",
  /** Header / compact UI. */
  small: "/brand/business-logo-64.jpg",
  /** Login / medium surfaces. */
  medium: "/brand/business-logo-256.jpg",
} as const;
