import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { mapClusterFromApi } from "@/src/lib/apiMappers";
import type { Cluster, ClusterStatus } from "@/src/types";
import {
    ArrowLeft,
    CheckCircle2,
    Crown,
    Edit2,
    Loader2,
    MapPin,
    Save,
    Trash2,
    UserPlus,
    Users,
    X,
    XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useClusters } from "../../hooks/useClusters";
import { ClusterLocationPicker } from "../clusters/ClusterLocationPicker";
import { AddClusterMemberDialog } from "./AddClusterMemberDialog";
import {
    ClusterActionType,
    ClusterActionsDialog,
} from "./ClusterActionsDialog";
import { ClusterLocationMap } from "./ClusterLocationMap";

function normalizeClusterDto(data: Record<string, unknown> | null) {
    if (!data) return null;
    return mapClusterFromApi(data);
}

interface ClusterMember {
    id: string;
    name: string;
    email: string;
    role: string;
    cluster_role: string;
    joined_at?: string;
}

function ClusterCoverImage({
    url,
    name,
    className,
}: {
    url?: string;
    name: string;
    className?: string;
}) {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [url]);

    const showImage = Boolean(url?.trim()) && !failed;

    return (
        <div
            className={cn(
                "relative w-full aspect-16/10 bg-emerald-500/10 overflow-hidden shrink-0",
                className,
            )}
        >
            {showImage ? (
                <img
                    src={url}
                    alt={`${name} cover`}
                    className="w-full h-full object-cover"
                    onError={() => setFailed(true)}
                />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-br from-emerald-600/15 via-slate-100 to-primary/10">
                    <MapPin className="w-10 h-10 text-emerald-600/50" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        No cover image
                    </span>
                </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />
        </div>
    );
}

export const ClusterDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        getCluster,
        updateCluster,
        listMembers,
        removeMember,
        assignRepresentative,
        fetchClusters,
    } = useClusters();

    const [cluster, setCluster] = useState<Cluster | null>(null);
    const [members, setMembers] = useState<ClusterMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Cluster | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAction, setSelectedAction] =
        useState<ClusterActionType | null>(null);
    const [actionDialogOpen, setActionDialogOpen] = useState(false);
    const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
    const [selectedRepUserId, setSelectedRepUserId] = useState("");
    const [assigningRep, setAssigningRep] = useState(false);

    const loadCluster = async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const data = await getCluster(id);
            const normalized = normalizeClusterDto(
                data as Record<string, unknown>,
            );
            setCluster(normalized);
            setEditData(normalized);
        } catch {
            toast.error("Failed to load cluster details");
            setTimeout(() => navigate("/admin"), 2000);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMembers = async () => {
        if (!id) return;
        setLoadingMembers(true);
        try {
            const data = await listMembers(id);
            setMembers(Array.isArray(data) ? data : []);
        } catch {
            setMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadCluster();
            loadMembers();
        }
    }, [id]);

    const handleSaveProfile = async () => {
        if (!editData || !id || !cluster) return;

        try {
            setIsSaving(true);
            const payload: Record<string, unknown> = {};

            if (editData.name !== cluster.name) payload.name = editData.name;
            if (editData.location !== cluster.location)
                payload.location = editData.location;
            if (editData.region !== cluster.region)
                payload.region = editData.region;
            if (editData.size !== cluster.size)
                payload.area_hectares = editData.size || undefined;
            if (editData.description !== cluster.description)
                payload.description = editData.description || undefined;
            if (editData.imageUrl !== cluster.imageUrl)
                payload.image_url = editData.imageUrl || undefined;
            if (editData.centerLatitude !== cluster.centerLatitude)
                payload.center_latitude = editData.centerLatitude;
            if (editData.centerLongitude !== cluster.centerLongitude)
                payload.center_longitude = editData.centerLongitude;

            if (Object.keys(payload).length === 0) {
                toast.info("No changes to save");
                setIsEditing(false);
                return;
            }

            const response = await updateCluster(id, payload);
            const refreshed = normalizeClusterDto(
                response as Record<string, unknown>,
            );
            setCluster(refreshed);
            setEditData(refreshed);
            setIsEditing(false);
            await fetchClusters();
        } catch {
            // toast from hook
        } finally {
            setIsSaving(false);
        }
    };

    const handleActionSuccess = async () => {
        setActionDialogOpen(false);
        setSelectedAction(null);
        if (selectedAction === "archive") {
            navigate("/admin");
            return;
        }
        await loadCluster();
        await fetchClusters();
    };

    const handleRemoveMember = async (userId: string) => {
        if (!id) return;
        try {
            await removeMember(id, userId);
            await loadMembers();
        } catch {
            // toast from hook
        }
    };

    const handleAssignRepresentative = async (userId?: string) => {
        const targetId = userId ?? selectedRepUserId;
        if (!id || !targetId) return;
        if (targetId === cluster?.ownerId) {
            toast.info("This member is already the representative");
            return;
        }
        try {
            setAssigningRep(true);
            await assignRepresentative(id, targetId);
            await loadCluster();
            await loadMembers();
            setSelectedRepUserId("");
        } catch {
            // toast from hook
        } finally {
            setAssigningRep(false);
        }
    };

    const currentRepresentative = members.find(
        (m) => m.id === cluster?.ownerId,
    );

    const openActionDialog = (action: ClusterActionType) => {
        setSelectedAction(action);
        setActionDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">Loading cluster details...</div>
            </div>
        );
    }

    if (!cluster) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-slate-600">Cluster not found</div>
            </div>
        );
    }

    const getStatusColor = (status?: ClusterStatus) => {
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

    const getVerificationColor = (verified: boolean) =>
        verified
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200";

    const displayCluster = isEditing && editData ? editData : cluster;
    const coverImageUrl = displayCluster.imageUrl;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-slate-50 p-6"
        >
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate("/admin")}
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
                                Edit Cluster
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
                                        setEditData(cluster);
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden p-0">
                            <ClusterCoverImage
                                key={coverImageUrl ?? "no-image"}
                                url={coverImageUrl}
                                name={displayCluster.name}
                            />
                            <CardContent className="p-6 pt-4">
                                <h2 className="text-lg font-bold text-slate-900 mb-1 text-center">
                                    {displayCluster.name}
                                </h2>
                                <p className="text-sm text-slate-500 mb-4 text-center">
                                    {displayCluster.location}
                                </p>

                                <div className="space-y-2 mb-6">
                                    <Badge
                                        className={cn(
                                            "w-full justify-center font-bold text-[11px] uppercase tracking-wider",
                                            getStatusColor(cluster.status),
                                        )}
                                    >
                                        {cluster.status || "ACTIVE"}
                                    </Badge>
                                    <Badge
                                        className={cn(
                                            "w-full justify-center font-bold text-[11px] uppercase tracking-wider",
                                            getVerificationColor(
                                                cluster.isVerified,
                                            ),
                                        )}
                                    >
                                        {cluster.isVerified
                                            ? "Verified"
                                            : "Pending Verification"}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className="w-full justify-center font-bold text-[11px] uppercase tracking-wider bg-slate-50 text-slate-600 border-slate-200"
                                    >
                                        {cluster.memberCount} Members
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    {!cluster.isVerified ? (
                                        <Button
                                            onClick={() =>
                                                openActionDialog("verify")
                                            }
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-[10px] uppercase h-9 rounded-md"
                                        >
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Verify Cluster
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() =>
                                                openActionDialog("unverify")
                                            }
                                            variant="outline"
                                            className="w-full border-amber-200 text-amber-700 font-bold text-[10px] uppercase h-9 rounded-md"
                                        >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Remove Verification
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() =>
                                            openActionDialog("changeStatus")
                                        }
                                        variant="outline"
                                        className="w-full border-slate-200 font-bold text-[10px] uppercase h-9 rounded-md"
                                    >
                                        Change Status
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            openActionDialog("archive")
                                        }
                                        variant="outline"
                                        className="w-full border-red-200 text-red-700 font-bold text-[10px] uppercase h-9 rounded-md gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Archive Cluster
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                            <CardContent className="p-6">
                                <Tabs defaultValue="info" className="space-y-4">
                                    <TabsList className="bg-slate-100 p-1 rounded-md h-10 border border-slate-200 w-full">
                                        <TabsTrigger
                                            value="info"
                                            className="flex-1 rounded-sm px-4 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                        >
                                            Cluster Info
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="members"
                                            className="flex-1 rounded-sm px-4 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                        >
                                            Members
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="activity"
                                            className="flex-1 rounded-sm px-4 h-full font-bold text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                        >
                                            Activity
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent
                                        value="info"
                                        className="space-y-4 mt-4"
                                    >
                                        {isEditing && editData ? (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        value={editData.name}
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                name: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider">
                                                            Location
                                                        </Label>
                                                        <Input
                                                            value={
                                                                editData.location
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
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase tracking-wider">
                                                            Region
                                                        </Label>
                                                        <Input
                                                            value={
                                                                editData.region
                                                            }
                                                            onChange={(e) =>
                                                                setEditData({
                                                                    ...editData,
                                                                    region: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            }
                                                            className="h-10 rounded-md bg-slate-50 border-slate-200"
                                                        />
                                                    </div>
                                                </div>
                                                <ClusterLocationPicker
                                                    latitude={
                                                        editData.centerLatitude
                                                    }
                                                    longitude={
                                                        editData.centerLongitude
                                                    }
                                                    onChange={({
                                                        latitude,
                                                        longitude,
                                                    }) =>
                                                        setEditData({
                                                            ...editData,
                                                            centerLatitude:
                                                                latitude,
                                                            centerLongitude:
                                                                longitude,
                                                        })
                                                    }
                                                />
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider">
                                                        Area (Hectares)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={
                                                            editData.size || ""
                                                        }
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                size: Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            })
                                                        }
                                                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider">
                                                        Cover Image URL
                                                    </Label>
                                                    <Input
                                                        value={
                                                            editData.imageUrl ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                imageUrl:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="h-10 rounded-md bg-slate-50 border-slate-200"
                                                        placeholder="https://..."
                                                    />
                                                    <p className="text-[10px] text-slate-400 font-medium">
                                                        Preview updates in the
                                                        sidebar cover above.
                                                    </p>
                                                    {editData.imageUrl && (
                                                        <div className="rounded-md overflow-hidden border border-slate-200 aspect-video max-h-36">
                                                            <ClusterCoverImage
                                                                key={
                                                                    editData.imageUrl
                                                                }
                                                                url={
                                                                    editData.imageUrl
                                                                }
                                                                name={
                                                                    editData.name
                                                                }
                                                                className="aspect-video max-h-36"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold uppercase tracking-wider">
                                                        Description
                                                    </Label>
                                                    <Textarea
                                                        value={
                                                            editData.description ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setEditData({
                                                                ...editData,
                                                                description:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="min-h-24 text-xs rounded-md bg-slate-50 border-slate-200"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {cluster.imageUrl && (
                                                    <div className="rounded-md overflow-hidden border border-slate-200">
                                                        <ClusterCoverImage
                                                            url={cluster.imageUrl}
                                                            name={cluster.name}
                                                            className="aspect-video max-h-48"
                                                        />
                                                    </div>
                                                )}
                                                <div className="space-y-3">
                                                {[
                                                    ["Name", cluster.name],
                                                    [
                                                        "Location",
                                                        cluster.location,
                                                    ],
                                                    ["Region", cluster.region],
                                                    [
                                                        "Area",
                                                        cluster.size
                                                            ? `${cluster.size} ha`
                                                            : "Not set",
                                                    ],
                                                    [
                                                        "Description",
                                                        cluster.description ||
                                                            "Not provided",
                                                    ],
                                                    [
                                                        "Owner ID",
                                                        cluster.ownerId ||
                                                            "Unknown",
                                                    ],
                                                ].map(([label, value]) => (
                                                    <div
                                                        key={label}
                                                        className="flex justify-between items-start pb-3 border-b border-slate-200 last:border-0"
                                                    >
                                                        <div>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                                {label}
                                                            </p>
                                                            <p className="text-sm font-medium text-slate-900 mt-1">
                                                                {value}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent
                                        value="members"
                                        className="space-y-4 mt-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                {members.length} member
                                                {members.length !== 1
                                                    ? "s"
                                                    : ""}
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200 gap-1"
                                                onClick={() =>
                                                    setShowAddMemberDialog(true)
                                                }
                                            >
                                                <UserPlus className="w-3 h-3" />
                                                Add from Platform
                                            </Button>
                                        </div>

                                        {members.length > 0 && (
                                            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-3">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                                        Cluster Representative
                                                    </p>
                                                    {currentRepresentative ? (
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {currentRepresentative.name}{" "}
                                                            <span className="text-slate-500 font-normal">
                                                                ({currentRepresentative.email})
                                                            </span>
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-slate-500">
                                                            Not assigned
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-end gap-2">
                                                    <div className="flex-1 min-w-48 space-y-1">
                                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                            Assign from members
                                                        </Label>
                                                        <Select
                                                            value={
                                                                selectedRepUserId ||
                                                                undefined
                                                            }
                                                            onValueChange={
                                                                setSelectedRepUserId
                                                            }
                                                        >
                                                            <SelectTrigger className="h-9 rounded-md text-xs border-slate-200 bg-white">
                                                                <SelectValue placeholder="Select a member..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {members.map(
                                                                    (m) => (
                                                                        <SelectItem
                                                                            key={
                                                                                m.id
                                                                            }
                                                                            value={
                                                                                m.id
                                                                            }
                                                                            className="text-xs"
                                                                        >
                                                                            {
                                                                                m.name
                                                                            }
                                                                            {m.id ===
                                                                            cluster.ownerId
                                                                                ? " (current)"
                                                                                : ""}
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        disabled={
                                                            !selectedRepUserId ||
                                                            assigningRep ||
                                                            selectedRepUserId ===
                                                                cluster.ownerId
                                                        }
                                                        onClick={() =>
                                                            handleAssignRepresentative()
                                                        }
                                                        className="h-9 text-[10px] font-bold uppercase tracking-wider gap-1"
                                                    >
                                                        {assigningRep ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <Crown className="w-3 h-3" />
                                                        )}
                                                        Assign
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {loadingMembers ? (
                                            <p className="text-sm text-slate-500">
                                                Loading members...
                                            </p>
                                        ) : members.length === 0 ? (
                                            <div className="text-center py-8 rounded-md border border-dashed border-slate-200 bg-slate-50/50">
                                                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                                <p className="text-sm text-slate-500">
                                                    No members yet
                                                </p>
                                                <p className="text-[11px] text-slate-400 mt-1">
                                                    Add farmers from the platform
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {members.map((m) => {
                                                    const isRepresentative =
                                                        m.id === cluster.ownerId;
                                                    return (
                                                        <div
                                                            key={m.id}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-md border",
                                                                isRepresentative
                                                                    ? "bg-emerald-50/80 border-emerald-200"
                                                                    : "bg-slate-50 border-slate-200",
                                                            )}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-bold text-sm text-slate-900">
                                                                        {m.name}
                                                                    </p>
                                                                    {isRepresentative && (
                                                                        <Badge className="bg-emerald-600 text-white border-none font-bold text-[8px] uppercase tracking-wider px-1.5 py-0 gap-0.5">
                                                                            <Crown className="w-2.5 h-2.5" />
                                                                            Representative
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-slate-500">
                                                                    {m.email} ·{" "}
                                                                    {m.cluster_role}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                                                {!isRepresentative && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200"
                                                                        disabled={
                                                                            assigningRep
                                                                        }
                                                                        onClick={() =>
                                                                            handleAssignRepresentative(
                                                                                m.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Crown className="w-3 h-3 mr-0.5" />
                                                                        Make Rep
                                                                    </Button>
                                                                )}
                                                                {!isRepresentative && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() =>
                                                                            handleRemoveMember(
                                                                                m.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent
                                        value="activity"
                                        className="space-y-4 mt-4"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-start pb-3 border-b border-slate-200">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        Created
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-900 mt-1">
                                                        {cluster.establishedDate
                                                            ? new Date(
                                                                  cluster.establishedDate,
                                                              ).toLocaleString()
                                                            : "Not available"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                        Last Updated
                                                    </p>
                                                    <p className="text-sm font-medium text-slate-900 mt-1">
                                                        {cluster.updatedAt
                                                            ? new Date(
                                                                  cluster.updatedAt,
                                                              ).toLocaleString()
                                                            : "Not available"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <ClusterLocationMap cluster={cluster} />
            </div>

            {selectedAction && (
                <ClusterActionsDialog
                    cluster={cluster}
                    actionType={selectedAction}
                    open={actionDialogOpen}
                    onOpenChange={setActionDialogOpen}
                    onSuccess={handleActionSuccess}
                />
            )}

            <AddClusterMemberDialog
                open={showAddMemberDialog}
                onOpenChange={setShowAddMemberDialog}
                clusterId={cluster.id}
                existingMemberIds={members.map((m) => m.id)}
                onAdded={loadMembers}
            />
        </motion.div>
    );
};
