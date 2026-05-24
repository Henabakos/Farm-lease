import type {
    Cluster,
    Proposal,
    Agreement,
    Payment,
    UserRole,
    ProposalStatus,
    AgreementStatus,
    PaymentStatus,
    AgreementWorkflowStatus,
    AgreementSignature,
} from "@/src/types";

export type ApiRole = "owner" | "tenant" | "admin";

const UI_TO_API_ROLE: Record<UserRole, ApiRole> = {
    INVESTOR: "owner",
    FARMER: "tenant",
    CLUSTER_REP: "owner",
    ADMIN: "admin",
};

const API_TO_UI_ROLE: Record<ApiRole, UserRole> = {
    owner: "CLUSTER_REP",
    tenant: "FARMER",
    admin: "ADMIN",
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
    const metadataVerified = ["true", "1", "t", "yes"].includes(
        String(metadata.is_verified ?? metadata.isVerified ?? "").toLowerCase(),
    );
    const isVerified = Boolean(row.has_verified_survey) || metadataVerified;
    const rawVerification = String(
        metadata.verification_status ?? row.verification_status ?? "",
    ).toUpperCase();
    const verificationStatus =
        isVerified || rawVerification === "VERIFIED"
            ? "VERIFIED"
            : rawVerification === "PENDING"
              ? "PENDING"
              : "UNVERIFIED";
    return {
        id: String(row.id),
        name: String(row.name),
        location: String(row.location),
        region: String(
            row.region ?? metadata.region ?? row.location ?? "Unknown",
        ),
        memberCount: Number(metadata.member_count ?? row.members_count ?? 0),
        isVerified: verificationStatus === "VERIFIED",
        verificationStatus,
        size: Number(row.area_hectares ?? 0),
        description: row.description ? String(row.description) : undefined,
        establishedDate: String(row.created_at ?? new Date().toISOString()),
        centerLatitude:
            row.center_latitude != null
                ? Number(row.center_latitude)
                : undefined,
        centerLongitude:
            row.center_longitude != null
                ? Number(row.center_longitude)
                : undefined,
        status: row.status
            ? (String(row.status) as Cluster["status"])
            : "ACTIVE",
        ownerId: row.owner_id ? String(row.owner_id) : undefined,
        imageUrl: row.image_url ? String(row.image_url) : undefined,
        updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    };
}

const PROPOSAL_STATUS_MAP: Record<string, ProposalStatus> = {
    draft: "PENDING",
    published: "PENDING",
    negotiating: "NEGOTIATING",
    accepted: "APPROVED",
    rejected: "REJECTED",
    expired: "REJECTED",
};

export function mapProposalFromApi(row: Record<string, unknown>): Proposal {
    const rawStatus = String(row.status ?? "draft").toLowerCase();
    const status = PROPOSAL_STATUS_MAP[rawStatus] || "PENDING";
    // Server now distinguishes CLUSTER vs FARMER target types — surface the real
    // value so the UI can render the right target label, not always "Cluster".
    const targetType = (
        String(row.target_type ?? "CLUSTER").toUpperCase() === "FARMER"
            ? "FARMER"
            : "CLUSTER"
    ) as "FARMER" | "CLUSTER";
    const targetName =
        targetType === "FARMER"
            ? String(row.target_user_name ?? row.target_user_id ?? "Farmer")
            : String(row.cluster_name ?? row.cluster_id ?? "Cluster");
    const targetId =
        targetType === "FARMER"
            ? String(row.target_user_id ?? "")
            : String(row.cluster_id ?? "");
    const terms = (row.terms as Record<string, unknown>) || {};
    return {
        id: String(row.id),
        title: String(row.title),
        targetType,
        targetId,
        targetName,
        description: String(row.description || ""),
        budget: Number(row.proposed_price ?? 0),
        amount: Number(row.proposed_price ?? 0),
        location: String(row.location || ""),
        roi: Number(row.roi ?? terms.roi ?? 0),
        timeline: row.lease_term_months
            ? `${row.lease_term_months} months`
            : "TBD",
        status,
        // Raw backend status preserved so consumers can branch on draft/published/etc.
        apiStatus: rawStatus as Proposal["apiStatus"],
        createdAt: String(row.created_at ?? new Date().toISOString()),
        documents: [],
        terms: {
            interestRate: Number(
                terms.interestRate ?? terms.interest_rate ?? 0,
            ),
            repaymentPeriod: String(
                terms.repaymentPeriod ?? terms.repayment_period ?? "Monthly",
            ),
            collateral: terms.collateral ? String(terms.collateral) : undefined,
        },
        history: [],
    };
}

