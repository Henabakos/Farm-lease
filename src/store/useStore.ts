import { create } from 'zustand';
import { 
  User, UserRole, Proposal, Cluster, Agreement, Payment, Message, AuditLog, Conversation, Notification, PaymentStatus, ProposalStatus
} from '@/src/types';

export type ViewType = 'DASHBOARD' | 'PROFILE' | 'CLUSTERS' | 'PROPOSALS' | 'AGREEMENTS' | 'PAYMENTS' | 'MESSAGES' | 'MEETINGS' | 'ANALYTICS' | 'ADMIN_DASHBOARD' | 'AUDIT_LOGS' | 'RESOURCES' | 'SETTINGS';
export type ProposalViewType = 'LIST' | 'CREATE' | 'DETAIL' | 'NEGOTIATE';
export type PaymentViewType = 'LIST' | 'SUBMIT' | 'REVIEW';

interface AppState {
  // Navigation
  currentView: ViewType;
  proposalView: ProposalViewType;
  paymentView: PaymentViewType;
  selectedCluster: Cluster | null;
  selectedProposal: Proposal | null;
  selectedAgreement: Agreement | null;
  selectedPayment: Payment | null;
  selectedConversationId: string | null;

  setCurrentView: (view: ViewType) => void;
  setProposalView: (view: ProposalViewType) => void;
  setPaymentView: (view: PaymentViewType) => void;
  setSelectedCluster: (cluster: Cluster | null) => void;
  setSelectedProposal: (proposal: Proposal | null) => void;
  setSelectedAgreement: (agreement: Agreement | null) => void;
  setSelectedPayment: (payment: Payment | null) => void;
  setSelectedConversationId: (id: string | null) => void;
  resetNavigation: () => void;

  // Auth
  user: User;
  isLoggedIn: boolean;
  setUser: (user: User) => void;
  setRole: (role: UserRole) => void;
  login: (role: UserRole) => void;
  logout: () => void;

  // Data
  proposals: Proposal[];
  clusters: Cluster[];
  agreements: Agreement[];
  payments: Payment[];
  messages: Message[];
  conversations: Conversation[];
  notifications: Notification[];
  auditLogs: AuditLog[];

  // Actions
  addProposal: (proposal: Proposal) => void;
  updateProposal: (id: string, updates: Partial<Proposal>) => void;
  deleteProposal: (id: string) => void;
  
  addCluster: (cluster: Cluster) => void;
  updateCluster: (id: string, updates: Partial<Cluster>) => void;
  verifyCluster: (id: string) => void;

  addAgreement: (agreement: Agreement) => void;
  updateAgreement: (id: string, updates: Partial<Agreement>) => void;
  signAgreement: (id: string) => void;

  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void; // Added
  verifyPayment: (id: string) => void;

  addMessage: (message: Message) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;

  // Proposal actions
  updateProposalStatus: (id: string, status: ProposalStatus) => void; // Added
  createAgreement: (proposal: Proposal) => void; // Added
}

const MOCK_USERS: Record<UserRole, User> = {
  INVESTOR: {
    id: 'u1',
    name: 'Alex Johnson',
    email: 'alex@invest.com',
    role: 'INVESTOR',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'Experienced agricultural investor focused on sustainable farming and high-yield crop production in West Africa.',
    phone: '+1 (555) 123-4567',
    location: 'New York, USA',
    joinedDate: '2024-01-15',
  },
  FARMER: {
    id: 'u2',
    name: 'Sarah Miller',
    email: 'sarah@farm.com',
    role: 'FARMER',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bio: 'Third-generation maize farmer passionate about organic practices and community development.',
    phone: '+234 801 234 5678',
    location: 'Kaduna, Nigeria',
    joinedDate: '2024-03-10',
    clusters: [
      { id: 'c1', name: 'Kaduna North Maize Cluster', location: 'Kaduna', region: 'North West', memberCount: 120, isVerified: true, size: 450, establishedDate: '2023-05-10' },
    ]
  },
  CLUSTER_REP: {
    id: 'u3',
    name: 'Robert Chen',
    email: 'robert@cluster.com',
    role: 'CLUSTER_REP',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    bio: 'Agricultural coordinator with 10 years of experience in managing large-scale farming clusters and supply chains.',
    phone: '+234 802 345 6789',
    location: 'Abuja, Nigeria',
    joinedDate: '2024-02-20',
  },
  ADMIN: {
    id: 'u4',
    name: 'Admin User',
    email: 'admin@agriinvest.com',
    role: 'ADMIN',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    bio: 'Platform administrator responsible for system oversight and user management.',
    phone: '+1 (555) 987-6543',
    location: 'Remote',
    joinedDate: '2023-12-01',
  }
};

