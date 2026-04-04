import React, { useState } from 'react';
import { RoleProvider, useRole } from '@/src/contexts/RoleContext';
import { DashboardLayout } from '@/src/components/layout/DashboardLayout';
import { LoginPage } from '@/src/components/auth/LoginPage';
import { RegisterPage } from '@/src/components/auth/RegisterPage';
import { ProfilePage } from '@/src/components/profile/ProfilePage';
import { ClusterList } from '@/src/components/clusters/ClusterList';
import { ClusterDetail } from '@/src/components/clusters/ClusterDetail';
import { ProposalList } from '@/src/components/proposals/ProposalList';
import { ProposalCreate } from '@/src/components/proposals/ProposalCreate';
import { ProposalDetail } from '@/src/components/proposals/ProposalDetail';
import { NegotiationView } from '@/src/components/proposals/NegotiationView';
import { AgreementList } from '@/src/components/agreements/AgreementList';
import { AgreementDetail } from '@/src/components/agreements/AgreementDetail';
import { PaymentList } from '@/src/components/payments/PaymentList';
import { PaymentSubmit } from '@/src/components/payments/PaymentSubmit';
import { PaymentReview } from '@/src/components/payments/PaymentReview';
import { PaymentDetail } from '@/src/components/payments/PaymentDetail';
import { ConversationList } from '@/src/components/messaging/ConversationList';
import { ChatWindow } from '@/src/components/messaging/ChatWindow';
import { MeetingScheduler } from '@/src/components/meetings/MeetingScheduler';
import { AnalyticsDashboard } from '@/src/components/analytics/AnalyticsDashboard';
import { AIChatbot } from '@/src/components/ai/AIChatbot';
import { AdminDashboard } from '@/src/components/admin/AdminDashboard';
import { AuditLogs } from '@/src/components/admin/AuditLogs';
import { SettingsPage } from '@/src/components/profile/SettingsPage';
import { ResourceRecommendations } from '@/src/components/resources/ResourceRecommendations';
import { DashboardOverview } from '@/src/components/dashboard/DashboardOverview';
import { Cluster, Proposal, Agreement, Payment, Conversation, Message } from '@/src/types';

