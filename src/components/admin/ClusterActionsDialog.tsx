import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Cluster, ClusterStatus } from "@/src/types";
import { AlertCircle, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useClusters } from "../../hooks/useClusters";

export type ClusterActionType =
    | "verify"
    | "unverify"
    | "archive"
    | "changeStatus";

interface ClusterActionsDialogProps {
    cluster: Cluster;
    actionType: ClusterActionType;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export const ClusterActionsDialog: React.FC<ClusterActionsDialogProps> = ({
    cluster,
    actionType,
    open,
    onOpenChange,
    onSuccess,
}) => {
    const {
        verifyCluster,
        unverifyCluster,
        deleteCluster,
        updateCluster,
        isLoading,
    } = useClusters();

    const [selectedStatus, setSelectedStatus] = useState<ClusterStatus>(
        cluster.status || "ACTIVE",
    );
    const [archiveReason, setArchiveReason] = useState("");

    const resetForm = () => {
        setSelectedStatus(cluster.status || "ACTIVE");
        setArchiveReason("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cluster?.id) return;

        try {
            switch (actionType) {
                case "verify":
                    await verifyCluster(cluster.id);
                    break;
                case "unverify":
                    await unverifyCluster(cluster.id);
                    break;
                case "changeStatus":
                    if (selectedStatus === cluster.status) {
                        toast.error("Cluster already has this status");
                        return;
                    }
                    await updateCluster(cluster.id, { status: selectedStatus });
                    break;
                case "archive":
                    if (!archiveReason.trim()) {
                        toast.error("Archive reason is required");
                        return;
                    }
                    await deleteCluster(cluster.id);
                    break;
            }
            onOpenChange(false);
            resetForm();
            onSuccess?.();
        } catch {
            // Errors surfaced via hook toasts
        }
    };

    const getTitle = () => {
        switch (actionType) {
            case "verify":
                return "Verify Cluster";
            case "unverify":
                return "Remove Verification";
            case "changeStatus":
                return "Change Cluster Status";
            case "archive":
                return "Archive Cluster";
            default:
                return "Cluster Action";
        }
    };

    const getDescription = () => {
        switch (actionType) {
            case "verify":
                return `Mark "${cluster.name}" as verified. This approves the cluster for platform operations.`;
            case "unverify":
                return `Remove verification from "${cluster.name}". The cluster will appear as pending again.`;
            case "changeStatus":
                return `Update the operational status for "${cluster.name}".`;
            case "archive":
                return `Archive "${cluster.name}". This soft-deletes the cluster while preserving history.`;
            default:
                return "";
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                if (!v) resetForm();
                onOpenChange(v);
            }}
        >
            <DialogContent className="sm:max-w-120 rounded-lg border-slate-200">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            {getTitle()}
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {getDescription()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {actionType === "changeStatus" && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider">
                                    Status
                                </Label>
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(v) =>
                                        setSelectedStatus(v as ClusterStatus)
                                    }
                                >
                                    <SelectTrigger className="h-10 rounded-md bg-slate-50 border-slate-200">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="INACTIVE">
                                            Inactive
                                        </SelectItem>
                                        <SelectItem value="ARCHIVED">
                                            Archived
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {actionType === "archive" && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider">
                                    Reason for archiving
                                </Label>
                                <Textarea
                                    value={archiveReason}
                                    onChange={(e) =>
                                        setArchiveReason(e.target.value)
                                    }
                                    placeholder="e.g. Duplicate entry, policy violation..."
                                    className="min-h-24 text-xs rounded-md bg-slate-50 border-slate-200"
                                    required
                                />
                            </div>
                        )}

                        {(actionType === "verify" || actionType === "unverify") && (
                            <p className="text-sm text-slate-600">
                                {actionType === "verify"
                                    ? "Verification confirms boundary survey or admin approval is on record."
                                    : "This will revert verification flags and boundary status where applicable."}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-4 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-md border-slate-200"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={
                                actionType === "archive"
                                    ? "rounded-md font-bold bg-red-600 hover:bg-red-700"
                                    : "rounded-md font-bold bg-primary hover:bg-primary/90"
                            }
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Confirm"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
