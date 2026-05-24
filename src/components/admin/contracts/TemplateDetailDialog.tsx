import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileSignature,
    History,
    GitCompare,
    Loader2,
    Trash2,
    Save,
    Eye,
    Send,
    Plus,
    ArrowUp,
    ArrowDown,
    X,
    CheckCircle2,
    Lock,
} from "lucide-react";
import { toast } from "sonner";
import { VersionEditor } from "./VersionEditor";
import { VersionDiffViewer } from "./VersionDiffViewer";
import {
    contractTemplateService,
    type ClauseCategory,
    type CompareVersionsResult,
    type ContractClause,
    type ContractTemplate,
    type ContractTemplateVersion,
    type TemplateClauseWithClause,
} from "@/src/services/contract-templates";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    templateId: string | null;
    onChanged?: () => void;
}

const CATEGORIES: ClauseCategory[] = [
    "PAYMENT",
    "TERMINATION",
    "DISPUTE",
    "CONFIDENTIALITY",
    "GENERAL",
    "CUSTOM",
];

const categoryColor = (c: ClauseCategory) => {
    const map: Record<ClauseCategory, string> = {
        PAYMENT: "bg-blue-50 text-blue-700 border-blue-200",
        TERMINATION: "bg-red-50 text-red-700 border-red-200",
        DISPUTE: "bg-amber-50 text-amber-700 border-amber-200",
        CONFIDENTIALITY: "bg-violet-50 text-violet-700 border-violet-200",
        GENERAL: "bg-emerald-50 text-emerald-700 border-emerald-200",
        CUSTOM: "bg-slate-50 text-slate-700 border-slate-200",
    };
    return map[c];
};

