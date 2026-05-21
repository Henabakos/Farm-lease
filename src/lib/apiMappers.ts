import type {
  Cluster,
  Proposal,
  Agreement,
  Payment,
  UserRole,
  ProposalStatus,
  AgreementStatus,
  PaymentStatus,
} from '@/src/types';

export type ApiRole = 'owner' | 'tenant' | 'admin';

const UI_TO_API_ROLE: Record<UserRole, ApiRole> = {
  INVESTOR: 'owner',
  FARMER: 'tenant',
  CLUSTER_REP: 'owner',
  ADMIN: 'admin',
};

const API_TO_UI_ROLE: Record<ApiRole, UserRole> = {
  owner: 'CLUSTER_REP',
  tenant: 'FARMER',
  admin: 'ADMIN',
};

export function uiRoleToApi(role: UserRole): ApiRole {
  return UI_TO_API_ROLE[role];
}

export function apiRoleToUi(role: ApiRole | string): UserRole {
  if (role in API_TO_UI_ROLE) return API_TO_UI_ROLE[role as ApiRole];
  return 'FARMER';
}

export function mapClusterFromApi(row: Record<string, unknown>): Cluster {
  const metadata = (row.metadata as Record<string, unknown>) || {};
  const isVerified = Boolean(row.has_verified_survey ?? metadata.is_verified ?? false);
  const rawVerification = String(metadata.verification_status ?? row.verification_status ?? '').toUpperCase();
  const verificationStatus =
    isVerified || rawVerification === 'VERIFIED'
      ? 'VERIFIED'
      : rawVerification === 'PENDING'
        ? 'PENDING'
        : 'UNVERIFIED';
  return {
    id: String(row.id),
    name: String(row.name),
    location: String(row.location),
    region: String(row.region ?? metadata.region ?? row.location ?? 'Unknown'),
    memberCount: Number(metadata.member_count ?? row.members_count ?? 0),
    isVerified: verificationStatus === 'VERIFIED',
    verificationStatus,
    size: Number(row.area_hectares ?? 0),
    description: row.description ? String(row.description) : undefined,
    establishedDate: String(row.created_at ?? new Date().toISOString()),
    centerLatitude: row.center_latitude != null ? Number(row.center_latitude) : undefined,
    centerLongitude: row.center_longitude != null ? Number(row.center_longitude) : undefined,
    status: row.status ? (String(row.status) as Cluster['status']) : 'ACTIVE',
    ownerId: row.owner_id ? String(row.owner_id) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

const PROPOSAL_STATUS_MAP: Record<string, ProposalStatus> = {
  draft: 'PENDING',
  published: 'PENDING',
  negotiating: 'NEGOTIATING',
  accepted: 'APPROVED',
  rejected: 'REJECTED',
  expired: 'REJECTED',
};

export function mapProposalFromApi(row: Record<string, unknown>): Proposal {
  const rawStatus = String(row.status ?? 'draft').toLowerCase();
  const status = PROPOSAL_STATUS_MAP[rawStatus] || 'PENDING';
  // Server now distinguishes CLUSTER vs FARMER target types — surface the real
  // value so the UI can render the right target label, not always "Cluster".
  const targetType = (String(row.target_type ?? 'CLUSTER').toUpperCase() === 'FARMER' ? 'FARMER' : 'CLUSTER') as 'FARMER' | 'CLUSTER';
  const targetName = targetType === 'FARMER'
    ? String(row.target_user_name ?? row.target_user_id ?? 'Farmer')
    : String(row.cluster_name ?? row.cluster_id ?? 'Cluster');
  const targetId = targetType === 'FARMER'
    ? String(row.target_user_id ?? '')
    : String(row.cluster_id ?? '');
  const terms = (row.terms as Record<string, unknown>) || {};
  return {
    id: String(row.id),
    title: String(row.title),
    targetType,
    targetId,
    targetName,
    description: String(row.description || ''),
    budget: Number(row.proposed_price ?? 0),
    amount: Number(row.proposed_price ?? 0),
    location: String(row.location || ''),
    roi: Number(row.roi ?? terms.roi ?? 0),
    timeline: row.lease_term_months
      ? `${row.lease_term_months} months`
      : 'TBD',
    status,
    // Raw backend status preserved so consumers can branch on draft/published/etc.
    apiStatus: rawStatus as Proposal['apiStatus'],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    documents: [],
    terms: {
      interestRate: Number(terms.interestRate ?? terms.interest_rate ?? 0),
      repaymentPeriod: String(terms.repaymentPeriod ?? terms.repayment_period ?? 'Monthly'),
      collateral: terms.collateral ? String(terms.collateral) : undefined,
    },
    history: [],
  };
}

const AGREEMENT_STATUS_MAP: Record<string, AgreementStatus> = {
  draft: 'PENDING',
  active: 'SIGNED',
  completed: 'SIGNED',
  terminated: 'REJECTED',
  disputed: 'REJECTED',
};

export function mapAgreementFromApi(row: Record<string, unknown>): Agreement {
  const status = AGREEMENT_STATUS_MAP[String(row.status)] || 'PENDING';
  const terms = (row.terms as Record<string, unknown>) || {};
  return {
    id: String(row.id),
    proposalId: String(row.proposal_id),
    clusterId: row.cluster_id ? String(row.cluster_id) : undefined,
    title: String(row.title || `Agreement ${String(row.id).slice(0, 8)}`),
    investorName: String(row.owner_name || 'Owner'),
    targetName: String(row.tenant_name || 'Tenant'),
    amount: Number(row.monthly_amount ?? row.total_amount ?? 0),
    status,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    signedAt: row.signed_at ? String(row.signed_at) : undefined,
    clauses: [],
    terms: {
      interestRate: Number(terms.interest_rate ?? 0),
      repaymentPeriod: String(row.payment_frequency || 'monthly'),
    },
  };
}

const PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  pending: 'PENDING',
  processing: 'SUBMITTED',
  completed: 'VERIFIED',
  failed: 'REJECTED',
  refunded: 'REJECTED',
  verified: 'VERIFIED',
};

export function mapPaymentFromApi(row: Record<string, unknown>): Payment {
  const status = PAYMENT_STATUS_MAP[String(row.status)] || 'PENDING';
  return {
    id: String(row.id),
    agreementId: String(row.agreement_id),
    agreementTitle: String(row.agreement_title || `Agreement ${String(row.agreement_id).slice(0, 8)}`),
    amount: Number(row.amount ?? 0),
    type: 'DISBURSEMENT',
    status,
    date: String(row.due_date || row.created_at || new Date().toISOString()),
    submittedAt: row.paid_at ? String(row.paid_at) : undefined,
    verifiedAt: row.status === 'completed' || row.status === 'verified' ? String(row.paid_at || row.updated_at) : undefined,
    senderName: String(row.payer_name || 'Payer'),
    receiverName: String(row.receiver_name || 'Receiver'),
    notes: row.notes ? String(row.notes) : undefined,
  };
}

export function mapClusterToApi(data: Partial<Cluster>) {
  return {
    name: data.name,
    location: data.location,
    area_hectares: data.size,
    description: data.description,
    metadata: {
      region: data.region,
      is_verified: data.isVerified,
      member_count: data.memberCount,
    },
  };
}
