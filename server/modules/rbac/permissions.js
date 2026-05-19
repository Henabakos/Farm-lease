// ============================================================================
// RBAC permission catalog.
//
// Permission strings use the shape  `resource:action[:scope]`.
//   resource : noun owned by a module (e.g. "cluster", "proposal")
//   action   : verb on that noun     (e.g. "create", "update", "read")
//   scope    : optional qualifier    (e.g. "own", "public")
//
// The catalog below is the static *default* — the source of truth at runtime
// is the `RolePermission` Prisma table. On boot we seed missing rows so admins
// can later override grants via the admin UI (feature-flag-like).
//
// Add a new permission:
//   1. Add the string to PERMISSIONS so other modules can import the constant.
//   2. Grant it to the appropriate roles in DEFAULT_ROLE_PERMISSIONS.
//   3. Check it at the route via `requirePermission(PERMISSIONS.X)`.
//   4. (Optional) re-check inside the service for resource-scoped rules.
// ============================================================================

export const PERMISSIONS = Object.freeze({
  // Identity / admin
  USER_READ_SELF:           'user:read:self',
  USER_UPDATE_SELF:         'user:update:self',
  USER_READ_ANY:            'user:read:any',
  USER_VERIFY:              'user:verify',
  ADMIN_APPROVE:            'admin:user:approve',
  ADMIN_SUSPEND:            'admin:user:suspend',
  ADMIN_AUDIT_READ:         'admin:audit:read',
  ADMIN_OVERVIEW:           'admin:overview',
  FEATURE_FLAG_TOGGLE:      'feature_flag:toggle',

  // Cluster
  CLUSTER_READ_PUBLIC:      'cluster:read:public',
  CLUSTER_CREATE:           'cluster:create',
  CLUSTER_UPDATE_OWN:       'cluster:update:own',
  CLUSTER_DELETE_OWN:       'cluster:delete:own',
  CLUSTER_JOIN:             'cluster:join',
  CLUSTER_VERIFY:           'cluster:verify',

  // Geospatial
  BOUNDARY_SUBMIT:          'boundary:submit',
  BOUNDARY_VERIFY:          'boundary:verify',
  SURVEY_UPLOAD:            'survey:upload',
  SURVEY_REVIEW:            'survey:review',

  // Proposals
  PROPOSAL_CREATE:          'proposal:create',
  PROPOSAL_READ_OWN:        'proposal:read:own',
  PROPOSAL_UPDATE_OWN:      'proposal:update:own',
  PROPOSAL_ACCEPT:          'proposal:accept',
  PROPOSAL_REJECT:          'proposal:reject',
  PROPOSAL_NEGOTIATE:       'proposal:negotiate',

  // Agreements
  AGREEMENT_READ_OWN:       'agreement:read:own',
  AGREEMENT_DRAFT:          'agreement:draft',
  AGREEMENT_SIGN:           'agreement:sign',
  AGREEMENT_TERMINATE:      'agreement:terminate',
  AGREEMENT_TEMPLATE_MANAGE:'agreement:template:manage',

  // Payments
  PAYMENT_READ_OWN:         'payment:read:own',
  PAYMENT_SUBMIT_RECEIPT:   'payment:submit_receipt',
  PAYMENT_VERIFY:           'payment:verify',
  PAYMENT_REFUND:           'payment:refund',

  // Messaging / Meetings / Notifications
  MESSAGE_SEND:             'message:send',
  MEETING_SCHEDULE:         'meeting:schedule',
  MEETING_INTEGRATIONS:     'meeting:integrations:configure',
  NOTIFICATION_READ_OWN:    'notification:read:own',

  // AI / KB
  AI_CHAT:                  'ai:chat',
  AI_KB_MANAGE:             'ai:kb:manage',
  AI_RECOMMENDATIONS_READ:  'ai:recommendations:read',
});

