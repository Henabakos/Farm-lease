import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type {
    TemplateVariable,
    TemplateVariableType,
} from "@/src/services/contract-templates";

interface VersionEditorProps {
    initialBody?: string;
    initialVariables?: TemplateVariable[];
    onSave: (payload: {
        body: string;
        variables: TemplateVariable[];
    }) => Promise<unknown>;
    onCancel?: () => void;
    submitLabel?: string;
    helperNote?: string;
}

const TYPES: TemplateVariableType[] = ["text", "number", "date", "boolean"];

export const VersionEditor: React.FC<VersionEditorProps> = ({
    initialBody = "",
    initialVariables = [],
    onSave,
    onCancel,
    submitLabel = "Save as new version",
    helperNote,
}) => {
    const [body, setBody] = useState(initialBody);
    const [variables, setVariables] =
        useState<TemplateVariable[]>(initialVariables);
    const [isSaving, setIsSaving] = useState(false);

    const updateVar = (idx: number, patch: Partial<TemplateVariable>) => {
        setVariables((prev) =>
            prev.map((v, i) => (i === idx ? { ...v, ...patch } : v)),
        );
    };

    const addVar = () => {
        setVariables((prev) => [
            ...prev,
            { name: "", type: "text", description: "", required: false },
        ]);
    };

    const removeVar = (idx: number) => {
        setVariables((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!body.trim()) {
            toast.error("Body cannot be empty");
            return;
        }
        // Validate variable names unique + non-empty
        const names = new Set<string>();
        for (const v of variables) {
            const name = v.name.trim();
            if (!name) {
                toast.error("All variables must have a name");
                return;
            }
            if (names.has(name)) {
                toast.error(`Duplicate variable name: ${name}`);
                return;
            }
            names.add(name);
        }
        try {
            setIsSaving(true);
            await onSave({
                body,
                variables: variables.map((v) => ({
                    name: v.name.trim(),
                    type: v.type,
                    description: v.description?.trim() || undefined,
                    required: !!v.required,
                })),
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {helperNote && (
                <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-md p-2">
                    {helperNote}
                </p>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="version-body">Body (markdown / mustache)</Label>
                <Textarea
                    id="version-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={14}
                    disabled={isSaving}
                    className="font-mono text-xs"
                    placeholder={`# Lease Agreement\n\nThis agreement is between {{owner_name}} and {{tenant_name}}...`}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Variables</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addVar}
                        disabled={isSaving}
                        className="gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add variable
                    </Button>
                </div>
                {variables.length === 0 ? (
                    <p className="text-xs text-slate-500 italic px-1">
                        No variables defined yet.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {variables.map((v, idx) => (
                            <div
                                key={idx}
                                className="grid grid-cols-12 gap-2 items-start bg-slate-50 border border-slate-200 rounded-md p-2"
                            >
                                <Input
                                    className="col-span-3 h-9 text-xs"
                                    placeholder="name"
                                    value={v.name}
                                    onChange={(e) =>
                                        updateVar(idx, { name: e.target.value })
                                    }
                                    disabled={isSaving}
                                />
                                <Select
                                    value={v.type}
                                    onValueChange={(val) =>
                                        updateVar(idx, {
                                            type: val as TemplateVariableType,
                                        })
                                    }
                                    disabled={isSaving}
                                >
                                    <SelectTrigger className="col-span-2 h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TYPES.map((t) => (
                                            <SelectItem
                                                key={t}
                                                value={t}
                                                className="text-xs"
                                            >
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    className="col-span-5 h-9 text-xs"
                                    placeholder="description (optional)"
                                    value={v.description ?? ""}
                                    onChange={(e) =>
                                        updateVar(idx, {
                                            description: e.target.value,
                                        })
                                    }
                                    disabled={isSaving}
                                />
                                <div className="col-span-1 flex items-center justify-center pt-2">
                                    <Checkbox
                                        checked={!!v.required}
                                        onCheckedChange={(c) =>
                                            updateVar(idx, {
                                                required: c === true,
                                            })
                                        }
                                        disabled={isSaving}
                                        title="Required"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeVar(idx)}
                                    disabled={isSaving}
                                    className="col-span-1 h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                        <p className="text-[10px] text-slate-400 px-1">
                            Required column on the right.
                        </p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                )}
                <Button onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
};