function AppContent() {
  const { isLoggedIn, user } = useRole();
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'PROFILE' | 'CLUSTERS' | 'PROPOSALS' | 'AGREEMENTS' | 'PAYMENTS' | 'MESSAGES' | 'MEETINGS' | 'ANALYTICS' | 'ADMIN_DASHBOARD' | 'AUDIT_LOGS' | 'RESOURCES' | 'SETTINGS'>('DASHBOARD');
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [proposalView, setProposalView] = useState<'LIST' | 'CREATE' | 'DETAIL' | 'NEGOTIATE'>('LIST');
  const [paymentView, setPaymentView] = useState<'LIST' | 'SUBMIT' | 'REVIEW' | 'DETAIL'>('LIST');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // Mock Conversations and Messages
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'c1',
      participants: [{ id: 'u2', name: 'Zaria Organic Growers', role: 'FARMER' }],
      unreadCount: 2,
      lastMessage: { id: 'm1', conversationId: 'c1', senderId: 'u2', senderName: 'Zaria Organic Growers', content: 'The irrigation system is working great!', timestamp: new Date().toISOString() }
    },
    {
      id: 'c2',
      participants: [{ id: 'u3', name: 'Sarah Miller', role: 'CLUSTER_REP' }],
      unreadCount: 0,
      lastMessage: { id: 'm2', conversationId: 'c2', senderId: 'u3', senderName: 'Sarah Miller', content: 'Let\'s discuss the next phase.', timestamp: new Date().toISOString() }
    }
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'c1': [
      { id: 'm0', conversationId: 'c1', senderId: 'u1', senderName: 'Alex Johnson', content: 'Hi, how is the project going?', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'm1', conversationId: 'c1', senderId: 'u2', senderName: 'Zaria Organic Growers', content: 'The irrigation system is working great!', timestamp: new Date().toISOString() }
    ],
    'c2': [
      { id: 'm2', conversationId: 'c2', senderId: 'u3', senderName: 'Sarah Miller', content: 'Let\'s discuss the next phase.', timestamp: new Date().toISOString() }
    ]
  });

  if (!isLoggedIn) {
    return authView === 'LOGIN' ? (
      <LoginPage onSwitch={() => setAuthView('REGISTER')} />
    ) : (
      <RegisterPage onSwitch={() => setAuthView('LOGIN')} />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'PROFILE':
        return <ProfilePage />;
      case 'CLUSTERS':
        return selectedCluster ? (
          <ClusterDetail cluster={selectedCluster} onBack={() => setSelectedCluster(null)} />
        ) : (
          <ClusterList onSelectCluster={(cluster) => setSelectedCluster(cluster)} />
        );
      case 'MEETINGS':
        return <MeetingScheduler />;
      case 'MESSAGES':
        return (
          <div className="flex h-[calc(100vh-120px)] -m-6 overflow-hidden">
            <div className="w-80 shrink-0">
              <ConversationList 
                conversations={conversations} 
                selectedId={selectedConversationId || undefined} 
                onSelect={(id) => setSelectedConversationId(id)} 
              />
            </div>
            <div className="flex-1">
              {selectedConversationId ? (
                <ChatWindow 
                  conversation={conversations.find(c => c.id === selectedConversationId)!} 
                  messages={messages[selectedConversationId] || []} 
                  onSendMessage={(content, attachments) => {
                    const newMsg: Message = {
                      id: Math.random().toString(36).substr(2, 9),
                      conversationId: selectedConversationId,
                      senderId: user.id,
                      senderName: user.name,
                      content,
                      timestamp: new Date().toISOString(),
                      attachments
                    };
                    setMessages({
                      ...messages,
                      [selectedConversationId]: [...(messages[selectedConversationId] || []), newMsg]
                    });
                  }} 
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-6 bg-card/10 backdrop-blur-sm">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Your Conversations</h2>
                    <p className="text-muted-foreground max-w-xs mx-auto">Select a conversation from the list to start messaging with your partners.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'PAYMENTS':
        switch (paymentView) {
          case 'SUBMIT':
            return selectedPayment ? (
              <PaymentSubmit 
                payment={selectedPayment} 
                onBack={() => setPaymentView('LIST')} 
                onSubmit={(id, receiptUrl, notes) => {
                  setSelectedPayment({ ...selectedPayment, status: 'SUBMITTED', receiptUrl, notes, submittedAt: new Date().toISOString() });
                  setPaymentView('LIST');
                }} 
              />
            ) : null;
          case 'REVIEW':
            return selectedPayment ? (
              <PaymentReview 
                payment={selectedPayment} 
                onBack={() => setPaymentView('LIST')} 
                onVerify={(id) => {
                  setSelectedPayment({ ...selectedPayment, status: 'VERIFIED', verifiedAt: new Date().toISOString() });
                  setPaymentView('LIST');
                }}
                onReject={(id, reason) => {
                  setSelectedPayment({ ...selectedPayment, status: 'REJECTED', notes: reason });
                  setPaymentView('LIST');
                }}
              />
            ) : null;
          case 'DETAIL':
            return selectedPayment ? (
              <PaymentDetail 
                payment={selectedPayment} 
                onBack={() => setPaymentView('LIST')} 
                onViewReceipt={(p) => {
                  setReceiptPayment(p);
                  setShowReceiptModal(true);
                }}
              />
            ) : null;
          case 'LIST':
          default:
            return (
              <PaymentList 
                onSelectPayment={(p) => { setSelectedPayment(p); setPaymentView('DETAIL'); }} 
                onSubmitPayment={(p) => { setSelectedPayment(p); setPaymentView('SUBMIT'); }}
                onReviewPayment={(p) => { setSelectedPayment(p); setPaymentView('REVIEW'); }}
                onViewReceipt={(p) => {
                  setReceiptPayment(p);
                  setShowReceiptModal(true);
                }}
              />
            );
        }
      case 'AGREEMENTS':
        return selectedAgreement ? (
          <AgreementDetail 
            agreement={selectedAgreement} 
            onBack={() => setSelectedAgreement(null)} 
            onSign={(id) => setSelectedAgreement({ ...selectedAgreement, status: 'SIGNED', signedAt: new Date().toISOString() })} 
          />
        ) : (
          <AgreementList onSelectAgreement={(agreement) => setSelectedAgreement(agreement)} />
        );
      case 'PROPOSALS':
        switch (proposalView) {
          case 'CREATE':
            return <ProposalCreate onBack={() => setProposalView('LIST')} onSubmit={() => setProposalView('LIST')} />;
          case 'DETAIL':
            return selectedProposal ? (
              <ProposalDetail 
                proposal={selectedProposal} 
                onBack={() => setProposalView('LIST')} 
                onNegotiate={() => setProposalView('NEGOTIATE')} 
              />
            ) : null;
          case 'NEGOTIATE':
            return selectedProposal ? (
              <NegotiationView 
                proposal={selectedProposal} 
                onBack={() => setProposalView('DETAIL')} 
                onUpdateProposal={(updated) => setSelectedProposal({ ...selectedProposal, ...updated })} 
              />
            ) : null;
          case 'LIST':
          default:
            return (
              <ProposalList 
                onSelectProposal={(p) => { setSelectedProposal(p); setProposalView('DETAIL'); }} 
                onCreateProposal={() => setProposalView('CREATE')} 
              />
            );
        }
      case 'ANALYTICS':
        return <AnalyticsDashboard />;
      case 'ADMIN_DASHBOARD':
        return <AdminDashboard />;
      case 'AUDIT_LOGS':
        return <AuditLogs />;
      case 'RESOURCES':
        return <ResourceRecommendations />;
      case 'SETTINGS':
        return <SettingsPage />;
      case 'DASHBOARD':
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout onNavigate={(view: any) => { setCurrentView(view); setSelectedCluster(null); setSelectedProposal(null); setSelectedAgreement(null); setSelectedPayment(null); setSelectedConversationId(null); setProposalView('LIST'); setPaymentView('LIST'); }}>
      {renderView()}
      <AIChatbot />
      <ReceiptModal 
        payment={receiptPayment} 
        open={showReceiptModal} 
        onOpenChange={setShowReceiptModal} 
      />
    </DashboardLayout>
  );
}

import { Toaster } from 'sonner';

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, Download, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <RoleProvider>
      <AppContent />
      <Toaster position="top-right" />
    </RoleProvider>
  );
}

function ReceiptModal({ 
  payment, 
  open, 
  onOpenChange 
}: { 
  payment: Payment | null, 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 overflow-hidden border-none bg-card/95 backdrop-blur-md">
        <DialogHeader className="p-6 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">Payment Receipt</DialogTitle>
              <DialogDescription>
                Receipt for {payment.agreementTitle} (${payment.amount.toLocaleString()})
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                <span>Download</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                <span>Open</span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 bg-muted/30 flex flex-col items-center justify-center p-12 space-y-6 overflow-y-auto">
          <div className="w-32 h-32 bg-primary/10 rounded-3xl flex items-center justify-center shadow-inner">
            <FileText className="w-16 h-16 text-primary" />
          </div>
          <div className="text-center space-y-4 max-w-md">
            <h3 className="text-xl font-bold">{payment.receiptUrl}</h3>
            <p className="text-muted-foreground leading-relaxed">
              This is a simulated preview of the payment receipt. In a live environment, this would display the actual PDF or image document uploaded by the sender.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="p-4 rounded-2xl bg-background/50 border border-border/50 text-left">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Transaction ID</p>
                <p className="text-xs font-mono mt-1">{payment.id.toUpperCase()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-background/50 border border-border/50 text-left">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Verified Date</p>
                <p className="text-xs mt-1">{payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleDateString() : 'Pending'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

