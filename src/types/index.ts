export type UserRole = "INVESTOR" | "FARMER" | "CLUSTER_REP" | "ADMIN";

export type ClusterStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ClusterVerificationStatus = "VERIFIED" | "UNVERIFIED" | "PENDING";

export interface Cluster {
    id: string;
    name: string;
    location: string;
    region: string;
    memberCount: number;
    isVerified: boolean;
    verificationStatus: ClusterVerificationStatus;
    size: number; // in hectares
    description?: string;
    establishedDate: string;
    centerLatitude?: number;
    centerLongitude?: number;
    status?: ClusterStatus;
    ownerId?: string;
    imageUrl?: string;
    updatedAt?: string;
}

export interface Plot {
    id: string;
    clusterId: string;
    size: number;
    location: string;
    status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
    coordinates?: { lat: number; lng: number };
    latitude?: number;
    longitude?: number;
}

export type ProposalStatus =
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "NEGOTIATING";

export interface Proposal {
  id: string;
  title: string;
  targetType: 'FARMER' | 'CLUSTER';
  targetId: string;
  targetName: string;
  description: string;
  budget: number;
  amount: number; // Added to match component usage
  location: string; // Added to match component usage
  roi: number; // Added to match component usage
  timeline: string;
  status: ProposalStatus;
  version?: number;
  // Raw backend FSM state — distinguishes draft from published from negotiating,
  // unlike the simplified UI `status` field. Used to decide which actions
  // (publish, accept, negotiate, ...) are valid in the current state.
  apiStatus?: 'draft' | 'published' | 'negotiating' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  createdAt: string;
  documents: {
    id?: string;
    name: string;
    size: string;
    type: string;
    storageKey?: string;
    mimeType?: string;
  }[];
  terms: {
    interestRate: number;
    repaymentPeriod: string;
    collateral?: string;
    cropType?: string;
    landArea?: number;
    landAreaUnit?: string;
    revenueShare?: number;
    expectedStartDate?: string;
  };
  history: {
    date: string;
    action: string;
    user: string;
    details?: string;
  }[];
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
    isSystem?: boolean; // Combined from both definitions
    attachments?: { name: string; type: string; size: string }[];
}

export type AgreementStatus = 'PENDING' | 'SIGNED' | 'REJECTED';
export type AgreementWorkflowStatus = 'DRAFT' | 'PENDING_SIGNATURES' | 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'DISPUTED';

export interface AgreementSignature {
  id: string;
  signerId: string;
  signerName?: string;
  signatureData?: string;
  method: 'DRAWN' | 'TYPED' | 'UPLOADED';
  signedAt: string;
}

export interface Clause {
    id: string;
    title: string;
    content: string;
    isEditable: boolean;
}

export interface Agreement {
  id: string;
  proposalId: string;
  farmerId?: string; // Added to match component usage
  clusterId?: string; // Added to match component usage
  lessorId?: string;
  lesseeId?: string;
  title: string;
  investorName: string;
  targetName: string;
  amount: number;
  status: AgreementStatus;
  apiStatus?: AgreementWorkflowStatus;
  createdAt: string;
  signedAt?: string;
  clauses: Clause[];
  signatures?: AgreementSignature[];
  terms: {
    interestRate: number;
    repaymentPeriod: string;
    collateral?: string;
    cropType?: string;
    landArea?: number;
    landAreaUnit?: string;
    revenueShare?: number;
    expectedStartDate?: string;
  };
  startDate?: string;
  endDate?: string;
  totalAmount?: number;
  currency?: string;
}

export type PaymentStatus =
    | "PENDING"
    | "SUBMITTED"
    | "VERIFIED"
    | "REJECTED"
    | "REFUNDED";
export type PaymentType = "DISBURSEMENT" | "REPAYMENT" | "FEE";

export interface Payment {
    id: string;
    agreementId: string;
    agreementTitle: string;
    amount: number;
    type: PaymentType;
    status: PaymentStatus;
    date: string;
    currency?: string;
    dueDate?: string;
    paidAt?: string;
    submittedAt?: string;
    verifiedAt?: string;
    receiptUrl?: string;
    receiptStorageKey?: string;
    receiptMimeType?: string;
    receiptFileSize?: number;
    receiptCount?: number;
    verificationDecision?: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED";
    notes?: string;
    senderName: string;
    receiverName: string;
}

export interface Conversation {
    id: string;
    participants: {
        id: string;
        name: string;
        avatar?: string;
        role: UserRole;
    }[];
    lastMessage?: Message;
    unreadCount: number;
}

export interface Meeting {
    id: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    participants: { id: string; name: string; role: UserRole }[];
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    meetingUrl?: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
    read: boolean;
    link?: string;
}

export interface Prediction {
    yield: number;
    roi: number;
    cost: number;
    confidence: number;
    risks: string[];
}

export interface AnalyticsData {
    month: string;
    roi: number;
    cost: number;
    yield: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    bio?: string;
    phone?: string;
    location?: string;
    joinedDate: string;
    clusters?: Cluster[];
}

export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    action: string;
    targetId?: string;
    targetType?: string;
    timestamp: string;
    details?: string;
    ipAddress?: string;
}

export type CropType =
    | "MAIZE"
    | "SOYBEANS"
    | "COCOA"
    | "RICE"
    | "CASSAVA"
    | "OTHERS";

export interface Resource {
    id: string;
    title: string;
    category: "INSURANCE" | "LABOR" | "SUPPORT";
    provider: string;
    description: string;
    priceRange?: string;
    rating: number;
    reviewCount: number;
    cropTypes: CropType[];
    imageUrl: string;
    contactEmail?: string;
    websiteUrl?: string;
}

export interface NavItem {
    title: string;
    href: string;
    icon: string;
    roles: UserRole[];
}