const AGREEMENT_STATUS_MAP: Record<string, AgreementStatus> = {
    draft: "PENDING",
    pending_signatures: "PENDING",
    active: "SIGNED",
    completed: "SIGNED",
    terminated: "REJECTED",
    disputed: "REJECTED",
};

export function mapAgreementFromApi(row: Record<string, unknown>): Agreement {
    const rawStatus = String(row.status ?? "draft").toLowerCase() as AgreementWorkflowStatus;
    const status = AGREEMENT_STATUS_MAP[rawStatus] || "PENDING";
    const terms = (row.terms as Record<string, unknown>) || {};
    const clauses = Array.isArray(row.clauses) ? (row.clauses as Record<string, unknown>[]) : [];
    const signatures = Array.isArray(row.signatures) ? (row.signatures as Record<string, unknown>[]) : [];

    return {
        id: String(row.id),
        proposalId: String(row.proposal_id),
        clusterId: row.cluster_id ? String(row.cluster_id) : undefined,
        title: String(row.title || `Agreement ${String(row.id).slice(0, 8)}`),
        investorName: String(row.owner_name || "Owner"),
        targetName: String(row.tenant_name || "Tenant"),
        amount: Number(row.monthly_amount ?? row.total_amount ?? 0),
        status,
        apiStatus: rawStatus.toUpperCase() as AgreementWorkflowStatus,
        createdAt: String(row.created_at ?? new Date().toISOString()),
        signedAt: row.signed_at ? String(row.signed_at) : undefined,
        clauses: clauses.map((clause, index) => ({
            id: String(clause.id ?? `${row.id}-clause-${index}`),
            title: String(clause.title ?? "Clause"),
            content: String(clause.content ?? clause.body ?? ""),
            isEditable: Boolean(clause.isEditable ?? clause.is_editable ?? false),
        })),
        signatures: signatures.map((signature, index) => ({
            id: String(signature.id ?? `${row.id}-signature-${index}`),
            signerId: String(signature.signer_id ?? signature.signerId ?? ""),
            method: String(signature.method ?? "TYPED") as AgreementSignature["method"],
            signedAt: String(signature.signed_at ?? signature.signedAt ?? new Date().toISOString()),
        })),
        terms: {
            interestRate: Number(terms.interestRate ?? terms.interest_rate ?? 0),
            repaymentPeriod: String(terms.repaymentPeriod ?? terms.repayment_period ?? row.payment_frequency ?? "monthly"),
            collateral: terms.collateral ? String(terms.collateral) : undefined,
        },
    };
}

const PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
    pending: "PENDING",
    processing: "SUBMITTED",
    submitted: "SUBMITTED",
    completed: "VERIFIED",
    failed: "REJECTED",
    refunded: "REFUNDED",
    verified: "VERIFIED",
    rejected: "REJECTED",
    under_review: "SUBMITTED",
};

const PAYMENT_TYPE_MAP: Record<string, Payment["type"]> = {
    disbursement: "DISBURSEMENT",
    repayment: "REPAYMENT",
    fee: "FEE",
};