export const useStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'DASHBOARD',
  proposalView: 'LIST',
  paymentView: 'LIST',
  selectedCluster: null,
  selectedProposal: null,
  selectedAgreement: null,
  selectedPayment: null,
  selectedConversationId: null,

  setCurrentView: (view) => set({ currentView: view }),
  setProposalView: (view) => set({ proposalView: view }),
  setPaymentView: (view) => set({ paymentView: view }),
  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  setSelectedProposal: (proposal) => set({ selectedProposal: proposal }),
  setSelectedAgreement: (agreement) => set({ selectedAgreement: agreement }),
  setSelectedPayment: (payment) => set({ selectedPayment: payment }),
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  resetNavigation: () => set({
    currentView: 'DASHBOARD',
    proposalView: 'LIST',
    paymentView: 'LIST',
    selectedCluster: null,
    selectedProposal: null,
    selectedAgreement: null,
    selectedPayment: null,
    selectedConversationId: null,
  }),

  // Auth
  user: MOCK_USERS.INVESTOR,
  isLoggedIn: true,
  setUser: (user) => set((state) => ({ 
    user,
    auditLogs: [{
      id: Math.random().toString(36).substr(2, 9),
      userId: state.user.id,
      userName: state.user.name,
      userRole: state.user.role,
      action: 'Updated Profile',
      targetId: user.id,
      targetType: 'USER',
      timestamp: new Date().toISOString(),
      details: 'User profile information updated.'
    }, ...state.auditLogs]
  })),
  setRole: (role) => set({ user: MOCK_USERS[role] }),
  login: (role) => set({ user: MOCK_USERS[role], isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),

  // Data
  proposals: [
    {
      id: 'p1',
      title: 'Maize Expansion Project 2024',
      targetType: 'CLUSTER',
      targetId: 'c1',
      targetName: 'Kaduna North Maize Cluster',
      description: 'Funding for irrigation systems and high-yield seeds for 100 hectares of maize production.',
      budget: 50000,
      amount: 50000,
      location: 'Kaduna, Nigeria',
      roi: 22,
      timeline: '12 Months',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      documents: [{ name: 'project_plan.pdf', size: '1.2MB', type: 'application/pdf' }],
      terms: { interestRate: 5, repaymentPeriod: '12 Months', collateral: 'Farm Equipment' },
      history: [{ date: new Date().toISOString(), action: 'Submitted', user: 'Alex Johnson' }]
    }
  ],
  clusters: [
    { id: 'c1', name: 'Kaduna North Maize Cluster', location: 'Kaduna', region: 'North West', memberCount: 120, isVerified: true, size: 450, establishedDate: '2023-05-10' },
    { id: 'c2', name: 'Organic Growers Association', location: 'Zaria', region: 'North West', memberCount: 45, isVerified: false, size: 120, establishedDate: '2023-08-22' },
  ],
  agreements: [],
  payments: [],
  messages: [
    { id: 'm1', conversationId: 'c1', senderId: 'u1', senderName: 'Alex Johnson', content: 'Hi, how is the project going?', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'm2', conversationId: 'c1', senderId: 'u2', senderName: 'Zaria Organic Growers', content: 'The irrigation system is working great!', timestamp: new Date().toISOString() },
    { id: 'm3', conversationId: 'c2', senderId: 'u3', senderName: 'Sarah Miller', content: 'Let\'s discuss the next phase.', timestamp: new Date().toISOString() }
  ],
  conversations: [
    {
      id: 'c1',
      participants: [{ id: 'u2', name: 'Zaria Organic Growers', role: 'FARMER' }],
      unreadCount: 2,
      lastMessage: { id: 'm2', conversationId: 'c1', senderId: 'u2', senderName: 'Zaria Organic Growers', content: 'The irrigation system is working great!', timestamp: new Date().toISOString() }
    },
    {
      id: 'c2',
      participants: [{ id: 'u3', name: 'Sarah Miller', role: 'CLUSTER_REP' }],
      unreadCount: 0,
      lastMessage: { id: 'm3', conversationId: 'c2', senderId: 'u3', senderName: 'Sarah Miller', content: 'Let\'s discuss the next phase.', timestamp: new Date().toISOString() }
    }
  ],
  notifications: [
    { id: 'n1', title: 'Welcome to AgriInvest', message: 'Start exploring agricultural opportunities today.', timestamp: new Date().toISOString(), type: 'INFO', read: false }
  ],
  auditLogs: [],

  // Actions
  addProposal: (proposal) => set((state) => ({ 
    proposals: [proposal, ...state.proposals],
    auditLogs: [{
      id: Math.random().toString(36).substr(2, 9),
      userId: state.user.id,
      userName: state.user.name,
      userRole: state.user.role,
      action: 'Created Proposal',
      targetId: proposal.id,
      targetType: 'PROPOSAL',
      timestamp: new Date().toISOString(),
      details: `Proposal "${proposal.title}" created.`
    }, ...state.auditLogs]
  })),
  updateProposal: (id, updates) => set((state) => {
    const proposal = state.proposals.find(p => p.id === id);
    return {
      proposals: state.proposals.map(p => p.id === id ? { ...p, ...updates } : p),
      auditLogs: [{
        id: Math.random().toString(36).substr(2, 9),
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        action: 'Updated Proposal',
        targetId: id,
        targetType: 'PROPOSAL',
        timestamp: new Date().toISOString(),
        details: `Proposal "${proposal?.title || id}" updated.`
      }, ...state.auditLogs]
    };
  }),
  deleteProposal: (id) => set((state) => {
    const proposal = state.proposals.find(p => p.id === id);
    return {
      proposals: state.proposals.filter(p => p.id !== id),
      auditLogs: [{
        id: Math.random().toString(36).substr(2, 9),
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        action: 'Deleted Proposal',
        targetId: id,
        targetType: 'PROPOSAL',
        timestamp: new Date().toISOString(),
        details: `Proposal "${proposal?.title || id}" deleted.`
      }, ...state.auditLogs]
    };
  }),

  addCluster: (cluster) => set((state) => ({ 
    clusters: [cluster, ...state.clusters],
    auditLogs: [{
      id: Math.random().toString(36).substr(2, 9),
      userId: state.user.id,
      userName: state.user.name,
      userRole: state.user.role,
      action: 'Created Cluster',
      targetId: cluster.id,
      targetType: 'CLUSTER',
      timestamp: new Date().toISOString(),
      details: `Cluster "${cluster.name}" created.`
    }, ...state.auditLogs]
  })),
  updateCluster: (id, updates) => set((state) => {
    const cluster = state.clusters.find(c => c.id === id);
    return {
      clusters: state.clusters.map(c => c.id === id ? { ...c, ...updates } : c),
      auditLogs: [{
        id: Math.random().toString(36).substr(2, 9),
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        action: 'Updated Cluster',
        targetId: id,
        targetType: 'CLUSTER',
        timestamp: new Date().toISOString(),
        details: `Cluster "${cluster?.name || id}" updated.`
      }, ...state.auditLogs]
    };
  }),
  verifyCluster: (id) => set((state) => {
    const cluster = state.clusters.find(c => c.id === id);
    return {
      clusters: state.clusters.map(c => c.id === id ? { ...c, isVerified: true } : c),
      auditLogs: [{
        id: Math.random().toString(36).substr(2, 9),
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        action: 'Verified Cluster',
        targetId: id,
        targetType: 'CLUSTER',
        timestamp: new Date().toISOString(),
        details: `Cluster "${cluster?.name || id}" verified.`
      }, ...state.auditLogs]
    };
  }),

  addAgreement: (agreement) => set((state) => ({ 
    agreements: [agreement, ...state.agreements],
    auditLogs: [{
      id: Math.random().toString(36).substr(2, 9),
      userId: state.user.id,
      userName: state.user.name,
      userRole: state.user.role,
      action: 'Created Agreement',
      targetId: agreement.id,
      targetType: 'AGREEMENT',
      timestamp: new Date().toISOString(),
      details: `Agreement "${agreement.title}" created.`
    }, ...state.auditLogs]
  })),
  updateAgreement: (id, updates) => set((state) => ({
    agreements: state.agreements.map(a => a.id === id ? { ...a, ...updates } : a)
  })),
  signAgreement: (id) => set((state) => {
    const agreement = state.agreements.find(a => a.id === id);
    return {
      agreements: state.agreements.map(a => a.id === id ? { ...a, status: 'SIGNED', signedAt: new Date().toISOString() } : a),
      auditLogs: [{
        id: Math.random().toString(36).substr(2, 9),
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        action: 'Signed Agreement',
        targetId: id,
        targetType: 'AGREEMENT',
        timestamp: new Date().toISOString(),
        details: `Agreement "${agreement?.title || id}" signed.`
      }, ...state.auditLogs]
    };
  }),

  addPayment: (payment) => set((state) => ({ 
    payments: [payment, ...state.payments],
    auditLogs: [{
      id: Math.random().toString(36).substr(2, 9),
      userId: state.user.id,
      userName: state.user.name,
      userRole: state.user.role,
      action: 'Submitted Payment',
      targetId: payment.id,
      targetType: 'PAYMENT',
      timestamp: new Date().toISOString(),
      details: `Payment of $${payment.amount} submitted.`
    }, ...state.auditLogs]
  })),
  updatePayment: (id, updates) => set((state) => ({
    payments: state.payments.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  updatePaymentStatus: (id, status) => set((state) => {
    const payment = state.payments.find(p => p.id === id);
    return {
      payments: state.payments.map(p => p.id === id ? { ...p, status } : p),
      auditLogs: [{
        id: Math.random().toString(36).substr(2, 9),
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        action: 'Updated Payment Status',
        targetId: id,
        targetType: 'PAYMENT',
        timestamp: new Date().toISOString(),
        details: `Payment status updated to ${status}.`
      }, ...state.auditLogs]
    };
  }),
  verifyPayment: (id) => set((state) => {
    const payment = state.payments.find(p => p.id === id);
    return {
      payments: state.payments.map(p => p.id === id ? { ...p, status: 'VERIFIED', verifiedAt: new Date().toISOString() } : p),
      auditLogs: [{
        id: Math.random().toString(36).substr(2, 9),
        userId: state.user.id,
        userName: state.user.name,
        userRole: state.user.role,
        action: 'Verified Payment',
        targetId: id,
        targetType: 'PAYMENT',
        timestamp: new Date().toISOString(),
        details: `Payment verified.`
      }, ...state.auditLogs]
    };
  }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  addAuditLog: (log) => set((state) => ({
    auditLogs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() }, ...state.auditLogs]
  })),

  updateProposalStatus: (id, status) => set((state) => ({
    proposals: state.proposals.map(p => p.id === id ? { ...p, status } : p)
  })),

  createAgreement: (proposal) => set((state) => {
    const newAgreement: Agreement = {
      id: `a-${Math.random().toString(36).substr(2, 9)}`,
      proposalId: proposal.id,
      title: proposal.title,
      investorName: state.user.name,
      targetName: proposal.targetName,
      amount: proposal.amount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      clauses: [
        { id: 'c1', title: 'Interest Rate', content: `The interest rate shall be ${proposal.terms.interestRate}% per annum.`, isEditable: false },
        { id: 'c2', title: 'Repayment Period', content: `The repayment period shall be ${proposal.terms.repaymentPeriod}.`, isEditable: false },
        { id: 'c3', title: 'Collateral', content: `The collateral for this agreement is ${proposal.terms.collateral || 'None'}.`, isEditable: false }
      ],
      terms: { ...proposal.terms }
    };
    return { agreements: [newAgreement, ...state.agreements] };
  })
}));
