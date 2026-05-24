import React, { useState } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
    Link,
    useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { RoleProvider, useRole } from "@/src/contexts/RoleContext";
import { NotificationProvider } from "@/src/contexts/NotificationContext";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { LoginPage } from "@/src/components/auth/LoginPage";
import { RegisterPage } from "@/src/components/auth/RegisterPage";
import { ProfilePage } from "@/src/components/profile/ProfilePage";
import { ClusterList } from "@/src/components/clusters/ClusterList";
import { ClusterDetail } from "@/src/components/clusters/ClusterDetail";
import { ProposalList } from "@/src/components/proposals/ProposalList";
import { ProposalCreate } from "@/src/components/proposals/ProposalCreate";
import { ProposalDetail } from "@/src/components/proposals/ProposalDetail";
import { NegotiationView } from "@/src/components/proposals/NegotiationView";
import { AgreementList } from "@/src/components/agreements/AgreementList";
import { AgreementDetail } from "@/src/components/agreements/AgreementDetail";
import { PaymentList } from "@/src/components/payments/PaymentList";
import { PaymentSubmit } from "@/src/components/payments/PaymentSubmit";
import { PaymentReview } from "@/src/components/payments/PaymentReview";
import { PaymentDetail } from "@/src/components/payments/PaymentDetail";
import { MessagingPage } from "@/src/components/messaging/MessagingPage";
import { MeetingScheduler } from "@/src/components/meetings/MeetingScheduler";
import { AIChatbot } from "@/src/components/ai/AIChatbot";
import { AuditLogs } from "@/src/components/admin/AuditLogs";
import { SettingsPage } from "@/src/components/profile/SettingsPage";
import { ResourceRecommendations } from "@/src/components/resources/ResourceRecommendations";
import { DashboardOverview } from "@/src/components/dashboard/DashboardOverview";
import { LandingPage } from "@/src/components/landing/LandingPage";
import { Payment, Proposal, UserRole } from "@/src/types";
import { useStore } from "@/src/store/useStore";

