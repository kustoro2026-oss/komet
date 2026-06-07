// Team authorization helpers — role-based access checks
// Used by both API routes and frontend to enforce permissions
import { prisma } from "@komet/db";

/**
 * Get the role of a user in a specific workspace.
 * Returns null if the user is not a member.
 */
export async function getUserRole(
  userId: string,
  workspaceId: string
): Promise<string | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    select: { role: true },
  });
  return member?.role || null;
}

/**
 * Check if the user is an admin of the workspace.
 */
export async function isAdmin(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const role = await getUserRole(userId, workspaceId);
  return role === "admin";
}

/**
 * Check if the user can edit content (admin or editor).
 */
export async function canEdit(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const role = await getUserRole(userId, workspaceId);
  return role === "admin" || role === "editor";
}

/**
 * Check if the user can view content (any role).
 */
export async function canView(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const role = await getUserRole(userId, workspaceId);
  return role !== null;
}

/**
 * Permission map for UI rendering decisions.
 * Pass the user's role string to get what they can/cannot do.
 */
export function getPermissions(role: string | null) {
  return {
    canManageTeam: role === "admin",
    canManageBilling: role === "admin",
    canInviteMembers: role === "admin",
    canRemoveMembers: role === "admin",
    canChangeRoles: role === "admin",
    canCreatePosts: role === "admin" || role === "editor",
    canEditPosts: role === "admin" || role === "editor",
    canDeletePosts: role === "admin",
    canManageComments: role === "admin" || role === "editor",
    canUploadMedia: role === "admin" || role === "editor",
    canViewAnalytics: role !== null,
    canViewTeam: role !== null,
    canManageSettings: role === "admin",
  };
}
