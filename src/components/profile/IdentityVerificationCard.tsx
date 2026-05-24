import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Upload,
  AlertCircle,
  Trash2,
  Eye,
  Camera,
  IdCard,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteKycDocument,
  getMyKyc,
  submitKycDocument,
  type KycDocument,
  type KycDocumentType,
  type MyKyc,
} from '@/src/services/kyc';
import { uploadFile, getSignedDownloadUrl } from '@/src/services/files';

interface DocSpec {
  type: KycDocumentType;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  accept: string;
}

const REQUIRED_DOCS: DocSpec[] = [
  {
    type: 'photo',
    title: 'Selfie / Profile Photo',
    description: 'A recent, clear photo of your face. JPG or PNG.',
    Icon: Camera,
    accept: 'image/jpeg,image/png',
  },
  {
    type: 'national_id',
    title: 'National ID',
    description: 'Front of your government-issued ID. PDF, JPG, or PNG.',
    Icon: IdCard,
    accept: 'application/pdf,image/jpeg,image/png',
  },
];

function StatusBadge({ status }: { status?: KycDocument['status'] }) {
  if (!status) {
    return (
      <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
        Not uploaded
      </Badge>
    );
  }
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
      <Clock className="w-3 h-3" /> Pending review
    </Badge>
  );
}

function OverallStatus({ status }: { status: MyKyc['verification_status'] }) {
  const map = {
    verified: { label: 'Verified', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', Icon: CheckCircle2 },
    pending: { label: 'Pending Review', cls: 'bg-amber-50 text-amber-600 border-amber-100', Icon: Clock },
    rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-600 border-rose-100', Icon: AlertCircle },
    unverified: { label: 'Not Verified', cls: 'bg-slate-50 text-slate-500 border-slate-200', Icon: ShieldCheck },
  } as const;
  const { label, cls, Icon } = map[status] ?? map.unverified;
  return (
    <Badge variant="outline" className={`${cls} gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md`}>
      <Icon className="w-3 h-3" /> {label}
    </Badge>
  );
}

export function IdentityVerificationCard() {
  const [data, setData] = useState<MyKyc | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<KycDocumentType | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await getMyKyc();
      setData(res);
    } catch {
      toast.error('Could not load verification status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const byType = useMemo(() => {
    const map = new Map<KycDocumentType, KycDocument>();
    (data?.documents ?? []).forEach((d) => {
      const existing = map.get(d.document_type);
      if (!existing || new Date(d.created_at) > new Date(existing.created_at)) {
        map.set(d.document_type, d);
      }
    });
    return map;
  }, [data]);

  const onUpload = async (spec: DocSpec, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Maximum file size is 5MB');
      return;
    }
    setUploadingType(spec.type);
    try {
      const uploaded = await uploadFile(file, 'kyc');
      await submitKycDocument({
        document_type: spec.type,
        storage_key: uploaded.storage_key,
        file_name: uploaded.file_name,
        mime_type: uploaded.mime_type,
        file_size: uploaded.file_size,
      });
      toast.success(`${spec.title} submitted for review`);
      await refresh();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg || 'Failed to submit document');
    } finally {
      setUploadingType(null);
    }
  };

  const onView = async (doc: KycDocument) => {
    try {
      const url = await getSignedDownloadUrl(doc.storage_key);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Could not open document');
    }
  };

  const onDelete = async (doc: KycDocument) => {
    if (!confirm('Remove this document and re-upload?')) return;
    try {
      await deleteKycDocument(doc.id);
      toast.success('Document removed');
      await refresh();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(msg || 'Could not delete document');
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
      <CardHeader className="p-5 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-slate-900">Identity Verification</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
              Upload your photo and national ID for review by an admin.
            </CardDescription>
          </div>
          {data ? <OverallStatus status={data.verification_status} /> : null}
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          REQUIRED_DOCS.map((spec) => {
            const doc = byType.get(spec.type);
            const { Icon } = spec;
            const busy = uploadingType === spec.type;
            return (
              <React.Fragment key={spec.type}>
                <DocRow
                  spec={spec}
                  Icon={Icon}
                  doc={doc}
                  busy={busy}
                  onUpload={(file) => onUpload(spec, file)}
                  onView={() => doc && onView(doc)}
                  onDelete={() => doc && onDelete(doc)}
                />
              </React.Fragment>
            );
          })
        )}

        {data?.verification_status === 'rejected' && (
          <div className="mt-3 p-3 rounded-md border border-rose-100 bg-rose-50 text-[11px] text-rose-700 font-medium leading-relaxed">
            One or more of your documents was rejected. Please re-upload to continue.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DocRowProps {
  spec: DocSpec;
  Icon: React.ComponentType<{ className?: string }>;
  doc?: KycDocument;
  busy: boolean;
  onUpload: (file: File) => void;
  onView: () => void;
  onDelete: () => void;
}

function DocRow({ spec, Icon, doc, busy, onUpload, onView, onDelete }: DocRowProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isApproved = doc?.status === 'APPROVED';

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-md border border-slate-100 bg-slate-50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{spec.title}</p>
          <p className="text-[10px] text-slate-500 font-medium truncate">
            {doc ? doc.file_name : spec.description}
          </p>
          {doc?.status === 'REJECTED' && doc.review_notes ? (
            <p className="text-[10px] text-rose-600 font-medium mt-0.5 truncate">
              Reason: {doc.review_notes}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={doc?.status} />
        {doc ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-white"
              onClick={onView}
            >
              <Eye className="w-3 h-3 mr-1" /> View
            </Button>
            {!isApproved && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-50"
                onClick={onDelete}
                disabled={busy}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </>
        ) : null}
        {!isApproved && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={spec.accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              size="sm"
              className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider rounded-md bg-primary hover:bg-primary/90 shadow-sm"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 mr-1" /> {doc ? 'Replace' : 'Upload'}
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
