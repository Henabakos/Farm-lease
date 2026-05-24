import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useClusters } from "@/src/hooks/useClusters";
import { mapClusterFromApi, mapPaymentFromApi } from "@/src/lib/apiMappers";
import { paymentVerificationService } from "@/src/services/payment-verification";
import { authAPI, paymentsAPI } from "@/src/services/api";
import {
    Activity,
    ArrowDownLeft,
    ArrowUpRight,
    BrainCircuit,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileSignature,
    FileText,
    Lock,
    MapPin,
    MoreVertical,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    UserPlus,
    Users,
    Wallet,
    XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdmin } from "../../hooks/useAdmin";
import { Payment } from "../../types";
import { CreateClusterDialog } from "../clusters/CreateClusterDialog";
import { ContractTemplatesPanel } from "./contracts/ContractTemplatesPanel";
import { AdminAIPanel } from "./AdminAIPanel";
import { AnalyticsDashboard } from "@/src/components/analytics/AnalyticsDashboard";
import {
    ClusterActionType,
    ClusterActionsDialog,
} from "./ClusterActionsDialog";
import { UserActionsDialog } from "./UserActionsDialog";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

function unwrapPayments(payload: unknown): Record<string, unknown>[] {
    if (Array.isArray(payload)) return payload as Record<string, unknown>[];
    if (
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { data?: unknown }).data)
    ) {
        return (payload as { data: Record<string, unknown>[] }).data;
    }
    if (
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { items?: unknown }).items)
    ) {
        return (payload as { items: Record<string, unknown>[] }).items;
    }
    return [];
}

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const {
        users,
        stats,
        isLoading,
        updateUserStatus,
        approveUser,
        fetchAllUsers,
        fetchAuditLogs,
        exportReport,
    } = useAdmin();
    const {
        clusters: apiClusters,
        verifyCluster,
        fetchClusters,
        isLoading: clustersLoading,
    } = useClusters();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<
        "ALL" | "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED"
    >("ALL");
    const [paymentTypeFilter, setPaymentTypeFilter] = useState<
        "ALL" | "DISBURSEMENT" | "REPAYMENT" | "FEE"
    >("ALL");
    const [activeTab, setActiveTab] = useState<
        "USERS" | "CLUSTERS" | "PAYMENTS" | "CONTRACTS" | "AI"
    >("USERS");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionType, setActionType] = useState<
        "suspend" | "unsuspend" | "verify" | "changeRole" | null
    >(null);
    const [selectedCluster, setSelectedCluster] = useState<any>(null);
    const [clusterActionType, setClusterActionType] =
        useState<ClusterActionType | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(
        null,
    );
    const [paymentReviewNotes, setPaymentReviewNotes] = useState("");
    const [paymentRefundReason, setPaymentRefundReason] = useState("");
    const [isProcessingPaymentAction, setIsProcessingPaymentAction] =
        useState(false);
    const [createClusterOpen, setCreateClusterOpen] = useState(false);
    const [createUserOpen, setCreateUserOpen] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newUserForm, setNewUserForm] = useState({
        fullName: "",
        email: "",
        password: "",
        role: "FARMER",
    });
    const [exportReportOpen, setExportReportOpen] = useState(false);
    const [reportType, setReportType] = useState<"USERS" | "CLUSTERS" | "PAYMENTS" | "AUDIT_LOGS">("USERS");
    const [reportStartDate, setReportStartDate] = useState("");
    const [reportEndDate, setReportEndDate] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    const filteredUsers = Array.isArray(users)
        ? users.filter(
              (user) =>
                  user.fullName
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                  user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : [];

    // Map API clusters to UI clusters
    const clusters = Array.isArray(apiClusters)
        ? apiClusters.map((c) =>
              mapClusterFromApi(c as unknown as Record<string, unknown>),
          )
        : [];

    const filteredClusters = clusters.filter(
        (cluster) =>
            cluster.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cluster.location
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            cluster.region?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const pendingClusters = clusters.filter(
        (c) => c.verificationStatus !== "VERIFIED",
    );
    const submittedPayments = payments.filter((p) => p.status === "SUBMITTED");
    const verifiedPayments = payments.filter((p) => p.status === "VERIFIED");
    const rejectedPayments = payments.filter((p) => p.status === "REJECTED");
    const refundedPayments = payments.filter((p) => p.status === "REFUNDED");
    const pendingPaymentCount = payments.filter(
        (p) => p.status === "PENDING",
    ).length;
    const submittedPaymentCount = submittedPayments.length;
    const totalVerifiedVolume = verifiedPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
    );
    const totalQueuedVolume = submittedPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
    );
    const totalRefundedVolume = refundedPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
    );
    const totalPaymentVolume = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
    );
    const totalRejectedVolume = rejectedPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
    );

    // Fetch payments on mount
    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await paymentsAPI.getAll();
                const rows = unwrapPayments(response.data);
                setPayments(
                    rows.map((payment) =>
                        mapPaymentFromApi(payment as Record<string, unknown>),
                    ),
                );
            } catch (err) {
                console.error("Failed to fetch payments", err);
                setPayments([]);
            }
        };
        fetchPayments();
    }, []);

    const openActionDialog = (
        user: any,
        type: "suspend" | "unsuspend" | "verify" | "changeRole",
    ) => {
        setSelectedUser(user);
        setActionType(type);
    };

    const closeActionDialog = () => {
        setSelectedUser(null);
        setActionType(null);
    };

    const handleUserRowClick = (userId: string) => {
        navigate(`/admin/users/${userId}`);
    };

    const handleClusterRowClick = (clusterId: string) => {
        navigate(`/admin/clusters/${clusterId}`);
    };

    const openClusterActionDialog = (
        cluster: (typeof clusters)[0],
        type: ClusterActionType,
    ) => {
        setSelectedCluster(cluster);
        setClusterActionType(type);
    };

    const closeClusterActionDialog = () => {
        setSelectedCluster(null);
        setClusterActionType(null);
    };

    const closePaymentDialog = () => {
        setSelectedPayment(null);
        setPaymentReviewNotes("");
        setPaymentRefundReason("");
    };

    const openPaymentDialog = (payment: Payment) => {
        setSelectedPayment(payment);
        setPaymentReviewNotes(payment.notes ?? "");
        setPaymentRefundReason("");
    };

    const getClusterStatusBadgeColor = (status?: string) => {
        switch (status) {
            case "ACTIVE":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "INACTIVE":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "ARCHIVED":
                return "bg-red-50 text-red-700 border-red-200";
            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "PENDING_APPROVAL":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "SUSPENDED":
                return "bg-red-50 text-red-700 border-red-200";
            default:
                return "bg-white text-slate-600 border-slate-200";
        }
    };

    const getVerificationBadgeColor = (status: string) => {
        switch (status) {
            case "VERIFIED":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "PENDING":
                return "bg-amber-50 text-amber-700 border-amber-200";
            case "REJECTED":
                return "bg-red-50 text-red-700 border-red-200";
            case "REFUNDED":
                return "bg-slate-100 text-slate-700 border-slate-200";
            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const getPaymentTypeTone = (type?: string) => {
        switch (type) {
            case "DISBURSEMENT":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "REPAYMENT":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "FEE":
                return "bg-violet-50 text-violet-700 border-violet-200";
            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const getPaymentTypeLabel = (type?: string) => {
        switch (type) {
            case "DISBURSEMENT":
                return "Disbursement";
            case "REPAYMENT":
                return "Repayment";
            case "FEE":
                return "Fee";
            default:
                return "Payment";
        }
    };

    const formatCurrencyAmount = (amount: number, currency = "USD") => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatPaymentAmount = (payment: Payment) => {
        return formatCurrencyAmount(payment.amount, payment.currency || "USD");
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "ADMIN":
                return "bg-purple-50 text-purple-700 border-purple-200";
            case "INVESTOR":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "CLUSTER_REP":
                return "bg-indigo-50 text-indigo-700 border-indigo-200";
            case "FARMER":
                return "bg-green-50 text-green-700 border-green-200";
            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const statsData = [
        {
            title: "Total Users",
            value: String(stats?.users?.total || 0),
            change: "+12%",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
        },
        {
            title: "Active Clusters",
            value: clusters.length.toString(),
            change: "+8%",
            icon: MapPin,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
        },
        {
            title: "Total Volume",
            value: `$${(payments.filter((p) => p.status === "VERIFIED").reduce((sum, p) => sum + p.amount, 0) / 1000).toFixed(1)}k`,
            change: "+15%",
            icon: Wallet,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
        },
        {
            title: "System Health",
            value: "99.9%",
            change: "Stable",
            icon: Activity,
            color: "text-purple-600",
            bg: "bg-purple-500/10",
        },
    ];

    const handleVerifyCluster = async (id: string) => {
        try {
            await verifyCluster(id);
        } catch (err) {
            console.error("Failed to verify cluster", err);
        }
    };

    const handleVerifyPayment = async (id: string) => {
        try {
            await paymentsAPI.verify(id, { verified: true });
            setPayments((prev) =>
                prev.map((p) =>
                    p.id === id ? { ...p, status: "VERIFIED" as any } : p,
                ),
            );
            toast.success("Payment verified successfully");
        } catch (err) {
            console.error("Failed to verify payment", err);
        }
    };

    const handleReviewSelectedPayment = async (
        decision: "verified" | "rejected",
    ) => {
        if (!selectedPayment) return;

        const reviewNotes = paymentReviewNotes.trim();
        if (decision === "rejected" && !reviewNotes) {
            toast.error("Please enter a rejection reason");
            return;
        }

        try {
            setIsProcessingPaymentAction(true);
            const response = await paymentVerificationService.verifyPayment(
                selectedPayment.id,
                {
                    verifiedAmount: selectedPayment.amount,
                    notes: reviewNotes,
                    status: decision,
                },
            );
            const nextStatus =
                decision === "verified" ? "VERIFIED" : "REJECTED";
            setPayments((prev) =>
                prev.map((payment) =>
                    payment.id === selectedPayment.id
                        ? {
                              ...payment,
                              status: nextStatus,
                              verificationDecision:
                                  decision === "verified"
                                      ? "APPROVED"
                                      : "REJECTED",
                              verifiedAt: new Date().toISOString(),
                              notes: reviewNotes || payment.notes,
                          }
                        : payment,
                ),
            );
            toast.success(response?.message || "Payment review updated");
            closePaymentDialog();
        } catch (err) {
            console.error("Failed to review payment", err);
        } finally {
            setIsProcessingPaymentAction(false);
        }
    };

    const handleRefundSelectedPayment = async () => {
        if (!selectedPayment) return;

        const reason = paymentRefundReason.trim();
        if (!reason) {
            toast.error("Refund reason is required");
            return;
        }

        try {
            setIsProcessingPaymentAction(true);
            await paymentsAPI.refund(selectedPayment.id, reason);
            setPayments((prev) =>
                prev.map((payment) =>
                    payment.id === selectedPayment.id
                        ? { ...payment, status: "REFUNDED" }
                        : payment,
                ),
            );
            toast.success("Payment refunded successfully");
            closePaymentDialog();
        } catch (err) {
            console.error("Failed to refund payment", err);
        } finally {
            setIsProcessingPaymentAction(false);
        }
    };

    const filteredPayments = payments
        .filter((payment) => {
            if (paymentStatusFilter === "ALL") return true;
            return payment.status === paymentStatusFilter;
        })
        .filter((payment) => {
            if (paymentTypeFilter === "ALL") return true;
            return payment.type === paymentTypeFilter;
        })
        .filter((payment) => {
            const query = searchTerm.toLowerCase();
            return (
                payment.agreementTitle?.toLowerCase().includes(query) ||
                payment.id.toLowerCase().includes(query) ||
                payment.senderName?.toLowerCase().includes(query) ||
                payment.receiverName?.toLowerCase().includes(query)
            );
        });

    const paymentSummaryCards = [
        {
            label: "Total Payments",
            value: payments.length,
            tone: "bg-slate-50 text-slate-700 border-slate-200",
        },
        {
            label: "Queued",
            value: pendingPaymentCount + submittedPaymentCount,
            tone: "bg-amber-50 text-amber-700 border-amber-200",
        },
        {
            label: "Verified",
            value: verifiedPayments.length,
            tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
        },
        {
            label: "Refunded",
            value: refundedPayments.length,
            tone: "bg-slate-100 text-slate-700 border-slate-200",
        },
    ];

    const handleCreateUser = async () => {
        const fullName = newUserForm.fullName.trim();
        const email = newUserForm.email.trim().toLowerCase();
        const password = newUserForm.password;
        const hasLetterAndDigit =
            /[A-Za-z]/.test(password) && /\d/.test(password);

        if (!fullName || !email || !password) {
            toast.error("Please fill all required fields");
            return;
        }

        if (fullName.length < 2) {
            toast.error("Full name must be at least 2 characters");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (password.length < 8 || password.length > 128) {
            toast.error("Password must be 8-128 characters");
            return;
        }

        if (!hasLetterAndDigit) {
            toast.error("Password must contain both letters and digits");
            return;
        }

        if (newUserForm.role === "ADMIN") {
            toast.error(
                "Admin role cannot be created via self-register endpoint",
            );
            return;
        }

        try {
            setIsCreatingUser(true);
            await authAPI.register({
                fullName,
                email,
                password,
                role: newUserForm.role,
            });
            toast.success("User created successfully");
            setCreateUserOpen(false);
            setNewUserForm({
                fullName: "",
                email: "",
                password: "",
                role: "FARMER",
            });
            fetchAllUsers();
        } catch (err: any) {
            const details = err?.response?.data?.details;
            const detailMessage = Array.isArray(details)
                ? details
                      .map((d: any) => d?.message)
                      .filter(Boolean)
                      .join("; ")
                : null;
            const message =
                detailMessage ||
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                "Failed to create user";
            toast.error(message);
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleExportReport = async () => {
        try {
            setIsExporting(true);
            await exportReport(reportType, reportStartDate || undefined, reportEndDate || undefined);
            setExportReportOpen(false);
            setReportType("USERS");
            setReportStartDate("");
            setReportEndDate("");
        } catch (err) {
            // Error handled in hook
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-10"
        >
            <motion.div
                variants={item}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                        Admin{" "}
                        <span className="text-primary">Control Center</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm font-normal">
                        Manage users, verify entities, and monitor system
                        performance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setExportReportOpen(true)}
                        className="gap-2 h-10 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Export Report</span>
                    </Button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat) => (
                    <motion.div key={stat.title} variants={item}>
                        <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all duration-300 group overflow-hidden relative rounded-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-md flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
                                            stat.bg,
                                            stat.color,
                                        )}
                                    >
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="bg-slate-100 text-slate-600 border-none font-semibold px-2 py-0.5 rounded-md text-[10px]"
                                    >
                                        {stat.change}
                                    </Badge>
                                </div>
                                <div className="mt-4">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {stat.title}
                                    </p>
                                    <h3 className="text-xl font-bold mt-1 tracking-tight text-foreground">
                                        {stat.value}
                                    </h3>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <motion.div variants={item} className="lg:col-span-9">
                    <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-primary" />
                                        System Management
                                    </CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                                        Manage and monitor all system entities
                                        and users.
                                    </CardDescription>
                                </div>
                                <div className="relative group w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <Input
                                        placeholder="Search..."
                                        className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <Tabs
                                defaultValue="USERS"
                                className="mt-6"
                                onValueChange={(v) => setActiveTab(v as any)}
                            >
                                <TabsList className="bg-slate-100 p-1 rounded-md h-10 w-full md:w-auto border border-slate-200 flex-wrap">
                                    <TabsTrigger
                                        value="USERS"
                                        className="rounded-sm px-4 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                    >
                                        Users
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="CLUSTERS"
                                        className="rounded-sm px-4 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                    >
                                        Clusters
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="PAYMENTS"
                                        className="rounded-sm px-4 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                    >
                                        Payments
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="CONTRACTS"
                                        className="rounded-sm px-4 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all gap-1.5"
                                    >
                                        <FileSignature className="w-3 h-3" />
                                        Contracts
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="AI"
                                        className="rounded-sm px-4 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all gap-1.5"
                                    >
                                        <BrainCircuit className="w-3 h-3" />
                                        AI
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="p-6">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {activeTab === "USERS" && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {filteredUsers.length} user
                                                    {filteredUsers.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    className="gap-1.5 h-8 rounded-md bg-primary hover:bg-primary/90 font-bold text-[10px] uppercase tracking-wider px-3"
                                                    onClick={() =>
                                                        setCreateUserOpen(true)
                                                    }
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    New User
                                                </Button>
                                            </div>
                                            {filteredUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    onClick={() =>
                                                        handleUserRowClick(
                                                            user.id,
                                                        )
                                                    }
                                                    className="flex items-center justify-between p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all group cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-primary font-bold group-hover:scale-105 transition-transform">
                                                            {user.fullName?.charAt(
                                                                0,
                                                            ) ||
                                                                user.name?.charAt(
                                                                    0,
                                                                ) ||
                                                                "U"}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-sm text-slate-900 tracking-tight">
                                                                {user.fullName ||
                                                                    user.name ||
                                                                    "Unknown"}
                                                            </h4>
                                                            <p className="text-[11px] text-slate-500 font-medium">
                                                                {user.email ||
                                                                    "No email"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="hidden md:flex items-center gap-2">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider",
                                                                getStatusBadgeColor(
                                                                    user.status,
                                                                ),
                                                            )}
                                                        >
                                                            {user.status ||
                                                                "UNKNOWN"}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider",
                                                                getVerificationBadgeColor(
                                                                    user.verificationStatus,
                                                                ),
                                                            )}
                                                        >
                                                            {user.verificationStatus ||
                                                                "UNVERIFIED"}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider",
                                                                getRoleBadgeColor(
                                                                    user.role,
                                                                ),
                                                            )}
                                                        >
                                                            {user.role}
                                                        </Badge>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-md hover:bg-white border border-transparent hover:border-slate-200 ml-2"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-48"
                                                        >
                                                            {user.status ===
                                                                "PENDING_APPROVAL" && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            approveUser(
                                                                                user.id,
                                                                            )
                                                                        }
                                                                        className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                        Approve
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}

                                                            {user.status ===
                                                                "ACTIVE" && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            openActionDialog(
                                                                                user,
                                                                                "suspend",
                                                                            )
                                                                        }
                                                                        className="text-red-700 focus:text-red-700 focus:bg-red-50"
                                                                    >
                                                                        <XCircle className="w-4 h-4 mr-2" />
                                                                        Suspend...
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}

                                                            {user.status ===
                                                                "SUSPENDED" && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            openActionDialog(
                                                                                user,
                                                                                "unsuspend",
                                                                            )
                                                                        }
                                                                        className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                        Unsuspend...
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}

                                                            {user.verificationStatus ===
                                                                "UNVERIFIED" && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        openActionDialog(
                                                                            user,
                                                                            "verify",
                                                                        )
                                                                    }
                                                                    className="text-blue-700 focus:text-blue-700 focus:bg-blue-50"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                    Verify...
                                                                </DropdownMenuItem>
                                                            )}

                                                            {user.verificationStatus ===
                                                                "VERIFIED" && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        openActionDialog(
                                                                            user,
                                                                            "verify",
                                                                        )
                                                                    }
                                                                    className="text-amber-700 focus:text-amber-700 focus:bg-amber-50"
                                                                >
                                                                    <XCircle className="w-4 h-4 mr-2" />
                                                                    Unverify...
                                                                </DropdownMenuItem>
                                                            )}

                                                            {user.verificationStatus !==
                                                                "UNVERIFIED" && (
                                                                <DropdownMenuSeparator />
                                                            )}

                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openActionDialog(
                                                                        user,
                                                                        "changeRole",
                                                                    )
                                                                }
                                                                className="focus:bg-slate-50"
                                                            >
                                                                <Shield className="w-4 h-4 mr-2" />
                                                                Change Role...
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {activeTab === "CLUSTERS" && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {filteredClusters.length}{" "}
                                                    cluster
                                                    {filteredClusters.length !==
                                                    1
                                                        ? "s"
                                                        : ""}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    className="gap-1.5 h-8 rounded-md bg-primary hover:bg-primary/90 font-bold text-[10px] uppercase tracking-wider px-3"
                                                    onClick={() =>
                                                        setCreateClusterOpen(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    New Cluster
                                                </Button>
                                            </div>
                                            {clustersLoading &&
                                            filteredClusters.length === 0 ? (
                                                <p className="text-sm text-slate-500 py-8 text-center">
                                                    Loading clusters...
                                                </p>
                                            ) : filteredClusters.length ===
                                              0 ? (
                                                <p className="text-sm text-slate-500 py-8 text-center">
                                                    No clusters match your
                                                    search.
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {filteredClusters.map(
                                                        (cluster) => (
                                                            <div
                                                                key={cluster.id}
                                                                onClick={() =>
                                                                    handleClusterRowClick(
                                                                        cluster.id,
                                                                    )
                                                                }
                                                                className="flex items-center justify-between p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all group cursor-pointer"
                                                            >
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                                                                        <MapPin className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <h4 className="font-bold text-sm text-slate-900 tracking-tight truncate">
                                                                            {
                                                                                cluster.name
                                                                            }
                                                                        </h4>
                                                                        <p className="text-[11px] text-slate-500 font-medium truncate">
                                                                            {
                                                                                cluster.location
                                                                            }
                                                                            {cluster.region
                                                                                ? ` · ${cluster.region}`
                                                                                : ""}
                                                                        </p>
                                                                        <div className="flex flex-wrap gap-1.5 mt-1.5 md:hidden">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={cn(
                                                                                    "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider",
                                                                                    getClusterStatusBadgeColor(
                                                                                        cluster.status,
                                                                                    ),
                                                                                )}
                                                                            >
                                                                                {cluster.status ||
                                                                                    "ACTIVE"}
                                                                            </Badge>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={cn(
                                                                                    "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider",
                                                                                    getVerificationBadgeColor(
                                                                                        cluster.verificationStatus,
                                                                                    ),
                                                                                )}
                                                                            >
                                                                                {
                                                                                    cluster.verificationStatus
                                                                                }
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="hidden md:flex items-center gap-2 shrink-0">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider",
                                                                            getClusterStatusBadgeColor(
                                                                                cluster.status,
                                                                            ),
                                                                        )}
                                                                    >
                                                                        {cluster.status ||
                                                                            "ACTIVE"}
                                                                    </Badge>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={cn(
                                                                            "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider",
                                                                            getVerificationBadgeColor(
                                                                                cluster.verificationStatus,
                                                                            ),
                                                                        )}
                                                                    >
                                                                        {
                                                                            cluster.verificationStatus
                                                                        }
                                                                    </Badge>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider bg-slate-50 text-slate-600 border-slate-200"
                                                                    >
                                                                        {
                                                                            cluster.memberCount
                                                                        }{" "}
                                                                        members
                                                                    </Badge>
                                                                </div>

                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 rounded-md hover:bg-white border border-transparent hover:border-slate-200 ml-2 shrink-0"
                                                                            onClick={(
                                                                                e,
                                                                            ) =>
                                                                                e.stopPropagation()
                                                                            }
                                                                        >
                                                                            <MoreVertical className="w-4 h-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent
                                                                        align="end"
                                                                        className="w-48"
                                                                    >
                                                                        <DropdownMenuItem
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                handleClusterRowClick(
                                                                                    cluster.id,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <ChevronRight className="w-4 h-4 mr-2" />
                                                                            View
                                                                            Details
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />

                                                                        {(cluster.verificationStatus ===
                                                                            "UNVERIFIED" ||
                                                                            cluster.verificationStatus ===
                                                                                "PENDING") && (
                                                                            <DropdownMenuItem
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    openClusterActionDialog(
                                                                                        cluster,
                                                                                        "verify",
                                                                                    );
                                                                                }}
                                                                                className="text-blue-700 focus:text-blue-700 focus:bg-blue-50"
                                                                            >
                                                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                                Verify...
                                                                            </DropdownMenuItem>
                                                                        )}

                                                                        {cluster.verificationStatus ===
                                                                            "VERIFIED" && (
                                                                            <DropdownMenuItem
                                                                                onClick={(
                                                                                    e,
                                                                                ) => {
                                                                                    e.stopPropagation();
                                                                                    openClusterActionDialog(
                                                                                        cluster,
                                                                                        "unverify",
                                                                                    );
                                                                                }}
                                                                                className="text-amber-700 focus:text-amber-700 focus:bg-amber-50"
                                                                            >
                                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                                Unverify...
                                                                            </DropdownMenuItem>
                                                                        )}

                                                                        {cluster.verificationStatus !==
                                                                            "UNVERIFIED" && (
                                                                            <DropdownMenuSeparator />
                                                                        )}

                                                                        <DropdownMenuItem
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                openClusterActionDialog(
                                                                                    cluster,
                                                                                    "changeStatus",
                                                                                );
                                                                            }}
                                                                        >
                                                                            <Shield className="w-4 h-4 mr-2" />
                                                                            Change
                                                                            Status...
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            onClick={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation();
                                                                                openClusterActionDialog(
                                                                                    cluster,
                                                                                    "archive",
                                                                                );
                                                                            }}
                                                                            className="text-red-700 focus:text-red-700 focus:bg-red-50"
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                                            Archive...
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === "CONTRACTS" && (
                                        <ContractTemplatesPanel />
                                    )}
                                    {activeTab === "PAYMENTS" && (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="xl:col-span-8 space-y-4">
                                                    <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                                                        <CardContent className="p-4 space-y-3">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                <div className="md:col-span-2 relative group">
                                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                                    <Input
                                                                        placeholder="Search payments by agreement, ID, sender, or receiver..."
                                                                        className="pl-9 bg-white border-slate-200 focus-visible:ring-primary/20 h-9 rounded-md text-xs transition-all"
                                                                        value={
                                                                            searchTerm
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setSearchTerm(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                </div>
                                                                <Select
                                                                    value={
                                                                        paymentStatusFilter
                                                                    }
                                                                    onValueChange={(
                                                                        value,
                                                                    ) =>
                                                                        setPaymentStatusFilter(
                                                                            value as
                                                                                | "ALL"
                                                                                | "PENDING"
                                                                                | "SUBMITTED"
                                                                                | "VERIFIED"
                                                                                | "REJECTED",
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="bg-white border-slate-200 h-9 rounded-md focus:ring-primary/20 text-[11px] font-bold uppercase tracking-wider transition-all">
                                                                        <SelectValue placeholder="Status" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-md border-slate-200">
                                                                        <SelectItem
                                                                            value="ALL"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            All
                                                                            Statuses
                                                                        </SelectItem>
                                                                        <SelectItem
                                                                            value="PENDING"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            Pending
                                                                        </SelectItem>
                                                                        <SelectItem
                                                                            value="SUBMITTED"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            Submitted
                                                                        </SelectItem>
                                                                        <SelectItem
                                                                            value="VERIFIED"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            Verified
                                                                        </SelectItem>
                                                                        <SelectItem
                                                                            value="REJECTED"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            Rejected
                                                                        </SelectItem>
                                                                        <SelectItem
                                                                            value="REFUNDED"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            Refunded
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                                                <Select
                                                                    value={
                                                                        paymentTypeFilter
                                                                    }
                                                                    onValueChange={(
                                                                        value,
                                                                    ) =>
                                                                        setPaymentTypeFilter(
                                                                            value as
                                                                                | "ALL"
                                                                                | "DISBURSEMENT"
                                                                                | "REPAYMENT"
                                                                                | "FEE",
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full md:w-56 bg-white border-slate-200 h-8 rounded-md focus:ring-primary/20 text-[11px] font-bold uppercase tracking-wider transition-all">
                                                                        <SelectValue placeholder="Type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-md border-slate-200">
                                                                        <SelectItem
                                                                            value="ALL"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            All
                                                                            Types
                                                                        </SelectItem>
                                                                        <SelectItem
                                                                            value="DISBURSEMENT"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            Disbursement
                                                                        </SelectItem>
                                                                        <SelectItem
                                                                            value="REPAYMENT"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            Repayment
                                                                        </SelectItem>
                                                                        <SelectItem
                                                                            value="FEE"
                                                                            className="text-xs font-medium"
                                                                        >
                                                                            Fee
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>

                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-8 rounded-md font-bold text-[10px] uppercase tracking-wider text-primary hover:bg-slate-50 border border-transparent hover:border-slate-200"
                                                                    onClick={() => {
                                                                        setSearchTerm(
                                                                            "",
                                                                        );
                                                                        setPaymentStatusFilter(
                                                                            "ALL",
                                                                        );
                                                                        setPaymentTypeFilter(
                                                                            "ALL",
                                                                        );
                                                                    }}
                                                                >
                                                                    Reset
                                                                    Filters
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    <div className="space-y-3">
                                                        {filteredPayments.length ===
                                                        0 ? (
                                                            <p className="text-sm text-slate-500 py-10 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                                                                No payments
                                                                match your
                                                                search or
                                                                filter.
                                                            </p>
                                                        ) : (
                                                            filteredPayments.map(
                                                                (payment) => (
                                                                    <div
                                                                        key={
                                                                            payment.id
                                                                        }
                                                                        onClick={() =>
                                                                            openPaymentDialog(
                                                                                payment,
                                                                            )
                                                                        }
                                                                        className="flex flex-col gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all group cursor-pointer"
                                                                    >
                                                                        <div className="flex items-start justify-between gap-4">
                                                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                                                <div
                                                                                    className={cn(
                                                                                        "w-10 h-10 rounded-md border flex items-center justify-center shrink-0",
                                                                                        getPaymentTypeTone(
                                                                                            payment.type,
                                                                                        ),
                                                                                    )}
                                                                                >
                                                                                    {payment.type ===
                                                                                    "DISBURSEMENT" ? (
                                                                                        <ArrowUpRight className="w-5 h-5" />
                                                                                    ) : payment.type ===
                                                                                      "REPAYMENT" ? (
                                                                                        <ArrowDownLeft className="w-5 h-5" />
                                                                                    ) : (
                                                                                        <Wallet className="w-5 h-5" />
                                                                                    )}
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <h4 className="font-bold text-sm text-slate-900 tracking-tight truncate">
                                                                                            {
                                                                                                payment.agreementTitle
                                                                                            }
                                                                                        </h4>
                                                                                        <Badge
                                                                                            variant="outline"
                                                                                            className={cn(
                                                                                                "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider border",
                                                                                                getPaymentTypeTone(
                                                                                                    payment.type,
                                                                                                ),
                                                                                            )}
                                                                                        >
                                                                                            {getPaymentTypeLabel(
                                                                                                payment.type,
                                                                                            )}
                                                                                        </Badge>
                                                                                    </div>
                                                                                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                                                                        {
                                                                                            payment.senderName
                                                                                        }{" "}
                                                                                        →{" "}
                                                                                        {
                                                                                            payment.receiverName
                                                                                        }
                                                                                    </p>
                                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                                                        Payment
                                                                                        ID{" "}
                                                                                        {payment.id.toUpperCase()}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-right shrink-0">
                                                                                <p className="text-lg font-bold tracking-tight text-slate-900">
                                                                                    {formatPaymentAmount(
                                                                                        payment,
                                                                                    )}
                                                                                </p>
                                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                                                    {payment.currency ||
                                                                                        "USD"}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                                                                            <div className="flex flex-wrap gap-2">
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={cn(
                                                                                        "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider border",
                                                                                        getVerificationBadgeColor(
                                                                                            payment.status,
                                                                                        ),
                                                                                    )}
                                                                                >
                                                                                    {
                                                                                        payment.status
                                                                                    }
                                                                                </Badge>
                                                                                {payment.dueDate && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="bg-white text-slate-600 border-slate-200 font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider"
                                                                                    >
                                                                                        Due{" "}
                                                                                        {new Date(
                                                                                            payment.dueDate,
                                                                                        ).toLocaleDateString()}
                                                                                    </Badge>
                                                                                )}
                                                                                {payment.paidAt && (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="bg-white text-slate-600 border-slate-200 font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider"
                                                                                    >
                                                                                        Paid{" "}
                                                                                        {new Date(
                                                                                            payment.paidAt,
                                                                                        ).toLocaleDateString()}
                                                                                    </Badge>
                                                                                )}
                                                                                {payment.receiptCount ? (
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className="bg-white text-slate-600 border-slate-200 font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider"
                                                                                    >
                                                                                        {
                                                                                            payment.receiptCount
                                                                                        }{" "}
                                                                                        receipt
                                                                                        {payment.receiptCount !==
                                                                                        1
                                                                                            ? "s"
                                                                                            : ""}
                                                                                    </Badge>
                                                                                ) : null}
                                                                            </div>

                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-8 w-8 rounded-md hover:bg-white border border-transparent hover:border-slate-200"
                                                                                        onClick={(
                                                                                            e,
                                                                                        ) =>
                                                                                            e.stopPropagation()
                                                                                        }
                                                                                    >
                                                                                        <MoreVertical className="w-4 h-4" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent
                                                                                    align="end"
                                                                                    className="w-52"
                                                                                >
                                                                                    <DropdownMenuItem
                                                                                        onClick={(
                                                                                            e,
                                                                                        ) => {
                                                                                            e.stopPropagation();
                                                                                            openPaymentDialog(
                                                                                                payment,
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        <ChevronRight className="w-4 h-4 mr-2" />
                                                                                        View
                                                                                        details
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuSeparator />
                                                                                    {payment.status ===
                                                                                        "SUBMITTED" && (
                                                                                        <>
                                                                                            <DropdownMenuItem
                                                                                                onClick={(
                                                                                                    e,
                                                                                                ) => {
                                                                                                    e.stopPropagation();
                                                                                                    openPaymentDialog(
                                                                                                        payment,
                                                                                                    );
                                                                                                }}
                                                                                                className="text-emerald-700 focus:text-emerald-700 focus:bg-emerald-50"
                                                                                            >
                                                                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                                                                Review
                                                                                                receipt
                                                                                            </DropdownMenuItem>
                                                                                            <DropdownMenuItem
                                                                                                onClick={(
                                                                                                    e,
                                                                                                ) => {
                                                                                                    e.stopPropagation();
                                                                                                    openPaymentDialog(
                                                                                                        payment,
                                                                                                    );
                                                                                                }}
                                                                                                className="text-red-700 focus:text-red-700 focus:bg-red-50"
                                                                                            >
                                                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                                                Reject
                                                                                                receipt
                                                                                            </DropdownMenuItem>
                                                                                        </>
                                                                                    )}
                                                                                    {payment.status ===
                                                                                        "VERIFIED" && (
                                                                                        <DropdownMenuItem
                                                                                            onClick={(
                                                                                                e,
                                                                                            ) => {
                                                                                                e.stopPropagation();
                                                                                                openPaymentDialog(
                                                                                                    payment,
                                                                                                );
                                                                                            }}
                                                                                            className="text-amber-700 focus:text-amber-700 focus:bg-amber-50"
                                                                                        >
                                                                                            <Wallet className="w-4 h-4 mr-2" />
                                                                                            Refund
                                                                                            payment
                                                                                        </DropdownMenuItem>
                                                                                    )}
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {activeTab === "AI" && <AdminAIPanel />}
                                </motion.div>
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>

                <div className="lg:col-span-3 space-y-6">
                    {/* Quick Actions / Verification Queue */}
                    <motion.div variants={item}>
                        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                            <CardHeader className="p-6">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                                        <Activity className="w-3.5 h-3.5 text-primary" />
                                        Pending Verification
                                    </CardTitle>
                                    <Badge className="bg-primary text-white border-none font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
                                        {pendingClusters.length +
                                            submittedPayments.length}
                                    </Badge>
                                </div>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                                    Critical items requiring admin approval.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-0 space-y-3">
                                {pendingClusters.slice(0, 2).map((cluster) => (
                                    <div
                                        key={cluster.id}
                                        className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3 group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-xs text-slate-900 tracking-tight">
                                                        {cluster.name}
                                                    </h4>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                                        {cluster.location}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 rounded-md text-emerald-600 hover:bg-white border border-transparent hover:border-slate-200"
                                                onClick={() =>
                                                    handleVerifyCluster(
                                                        cluster.id,
                                                    )
                                                }
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {submittedPayments
                                    .slice(0, 2)
                                    .map((payment) => (
                                        <div
                                            key={payment.id}
                                            className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3 group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                                                        <Wallet className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-xs text-slate-900 tracking-tight">
                                                            $
                                                            {payment.amount.toLocaleString()}
                                                        </h4>
                                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                                            {
                                                                payment.agreementTitle
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 rounded-md text-amber-600 hover:bg-white border border-transparent hover:border-slate-200"
                                                    onClick={() =>
                                                        handleVerifyPayment(
                                                            payment.id,
                                                        )
                                                    }
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                <Button
                                    variant="ghost"
                                    className="w-full h-10 rounded-md font-bold text-[10px] uppercase tracking-wider text-primary hover:bg-slate-50 border border-transparent hover:border-slate-200"
                                >
                                    View Full Queue
                                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* System Security */}
                    <motion.div variants={item}>
                        <Card className="border border-slate-200 shadow-sm bg-slate-50 rounded-lg overflow-hidden">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-primary">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm tracking-tight text-slate-900">
                                            Security Status
                                        </h3>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                            All Systems Secure
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                                            Firewall
                                        </span>
                                        <Badge className="bg-emerald-500 text-white border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 rounded-md">
                                            Active
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                                            Encryption
                                        </span>
                                        <Badge className="bg-emerald-500 text-white border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 rounded-md">
                                            AES-256
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                                            Audit Logging
                                        </span>
                                        <Badge className="bg-emerald-500 text-white border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 rounded-md">
                                            Enabled
                                        </Badge>
                                    </div>
                                </div>
                                <Button className="w-full mt-6 h-10 rounded-md bg-primary hover:bg-primary/90 font-bold text-[10px] uppercase tracking-wider shadow-sm">
                                    Security Audit
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>

            {selectedUser && actionType && (
                <UserActionsDialog
                    user={selectedUser}
                    actionType={actionType}
                    open={!!selectedUser && !!actionType}
                    onOpenChange={(open) => {
                        if (!open) closeActionDialog();
                    }}
                    onSuccess={() => {
                        closeActionDialog();
                        fetchAllUsers();
                    }}
                />
            )}

            {selectedCluster && clusterActionType && (
                <ClusterActionsDialog
                    cluster={selectedCluster}
                    actionType={clusterActionType}
                    open={!!selectedCluster && !!clusterActionType}
                    onOpenChange={(open) => {
                        if (!open) closeClusterActionDialog();
                    }}
                    onSuccess={() => {
                        closeClusterActionDialog();
                        fetchClusters();
                    }}
                />
            )}

            <CreateClusterDialog
                open={createClusterOpen}
                onOpenChange={setCreateClusterOpen}
                onCreated={() => fetchClusters()}
            />

            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create User</DialogTitle>
                        <DialogDescription>
                            Register a new user account as admin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <Input
                            placeholder="Full name"
                            value={newUserForm.fullName}
                            onChange={(e) =>
                                setNewUserForm((prev) => ({
                                    ...prev,
                                    fullName: e.target.value,
                                }))
                            }
                        />
                        <Input
                            type="email"
                            placeholder="Email address"
                            value={newUserForm.email}
                            onChange={(e) =>
                                setNewUserForm((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                }))
                            }
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={newUserForm.password}
                            onChange={(e) =>
                                setNewUserForm((prev) => ({
                                    ...prev,
                                    password: e.target.value,
                                }))
                            }
                        />
                        <Select
                            value={newUserForm.role}
                            onValueChange={(value) =>
                                setNewUserForm((prev) => ({
                                    ...prev,
                                    role: value ?? prev.role,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FARMER">Farmer</SelectItem>
                                <SelectItem value="INVESTOR">
                                    Investor
                                </SelectItem>
                                <SelectItem value="CLUSTER_REP">
                                    Cluster Rep
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateUserOpen(false)}
                            disabled={isCreatingUser}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateUser}
                            disabled={isCreatingUser}
                        >
                            {isCreatingUser ? "Creating..." : "Create User"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!selectedPayment}
                onOpenChange={(open) => {
                    if (!open) closePaymentDialog();
                }}
            >
                <DialogContent className="sm:max-w-3xl">
                    {selectedPayment && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex flex-wrap items-center gap-2">
                                    Payment Details
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider border",
                                            getVerificationBadgeColor(
                                                selectedPayment.status,
                                            ),
                                        )}
                                    >
                                        {selectedPayment.status}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                    Review the payment record, receipt state,
                                    and verification outcome.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Agreement
                                        </p>
                                        <p className="mt-1 font-bold text-slate-900">
                                            {selectedPayment.agreementTitle}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Amount
                                            </p>
                                            <p className="font-bold text-slate-900 mt-1">
                                                {formatPaymentAmount(
                                                    selectedPayment,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Type
                                            </p>
                                            <p className="font-bold text-slate-900 mt-1">
                                                {getPaymentTypeLabel(
                                                    selectedPayment.type,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Due Date
                                            </p>
                                            <p className="font-bold text-slate-900 mt-1">
                                                {selectedPayment.dueDate
                                                    ? new Date(
                                                          selectedPayment.dueDate,
                                                      ).toLocaleDateString()
                                                    : "Not set"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                Paid At
                                            </p>
                                            <p className="font-bold text-slate-900 mt-1">
                                                {selectedPayment.paidAt
                                                    ? new Date(
                                                          selectedPayment.paidAt,
                                                      ).toLocaleString()
                                                    : "Not paid"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Parties
                                        </p>
                                        <p className="font-bold text-slate-900">
                                            {selectedPayment.senderName}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Receiver:{" "}
                                            {selectedPayment.receiverName}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Receipt
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            {selectedPayment.receiptUrl ||
                                                "No receipt file attached."}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            {selectedPayment.receiptCount || 0}{" "}
                                            total receipts
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Verification
                                        </p>
                                        <p className="text-xs text-slate-600">
                                            {selectedPayment.verificationDecision ||
                                                "Pending review"}
                                        </p>
                                        {selectedPayment.notes && (
                                            <p className="text-xs italic text-slate-500">
                                                "{selectedPayment.notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedPayment.status === "SUBMITTED" && (
                                <div className="space-y-3 pt-2">
                                    <Textarea
                                        value={paymentReviewNotes}
                                        onChange={(e) =>
                                            setPaymentReviewNotes(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Add review notes or a rejection reason..."
                                        className="min-h-28"
                                    />
                                    <DialogFooter className="gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => closePaymentDialog()}
                                            disabled={isProcessingPaymentAction}
                                        >
                                            Close
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                                            onClick={() =>
                                                handleReviewSelectedPayment(
                                                    "rejected",
                                                )
                                            }
                                            disabled={isProcessingPaymentAction}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                handleReviewSelectedPayment(
                                                    "verified",
                                                )
                                            }
                                            disabled={isProcessingPaymentAction}
                                        >
                                            {isProcessingPaymentAction
                                                ? "Saving..."
                                                : "Verify Payment"}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            )}

                            {selectedPayment.status === "VERIFIED" && (
                                <div className="space-y-3 pt-2">
                                    <Textarea
                                        value={paymentRefundReason}
                                        onChange={(e) =>
                                            setPaymentRefundReason(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Explain why this verified payment is being refunded..."
                                        className="min-h-28"
                                    />
                                    <DialogFooter className="gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => closePaymentDialog()}
                                            disabled={isProcessingPaymentAction}
                                        >
                                            Close
                                        </Button>
                                        <Button
                                            type="button"
                                            className="bg-red-600 hover:bg-red-700"
                                            onClick={
                                                handleRefundSelectedPayment
                                            }
                                            disabled={isProcessingPaymentAction}
                                        >
                                            {isProcessingPaymentAction
                                                ? "Processing..."
                                                : "Refund Payment"}
                                        </Button>
                                    </DialogFooter>
                                </div>
                            )}

                            {selectedPayment.status !== "SUBMITTED" &&
                                selectedPayment.status !== "VERIFIED" && (
                                    <DialogFooter className="pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => closePaymentDialog()}
                                        >
                                            Close
                                        </Button>
                                    </DialogFooter>
                                )}
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Export Report Dialog */}
            <Dialog open={exportReportOpen} onOpenChange={setExportReportOpen}>
                <DialogContent className="sm:max-w-md rounded-lg border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Export Report
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Select report type and date range
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider">
                                Report Type
                            </Label>
                            <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
                                <SelectTrigger className="h-10 rounded-md bg-slate-50 border-slate-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USERS">Users</SelectItem>
                                    <SelectItem value="CLUSTERS">Clusters</SelectItem>
                                    <SelectItem value="PAYMENTS">Payments</SelectItem>
                                    <SelectItem value="AUDIT_LOGS">Audit Logs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider">
                                Start Date (Optional)
                            </Label>
                            <Input
                                type="date"
                                value={reportStartDate}
                                onChange={(e) => setReportStartDate(e.target.value)}
                                className="h-10 rounded-md bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider">
                                End Date (Optional)
                            </Label>
                            <Input
                                type="date"
                                value={reportEndDate}
                                onChange={(e) => setReportEndDate(e.target.value)}
                                className="h-10 rounded-md bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setExportReportOpen(false)}
                            disabled={isExporting}
                            className="rounded-md border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExportReport}
                            disabled={isExporting}
                            className="rounded-md font-bold bg-primary hover:bg-primary/90"
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Export Report
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Analytics Section */}
            <motion.div variants={item}>
                <AnalyticsDashboard />
            </motion.div>
        </motion.div>
    );
};
