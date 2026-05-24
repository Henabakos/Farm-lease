import React, { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { contractTemplateService } from "@/src/services/contract-templates";
import { RichTextEditor } from "./RichTextEditor";
import { api, getAccessToken } from "@/src/services/api";
import axios from 'axios';

interface EditTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templateId: string | null;
    onChanged?: () => void;
}

export const EditTemplateDialog: React.FC<EditTemplateDialogProps> = ({
    open,
    onOpenChange,
    templateId,
    onChanged,
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [targetAudience, setTargetAudience] = useState("BOTH");
    const [isActive, setIsActive] = useState(true);
    const [contentType, setContentType] = useState<"MARKDOWN" | "PDF">("MARKDOWN");
    const [body, setBody] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfStorageKey, setPdfStorageKey] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const reset = () => {
        setName("");
        setDescription("");
        setCategory("");
        setTargetAudience("BOTH");
        setIsActive(true);
        setContentType("MARKDOWN");
        setBody("");
        setPdfFile(null);
        setPdfStorageKey(null);
    };

    useEffect(() => {
        if (open && templateId) {
            loadTemplate();
        } else if (!open) {
            reset();
        }
    }, [open, templateId]);

    const loadTemplate = async () => {
        if (!templateId) return;
        setIsLoading(true);
        try {
            const template = await contractTemplateService.getTemplate(templateId);
            setName(template.name);
            setDescription(template.description || "");
            setCategory(template.category || "");
            setTargetAudience(template.targetAudience || "BOTH");
            setIsActive(template.isActive);
            
            // Load the latest version
            if (template.versions && template.versions.length > 0) {
                const latestVersion = template.versions[0];
                setContentType((latestVersion.contentType as "MARKDOWN" | "PDF") || "MARKDOWN");
                setBody(latestVersion.body || "");
                setPdfStorageKey(latestVersion.pdfStorageKey || null);
            }
        } catch (err) {
            toast.error("Failed to load template");
        } finally {
            setIsLoading(false);
        }
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

            const token = getAccessToken();
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
            
            const response = await axios.post(`${API_BASE_URL}/files/upload`, formData, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : undefined,
                },
            });

            setPdfStorageKey(response.data.storage_key);
            toast.success('PDF uploaded successfully');
        } catch (err: any) {
            console.error('PDF upload error:', err);
            const errorMessage = err.response?.data?.error || err.message || 'Failed to upload PDF';
            toast.error(errorMessage);
            setPdfFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!templateId) return;
        
        const trimmedName = name.trim();
        if (trimmedName.length < 1) {
            toast.error("Template name is required");
            return;
        }
        if (contentType === 'MARKDOWN' && !body.trim()) {
            toast.error("Content is required");
            return;
        }
        if (contentType === 'PDF' && !pdfStorageKey) {
            toast.error("Please upload a PDF file");
            return;
        }
        
        try {
            setIsSaving(true);
            
            // Update template metadata
            await contractTemplateService.updateTemplate(templateId, {
                name: trimmedName,
                description: description.trim() || undefined,
                category: category.trim() || undefined,
                isActive,
            });

            // Create a new version with updated content
            await contractTemplateService.createVersion(templateId, {
                contentType,
                body: contentType === 'MARKDOWN' ? body : undefined,
                pdfStorageKey: contentType === 'PDF' ? pdfStorageKey : undefined,
                variables: [],
            });

            toast.success("Template updated successfully");
            reset();
            onOpenChange(false);
            onChanged?.();
        } catch (err) {
            toast.error("Failed to update template");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl">
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) reset();
                onOpenChange(o);
            }}
        >
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit contract template</DialogTitle>
                    <DialogDescription>
                        Update template details and content. A new version will be created.
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
                        <Label htmlFor="template-target-audience">Target Audience</Label>
                        <Select
                            value={targetAudience}
                            onValueChange={setTargetAudience}
                            disabled={isSaving}
                        >
                            <SelectTrigger id="template-target-audience">
                                <SelectValue placeholder="Select target audience" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FARMER">Farmer</SelectItem>
                                <SelectItem value="INVESTOR">Investor</SelectItem>
                                <SelectItem value="BOTH">Both</SelectItem>
                            </SelectContent>
                        </Select>
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
                            rows={2}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="template-active"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            disabled={isSaving}
                            className="h-4 w-4"
                        />
                        <Label htmlFor="template-active" className="cursor-pointer">
                            Active
                        </Label>
                    </div>

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
                            <Label>Content</Label>
                            <RichTextEditor
                                content={body}
                                onChange={setBody}
                                placeholder="Start typing your contract content..."
                                editable={!isSaving}
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
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSaving || isUploading}>
                        {isSaving && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
