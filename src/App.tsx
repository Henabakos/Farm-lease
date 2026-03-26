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
import { ConversationList } from '@/src/components/messaging/ConversationList';
import { ChatWindow } from '@/src/components/messaging/ChatWindow';
import { MeetingScheduler } from '@/src/components/meetings/MeetingScheduler';
import { AnalyticsDashboard } from '@/src/components/analytics/AnalyticsDashboard';
import { AIChatbot } from '@/src/components/ai/AIChatbot';
import { AdminDashboard } from '@/src/components/admin/AdminDashboard';
import { AuditLogs } from '@/src/components/admin/AuditLogs';
import { ResourceRecommendations } from '@/src/components/resources/ResourceRecommendations';
import { Cluster, Proposal, Agreement, Payment, Conversation, Message } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Sprout, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function DashboardOverview() {
  const { user } = useRole();

  const stats = [
    { title: 'Total Portfolio', value: '$124,500.00', change: '+12.5%', icon: Wallet, color: 'text-primary' },
    { title: 'Active Investments', value: '12', change: '+2', icon: TrendingUp, color: 'text-blue-500' },
    { title: 'Farms Supported', value: '45', change: '+5', icon: Sprout, color: 'text-green-500' },
    { title: 'Yield Rate', value: '18.4%', change: '+1.2%', icon: ArrowUpRight, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your agricultural portfolio today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            <span>Last 30 Days</span>
          </Button>
          <Button className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>New Investment</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={stat.color}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none font-medium">
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>High-yield agricultural opportunities matching your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                    <img 
                      src={`https://picsum.photos/seed/farm${i}/200/200`} 
                      alt="Farm" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground truncate">Green Valley Organic Maize</h4>
                      <Badge variant="outline" className="text-xs">Active</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>Kaduna, Nigeria</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>22% ROI</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold">$12,000</p>
                    <p className="text-xs text-muted-foreground mt-1">Invested</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/5">
              View All Projects
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Yield Distribution</CardTitle>
            <CardDescription>Performance by crop category.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: 'Maize', value: 45, color: 'bg-primary' },
                { label: 'Soybeans', value: 30, color: 'bg-blue-500' },
                { label: 'Cocoa', value: 15, color: 'bg-orange-500' },
                { label: 'Others', value: 10, color: 'bg-muted' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-muted-foreground">{item.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color}`} 
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AppContent() {
  const { isLoggedIn, user } = useRole();
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'PROFILE' | 'CLUSTERS' | 'PROPOSALS' | 'AGREEMENTS' | 'PAYMENTS' | 'MESSAGES' | 'MEETINGS' | 'ANALYTICS' | 'ADMIN_DASHBOARD' | 'AUDIT_LOGS' | 'RESOURCES'>('DASHBOARD');
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [proposalView, setProposalView] = useState<'LIST' | 'CREATE' | 'DETAIL' | 'NEGOTIATE'>('LIST');
  const [paymentView, setPaymentView] = useState<'LIST' | 'SUBMIT' | 'REVIEW'>('LIST');

  // Mock Conversations and Messages
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'c1',
      participants: [{ id: 'u2', name: 'Zaria Organic Growers', role: 'FARMER' }],
      unreadCount: 2,
      lastMessage: { id: 'm1', senderId: 'u2', senderName: 'Zaria Organic Growers', content: 'The irrigation system is working great!', timestamp: new Date().toISOString() }
    },
    {
      id: 'c2',
      participants: [{ id: 'u3', name: 'Sarah Miller', role: 'CLUSTER_REP' }],
      unreadCount: 0,
      lastMessage: { id: 'm2', senderId: 'u3', senderName: 'Sarah Miller', content: 'Let\'s discuss the next phase.', timestamp: new Date().toISOString() }
    }
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'c1': [
      { id: 'm0', senderId: 'u1', senderName: 'Alex Johnson', content: 'Hi, how is the project going?', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'm1', senderId: 'u2', senderName: 'Zaria Organic Growers', content: 'The irrigation system is working great!', timestamp: new Date().toISOString() }
    ],
    'c2': [
      { id: 'm2', senderId: 'u3', senderName: 'Sarah Miller', content: 'Let\'s discuss the next phase.', timestamp: new Date().toISOString() }
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
          case 'LIST':
          default:
            return (
              <PaymentList 
                onSelectPayment={(p) => { setSelectedPayment(p); setPaymentView('LIST'); }} 
                onSubmitPayment={(p) => { setSelectedPayment(p); setPaymentView('SUBMIT'); }}
                onReviewPayment={(p) => { setSelectedPayment(p); setPaymentView('REVIEW'); }}
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
      case 'DASHBOARD':
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <DashboardLayout onNavigate={(view: any) => { setCurrentView(view); setSelectedCluster(null); setSelectedProposal(null); setSelectedAgreement(null); setSelectedPayment(null); setSelectedConversationId(null); setProposalView('LIST'); setPaymentView('LIST'); }}>
      {renderView()}
      <AIChatbot />
    </DashboardLayout>
  );
}

import { Toaster } from 'sonner';

export default function App() {
  return (
    <RoleProvider>
      <AppContent />
      <Toaster position="top-right" />
    </RoleProvider>
  );
}

