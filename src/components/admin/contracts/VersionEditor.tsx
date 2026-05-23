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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Loader2, Save, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import type {
    TemplateVariable,
    TemplateVariableType,
} from "@/src/services/contract-templates";

interface VersionEditorProps {
    initialBody?: string;
    initialVariables?: TemplateVariable[];
    onSave: (payload: {
        contentType: string;
        body?: string;
        pdfStorageKey?: string;
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
    const [contentType, setContentType] = useState<"MARKDOWN" | "PDF">("MARKDOWN");
    const [body, setBody] = useState(initialBody);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfStorageKey, setPdfStorageKey] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
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

    const handlePdfUpload = async (file: File) => {
        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are allowed');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('prefix', 'contract-templates');

            const response = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setPdfStorageKey(data.storage_key);
            toast.success('PDF uploaded successfully');
        } catch (err) {
            toast.error('Failed to upload PDF');
            setPdfFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (contentType === 'MARKDOWN' && !body.trim()) {
            toast.error("Body cannot be empty");
            return;
        }
        if (contentType === 'PDF' && !pdfStorageKey) {
            toast.error("Please upload a PDF file");
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
                contentType,
                body: contentType === 'MARKDOWN' ? body : undefined,
                pdfStorageKey: contentType === 'PDF' ? pdfStorageKey : undefined,
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
                <Label>Content Type</Label>
                <RadioGroup
                    value={contentType}
                    onValueChange={(value: "MARKDOWN" | "PDF") => setContentType(value)}
                    disabled={isSaving}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="MARKDOWN" id="markdown" />
                        <Label htmlFor="markdown" className="flex items-center gap-2 cursor-pointer">
                            <FileText className="w-4 h-4" />
                            Markdown Editor
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="PDF" id="pdf" />
                        <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Upload PDF
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {contentType === 'MARKDOWN' ? (
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
            ) : (
                <div className="space-y-1.5">
                    <Label htmlFor="pdf-upload">PDF Document</Label>
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <input
                            id="pdf-upload"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setPdfFile(file);
                                    handlePdfUpload(file);
                                }
                            }}
                            disabled={isSaving || isUploading}
                            className="hidden"
                        />
                        <label
                            htmlFor="pdf-upload"
                            className="cursor-pointer flex flex-col items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-sm text-slate-600">Uploading...</p>
                                </>
                            ) : pdfStorageKey ? (
                                <>
                                    <FileText className="w-8 h-8 text-green-600" />
                                    <p className="text-sm text-slate-600">PDF uploaded successfully</p>
                                    <p className="text-xs text-slate-400">Click to replace</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-slate-400" />
                                    <p className="text-sm text-slate-600">Click to upload PDF</p>
                                    <p className="text-xs text-slate-400">Max 10MB</p>
                                </>
                            )}
                        </label>
                    </div>
                </div>
            )}

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
