/**
 * Browser-side editor gate. PostgreSQL row-level security enforces the same
 * server-controlled app_metadata.cms_role allow-list for every data operation.
 */
export const CMS_EDITOR_ROLES = ["owner", "admin", "editor"] as const;
export type CmsEditorRole = (typeof CMS_EDITOR_ROLES)[number];

export function hasCmsEditorAccess(role: unknown): role is CmsEditorRole {
  return typeof role === "string" && CMS_EDITOR_ROLES.includes(role as CmsEditorRole);
}
