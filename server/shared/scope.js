// Common Prisma `where` fragments for ownership / membership scoping. Admins
// bypass scopes entirely; other roles see only rows they own or participate
// in. Keeping scoping logic in one module prevents drift across services.

export function isAdmin(user) {
  return user?.role === 'ADMIN';
}

/** Throws if the given user is not the owner of the resource and not an admin. */
export function assertOwnerOrAdmin(user, ownerId) {
  if (!user) return false;
  return isAdmin(user) || user.id === ownerId;
}
