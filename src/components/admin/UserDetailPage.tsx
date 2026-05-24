import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { adminAPI, usersAPI } from "@/src/services/api";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Edit2,
    Key,
    RefreshCw,
    Save,
    X,
    User,
    Calendar,
    Shield,
    FileText,
    Activity,
    Clock,
    MapPin,
    Phone,
    Mail,
    Building2,
    TrendingUp,
    AlertTriangle,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAdmin } from "../../hooks/useAdmin";
import { UserActionsDialog } from "./UserActionsDialog";

function normalizeUserProfile(data: any) {
    if (!data) return null;

    return {
        ...data,
        fullName: data.fullName ?? data.full_name ?? "",
        avatarUrl: data.avatarUrl ?? data.avatar_url ?? null,
        verificationStatus:
            data.verificationStatus ?? data.verification_status ?? "UNVERIFIED",
        createdAt: data.createdAt ?? data.created_at ?? null,
        lastLoginAt: data.lastLoginAt ?? data.last_login_at ?? null,
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        location: data.location ?? null,
    };
}

export const UserDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { users, fetchAllUsers } = useAdmin();

    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAction, setSelectedAction] = useState<
        "suspend" | "unsuspend" | "verify" | "changeRole" | null
    >(null);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [passwordResetOpen, setPasswordResetOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            try {
                setIsLoading(true);
                // Always hydrate from the profile endpoint because the admin list omits
                // editable profile fields like bio/location.
                const response = await usersAPI.getProfile(id!);
                let userData = normalizeUserProfile(response.data);

                if (!userData) {
                    userData = normalizeUserProfile(
                        users.find((u) => u.id === id),
                    );
                }

                setUser(userData);
                setEditData(userData);
            } catch (err) {
                console.error("Failed to load user:", err);
                toast.error("Failed to load user details");
                setTimeout(() => navigate("/admin"), 2000);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) loadUser();
    }, [id, users, navigate]);

    const handleSaveProfile = async () => {
        if (!editData || !id) return;

        try {
            setIsSaving(true);
            const payload: any = {};

            // Only include changed fields
            if (editData.fullName !== user.fullName)
                payload.fullName = editData.fullName;
            if (editData.phone !== user.phone) payload.phone = editData.phone;
            if (editData.location !== user.location)
                payload.location = editData.location;
            if (editData.bio !== user.bio) payload.bio = editData.bio;

            if (Object.keys(payload).length === 0) {
                toast.info("No changes to save");
                setIsEditing(false);
                return;
            }

            await usersAPI.updateProfile(id, payload);
            setIsEditing(false);
            toast.success("Profile updated successfully");

            // Refresh user data from API to ensure displayed data matches saved data
            try {
                const response = await usersAPI.getProfile(id);
                const refreshedUser = normalizeUserProfile(response.data);
                setUser(refreshedUser);
                setEditData(refreshedUser);
            } catch (err) {
                console.error("Failed to refresh user:", err);
            }

            // Refresh the users list
            await fetchAllUsers();
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.error || "Failed to update profile";
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleActionSuccess = async () => {
        setActionDialogOpen(false);
        setSelectedAction(null);
        if (id) {
            try {
                const response = await usersAPI.getProfile(id);
                const refreshedUser = normalizeUserProfile(response.data);
                setUser(refreshedUser);
                setEditData(refreshedUser);
            } catch (err) {
                console.error("Failed to refresh user:", err);
            }
        }
    };

    const handlePasswordReset = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error("Please enter both password fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        try {
            setIsResettingPassword(true);
            await adminAPI.resetUserPassword(id!, newPassword);
            toast.success("Password reset successfully");
            setPasswordResetOpen(false);
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.error || "Failed to reset password";
            toast.error(errorMessage);
        } finally {
            setIsResettingPassword(false);
        }
    };

    const openActionDialog = (
        action: "suspend" | "unsuspend" | "verify" | "changeRole",
    ) => {
        setSelectedAction(action);
        setActionDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">Loading user details...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">User not found</div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "SUSPENDED":
                return "bg-red-50 text-red-700 border-red-200";
            case "PENDING_APPROVAL":
                return "bg-amber-50 text-amber-700 border-amber-200";
            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const getVerificationColor = (status: string) => {
        switch (status) {
            case "VERIFIED":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "REJECTED":
                return "bg-red-50 text-red-700 border-red-200";
            case "PENDING":
                return "bg-amber-50 text-amber-700 border-amber-200";
            default:
                return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const getRoleColor = (role: string) => {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-slate-50"
        >
            <div className="mx-auto space-y-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="font-medium">Back to Admin</span>
                    </button>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <Button
                                onClick={() => setIsEditing(true)}
                                className="gap-2 rounded-md font-bold text-[10px] uppercase"
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </Button>
                        ) : (
                            <>
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="gap-2 rounded-md font-bold text-[10px] uppercase bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditData(user);
                                    }}
                                    variant="outline"
                                    className="gap-2 rounded-md border-slate-200"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Sidebar - User Avatar & Key Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                            <CardContent className="p-6">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-3xl shadow-sm">
                                    {user.fullName?.charAt(0) ||
                                        user.email?.charAt(0) ||
                                        "U"}
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1 text-center">
                                    {user.fullName || "Unknown User"}
                                </h2>
                                <p className="text-sm text-slate-500 mb-6 text-center">
                                    {user.email}
                                </p>

                                <div className="space-y-2 mb-6">
                                    <Badge
                                        className={cn(
                                            "w-full justify-center font-bold text-[11px] uppercase tracking-wider py-2",
                                            getStatusColor(user.status),
                                        )}
                                    >
                                        {user.status || "UNKNOWN"}
                                    </Badge>
                                    <Badge
                                        className={cn(
                                            "w-full justify-center font-bold text-[11px] uppercase tracking-wider py-2",
                                            getRoleColor(user.role),
                                        )}
                                    >
                                        {user.role}
                                    </Badge>
                                    <Badge
                                        className={cn(
                                            "w-full justify-center font-bold text-[11px] uppercase tracking-wider py-2",
                                            getVerificationColor(
                                                user.verificationStatus,
                                            ),
                                        )}
                                    >
                                        {user.verificationStatus ||
                                            "UNVERIFIED"}
                                    </Badge>
                                </div>

                                {/* Quick Info */}
                                <div className="space-y-3 mb-6 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Member Since</p>
                                            <p className="text-xs font-medium text-slate-900">
                                                {user.createdAt
                                                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        year: "numeric"
                                                    })
                                                    : "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Login</p>
                                            <p className="text-xs font-medium text-slate-900">
                                                {user.lastLoginAt
                                                    ? new Date(user.lastLoginAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric"
                                                    })
                                                    : "Never"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Actions */}
                                <div className="space-y-2">
                                    {user.status === "ACTIVE" && (
                                        <Button
                                            onClick={() =>
                                                openActionDialog("suspend")
                                            }
                                            className="w-full bg-rose-600 hover:bg-rose-700 font-bold text-[10px] uppercase h-9 rounded-md"
                                        >
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Suspend User
                                        </Button>
                                    )}
                                    {user.status === "SUSPENDED" && (
                                        <Button
                                            onClick={() =>
                                                openActionDialog("unsuspend")
                                            }
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-[10px] uppercase h-9 rounded-md"
                                        >
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Unsuspend User
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() =>
                                            openActionDialog("verify")
                                        }
                                        variant="outline"
                                        className="w-full border-slate-200 font-bold text-[10px] uppercase h-9 rounded-md"
                                    >
                                        <Shield className="w-3 h-3 mr-1" />
                                        Update Verification
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            openActionDialog("changeRole")
                                        }
                                        variant="outline"
                                        className="w-full border-slate-200 font-bold text-[10px] uppercase h-9 rounded-md"
                                    >
                                        <User className="w-3 h-3 mr-1" />
                                        Change Role
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            setPasswordResetOpen(true)
                                        }
                                        variant="outline"
                                        className="w-full border-slate-200 font-bold text-[10px] uppercase h-9 rounded-md gap-1"
                                    >
                                        <Key className="w-3 h-3" />
                                        Reset Password
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats Card */}
                        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2">
                                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                                    Account Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Age</span>
                                    <span className="font-bold text-xs text-slate-900">
                                        {user.createdAt
                                            ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                                            : 0} days
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Profile Complete</span>
                                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold text-[9px] uppercase tracking-wider px-1.5 py-0 rounded-md">
                                        {user.fullName && user.phone && user.location ? '100%' : 'Partial'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Content - Tabs */}
                    <div className="lg:col-span-2">
                        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                            <CardContent className="p-6">
                                <Tabs defaultValue="info" className="space-y-4">
                                    <TabsList className="bg-slate-100 p-1 rounded-md h-10 border border-slate-200 w-full">
                                        <TabsTrigger
                                            value="info"
                                            className="flex-1 rounded-sm px-3 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                        >
                                            <User className="w-3 h-3 mr-1" />
                                            Profile
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="activity"
                                            className="flex-1 rounded-sm px-3 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                        >
                                            <Activity className="w-3 h-3 mr-1" />
                                            Activity
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="kyc"
                                            className="flex-1 rounded-sm px-3 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                        >
                                            <FileText className="w-3 h-3 mr-1" />
                                            Documents
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Profile Info Tab */}
                                    <TabsContent
                                        value="info"
                                        className="space-y-4 mt-4"
                                    >
                                        {isEditing ? (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                        <User className="w-3 h-3" />
                                                        Full Name
                                                    </Label>
                                                    <Input
                                                        value={
                                                            editData?.fullName ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                fullName:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                                                        placeholder="Full name"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                        <Mail className="w-3 h-3" />
                                                        Email
                                                    </Label>
                                                    <Input
                                                        value={
                                                            editData?.email ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                email: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                                                        placeholder="Email"
                                                        type="email"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                        <Phone className="w-3 h-3" />
                                                        Phone
                                                    </Label>
                                                    <Input
                                                        value={
                                                            editData?.phone ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                phone: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                                                        placeholder="Phone"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                        <MapPin className="w-3 h-3" />
                                                        Location
                                                    </Label>
                                                    <Input
                                                        value={
                                                            editData?.location ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                location:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                                                        placeholder="Location"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                                        <FileText className="w-3 h-3" />
                                                        Bio
                                                    </Label>
                                                    <Textarea
                                                        value={
                                                            editData?.bio || ""
                                                        }
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                bio: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        className="min-h-24 text-xs rounded-md bg-slate-50 border-slate-200"
                                                        placeholder="Bio"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                                                    <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                            Full Name
                                                        </p>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {user.fullName ||
                                                                "Not provided"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                                                    <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <Mail className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                            Email
                                                        </p>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                                                    <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <Phone className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                            Phone
                                                        </p>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {user.phone ||
                                                                "Not provided"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                                                    <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <MapPin className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                            Location
                                                        </p>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {user.location ||
                                                                "Not provided"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                            Bio
                                                        </p>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {user.bio ||
                                                                "Not provided"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* Activity Tab */}
                                    <TabsContent
                                        value="activity"
                                        className="space-y-4 mt-4"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                                                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Calendar className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                        Account Created
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {user.createdAt
                                                            ? new Date(
                                                                  user.createdAt,
                                                              ).toLocaleDateString(
                                                                  "en-US",
                                                                  {
                                                                      year: "numeric",
                                                                      month: "long",
                                                                      day: "numeric",
                                                                      hour: "2-digit",
                                                                      minute: "2-digit",
                                                                  },
                                                              )
                                                            : "Not available"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                                                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Clock className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                        Last Login
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {user.lastLoginAt
                                                            ? new Date(
                                                                  user.lastLoginAt,
                                                              ).toLocaleDateString(
                                                                  "en-US",
                                                                  {
                                                                      year: "numeric",
                                                                      month: "long",
                                                                      day: "numeric",
                                                                      hour: "2-digit",
                                                                      minute: "2-digit",
                                                                  },
                                                              )
                                                            : "Never"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                                                    <Activity className="w-4 h-4 text-slate-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                        Account Status
                                                    </p>
                                                    <Badge className={cn("mt-1", getStatusColor(user.status))}>
                                                        {user.status || "UNKNOWN"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* Documents Tab */}
                                    <TabsContent
                                        value="kyc"
                                        className="space-y-4 mt-4"
                                    >
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                                                <FileText className="w-8 h-8 text-slate-400" />
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 mb-2">KYC Documents</h3>
                                            <p className="text-sm text-slate-500 mb-4">
                                                {user.verificationStatus === 'VERIFIED'
                                                    ? 'User has completed KYC verification'
                                                    : user.verificationStatus === 'PENDING'
                                                    ? 'KYC verification is pending review'
                                                    : 'User has not submitted KYC documents yet'}
                                            </p>
                                            <Badge className={cn("mb-6", getVerificationColor(user.verificationStatus))}>
                                                {user.verificationStatus || "UNVERIFIED"}
                                            </Badge>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Action Dialog */}
            {selectedAction && (
                <UserActionsDialog
                    user={user}
                    actionType={selectedAction}
                    open={actionDialogOpen}
                    onOpenChange={setActionDialogOpen}
                    onSuccess={handleActionSuccess}
                />
            )}

            {/* Password Reset Dialog */}
            <Dialog
                open={passwordResetOpen}
                onOpenChange={setPasswordResetOpen}
            >
                <DialogContent className="sm:max-w-120 rounded-lg border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-primary" />
                            Reset Password
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Set a new password for{" "}
                            {user?.fullName || user?.email}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider">
                                New Password
                            </Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="h-10 rounded-md bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider">
                                Confirm Password
                            </Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Confirm password"
                                className="h-10 rounded-md bg-slate-50 border-slate-200"
                            />
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                            Password must be at least 8 characters long.
                        </p>
                    </div>

                    <DialogFooter className="pt-4 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPasswordResetOpen(false)}
                            className="rounded-md border-slate-200"
                            disabled={isResettingPassword}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handlePasswordReset}
                            disabled={isResettingPassword}
                            className="rounded-md font-bold bg-primary hover:bg-primary/90"
                        >
                            {isResettingPassword ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Key className="w-4 h-4 mr-2" />
                                    Reset Password
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};
