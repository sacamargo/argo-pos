export const colors = {
  background: "#f7f8fa",
  surface: "#ffffff",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  primary: "#0f172a",
  primaryForeground: "#ffffff",
  accent: "#0d9488",
  accentMuted: "#ccfbf1",
  success: "#059669",
  successMuted: "#d1fae5",
  warning: "#d97706",
  warningMuted: "#fef3c7",
  danger: "#dc2626",
  dangerMuted: "#fee2e2",
  focus: "#0d9488",
} as const;

export type ColorToken = keyof typeof colors;
