import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { clustersAPI, usersAPI } from "@/src/services/api";
import { Loader2, Search, UserPlus } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface PlatformUser {
    id: string;
    email: string;
    fullName: string;
    role: string;
}

function unwrapUsers(payload: unknown): PlatformUser[] {
    const rows = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object" && Array.isArray((payload as any).data)
          ? (payload as any).data
          : payload && typeof payload === "object" && Array.isArray((payload as any).items)
            ? (payload as any).items
            : [];
    return rows.map((u: Record<string, unknown>) => ({
        id: String(u.id),
        email: String(u.email ?? ""),
        fullName: String(u.full_name ?? u.fullName ?? "Unknown"),
        role: String(u.role ?? "FARMER"),
    }));
}

interface AddClusterMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clusterId: string;
    existingMemberIds: string[];
    onAdded: () => void;
}

export const AddClusterMemberDialog: React.FC<AddClusterMemberDialogProps> = ({
    open,
    onOpenChange,
    clusterId,
    existingMemberIds,
    onAdded,
}) => {
    const [search, setSearch] = useState("");
    const [clusterRole, setClusterRole] = useState<"FARMER" | "REPRESENTATIVE">(
        "FARMER",
    );
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    const fetchFarmers = useCallback(async (query: string) => {
        setLoading(true);
        try {
            const response = await usersAPI.searchUsers(
                query.trim() || undefined,
                "FARMER",
            );
            setUsers(unwrapUsers(response.data));
        } catch (err: any) {
            toast.error(
                err?.response?.data?.error || "Failed to search farmers",
            );
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        const timer = setTimeout(() => fetchFarmers(search), 300);
        return () => clearTimeout(timer);
    }, [open, search, fetchFarmers]);

    useEffect(() => {
        if (!open) {
            setSearch("");
            setClusterRole("FARMER");
            setUsers([]);
        }
    }, [open]);

    const availableUsers = users.filter(
        (u) => !existingMemberIds.includes(u.id),
    );

    const handleAdd = async (user: PlatformUser) => {
        if (!user.email) {
            toast.error("User has no email on file");
            return;
        }
        setAddingId(user.id);
        try {
            await clustersAPI.inviteMember(
                clusterId,
                user.email,
                clusterRole,
            );
            toast.success(`${user.fullName} added to cluster`);
            onAdded();
        } catch (err: any) {
            toast.error(
                err?.response?.data?.error || "Failed to add member",
            );
        } finally {
            setAddingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg rounded-lg border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
                        Add Member from Platform
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Search existing farmers and add them to this cluster
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Cluster role for new members
                        </Label>
                        <Select
                            value={clusterRole}
                            onValueChange={(v: "FARMER" | "REPRESENTATIVE") =>
                                setClusterRole(v)
                            }
                        >
                            <SelectTrigger className="h-9 rounded-md text-xs border-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-md border-slate-200">
                                <SelectItem
                                    value="FARMER"
                                    className="text-xs font-medium"
                                >
                                    Farmer
                                </SelectItem>
                                <SelectItem
                                    value="REPRESENTATIVE"
                                    className="text-xs font-medium"
                                >
                                    Cluster Representative
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="pl-9 h-9 rounded-md text-xs border-slate-200"
                        />
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-md border border-slate-200 p-2 bg-slate-50/50">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-slate-500 text-sm gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Searching farmers...
                            </div>
                        ) : availableUsers.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                                {users.length > 0
                                    ? "All matching farmers are already members."
                                    : search
                                      ? "No farmers found. Try a different search."
                                      : "Type to search platform farmers."}
                            </p>
                        ) : (
                            availableUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between p-3 rounded-md bg-white border border-slate-200"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm text-slate-900 truncate">
                                            {user.fullName}
                                        </p>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={addingId === user.id}
                                        onClick={() => handleAdd(user)}
                                        className={cn(
                                            "shrink-0 ml-2 h-8 text-[10px] font-bold uppercase tracking-wider gap-1",
                                        )}
                                    >
                                        {addingId === user.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <UserPlus className="w-3 h-3" />
                                        )}
                                        Add
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
