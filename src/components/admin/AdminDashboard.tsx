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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useClusters } from "@/src/hooks/useClusters";
import { mapClusterFromApi } from "@/src/lib/apiMappers";
import { paymentsAPI } from "@/src/services/api";
import {
    Activity,
    BrainCircuit,
    CheckCircle2,
    ChevronRight,
    FileSignature,
    FileText,
    Lock,
    MapPin,
    MoreVertical,
    Search,
    Shield,
    UserPlus,
    Users,
    Wallet,
    XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdmin } from "../../hooks/useAdmin";
import { Payment } from "../../types";
import { AdminAIPanel } from "./AdminAIPanel";
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

export const AdminDashboard: React.FC = () => {
    const {
        users,
        stats,
        isLoading,
        updateUserStatus,
        approveUser,
        fetchAllUsers,
        fetchAuditLogs,
    } = useAdmin();
    const { clusters: apiClusters, verifyCluster } = useClusters();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<
        "USERS" | "CLUSTERS" | "PAYMENTS" | "CONTRACTS" | "AI"
    >("USERS");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionType, setActionType] = useState<
        | "suspend"
        | "unsuspend"
        | "verify"
        | "changeRole"
        | "activate"
        | "deactivate"
        | null
    >(null);

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

    const pendingClusters = clusters.filter((c) => !c.isVerified);
    const pendingPayments = payments.filter((p) => p.status === "SUBMITTED");

    // Fetch payments on mount
    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await paymentsAPI.getAll();
                setPayments(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Failed to fetch payments", err);
            }
        };
        fetchPayments();
    }, []);

    const openActionDialog = (
        user: any,
        type:
            | "suspend"
            | "unsuspend"
            | "verify"
            | "changeRole"
            | "activate"
            | "deactivate",
    ) => {
        setSelectedUser(user);
        setActionType(type);
    };

    const closeActionDialog = () => {
        setSelectedUser(null);
        setActionType(null);
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
            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
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
            toast.success("Cluster verified successfully");
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
                        className="gap-2 h-10 px-4 rounded-md border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Export Report</span>
                    </Button>
                    <Button className="gap-2 h-10 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all">
                        <UserPlus className="w-4 h-4" />
                        <span className="font-medium">Invite User</span>
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
                                            {filteredUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="flex items-center justify-between p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all group"
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
                                        <div className="space-y-3">
                                            {clusters.map((cluster) => (
                                                <div
                                                    key={cluster.id}
                                                    className="flex items-center justify-between p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                                                            <MapPin className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm text-slate-900 tracking-tight">
                                                                {cluster.name}
                                                            </h4>
                                                            <p className="text-[11px] text-slate-500 font-medium">
                                                                {
                                                                    cluster.location
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {cluster.isVerified ? (
                                                            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
                                                                Verified
                                                            </Badge>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-md h-8 text-[10px] uppercase tracking-wider px-3"
                                                                onClick={() =>
                                                                    handleVerifyCluster(
                                                                        cluster.id,
                                                                    )
                                                                }
                                                            >
                                                                Verify Now
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-md h-8 w-8 hover:bg-white hover:text-primary border border-transparent hover:border-slate-200"
                                                        >
                                                            <ChevronRight className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {activeTab === "CONTRACTS" && (
                                        <div className="space-y-4">
                                            <Card className="p-6 border-slate-200">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-bold flex items-center gap-2">
                                                        <FileSignature className="w-4 h-4" />{" "}
                                                        Contract Templates
                                                    </h3>
                                                    <Button
                                                        size="sm"
                                                        className="bg-primary hover:bg-primary/90"
                                                    >
                                                        Create Template
                                                    </Button>
                                                </div>
                                                <p className="text-slate-500 text-sm">
                                                    Contract template management
                                                    interface coming soon.
                                                </p>
                                            </Card>
                                        </div>
                                    )}
                                    {activeTab === "PAYMENTS" && (
                                        <div className="space-y-3">
                                            {payments.map((payment) => (
                                                <div
                                                    key={payment.id}
                                                    className="flex items-center justify-between p-4 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-md bg-white border border-slate-200 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                                                            <Wallet className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm text-slate-900 tracking-tight">
                                                                $
                                                                {payment.amount.toLocaleString()}
                                                            </h4>
                                                            <p className="text-[11px] text-slate-500 font-medium">
                                                                {
                                                                    payment.agreementTitle
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge
                                                            className={cn(
                                                                "font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider border",
                                                                payment.status ===
                                                                    "VERIFIED"
                                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                                    : payment.status ===
                                                                        "SUBMITTED"
                                                                      ? "bg-amber-50 text-amber-600 border-amber-100"
                                                                      : "bg-slate-50 text-slate-600 border-slate-200",
                                                            )}
                                                        >
                                                            {payment.status}
                                                        </Badge>
                                                        {payment.status ===
                                                            "SUBMITTED" && (
                                                            <Button
                                                                size="sm"
                                                                className="bg-primary hover:bg-primary/90 font-bold rounded-md h-8 text-[10px] uppercase tracking-wider px-3"
                                                                onClick={() =>
                                                                    handleVerifyPayment(
                                                                        payment.id,
                                                                    )
                                                                }
                                                            >
                                                                Verify
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
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
                                            pendingPayments.length}
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
                                {pendingPayments.slice(0, 2).map((payment) => (
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
                                                        {payment.agreementTitle}
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
        </motion.div>
    );
};