export function mapPaymentFromApi(row: Record<string, unknown>): Payment {
    const status = PAYMENT_STATUS_MAP[String(row.status)] || "PENDING";
    const verification = row.verification as
        | Record<string, unknown>
        | undefined;
    const agreement = row.agreement as Record<string, unknown> | undefined;
    const verificationDecision = String(
        row.verification_decision ??
            row.decision ??
            verification?.decision ??
            "PENDING",
    ).toUpperCase() as Payment["verificationDecision"];
    const receipts = Array.isArray(row.receipts)
        ? (row.receipts as Record<string, unknown>[])
        : [];
    const latestReceipt = receipts[0];
    const rawType = String(
        row.type ?? row.payment_type ?? "repayment",
    ).toLowerCase();
    const currency = String(row.currency ?? "USD");
    const dueDate = row.due_date ?? row.dueDate;
    const paidAt = row.paid_at ?? row.paidAt;
    const agreementId = String(row.agreement_id ?? row.agreementId ?? "");
    const senderName = String(
        row.payer_name ?? row.sender_name ?? row.senderName ?? "Payer",
    );
    const receiverName = String(
        row.receiver_name ?? row.receiverName ?? "Receiver",
    );
    return {
        id: String(row.id),
        agreementId,
        agreementTitle: String(
            row.agreement_title ||
                agreement?.title ||
                `Agreement ${agreementId.slice(0, 8)}`,
        ),
        amount: Number(row.amount ?? 0),
        type: PAYMENT_TYPE_MAP[rawType] || "REPAYMENT",
        status,
        date: String(
            dueDate ||
                row.created_at ||
                row.createdAt ||
                new Date().toISOString(),
        ),
        currency,
        dueDate: dueDate ? String(dueDate) : undefined,
        paidAt: paidAt ? String(paidAt) : undefined,
        submittedAt: row.submitted_at
            ? String(row.submitted_at)
            : row.paid_at
              ? String(row.paid_at)
              : undefined,
        verifiedAt:
            row.status === "completed" ||
            row.status === "verified" ||
            row.status === "VERIFIED"
                ? String(
                      row.paid_at ||
                          row.paidAt ||
                          row.updated_at ||
                          row.updatedAt,
                  )
                : undefined,
        receiptUrl:
            String(row.receipt_url ?? "") ||
            String(
                (latestReceipt?.file_name ?? latestReceipt?.storage_key) || "",
            ) ||
            undefined,
        receiptStorageKey: latestReceipt?.storage_key
            ? String(latestReceipt.storage_key)
            : row.receipt_storage_key
              ? String(row.receipt_storage_key)
              : undefined,
        receiptMimeType: latestReceipt?.mime_type
            ? String(latestReceipt.mime_type)
            : row.receipt_mime_type
              ? String(row.receipt_mime_type)
              : undefined,
        receiptFileSize: latestReceipt?.file_size
            ? Number(latestReceipt.file_size)
            : row.receipt_file_size
              ? Number(row.receipt_file_size)
              : undefined,
        receiptCount:
            receipts.length || Number(row.receipt_count ?? 0) || undefined,
        verificationDecision,
        senderName,
        receiverName,
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

export function mapAuditLogFromApi(row: Record<string, unknown>) {
    const user = row.user as Record<string, unknown> | undefined;
    const changes = row.changes as Record<string, unknown> | undefined;

    // Format changes into a human-readable summary
    let details = '';
    if (changes && typeof changes === 'object') {
        const entries = Object.entries(changes);
        if (entries.length > 0) {
            details = entries
                .map(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        return `${key}: ${JSON.stringify(value)}`;
                    }
                    return `${key}: ${String(value)}`;
                })
                .join(', ');
        }
    }

    return {
        id: String(row.id),
        userId: user?.id ? String(user.id) : row.userId ? String(row.userId) : '',
        userName: user?.fullName ? String(user.fullName) : 'System',
        userRole: user?.role ? apiRoleToUi(String(user.role)) : 'ADMIN',
        action: String(row.action),
        targetType: row.entityType ? String(row.entityType) : undefined,
        targetId: row.entityId ? String(row.entityId) : undefined,
        timestamp: String(row.createdAt),
        details: details || undefined,
        ipAddress: row.ipAddress ? String(row.ipAddress) : undefined,
    };
}
