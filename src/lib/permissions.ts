export type Role = "super_admin" | "admin" | "unit_admin" | "data_entry" | "viewer" | "maintenance";

export type AppModule = 
  | "dashboard"
  | "realtime"
  | "vehicles"
  | "history"
  | "stats"
  | "external_persons"
  | "electrical"
  | "users"
  | "monitoring"
  | "online_users"
  | "audit";

// Map each module to the array of roles allowed to access it
export const ROLE_PERMISSIONS: Record<AppModule, Role[]> = {
  dashboard: ["super_admin", "admin", "unit_admin", "data_entry", "viewer"],
  realtime: ["super_admin", "admin", "unit_admin", "data_entry", "viewer"],
  vehicles: ["super_admin", "admin", "unit_admin", "data_entry"],
  history: ["super_admin", "admin", "unit_admin", "data_entry", "viewer"],
  stats: ["super_admin", "admin", "unit_admin", "viewer"],
  external_persons: ["super_admin", "admin", "unit_admin", "data_entry"],
  electrical: ["super_admin", "admin", "maintenance"],
  users: ["super_admin", "admin"],
  monitoring: ["super_admin", "admin", "maintenance"],
  online_users: ["super_admin", "admin"],
  audit: ["super_admin"]
};

/**
 * Checks if a specific role has access to a specific application module.
 */
export const hasPermission = (role: Role | undefined | null, module: AppModule): boolean => {
  if (!role) return false;
  
  const allowedRoles = ROLE_PERMISSIONS[module];
  if (!allowedRoles) return false;

  return allowedRoles.includes(role);
};
