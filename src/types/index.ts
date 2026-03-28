export type UserRole = 'INVESTOR' | 'FARMER' | 'CLUSTER_REP' | 'ADMIN';

export interface Cluster {
  id: string;
  name: string;
  location: string;
  region: string;
  memberCount: number;
  isVerified: boolean;
  size: number; // in hectares
  description?: string;
  establishedDate: string;
}

export interface Plot {
  id: string;
  clusterId: string;
  size: number;
  location: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  coordinates?: { lat: number; lng: number };
}

export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEGOTIATING';

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
  createdAt: string;
  documents: { name: string; size: string; type: string }[];
  terms: {
    interestRate: number;
    repaymentPeriod: string;
    collateral?: string;
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
  title: string;
  investorName: string;
  targetName: string;
  amount: number;
  status: AgreementStatus;
  createdAt: string;
  signedAt?: string;
  clauses: Clause[];
  terms: {
    interestRate: number;
    repaymentPeriod: string;
    collateral?: string;
  };
}

export type PaymentStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface Payment {
  id: string;
  agreementId: string;
  agreementTitle: string;
  amount: number;
  type: 'DISBURSEMENT' | 'REPAYMENT';
  status: PaymentStatus;
  date: string;
  submittedAt?: string;
  verifiedAt?: string;
  receiptUrl?: string;
  notes?: string;
  senderName: string;
  receiverName: string;
}

export interface Conversation {
  id: string;
  participants: { id: string; name: string; avatar?: string; role: UserRole }[];
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
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  meetingUrl?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
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

export type CropType = 'MAIZE' | 'SOYBEANS' | 'COCOA' | 'RICE' | 'CASSAVA' | 'OTHERS';

export interface Resource {
  id: string;
  title: string;
  category: 'INSURANCE' | 'LABOR' | 'SUPPORT';
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
