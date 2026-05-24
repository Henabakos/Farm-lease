import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Eye,
  Loader2,
  ShieldCheck,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  listKycDocuments,
  reviewKycDocument,
  type KycDocument,
  type KycDocumentStatus,
} from '@/src/services/kyc';
import { getSignedDownloadUrl } from '@/src/services/files';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const STATUS_FILTERS: { label: string; value: 'ALL' | KycDocumentStatus }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All', value: 'ALL' },
];

function statusBadge(status: KycDocumentStatus) {
  if (status === 'APPROVED') {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </Badge>
    );
  }
  if (status === 'REJECTED') {
    return (
      <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-100 gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
        <AlertCircle className="w-3 h-3" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-100 gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
      <Clock className="w-3 h-3" /> Pending
    </Badge>
  );
}

function prettyType(t: string) {
  return t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function KycReviewTab() {
  const [filter, setFilter] = useState<'ALL' | KycDocumentStatus>('PENDING');
  const [docs, setDocs] = useState<KycDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewing, setReviewing] = useState<KycDocument | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listKycDocuments({
        status: filter === 'ALL' ? undefined : filter,
        pageSize: 100,
      });
      setDocs(res.data);
    } catch {
      toast.error('Could not load KYC documents');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    return {
      pending: docs.filter((d) => d.status === 'PENDING').length,
      approved: docs.filter((d) => d.status === 'APPROVED').length,
      rejected: docs.filter((d) => d.status === 'REJECTED').length,
    };
  }, [docs]);

  const openDocument = async (doc: KycDocument) => {
    try {
      const url = await getSignedDownloadUrl(doc.storage_key);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Could not open document');
    }
  };

  const startReview = (doc: KycDocument, initial: 'APPROVED' | 'REJECTED') => {
    setReviewing(doc);
    setDecision(initial);
    setNotes('');
  };

  const submitReview = async () => {
    if (!reviewing) return;
    if (decision === 'REJECTED' && !notes.trim()) {
      toast.error('Please add a reason when rejecting');
      return;
    }
    setIsSubmitting(true);
    try {
      await reviewKycDocument(reviewing.id, decision, notes.trim() || undefined);
      toast.success(`Document ${decision === 'APPROVED' ? 'approved' : 'rejected'}`);
      setReviewing(null);
      await refresh();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg || 'Could not submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'default' : 'outline'}
              className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span><span className="text-amber-600">{counts.pending}</span> pending</span>
          <span><span className="text-emerald-600">{counts.approved}</span> approved</span>
          <span><span className="text-rose-600">{counts.rejected}</span> rejected</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : docs.length === 0 ? (
        <Card className="border border-slate-200 bg-slate-50 shadow-none">
          <CardContent className="p-10 flex flex-col items-center gap-2 text-center">
            <ShieldCheck className="w-8 h-8 text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              No documents in this category
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <Card key={doc.id} className="border border-slate-200 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-md bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {doc.user_name || doc.user_email || 'Unknown user'}
                      </p>
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                        {prettyType(doc.document_type)}
                      </Badge>
                      {statusBadge(doc.status)}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      {doc.file_name} · submitted {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                    {doc.status !== 'PENDING' && doc.review_notes ? (
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                        Note: {doc.review_notes}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider"
                    onClick={() => openDocument(doc)}
                  >
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  {doc.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider border-rose-200 text-rose-600 hover:bg-rose-50"
                        onClick={() => startReview(doc, 'REJECTED')}
                      >
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => startReview(doc, 'APPROVED')}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!reviewing} onOpenChange={(open) => !open && setReviewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === 'APPROVED' ? 'Approve document' : 'Reject document'}
            </DialogTitle>
            <DialogDescription>
              {reviewing
                ? `${prettyType(reviewing.document_type)} from ${reviewing.user_name || reviewing.user_email || 'this user'}.`
                : ''}
              {' '}
              The user's overall verification status updates automatically once all required documents are approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {decision === 'REJECTED' ? 'Rejection reason (required)' : 'Reviewer notes (optional)'}
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={decision === 'REJECTED' ? 'e.g., document is blurry, name does not match…' : 'Add an internal note (optional)…'}
              className="min-h-24 text-xs"
            />
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant={decision === 'APPROVED' ? 'default' : 'outline'}
                className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => setDecision('APPROVED')}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant={decision === 'REJECTED' ? 'default' : 'outline'}
                className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => setDecision('REJECTED')}
              >
                Reject
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
