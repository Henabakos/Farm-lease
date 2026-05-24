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
  const normalized = String(role).toUpperCase();
  if (normalized === 'INVESTOR' || normalized === 'FARMER' || normalized === 'CLUSTER_REP' || normalized === 'ADMIN') {
    return normalized as UserRole;
  }
  if (role in API_TO_UI_ROLE) return API_TO_UI_ROLE[role as ApiRole];
  return 'FARMER';
}

export function mapClusterFromApi(row: Record<string, unknown>): Cluster {
  const metadata = (row.metadata as Record<string, unknown>) || {};
  return {
    id: String(row.id),
    name: String(row.name),
    location: String(row.location),
    region: String(metadata.region || row.location || 'Unknown'),
    memberCount: Number(metadata.member_count ?? row.members_count ?? 0),
    isVerified: Boolean(row.has_verified_survey ?? metadata.is_verified ?? false),
    size: Number(row.area_hectares ?? 0),
    description: row.description ? String(row.description) : undefined,
    establishedDate: String(row.created_at ?? new Date().toISOString()),
    centerLatitude: row.center_latitude != null ? Number(row.center_latitude) : undefined,
    centerLongitude: row.center_longitude != null ? Number(row.center_longitude) : undefined,
  };
}

const PROPOSAL_STATUS_MAP: Record<string, ProposalStatus> = {
  draft: 'PENDING',
  published: 'PENDING',
  negotiating: 'NEGOTIATING',
  accepted: 'APPROVED',
  rejected: 'REJECTED',
  withdrawn: 'REJECTED',
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
  const documents = Array.isArray(row.documents) ? row.documents as Record<string, unknown>[] : [];
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
    version: Number(row.version ?? 0),
    // Raw backend status preserved so consumers can branch on draft/published/etc.
    apiStatus: rawStatus as Proposal['apiStatus'],
    createdAt: String(row.created_at ?? new Date().toISOString()),
    documents: documents.map((doc) => ({
      name: String(doc.file_name ?? doc.fileName ?? doc.storage_key ?? 'Document'),
      size: doc.file_size != null ? `${Math.ceil(Number(doc.file_size) / 1024)} KB` : '',
      type: String(doc.mime_type ?? doc.mimeType ?? 'application/octet-stream'),
    })),
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
  pending_signatures: 'PENDING',
  active: 'SIGNED',
  completed: 'SIGNED',
  terminated: 'REJECTED',
  disputed: 'REJECTED',
};

export function mapAgreementFromApi(row: Record<string, unknown>): Agreement {
  const rawStatus = String(row.status ?? 'draft').toLowerCase() as AgreementWorkflowStatus;
  const status = AGREEMENT_STATUS_MAP[rawStatus] || 'PENDING';
  const terms = (row.terms as Record<string, unknown>) || {};
  const clauses = Array.isArray(row.clauses) ? (row.clauses as Record<string, unknown>[]) : [];
  const signatures = Array.isArray(row.signatures) ? (row.signatures as Record<string, unknown>[]) : [];

  return {
    id: String(row.id),
    proposalId: String(row.proposal_id),
    clusterId: row.cluster_id ? String(row.cluster_id) : undefined,
    title: String(row.title || `Agreement ${String(row.id).slice(0, 8)}`),
    investorName: String(row.owner_name || 'Owner'),
    targetName: String(row.tenant_name || 'Tenant'),
    amount: Number(row.monthly_amount ?? row.total_amount ?? 0),
    status,
    apiStatus: rawStatus,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    signedAt: row.signed_at ? String(row.signed_at) : undefined,
    clauses: clauses.map((clause, index) => ({
      id: String(clause.id ?? `${row.id}-clause-${index}`),
      title: String(clause.title ?? 'Clause'),
      content: String(clause.content ?? clause.body ?? ''),
      isEditable: Boolean(clause.isEditable ?? clause.is_editable ?? false),
    })),
    signatures: signatures.map((signature, index) => ({
      id: String(signature.id ?? `${row.id}-signature-${index}`),
      signerId: String(signature.signer_id ?? signature.signerId ?? ''),
      method: String(signature.method ?? 'TYPED') as AgreementSignature['method'],
      signedAt: String(signature.signed_at ?? signature.signedAt ?? new Date().toISOString()),
    })),
    terms: {
      interestRate: Number(terms.interestRate ?? terms.interest_rate ?? 0),
      repaymentPeriod: String(terms.repaymentPeriod ?? terms.repayment_period ?? 'monthly'),
      collateral: terms.collateral ? String(terms.collateral) : undefined,
    },
    history: [],
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
