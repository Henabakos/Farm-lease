// Maps internal Prisma User rows to the snake_case shape the existing
// frontend expects (`full_name`, `avatar_url`, `verification_status`...).
//
// Keeping this translation at the boundary means the rest of the backend
// can use idiomatic camelCase without churn, and the frontend doesn't have
// to change its existing AuthContext / UI types.
export function toUserDto(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    status: user.status,
    avatar_url: user.avatarUrl ?? null,
    phone: user.phone ?? null,
    bio: user.bio ?? null,
    verification_status: mapVerificationStatus(user.verificationStatus),
    email_verified: !!user.emailVerifiedAt,
    created_at: user.createdAt?.toISOString?.() ?? user.createdAt,
  };
}

// The frontend types declare `verification_status: 'unverified'|'pending'|'verified'`
// (lowercase). Backend enum is uppercase. Map at the boundary.
function mapVerificationStatus(s) {
  if (!s) return 'unverified';
  return s.toLowerCase();
}

// ----------------------------------------------------------------------------
// Role normalization
// ----------------------------------------------------------------------------
// The frontend was originally written against Supabase-era roles
// (`owner|tenant|admin`). The user has chosen the canonical 4-role taxonomy
// (`ADMIN|INVESTOR|CLUSTER_REP|FARMER`) end-to-end. To keep the existing
// register flow working during the (brief) cutover window before the
// frontend AuthContext is patched, we accept BOTH casings and the legacy
// names, normalizing to the canonical enum on the way in.
//
// Once the frontend ships the role-cutover patch, the legacy branch can be
// removed.
const LEGACY_TO_CANONICAL = {
  owner:        'CLUSTER_REP',  // closest fit; investors must explicitly send INVESTOR
  tenant:       'FARMER',
  admin:        'ADMIN',
  investor:     'INVESTOR',
  farmer:       'FARMER',
  cluster_rep:  'CLUSTER_REP',
  clusterrep:   'CLUSTER_REP',
};

export function normalizeRole(input) {
  if (typeof input !== 'string') return null;
  const upper = input.trim().toUpperCase();
  if (['ADMIN', 'INVESTOR', 'CLUSTER_REP', 'FARMER'].includes(upper)) return upper;
  const legacy = LEGACY_TO_CANONICAL[input.trim().toLowerCase()];
  return legacy ?? null;
}
