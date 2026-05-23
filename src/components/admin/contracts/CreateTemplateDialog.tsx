import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (input: {
        name: string;
        description?: string;
        category?: string;
    }) => Promise<unknown>;
}

export const CreateTemplateDialog: React.FC<CreateTemplateDialogProps> = ({
    open,
    onOpenChange,
    onCreate,
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const reset = () => {
        setName("");
        setDescription("");
        setCategory("");
    };

    const handleSubmit = async () => {
        const trimmedName = name.trim();
        if (trimmedName.length < 1) {
            toast.error("Template name is required");
            return;
        }
        try {
            setIsSaving(true);
            await onCreate({
                name: trimmedName,
                description: description.trim() || undefined,
                category: category.trim() || undefined,
            });
            reset();
            onOpenChange(false);
        } catch {
            // toast handled upstream
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) reset();
                onOpenChange(o);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create contract template</DialogTitle>
                    <DialogDescription>
                        Templates hold versioned bodies and reusable clauses.
                        You can add a first version after creation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="template-name">Name</Label>
                        <Input
                            id="template-name"
                            placeholder="e.g., Standard Cluster Lease"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="template-category">
                            Category{" "}
                            <span className="text-slate-400 font-normal">
                                (optional)
                            </span>
                        </Label>
                        <Input
                            id="template-category"
                            placeholder="e.g., lease, partnership"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="template-description">
                            Description{" "}
                            <span className="text-slate-400 font-normal">
                                (optional)
                            </span>
                        </Label>
                        <Textarea
                            id="template-description"
                            placeholder="Short summary of when to use this template..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isSaving}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSaving}>
                        {isSaving && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Create template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
