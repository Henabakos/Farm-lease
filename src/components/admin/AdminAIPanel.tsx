// Admin AI / Knowledge-base panel.
// Visual language follows AdminDashboard: slate-50/white cards, uppercase
// tracking-wider micro-labels, primary accents, motion-driven row mounts.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BrainCircuit,
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  Plus,
  RefreshCw,
  Link as LinkIcon,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { aiAPI, KnowledgeBase, KbDocument } from '@/src/services/ai';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function statusBadge(status: KbDocument['status']) {
  switch (status) {
    case 'INDEXED':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase tracking-wider gap-1">
          <CheckCircle2 className="w-3 h-3" /> Indexed
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge className="bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] uppercase tracking-wider gap-1">
          <XCircle className="w-3 h-3" /> Failed
        </Badge>
      );
    case 'PROCESSING':
      return (
        <Badge className="bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[10px] uppercase tracking-wider gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Processing
        </Badge>
      );
    default:
      return (
        <Badge className="bg-amber-100 text-amber-700 border border-amber-200 font-bold text-[10px] uppercase tracking-wider gap-1">
          <Clock className="w-3 h-3" /> Pending
        </Badge>
      );
  }
}

function formatSize(bytes: number | null) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}

export const AdminAIPanel: React.FC = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [activeKbId, setActiveKbId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [loadingKbs, setLoadingKbs] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCreateKb, setShowCreateKb] = useState(false);
  const [showIngestUrl, setShowIngestUrl] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Loaders --------------------------------------------------------------
  const loadKnowledgeBases = async () => {
    setLoadingKbs(true);
    try {
      const res = await aiAPI.listKnowledgeBases();
      const list = res.data?.data ?? [];
      setKnowledgeBases(list);
      if (!activeKbId && list[0]) setActiveKbId(list[0].id);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to load knowledge bases');
    } finally {
      setLoadingKbs(false);
    }
  };

  const loadDocuments = async (kbId: string) => {
    setLoadingDocs(true);
    try {
      const res = await aiAPI.listDocuments(kbId);
      setDocuments(res.data?.data ?? []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadKnowledgeBases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeKbId) loadDocuments(activeKbId);
  }, [activeKbId]);

  // Poll while any document is still processing/pending.
  useEffect(() => {
    if (!activeKbId) return;
    const hasInFlight = documents.some(
      (d) => d.status === 'PENDING' || d.status === 'PROCESSING',
    );
    if (!hasInFlight) return;
    const t = setInterval(() => loadDocuments(activeKbId), 3000);
    return () => clearInterval(t);
  }, [documents, activeKbId]);

  // ---- Actions --------------------------------------------------------------
  const handleFile = async (file: File) => {
    if (!activeKbId) return;
    setUploading(true);
    try {
      await aiAPI.uploadDocument(activeKbId, file);
      toast.success(`Uploaded ${file.name}. Indexing in background.`);
      await loadDocuments(activeKbId);
      await loadKnowledgeBases();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document? Indexed chunks will be removed.')) return;
    try {
      await aiAPI.deleteDocument(docId);
      toast.success('Document deleted');
      if (activeKbId) await loadDocuments(activeKbId);
      await loadKnowledgeBases();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to delete');
    }
  };

  const visibleDocuments = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, search]);

  const activeKb = knowledgeBases.find((k) => k.id === activeKbId) ?? null;
  const stats = useMemo(() => {
    const total = documents.length;
    const indexed = documents.filter((d) => d.status === 'INDEXED').length;
    const processing = documents.filter(
      (d) => d.status === 'PROCESSING' || d.status === 'PENDING',
    ).length;
    const failed = documents.filter((d) => d.status === 'FAILED').length;
    return { total, indexed, processing, failed };
  }, [documents]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.05 }}
      className="space-y-6"
    >
      {/* Header card --------------------------------------------------- */}
      <motion.div variants={item}>
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/5 via-white to-white border-b border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
                    AI Knowledge Base
                  </CardTitle>
                  <CardDescription className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mt-1">
                    Upload documents · Power the RAG chatbot · Manage embeddings
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 rounded-md gap-2 text-[10px] font-bold uppercase tracking-wider border-slate-200 bg-white shadow-sm"
                  onClick={() => loadKnowledgeBases()}
                  disabled={loadingKbs}
                >
                  <RefreshCw className={cn('w-3 h-3', loadingKbs && 'animate-spin')} />
                  <span>Refresh</span>
                </Button>
                <Button
                  size="sm"
                  className="h-9 px-4 rounded-md gap-2 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-sm"
                  onClick={() => setShowCreateKb(true)}
                >
                  <Plus className="w-3 h-3" />
                  <span>New Knowledge Base</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Stat strip ----------------------------------------------- */}
          <CardContent className="p-0 border-b border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4">
              <StatCell label="Total Documents" value={String(stats.total)} accent="text-slate-900" />
              <StatCell label="Indexed" value={String(stats.indexed)} accent="text-emerald-600" />
              <StatCell label="In Progress" value={String(stats.processing)} accent="text-blue-600" />
              <StatCell label="Failed" value={String(stats.failed)} accent="text-red-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Body grid: KB sidebar + documents -------------------------------- */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: knowledge bases */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-5 border-b border-slate-100">
            <CardTitle className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-2">
              <Database className="w-3 h-3" />
              Knowledge Bases
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-1.5">
            {knowledgeBases.length === 0 && !loadingKbs ? (
              <p className="px-3 py-6 text-center text-xs text-slate-400 font-medium">
                No knowledge bases yet.
              </p>
            ) : (
              knowledgeBases.map((kb) => (
                <button
                  key={kb.id}
                  type="button"
                  onClick={() => setActiveKbId(kb.id)}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-md border text-xs transition-all',
                    activeKbId === kb.id
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-slate-100',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 truncate">{kb.name}</p>
                    <Badge className="shrink-0 bg-white border border-slate-200 text-slate-600 font-bold text-[9px] uppercase tracking-wider">
                      {kb.scope}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    {kb.document_count} doc{kb.document_count === 1 ? '' : 's'}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Main: documents in active KB */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold tracking-tight text-slate-900">
                  {activeKb?.name ?? 'Documents'}
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  {activeKb?.description ?? 'Drop in PDFs, markdown, or plain text to power AI answers.'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <Input
                    placeholder="Filter…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 bg-white border-slate-200 h-9 rounded-md text-xs w-44"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-md gap-2 text-[10px] font-bold uppercase tracking-wider border-slate-200 bg-white shadow-sm"
                  onClick={() => setShowIngestUrl(true)}
                  disabled={!activeKbId}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Ingest URL</span>
                </Button>
                <Button
                  size="sm"
                  className="h-9 px-3 rounded-md gap-2 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!activeKbId || uploading}
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  <span>{uploading ? 'Uploading' : 'Upload File'}</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.md,.json,.csv,application/pdf,text/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            {loadingDocs ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-xs font-bold uppercase tracking-wider">Loading documents…</p>
              </div>
            ) : visibleDocuments.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  No documents yet
                </p>
                <p className="text-[11px] text-slate-400 font-medium max-w-xs text-center">
                  Upload a PDF or markdown file to start populating this knowledge base.
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                <div className="space-y-2">
                  {visibleDocuments.map((doc) => (
                    <motion.div
                      key={doc.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center justify-between gap-3 p-3 rounded-md bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center text-primary shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{doc.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {doc.source} · {formatSize(doc.file_size)} · {doc.chunk_count} chunk
                            {doc.chunk_count === 1 ? '' : 's'}
                            {doc.error_message ? ` · ${doc.error_message}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge(doc.status)}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(doc.id)}
                          aria-label="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <CreateKbDialog
        open={showCreateKb}
        onOpenChange={setShowCreateKb}
        onCreated={(kb) => {
          setKnowledgeBases((prev) => [kb, ...prev]);
          setActiveKbId(kb.id);
        }}
      />
      <IngestUrlDialog
        open={showIngestUrl}
        onOpenChange={setShowIngestUrl}
        kbId={activeKbId}
        onIngested={() => {
          if (activeKbId) loadDocuments(activeKbId);
          loadKnowledgeBases();
        }}
      />
    </motion.div>
  );
};

// ---- Subcomponents -------------------------------------------------------
function StatCell({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="p-5 border-r last:border-r-0 border-slate-100">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn('text-2xl font-bold tracking-tight mt-1', accent)}>{value}</p>
    </div>
  );
}

function CreateKbDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (kb: KnowledgeBase) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'USER'>('GLOBAL');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await aiAPI.createKnowledgeBase({ name: name.trim(), description: description.trim() || undefined, scope });
      onCreated(res.data);
      toast.success('Knowledge base created');
      onOpenChange(false);
      setName('');
      setDescription('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to create');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-lg border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
            New Knowledge Base
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Documents added here will power the AI assistant
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              className="h-9 rounded-md text-xs border-slate-200"
              placeholder="e.g. Agronomy Playbook 2025"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scope</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['GLOBAL', 'USER'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={cn(
                    'h-9 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all',
                    scope === s
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  )}
                >
                  {s === 'GLOBAL' ? 'Visible to All' : 'Private to Me'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="h-9 rounded-md text-xs border-slate-200"
              placeholder="Optional"
            />
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{saving ? 'Creating…' : 'Create'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IngestUrlDialog({
  open,
  onOpenChange,
  kbId,
  onIngested,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kbId: string | null;
  onIngested: () => void;
}) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbId || !url.trim()) return;
    setSaving(true);
    try {
      await aiAPI.ingestUrl(kbId, url.trim(), title.trim() || undefined);
      toast.success('URL queued for ingestion');
      onIngested();
      onOpenChange(false);
      setUrl('');
      setTitle('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to ingest URL');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-lg border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight text-slate-900">
            Ingest from URL
          </DialogTitle>
          <DialogDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            The system will fetch, extract, chunk, and embed the page
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">URL</Label>
            <Input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-9 rounded-md text-xs border-slate-200"
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="h-9 rounded-md text-xs border-slate-200"
              placeholder="Optional display title"
            />
          </div>
          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="h-9 px-4 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white gap-2"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{saving ? 'Queuing…' : 'Ingest'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
