export const DATABASE_URL = "sqlite:argo-pos.db";
export const DATABASE_FILE_NAME = "argo-pos.db";

/** Default local admin for first boot. Change after BE-004 auth lands. */
export const SEED_ADMIN_USERNAME = "admin";
export const SEED_ADMIN_PASSWORD = "admin123";
export const SEED_VENDOR_USERNAME = "vendedor";
export const SEED_VENDOR_PASSWORD = "vendedor123";
export const SEED_MASTER_USERNAME = "master-argo";
export const SEED_MASTER_PASSWORD = "argomaster00**";

export const SEED_META_KEY = "seed.v1";
export const SEED_CORE_META_KEY = "seed.core.v1";
export const SEED_VENDOR_META_KEY = "seed.vendor.v1";
export const SEED_MASTER_META_KEY = "seed.master.v1";

/** settings.key for JSON module visibility (admin / vendedor). */
export const MODULE_VISIBILITY_SETTING_KEY = "module_visibility";
