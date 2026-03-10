export const ADMIN_SESSION_STORAGE_KEY = "lydo_admin_session_v1";

export const PREDEFINED_ADMIN_CREDENTIALS = {
  username: "lydoadmin",
  password: "lydoadminnpassword",
} as const;

export const PREDEFINED_ADMIN_USER = {
  id: "local-admin",
  email: "lydoadmin@local.admin",
  displayName: "Admin User",
} as const;
