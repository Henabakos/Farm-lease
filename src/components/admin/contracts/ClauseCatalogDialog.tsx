import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BookOpen, Loader2, Plus, Search, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
    contractTemplateService,
    type ClauseCategory,
    type ContractClause,
} from "@/src/services/contract-templates";

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

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onChanged?: () => void;
}

export const ClauseCatalogDialog: React.FC<Props> = ({ open, onOpenChange, onChanged }) => {
    const [clauses, setClauses] = useState<ContractClause[]>([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<"ALL" | ClauseCategory>("ALL");
    const [isLoading, setIsLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState("");
    const [formCategory, setFormCategory] = useState<ClauseCategory>("GENERAL");
    const [formBody, setFormBody] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fetchClauses = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await contractTemplateService.listClauses({});
            setClauses(res.items);
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to load clauses");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) fetchClauses();
    }, [open, fetchClauses]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return clauses.filter((c) => {
            if (categoryFilter !== "ALL" && c.category !== categoryFilter) return false;
            if (!q) return true;
            return c.title.toLowerCase().includes(q) || c.body.toLowerCase().includes(q);
        });
    }, [clauses, search, categoryFilter]);

    const resetForm = () => {
        setEditingId(null);
        setFormTitle("");
        setFormCategory("GENERAL");
        setFormBody("");
    };

    const startEdit = (c: ContractClause) => {
        setEditingId(c.id);
        setFormTitle(c.title);
        setFormCategory(c.category);
        setFormBody(c.body);
    };

    const handleSave = async () => {
        const title = formTitle.trim();
        const body = formBody.trim();
        if (!title || !body) {
            toast.error("Title and body are required");
            return;
        }
        try {
            setIsSaving(true);
            if (editingId) {
                await contractTemplateService.updateClause(editingId, { title, category: formCategory, body });
                toast.success("Clause updated");
            } else {
                await contractTemplateService.createClause({ title, category: formCategory, body });
                toast.success("Clause created");
            }
            resetForm();
            await fetchClauses();
            onChanged?.();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to save clause");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (c: ContractClause) => {
        if (!window.confirm(`Delete clause "${c.title}"? Will be deactivated if referenced.`)) return;
        try {
            const r = await contractTemplateService.deleteClause(c.id);
            toast.success(r.softDeleted ? "Clause deactivated" : "Clause deleted");
            if (editingId === c.id) resetForm();
            await fetchClauses();
            onChanged?.();
        } catch (err: any) {
            toast.error(err?.response?.data?.error || "Failed to delete clause");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Clause library
                    </DialogTitle>
                    <DialogDescription>
                        Manage reusable contract clauses. Referenced clauses are deactivated instead of deleted.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 overflow-hidden">
                    <div className="md:col-span-3 flex flex-col gap-3 overflow-hidden">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <Input
                                    className="pl-9 h-9 text-xs"
                                    placeholder="Search clauses..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                                <SelectTrigger className="w-40 h-9 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL" className="text-xs">All categories</SelectItem>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <p className="text-xs text-slate-500 italic text-center py-8">No clauses.</p>
                            ) : (
                                filtered.map((c) => (
                                    <div
                                        key={c.id}
                                        className={`group border rounded-md p-2.5 bg-white hover:border-primary/40 transition-colors ${
                                            editingId === c.id ? "border-primary ring-1 ring-primary/20" : "border-slate-200"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-xs font-semibold text-slate-900 truncate">{c.title}</p>
                                                    <Badge variant="outline" className={`text-[9px] uppercase px-1.5 py-0 ${categoryColor(c.category)}`}>
                                                        {c.category}
                                                    </Badge>
                                                    {!c.isActive && (
                                                        <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 bg-slate-100 text-slate-500 border-slate-200">
                                                            inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{c.body}</p>
                                            </div>
                                            <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100">
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(c)}>
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(c)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="md:col-span-2 border-l border-slate-200 pl-4 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold flex items-center gap-2">
                                {editingId ? <><Pencil className="w-3.5 h-3.5" />Edit clause</> : <><Plus className="w-3.5 h-3.5" />New clause</>}
                            </h3>
                            {editingId && (
                                <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 gap-1 text-xs">
                                    <X className="w-3 h-3" /> Clear
                                </Button>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="clause-title" className="text-xs">Title</Label>
                                <Input
                                    id="clause-title"
                                    className="h-9 text-xs"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Category</Label>
                                <Select
                                    value={formCategory}
                                    onValueChange={(v) => setFormCategory(v as ClauseCategory)}
                                    disabled={isSaving}
                                >
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map((c) => (
                                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="clause-body" className="text-xs">Body</Label>
                                <Textarea
                                    id="clause-body"
                                    className="text-xs font-mono"
                                    rows={8}
                                    value={formBody}
                                    onChange={(e) => setFormBody(e.target.value)}
                                    disabled={isSaving}
                                />
                            </div>
                            <Button onClick={handleSave} disabled={isSaving} className="w-full">
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {editingId ? "Update clause" : "Create clause"}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
