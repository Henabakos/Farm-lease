import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileSignature,
    Plus,
    Search,
    Loader2,
    CheckCircle2,
    Pencil,
    Trash2,
} from "lucide-react";
import { useContractTemplates } from "@/src/hooks/useContractTemplates";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { EditTemplateDialog } from "./EditTemplateDialog";

type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const ContractTemplatesPanel: React.FC = () => {
    const {
        templates,
        pagination,
        isLoading,
        fetchTemplates,
        createTemplate,
        deleteTemplate,
    } = useContractTemplates({ autoFetch: false });

    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
    const [createOpen, setCreateOpen] = useState(false);
    const [editTemplateId, setEditTemplateId] = useState<string | null>(null);

    const loadParams = useMemo(
        () => ({
            search: search.trim() || undefined,
            isActive:
                activeFilter === "ALL"
                    ? undefined
                    : activeFilter === "ACTIVE"
                      ? true
                      : false,
            page: 1,
            pageSize: 50,
        }),
        [search, activeFilter],
    );

    useEffect(() => {
        const id = setTimeout(() => {
            fetchTemplates(loadParams).catch(() => {});
        }, 200);
        return () => clearTimeout(id);
    }, [loadParams, fetchTemplates]);

    const stats = useMemo(() => {
        const total = templates.length;
        const active = templates.filter((t) => t.isActive).length;
        return { total, active };
    }, [templates]);

    const handleDelete = async (templateId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }
        try {
            await deleteTemplate(templateId);
            fetchTemplates(loadParams).catch(() => {});
        } catch (err) {
            console.error('Failed to delete template:', err);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h3 className="font-bold flex items-center gap-2 text-slate-900">
                        <FileSignature className="w-4 h-4" />
                        Contract Templates
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        Create and manage contract templates
                    </p>
                </div>
                <Button
                    size="sm"
                    className="gap-1.5 h-9"
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="w-3.5 h-3.5" />
                    New template
                </Button>
            </div>

            <Card className="border-slate-200">
                <CardContent className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search templates by name or description..."
                                className="pl-9 h-9 text-xs"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select
                            value={activeFilter}
                            onValueChange={(v) => setActiveFilter(v as ActiveFilter)}
                        >
                            <SelectTrigger className="h-9 text-[11px] font-bold uppercase tracking-wider">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL" className="text-xs">All statuses</SelectItem>
                                <SelectItem value="ACTIVE" className="text-xs">Active</SelectItem>
                                <SelectItem value="INACTIVE" className="text-xs">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {isLoading && templates.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            ) : templates.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileSignature className="w-6 h-6 text-slate-300" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">No templates found</h4>
                    <p className="text-xs text-slate-500 mt-1">
                        Create your first contract template to get started.
                    </p>
                    <Button size="sm" className="mt-3 gap-1.5" onClick={() => setCreateOpen(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        New template
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templates.map((t) => (
                            <Card
                                key={t.id}
                                className="border-slate-200 hover:shadow-md hover:border-primary/40 transition-all"
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h4 className="text-sm font-bold text-slate-900 truncate">
                                                    {t.name}
                                                </h4>
                                                {t.isActive ? (
                                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] uppercase gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-[9px] uppercase">
                                                        inactive
                                                    </Badge>
                                                )}
                                            </div>
                                            {t.targetAudience && t.targetAudience !== 'BOTH' && (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[9px] uppercase">
                                                    {t.targetAudience}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {t.description && (
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 mb-3">{t.description}</p>
                                    )}
                                    <div className="flex items-center justify-between gap-2 mt-auto">
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditTemplateId(t.id)}
                                                className="h-7 w-7 p-0 text-slate-600 hover:text-primary"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(t.id, t.name)}
                                                className="h-7 w-7 p-0 text-slate-600 hover:text-red-600"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {pagination.total > templates.length && (
                        <p className="text-[10px] text-slate-400 text-center">
                            Showing {templates.length} of {pagination.total}
                        </p>
                    )}
                </>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Total: <strong>{stats.total}</strong></span>
                <span>Active: <strong>{stats.active}</strong></span>
            </div>

            <CreateTemplateDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreate={createTemplate}
            />

            <EditTemplateDialog
                open={editTemplateId !== null}
                onOpenChange={(o) => {
                    if (!o) setEditTemplateId(null);
                }}
                templateId={editTemplateId}
                onChanged={() => fetchTemplates(loadParams).catch(() => {})}
            />
        </div>
    );
};