export const TemplateDetailDialog: React.FC<Props> = ({
    open,
    onOpenChange,
    templateId,
    onChanged,
}) => {
    const [template, setTemplate] = useState<ContractTemplate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "versions" | "clauses">(
        "overview",
    );

    // overview form
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // versions
    const [showNewVersion, setShowNewVersion] = useState(false);
    const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

    // compare
    const [compareA, setCompareA] = useState<number | null>(null);
    const [compareB, setCompareB] = useState<number | null>(null);
    const [compareResult, setCompareResult] = useState<CompareVersionsResult | null>(
        null,
    );
    const [isComparing, setIsComparing] = useState(false);

    // clauses
    const [templateClauses, setTemplateClauses] = useState<TemplateClauseWithClause[]>([]);
    const [catalog, setCatalog] = useState<ContractClause[]>([]);
    const [selectedClauseId, setSelectedClauseId] = useState<string>("");

    const versions = template?.versions ?? [];
    const selectedVersion = useMemo(
        () => versions.find((v) => v.id === selectedVersionId) ?? null,
        [versions, selectedVersionId],
    );
    const isSelectedPublished = !!selectedVersion?.publishedAt;

    const refresh = useCallback(async () => {
        if (!templateId) return;
        setIsLoading(true);
        try {
            const t = await contractTemplateService.getTemplate(templateId);
            setTemplate(t);
            setName(t.name);
            setDescription(t.description ?? "");
            setCategory(t.category ?? "");
            // Keep selected version if present, else default to latest
            const vs = t.versions ?? [];
            if (vs.length > 0) {
                setSelectedVersionId((prev) =>
                    prev && vs.some((v) => v.id === prev) ? prev : vs[0].id,
                );
            } else {
                setSelectedVersionId(null);
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to load template");
        } finally {
            setIsLoading(false);
        }
    }, [templateId]);

    useEffect(() => {
        if (open) {
            refresh();
            // load catalog (active only) for clause picker
            contractTemplateService
                .listClauses({ isActive: true })
                .then((r) => setCatalog(r.items))
                .catch(() => {});
        } else {
            setTemplate(null);
            setActiveTab("overview");
            setShowNewVersion(false);
            setCompareA(null);
            setCompareB(null);
            setCompareResult(null);
            setTemplateClauses([]);
        }
    }, [open, refresh]);

    // Load template clauses when selected version changes / clauses tab opens
    useEffect(() => {
        if (!templateId || !selectedVersionId) {
            setTemplateClauses([]);
            return;
        }
        contractTemplateService
            .listTemplateClauses(templateId, selectedVersionId)
            .then(setTemplateClauses)
            .catch(() => setTemplateClauses([]));
    }, [templateId, selectedVersionId]);

    const handleSaveOverview = async () => {
        if (!templateId) return;
        const trimmed = name.trim();
        if (!trimmed) {
            toast.error("Name is required");
            return;
        }
        try {
            setIsSaving(true);
            await contractTemplateService.updateTemplate(templateId, {
                name: trimmed,
                description: description.trim() || undefined,
                category: category.trim() || undefined,
            });
            toast.success("Template updated");
            await refresh();
            onChanged?.();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to update");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleActive = async () => {
        if (!templateId || !template) return;
        try {
            setIsSaving(true);
            await contractTemplateService.updateTemplate(templateId, {
                isActive: !template.isActive,
            });
            toast.success(template.isActive ? "Template deactivated" : "Template activated");
            await refresh();
            onChanged?.();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to update");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTemplate = async () => {
        if (!templateId || !template) return;
        if (
            !window.confirm(
                `Delete template "${template.name}"? It will be soft-deleted if any agreement uses it.`,
            )
        )
            return;
        try {
            const r = await contractTemplateService.deleteTemplate(templateId);
            toast.success(r.softDeleted ? "Template deactivated (in use)" : "Template deleted");
            onChanged?.();
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to delete");
        }
    };

    const handleCreateVersion = async (payload: {
        contentType: string;
        body?: string;
        pdfStorageKey?: string;
        variables: any[];
    }) => {
        if (!templateId) return;
        try {
            const created = await contractTemplateService.createVersion(templateId, payload);
            toast.success(`Version ${created.versionNumber} created`);
            setShowNewVersion(false);
            await refresh();
            setSelectedVersionId(created.id);
            onChanged?.();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to create version");
        }
    };

    const handlePublish = async (v: ContractTemplateVersion) => {
        if (!templateId) return;
        if (!window.confirm(`Publish version ${v.versionNumber}? It will become immutable.`)) return;
        try {
            await contractTemplateService.publishVersion(templateId, v.id);
            toast.success(`Version ${v.versionNumber} published`);
            await refresh();
            onChanged?.();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to publish");
        }
    };

    const handleCompare = async () => {
        if (!templateId || compareA == null || compareB == null) {
            toast.error("Select two versions");
            return;
        }
        if (compareA === compareB) {
            toast.error("Pick two different versions");
            return;
        }
        try {
            setIsComparing(true);
            const r = await contractTemplateService.compareVersions(
                templateId,
                compareA,
                compareB,
            );
            setCompareResult(r);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to compare");
        } finally {
            setIsComparing(false);
        }
    };

    const handleAddClause = async () => {
        if (!templateId || !selectedVersionId || !selectedClauseId) return;
        try {
            const ordering = templateClauses.length;
            await contractTemplateService.addTemplateClause(templateId, selectedVersionId, {
                clauseId: selectedClauseId,
                ordering,
            });
            toast.success("Clause added");
            setSelectedClauseId("");
            const next = await contractTemplateService.listTemplateClauses(
                templateId,
                selectedVersionId,
            );
            setTemplateClauses(next);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to add clause");
        }
    };

    const handleRemoveClause = async (tc: TemplateClauseWithClause) => {
        if (!templateId || !selectedVersionId) return;
        try {
            await contractTemplateService.removeTemplateClause(
                templateId,
                selectedVersionId,
                tc.id,
            );
            const next = await contractTemplateService.listTemplateClauses(
                templateId,
                selectedVersionId,
            );
            setTemplateClauses(next);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to remove clause");
        }
    };

    const handleMoveClause = async (idx: number, direction: -1 | 1) => {
        if (!templateId || !selectedVersionId) return;
        const target = idx + direction;
        if (target < 0 || target >= templateClauses.length) return;
        const a = templateClauses[idx];
        const b = templateClauses[target];
        try {
            // Swap orderings sequentially.
            await contractTemplateService.updateTemplateClause(templateId, selectedVersionId, a.id, {
                ordering: b.ordering,
            });
            await contractTemplateService.updateTemplateClause(templateId, selectedVersionId, b.id, {
                ordering: a.ordering,
            });
            const next = await contractTemplateService.listTemplateClauses(
                templateId,
                selectedVersionId,
            );
            setTemplateClauses(next);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to reorder");
        }
    };

    const attachableClauses = useMemo(() => {
        const attached = new Set(templateClauses.map((tc) => tc.clauseId));
        return catalog.filter((c) => !attached.has(c.id));
    }, [catalog, templateClauses]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSignature className="w-4 h-4" />
                        {template?.name ?? "Template"}
                        {template && !template.isActive && (
                            <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-[9px] uppercase">
                                inactive
                            </Badge>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Manage metadata, versions, and clauses for this contract template.
                    </DialogDescription>
                </DialogHeader>

                {isLoading || !template ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <Tabs
                        value={activeTab}
                        onValueChange={(v) => setActiveTab(v as any)}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
                        <TabsList className="grid grid-cols-3 w-full max-w-md">
                            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                            <TabsTrigger value="versions" className="text-xs">
                                Versions ({versions.length})
                            </TabsTrigger>
                            <TabsTrigger value="clauses" className="text-xs">Clauses</TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto pt-4">
                            {/* OVERVIEW */}
                            <TabsContent value="overview" className="mt-0 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="t-name">Name</Label>
                                        <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="t-cat">Category</Label>
                                        <Input id="t-cat" value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSaving} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="t-desc">Description</Label>
                                    <Textarea
                                        id="t-desc"
                                        rows={4}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={isSaving}>
                                            {template.isActive ? "Deactivate" : "Activate"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDeleteTemplate}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                            Delete
                                        </Button>
                                    </div>
                                    <Button onClick={handleSaveOverview} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save changes
                                    </Button>
                                </div>
                                <Card className="border-slate-200 bg-slate-50/60">
                                    <CardContent className="p-4 text-xs text-slate-600 space-y-1">
                                        <p><span className="font-bold">Created:</span> {new Date(template.createdAt).toLocaleString()}</p>
                                        <p><span className="font-bold">Updated:</span> {new Date(template.updatedAt).toLocaleString()}</p>
                                        <p><span className="font-bold">Versions:</span> {versions.length}</p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* VERSIONS */}
                            <TabsContent value="versions" className="mt-0 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <History className="w-3.5 h-3.5" /> Version history
                                    </h3>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowNewVersion((v) => !v)}
                                        className="gap-1.5"
                                    >
                                        {showNewVersion ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                        {showNewVersion ? "Cancel" : "New version"}
                                    </Button>
                                </div>

                                {showNewVersion && (
                                    <Card className="border-primary/20 bg-primary/5">
                                        <CardContent className="p-4">
                                            <VersionEditor
                                                initialBody={selectedVersion?.body ?? ""}
                                                initialVariables={selectedVersion?.variables ?? []}
                                                onSave={handleCreateVersion}
                                                onCancel={() => setShowNewVersion(false)}
                                                helperNote={
                                                    selectedVersion
                                                        ? `Pre-filled from v${selectedVersion.versionNumber}. Versions are immutable; saving creates the next version.`
                                                        : "First version — author the body and declare any variables."
                                                }
                                            />
                                        </CardContent>
                                    </Card>
                                )}

                                {versions.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic text-center py-8">
                                        No versions yet. Create the first version above.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {versions.map((v) => (
                                            <Card
                                                key={v.id}
                                                className={`border ${selectedVersionId === v.id ? "border-primary ring-1 ring-primary/20" : "border-slate-200"}`}
                                            >
                                                <CardContent className="p-3 flex items-center justify-between gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedVersionId(v.id)}
                                                        className="flex-1 min-w-0 text-left"
                                                    >
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-sm font-bold">v{v.versionNumber}</span>
                                                            {v.publishedAt ? (
                                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] uppercase gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    published
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] uppercase">
                                                                    draft
                                                                </Badge>
                                                            )}
                                                            <span className="text-[11px] text-slate-500">
                                                                {new Date(v.createdAt).toLocaleString()}
                                                            </span>
                                                            {Array.isArray(v.variables) && v.variables.length > 0 && (
                                                                <span className="text-[10px] text-slate-400">
                                                                    {v.variables.length} variables
                                                                </span>
                                                            )}
                                                            {v._count && (
                                                                <span className="text-[10px] text-slate-400">
                                                                    {v._count.clauses} clauses
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                    <div className="flex items-center gap-1.5">
                                                        {!v.publishedAt && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handlePublish(v)}
                                                                className="h-8 gap-1 text-xs"
                                                            >
                                                                <Send className="w-3.5 h-3.5" />
                                                                Publish
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                                {selectedVersionId === v.id && (
                                                    <div className="border-t border-slate-100 px-3 py-3 bg-slate-50/60">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Body preview</p>
                                                        <pre className="text-[11px] font-mono leading-relaxed text-slate-700 max-h-48 overflow-auto whitespace-pre-wrap">
                                                            {v.body}
                                                        </pre>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {versions.length >= 2 && (
                                    <Card className="border-slate-200">
                                        <CardContent className="p-4 space-y-3">
                                            <h4 className="text-sm font-bold flex items-center gap-2">
                                                <GitCompare className="w-3.5 h-3.5" /> Compare versions
                                            </h4>
                                            <div className="flex items-end gap-3 flex-wrap">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">From</Label>
                                                    <Select
                                                        value={compareA?.toString() ?? ""}
                                                        onValueChange={(v) => setCompareA(Number(v))}
                                                    >
                                                        <SelectTrigger className="w-32 h-9 text-xs">
                                                            <SelectValue placeholder="Pick version" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {versions.map((v) => (
                                                                <SelectItem key={v.id} value={v.versionNumber.toString()} className="text-xs">
                                                                    v{v.versionNumber}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">To</Label>
                                                    <Select
                                                        value={compareB?.toString() ?? ""}
                                                        onValueChange={(v) => setCompareB(Number(v))}
                                                    >
                                                        <SelectTrigger className="w-32 h-9 text-xs">
                                                            <SelectValue placeholder="Pick version" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {versions.map((v) => (
                                                                <SelectItem key={v.id} value={v.versionNumber.toString()} className="text-xs">
                                                                    v{v.versionNumber}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button onClick={handleCompare} disabled={isComparing}>
                                                    {isComparing ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Eye className="w-4 h-4 mr-2" />
                                                    )}
                                                    Compare
                                                </Button>
                                            </div>
                                            {compareResult && <VersionDiffViewer result={compareResult} />}
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            {/* CLAUSES */}
                            <TabsContent value="clauses" className="mt-0 space-y-4">
                                {versions.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic text-center py-8">
                                        Create a version first to manage clauses.
                                    </p>
                                ) : (
                                    <>
                                        <div className="flex items-end gap-3 flex-wrap">
                                            <div className="space-y-1">
                                                <Label className="text-xs">Working on version</Label>
                                                <Select
                                                    value={selectedVersionId ?? ""}
                                                    onValueChange={(v) => setSelectedVersionId(v)}
                                                >
                                                    <SelectTrigger className="w-48 h-9 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {versions.map((v) => (
                                                            <SelectItem key={v.id} value={v.id} className="text-xs">
                                                                v{v.versionNumber}
                                                                {v.publishedAt ? " · published" : " · draft"}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {isSelectedPublished && (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 text-[10px]">
                                                    <Lock className="w-3 h-3" />
                                                    Published — read-only
                                                </Badge>
                                            )}
                                        </div>

                                        {!isSelectedPublished && (
                                            <div className="flex items-end gap-2 flex-wrap">
                                                <div className="flex-1 min-w-[220px] space-y-1">
                                                    <Label className="text-xs">Attach clause from catalog</Label>
                                                    <Select value={selectedClauseId} onValueChange={setSelectedClauseId}>
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue placeholder={attachableClauses.length === 0 ? "All catalog clauses already attached" : "Pick a clause..."} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {CATEGORIES.map((cat) => {
                                                                const items = attachableClauses.filter((c) => c.category === cat);
                                                                if (items.length === 0) return null;
                                                                return (
                                                                    <React.Fragment key={cat}>
                                                                        <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                                                            {cat}
                                                                        </div>
                                                                        {items.map((c) => (
                                                                            <SelectItem key={c.id} value={c.id} className="text-xs">
                                                                                {c.title}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={handleAddClause}
                                                    disabled={!selectedClauseId}
                                                    className="gap-1.5 h-9"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Add
                                                </Button>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {templateClauses.length === 0 ? (
                                                <p className="text-xs text-slate-500 italic text-center py-8">
                                                    No clauses attached to this version.
                                                </p>
                                            ) : (
                                                templateClauses.map((tc, idx) => (
                                                    <Card key={tc.id} className="border-slate-200">
                                                        <CardContent className="p-3 flex items-start gap-3">
                                                            <div className="flex flex-col gap-0.5">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={() => handleMoveClause(idx, -1)}
                                                                    disabled={idx === 0 || isSelectedPublished}
                                                                >
                                                                    <ArrowUp className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={() => handleMoveClause(idx, 1)}
                                                                    disabled={idx === templateClauses.length - 1 || isSelectedPublished}
                                                                >
                                                                    <ArrowDown className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                                                                    <p className="text-xs font-semibold text-slate-900">{tc.clause.title}</p>
                                                                    <Badge variant="outline" className={`text-[9px] uppercase px-1.5 py-0 ${categoryColor(tc.clause.category)}`}>
                                                                        {tc.clause.category}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 mt-1 line-clamp-3">{tc.clause.body}</p>
                                                            </div>
                                                            {!isSelectedPublished && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleRemoveClause(tc)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                )}
            </DialogContent>
        </Dialog>
    );
};