function AppContent() {
    const {
        isAuthenticated,
        user: authUser,
        isLoading: authLoading,
    } = useAuth();
    const { role } = useRole();
    const location = useLocation();
    const navigate = useNavigate();
    const {
        currentView,
        setCurrentView,
        selectedCluster,
        setSelectedCluster,
        selectedProposal,
        setSelectedProposal,
        selectedAgreement,
        setSelectedAgreement,
        selectedPayment,
        setSelectedPayment,
        proposalView,
        setProposalView,
        paymentView,
        setPaymentView,
        resetNavigation,
    } = useStore();
    const [authView, setAuthView] = useState<"LANDING" | "LOGIN" | "REGISTER">(
        "LANDING",
    );
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

    //   const guardRoute = (element: React.ReactElement, allowedRoles?: UserRole[]) => {
    //     if (!allowedRoles) return element;
    //     if (!role) return <Navigate to="/dashboard" replace />;
    //     if (allowedRoles.includes(role)) return element;
    //     return <Navigate to="/dashboard" replace />;
    //   };

    //   const ALL_ROLES: UserRole[] = ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'];
    //   const CLUSTER_BROWSE_ROLES: UserRole[] = ALL_ROLES;
    //   const PROPOSAL_ACCESS_ROLES: UserRole[] = ['INVESTOR', 'CLUSTER_REP', 'ADMIN'];
    //   const PROPOSAL_CREATE_ROLES: UserRole[] = ['INVESTOR'];
    //   const AGREEMENT_ACCESS_ROLES: UserRole[] = ['INVESTOR', 'CLUSTER_REP', 'ADMIN'];
    //   const PAYMENT_ACCESS_ROLES: UserRole[] = ['INVESTOR', 'CLUSTER_REP', 'ADMIN'];
    //   const PAYMENT_SUBMIT_ROLES: UserRole[] = ['INVESTOR'];
    //   const PAYMENT_REVIEW_ROLES: UserRole[] = ['CLUSTER_REP', 'ADMIN'];
    //   const INVESTOR_OR_ADMIN: UserRole[] = ['INVESTOR', 'ADMIN'];

    // Sync URL with currentView
    React.useEffect(() => {
        const path = location.pathname;
        const viewMap: Record<string, any> = {
            "/dashboard": "DASHBOARD",
            "/profile": "PROFILE",
            "/clusters": "CLUSTERS",
            "/proposals": "PROPOSALS",
            "/agreements": "AGREEMENTS",
            "/payments": "PAYMENTS",
            "/messages": "MESSAGES",
            "/meetings": "MEETINGS",
            "/audit-logs": "AUDIT_LOGS",
            "/resources": "RESOURCES",
            "/settings": "SETTINGS",
        };
        const matchedView = Object.entries(viewMap).find(([path]) =>
            location.pathname.startsWith(path),
        );
        if (matchedView) {
            setCurrentView(matchedView[1]);
        }
    }, [location.pathname, setCurrentView]);
    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-linear-to-br from-background via-background to-muted/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <>
                {authView === "LANDING" ? (
                    <LandingPage
                        onLogin={() => setAuthView("LOGIN")}
                        onRegister={() => setAuthView("REGISTER")}
                    />
                ) : authView === "LOGIN" ? (
                    <LoginPage
                        onSwitch={() => setAuthView("REGISTER")}
                        onBack={() => setAuthView("LANDING")}
                    />
                ) : (
                    <RegisterPage
                        onSwitch={() => setAuthView("LOGIN")}
                        onBack={() => setAuthView("LANDING")}
                    />
                )}
            </>
        );
    }

    return (
        <DashboardLayout>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/dashboard" element={<DashboardOverview />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                    path="/clusters"
                    element={
                        <ClusterList
                            onSelectCluster={(cluster) => {
                                setSelectedCluster(cluster);
                                navigate(`/clusters/${cluster.id}`);
                            }}
                        />
                    }
                />
                <Route
                    path="/clusters/:id"
                    element={
                        selectedCluster ? (
                            <ClusterDetail
                                cluster={selectedCluster}
                                onBack={() => {
                                    setSelectedCluster(null);
                                    navigate("/clusters");
                                }}
                            />
                        ) : (
                            <Navigate to="/clusters" />
                        )
                    }
                />
                <Route
                    path="/proposals"
                    element={
                        <ProposalList
                            onSelectProposal={(p) => {
                                setSelectedProposal(p);
                                navigate(`/proposals/${p.id}`);
                            }}
                            onCreateProposal={() =>
                                navigate("/proposals/create")
                            }
                        />
                    }
                />
                <Route
                    path="/proposals/create"
                    element={
                        <ProposalCreate
                            onBack={() => navigate("/proposals")}
                            onSubmit={() => navigate("/proposals")}
                        />
                    }
                />
                <Route
                    path="/proposals/:id"
                    element={
                        selectedProposal ? (
                            <ProposalDetail
                                proposal={selectedProposal}
                                onBack={() => {
                                    setSelectedProposal(null);
                                    navigate("/proposals");
                                }}
                                onNegotiate={() =>
                                    navigate(
                                        `/proposals/${selectedProposal.id}/negotiate`,
                                    )
                                }
                                onUpdateProposal={function (
                                    updated: Partial<Proposal>,
                                ): void {
                                    throw new Error(
                                        "Function not implemented.",
                                    );
                                }}
                            />
                        ) : (
                            <Navigate to="/proposals" />
                        )
                    }
                />
                <Route
                    path="/proposals/:id/negotiate"
                    element={
                        selectedProposal ? (
                            <NegotiationView
                                proposal={selectedProposal}
                                onBack={() =>
                                    navigate(
                                        `/proposals/${selectedProposal.id}`,
                                    )
                                }
                                onUpdateProposal={(updated) =>
                                    setSelectedProposal({
                                        ...selectedProposal,
                                        ...updated,
                                    })
                                }
                            />
                        ) : (
                            <Navigate to="/proposals" />
                        )
                    }
                />
                <Route
                    path="/agreements"
                    element={
                        <AgreementList
                            onSelectAgreement={(a) => {
                                setSelectedAgreement(a);
                                navigate(`/agreements/${a.id}`);
                            }}
                        />
                    }
                />
                <Route
                    path="/agreements/:id"
                    element={
                        selectedAgreement ? (
                            <AgreementDetail
                                agreement={selectedAgreement}
                                onBack={() => {
                                    setSelectedAgreement(null);
                                    navigate("/agreements");
                                }}
                                onSign={(id) =>
                                    setSelectedAgreement({
                                        ...selectedAgreement,
                                        status: "SIGNED",
                                        signedAt: new Date().toISOString(),
                                    })
                                }
                            />
                        ) : (
                            <Navigate to="/agreements" />
                        )
                    }
                />
                <Route
                    path="/payments"
                    element={
                        <PaymentList
                            onSelectPayment={(p) => {
                                setSelectedPayment(p);
                                navigate(`/payments/${p.id}`);
                            }}
                            onSubmitPayment={(p) => {
                                setSelectedPayment(p);
                                navigate(`/payments/${p.id}/submit`);
                            }}
                            onReviewPayment={(p) => {
                                setSelectedPayment(p);
                                navigate(`/payments/${p.id}/review`);
                            }}
                            onViewReceipt={(p) => {
                                setReceiptPayment(p);
                                setShowReceiptModal(true);
                            }}
                        />
                    }
                />
                <Route
                    path="/payments/:id/submit"
                    element={
                        selectedPayment ? (
                            <PaymentSubmit
                                payment={selectedPayment}
                                onBack={() => navigate("/payments")}
                                onSubmit={(id, receiptUrl, notes) => {
                                    setSelectedPayment({
                                        ...selectedPayment,
                                        status: "SUBMITTED",
                                        receiptUrl,
                                        notes,
                                        submittedAt: new Date().toISOString(),
                                    });
                                    navigate("/payments");
                                }}
                            />
                        ) : (
                            <Navigate to="/payments" />
                        )
                    }
                />
                <Route
                    path="/payments/:id/review"
                    element={
                        selectedPayment ? (
                            <PaymentReview
                                payment={selectedPayment}
                                onBack={() => navigate("/payments")}
                                onVerify={(id) => {
                                    setSelectedPayment({
                                        ...selectedPayment,
                                        status: "VERIFIED",
                                        verifiedAt: new Date().toISOString(),
                                    });
                                    navigate("/payments");
                                }}
                                onReject={(id, reason) => {
                                    setSelectedPayment({
                                        ...selectedPayment,
                                        status: "REJECTED",
                                        notes: reason,
                                    });
                                    navigate("/payments");
                                }}
                            />
                        ) : (
                            <Navigate to="/payments" />
                        )
                    }
                />
                <Route
                    path="/payments/:id"
                    element={
                        selectedPayment ? (
                            <PaymentDetail
                                payment={selectedPayment}
                                onBack={() => navigate("/payments")}
                                onViewReceipt={(p) => {
                                    setReceiptPayment(p);
                                    setShowReceiptModal(true);
                                }}
                            />
                        ) : (
                            <Navigate to="/payments" />
                        )
                    }
                />
                <Route path="/messages" element={<MessagingPage />} />
                <Route path="/meetings" element={<MeetingScheduler />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route
                    path="/resources"
                    element={<ResourceRecommendations />}
                />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
            <AIChatbot />
            <ReceiptModal
                payment={receiptPayment}
                open={showReceiptModal}
                onOpenChange={setShowReceiptModal}
            />
        </DashboardLayout>
    );
}

import { Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Download, ExternalLink, FileText } from "lucide-react";
import { UserDetailPage } from "./components/admin/UserDetailPage";
import { ClusterDetailPage } from "./components/admin/ClusterDetailPage";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <RoleProvider>
                    <NotificationProvider>
                        <AppContent />
                        <Toaster position="top-right" richColors closeButton />
                    </NotificationProvider>
                </RoleProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

function ReceiptModal({
    payment,
    open,
    onOpenChange,
}: {
    payment: Payment | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (!payment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-150 rounded-lg border-slate-200 shadow-lg p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                                Payment Receipt
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                                Receipt for {payment.agreementTitle} ($
                                {payment.amount.toLocaleString()})
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 rounded-md gap-2 text-[10px] font-bold uppercase tracking-wider border-slate-200 bg-white shadow-sm transition-all active:scale-95"
                            >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 rounded-md gap-2 text-[10px] font-bold uppercase tracking-wider border-slate-200 bg-white shadow-sm transition-all active:scale-95"
                            >
                                <ExternalLink className="w-3 h-3" />
                                <span>Open</span>
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 bg-white">
                    <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                        <FileText className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-3 max-w-md">
                        <h3 className="text-base font-bold text-slate-900">
                            {payment.receiptUrl}
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            This is a simulated preview of the payment receipt.
                            In a live environment, this would display the actual
                            PDF or image document uploaded by the sender.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="p-4 rounded-md bg-slate-50 border border-slate-100 text-left">
                                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                                    Transaction ID
                                </p>
                                <p className="text-[11px] font-mono font-bold text-slate-700 mt-1">
                                    {payment.id.toUpperCase()}
                                </p>
                            </div>
                            <div className="p-4 rounded-md bg-slate-50 border border-slate-100 text-left">
                                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
                                    Verified Date
                                </p>
                                <p className="text-[11px] font-bold text-slate-700 mt-1">
                                    {payment.verifiedAt
                                        ? new Date(
                                              payment.verifiedAt,
                                          ).toLocaleDateString()
                                        : "Pending"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