// Default grants per role. Admin gets everything implicitly elsewhere.
export const DEFAULT_ROLE_PERMISSIONS = Object.freeze({
  ADMIN: Object.values(PERMISSIONS), // wildcard

  INVESTOR: [
    PERMISSIONS.USER_READ_SELF, PERMISSIONS.USER_UPDATE_SELF,
    PERMISSIONS.CLUSTER_READ_PUBLIC,
    PERMISSIONS.PROPOSAL_CREATE, PERMISSIONS.PROPOSAL_READ_OWN,
    PERMISSIONS.PROPOSAL_UPDATE_OWN, PERMISSIONS.PROPOSAL_REJECT,
    PERMISSIONS.PROPOSAL_NEGOTIATE,
    PERMISSIONS.AGREEMENT_READ_OWN, PERMISSIONS.AGREEMENT_SIGN,
    PERMISSIONS.PAYMENT_READ_OWN, PERMISSIONS.PAYMENT_SUBMIT_RECEIPT,
    PERMISSIONS.MESSAGE_SEND, PERMISSIONS.MEETING_SCHEDULE,
    PERMISSIONS.NOTIFICATION_READ_OWN,
    PERMISSIONS.AI_CHAT, PERMISSIONS.AI_RECOMMENDATIONS_READ,
  ],

  CLUSTER_REP: [
    PERMISSIONS.USER_READ_SELF, PERMISSIONS.USER_UPDATE_SELF,
    PERMISSIONS.CLUSTER_READ_PUBLIC, PERMISSIONS.CLUSTER_CREATE,
    PERMISSIONS.CLUSTER_UPDATE_OWN, PERMISSIONS.CLUSTER_DELETE_OWN,
    PERMISSIONS.BOUNDARY_SUBMIT, PERMISSIONS.SURVEY_UPLOAD,
    PERMISSIONS.PROPOSAL_CREATE, PERMISSIONS.PROPOSAL_READ_OWN,
    PERMISSIONS.PROPOSAL_UPDATE_OWN, PERMISSIONS.PROPOSAL_ACCEPT,
    PERMISSIONS.PROPOSAL_REJECT, PERMISSIONS.PROPOSAL_NEGOTIATE,
    PERMISSIONS.AGREEMENT_READ_OWN, PERMISSIONS.AGREEMENT_DRAFT,
    PERMISSIONS.AGREEMENT_SIGN, PERMISSIONS.AGREEMENT_TERMINATE,
    PERMISSIONS.PAYMENT_READ_OWN, PERMISSIONS.PAYMENT_VERIFY,
    PERMISSIONS.MESSAGE_SEND, PERMISSIONS.MEETING_SCHEDULE,
    PERMISSIONS.NOTIFICATION_READ_OWN,
    PERMISSIONS.AI_CHAT, PERMISSIONS.AI_KB_MANAGE,
  ],

  FARMER: [
    PERMISSIONS.USER_READ_SELF, PERMISSIONS.USER_UPDATE_SELF,
    PERMISSIONS.CLUSTER_READ_PUBLIC, PERMISSIONS.CLUSTER_JOIN,
    PERMISSIONS.PROPOSAL_READ_OWN, PERMISSIONS.PROPOSAL_ACCEPT,
    PERMISSIONS.PROPOSAL_REJECT, PERMISSIONS.PROPOSAL_NEGOTIATE,
    PERMISSIONS.AGREEMENT_READ_OWN, PERMISSIONS.AGREEMENT_SIGN,
    PERMISSIONS.PAYMENT_READ_OWN,
    PERMISSIONS.MESSAGE_SEND, PERMISSIONS.MEETING_SCHEDULE,
    PERMISSIONS.NOTIFICATION_READ_OWN,
    PERMISSIONS.AI_CHAT,
  ],
});

/**
 * In-memory cache populated from the RolePermission table at boot and
 * invalidated whenever an admin mutates grants. Falls back to defaults
 * if the cache is empty (e.g. before first DB seed).
 */
const cache = new Map(); // role -> Set<permission>

export function loadPermissionsIntoCache(rows) {
  cache.clear();
  for (const { role, permission } of rows) {
    if (!cache.has(role)) cache.set(role, new Set());
    cache.get(role).add(permission);
  }
}

export function invalidatePermissionCache() {
  cache.clear();
}

export function hasPermission(role, permission) {
  if (role === 'ADMIN') return true;
  const cached = cache.get(role);
  if (cached) return cached.has(permission);
  const defaults = DEFAULT_ROLE_PERMISSIONS[role];
  return Array.isArray(defaults) && defaults.includes(permission);
}
