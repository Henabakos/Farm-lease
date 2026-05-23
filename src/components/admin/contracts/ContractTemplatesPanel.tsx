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
    BookOpen,
    Loader2,
    CheckCircle2,
    Layers,
} from "lucide-react";
import { useContractTemplates } from "@/src/hooks/useContractTemplates";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { TemplateDetailDialog } from "./TemplateDetailDialog";
import { ClauseCatalogDialog } from "./ClauseCatalogDialog";

type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

export const ContractTemplatesPanel: React.FC = () => {
    const {
        templates,
        pagination,
        isLoading,
        fetchTemplates,
        createTemplate,
    } = useContractTemplates({ autoFetch: false });

    const [search, setSearch] = useState("");
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
    const [createOpen, setCreateOpen] = useState(false);
    const [catalogOpen, setCatalogOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

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
        const totalVersions = templates.reduce(
            (sum, t) => sum + (t._count?.versions ?? 0),
            0,
        );
        return { total, active, totalVersions };
    }, [templates]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h3 className="font-bold flex items-center gap-2 text-slate-900">
                        <FileSignature className="w-4 h-4" />
                        Contract Templates
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        Versioned templates with reusable clauses
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCatalogOpen(true)}
                        className="gap-1.5 h-9"
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        Clause library
                    </Button>
                    <Button
                        size="sm"
                        className="gap-1.5 h-9"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New template
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="xl:col-span-9 space-y-4">
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
                        <div className="space-y-2">
                            {templates.map((t) => {
                                const versionCount = t._count?.versions ?? 0;
                                return (
                                    <Card
                                        key={t.id}
                                        className="border-slate-200 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group"
                                        onClick={() => setSelectedTemplateId(t.id)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
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
                                                        {t.category && (
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[9px] uppercase">
                                                                {t.category}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {t.description && (
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Layers className="w-3 h-3" />
                                                            {versionCount} {versionCount === 1 ? "version" : "versions"}
                                                        </span>
                                                        <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTemplateId(t.id);
                                                    }}
                                                    className="h-8 text-xs"
                                                >
                                                    Manage
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {pagination.total > templates.length && (
                                <p className="text-[10px] text-slate-400 text-center">
                                    Showing {templates.length} of {pagination.total}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <div className="xl:col-span-3 space-y-4">
                    <Card className="border-slate-200">
                        <CardContent className="p-4 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Summary
                            </p>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total templates</span>
                                    <span className="text-sm font-bold">{stats.total}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active</span>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] uppercase">
                                        {stats.active}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Versions</span>
                                    <span className="text-sm font-bold">{stats.totalVersions}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-primary/10 bg-primary/5">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                <h4 className="text-xs font-bold">Clause library</h4>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                                Manage the reusable clause catalog. Clauses can be attached to any unpublished template version.
                            </p>
                            <Button size="sm" variant="outline" className="w-full h-8 text-xs bg-white" onClick={() => setCatalogOpen(true)}>
                                Open library
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <CreateTemplateDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreate={createTemplate}
            />

            <TemplateDetailDialog
                open={selectedTemplateId !== null}
                onOpenChange={(o) => {
                    if (!o) setSelectedTemplateId(null);
                }}
                templateId={selectedTemplateId}
                onChanged={() => fetchTemplates(loadParams).catch(() => {})}
            />

            <ClauseCatalogDialog
                open={catalogOpen}
                onOpenChange={setCatalogOpen}
            />
        </div>
    );
};
