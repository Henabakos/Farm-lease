import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Upload,
  File as FileIcon,
  Trash2,
  Users,
  Sprout,
  DollarSign,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { clustersAPI, usersAPI } from '@/src/services/api';
import { uploadFile, type UploadedFile } from '@/src/services/files';
import { useProposals } from '@/src/hooks/useProposals';

interface TargetOption {
  id: string;
  label: string;
  subtitle?: string;
}

export function ProposalCreate({ onBack, onSubmit }: { onBack: () => void; onSubmit?: () => void }) {
  const location = useLocation();
  const { createProposal, publishProposal } = useProposals();
  const [targetType, setTargetType] = useState<'FARMER' | 'CLUSTER'>('CLUSTER');
  const [targets, setTargets] = useState<TargetOption[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDocs, setPendingDocs] = useState<File[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedFile[]>([]);
  const docInputRef = React.useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    targetId: '',
    description: '',
    budget: '',
    currency: 'USD',
    leaseTermMonths: '',
    roi: '',
    interestRate: '',
    repaymentPeriod: '',
    collateral: '',
    location: '',
  });

  // Handle pre-selected cluster from router state
  useEffect(() => {
    const state = location.state as { clusterId?: string; clusterName?: string } | null;
    if (state?.clusterId) {
      setTargetType('CLUSTER');
      setFormData((prev) => ({
        ...prev,
        targetId: state.clusterId,
        title: state.clusterName ? `Proposal for ${state.clusterName}` : '',
      }));
    }
  }, [location.state]);

  // Load real targets whenever the picker switches between cluster and farmer.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoadingTargets(true);
      try {
        if (targetType === 'CLUSTER') {
          const res = await clustersAPI.getAll({});
          const rows = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.items ?? [];
          if (!cancelled) {
            setTargets(rows.map((c: any) => ({
              id: c.id,
              label: c.name,
              subtitle: c.location ?? undefined,
            })));
          }
        } else {
          const res = await usersAPI.searchUsers(undefined, 'FARMER');
          const rows = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
          if (!cancelled) {
            setTargets(rows.map((u: any) => ({
              id: u.id,
              label: u.full_name ?? u.fullName ?? u.email,
              subtitle: u.email,
            })));
          }
        }
      } catch {
        if (!cancelled) toast.error(`Failed to load ${targetType === 'CLUSTER' ? 'clusters' : 'farmers'}`);
      } finally {
        if (!cancelled) setIsLoadingTargets(false);
      }
    }
    setTargets([]);
    setFormData((prev) => ({ ...prev, targetId: '' }));
    load();
    return () => {
      cancelled = true;
    };
  }, [targetType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAttach = () => docInputRef.current?.click();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPendingDocs((prev) => [...prev, ...files]);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const removePending = (i: number) => setPendingDocs((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault();
    if (!formData.targetId) {
      toast.error('Please select a target');
      return;
    }
    if (!formData.budget) {
      toast.error('Budget is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload any pending docs first (best-effort — failure rolls back the proposal create).
      let docs = uploadedDocs;
      if (pendingDocs.length > 0) {
        const ups = await Promise.all(pendingDocs.map((f) => uploadFile(f, 'proposals')));
        docs = [...uploadedDocs, ...ups];
        setUploadedDocs(docs);
        setPendingDocs([]);
      }

      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        targetType,
        proposedAmount: Number(formData.budget),
        currency: formData.currency,
        location: formData.location || undefined,
        leaseTermMonths: formData.leaseTermMonths ? Number(formData.leaseTermMonths) : undefined,
        roi: formData.roi ? Number(formData.roi) : undefined,
        terms: {
          interestRate: formData.interestRate ? Number(formData.interestRate) : undefined,
          repaymentPeriod: formData.repaymentPeriod || undefined,
          collateral: formData.collateral || undefined,
          documents: docs.map((d) => ({
            storage_key: d.storage_key,
            file_name: d.file_name,
            mime_type: d.mime_type,
            file_size: d.file_size,
          })),
        },
      };
      if (targetType === 'CLUSTER') payload.clusterId = formData.targetId;
      else payload.targetUserId = formData.targetId;

      const created = await createProposal(payload);
      if (publish) {
        await publishProposal(created.id);
      }
      onSubmit?.();
      onBack();
    } catch {
      // Errors already toasted inside the hook.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-md hover:bg-slate-100 transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Create New Proposal</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">
            Draft a funding offer for a farmer or cluster.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => submit(e, true)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base font-bold tracking-tight">Basic Information</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Define the core details of your proposal.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Proposal Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Maize Expansion Funding 2024"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Target Type</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={targetType === 'FARMER' ? 'default' : 'outline'}
                        className={cn(
                          'flex-1 h-9 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all active:scale-95',
                          targetType === 'FARMER'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 shadow-sm',
                        )}
                        onClick={() => setTargetType('FARMER')}
                      >
                        <Sprout className="w-3.5 h-3.5" />
                        Farmer
                      </Button>
                      <Button
                        type="button"
                        variant={targetType === 'CLUSTER' ? 'default' : 'outline'}
                        className={cn(
                          'flex-1 h-9 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all active:scale-95',
                          targetType === 'CLUSTER'
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 shadow-sm',
                        )}
                        onClick={() => setTargetType('CLUSTER')}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Cluster
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="targetId" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                      Select Target
                    </Label>
                    <Select
                      value={formData.targetId}
                      onValueChange={(val) => setFormData({ ...formData, targetId: val })}
                    >
                      <SelectTrigger className="h-9 bg-slate-50 border-slate-200 rounded-md focus:ring-primary/20 text-xs font-medium pl-3">
                        <SelectValue placeholder={isLoadingTargets ? 'Loading...' : `Select a ${targetType.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-slate-200">
                        {targets.length === 0 && !isLoadingTargets ? (
                          <div className="px-3 py-2 text-xs text-slate-400">No options available</div>
                        ) : (
                          targets.map((t) => (
                            <SelectItem key={t.id} value={t.id} className="text-xs font-medium">
                              {t.label}
                              {t.subtitle && <span className="text-slate-400 ml-2">— {t.subtitle}</span>}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the purpose and goals of this funding..."
                    className="min-h-[100px] bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium p-3 resize-none"
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Location (Optional)
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., Kaduna, Nigeria"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base font-bold tracking-tight">Documents</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Attach feasibility studies, land titles, or business plans.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <input
                  ref={docInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
                <div
                  className="border border-dashed border-slate-200 rounded-lg p-6 text-center space-y-3 hover:border-primary/50 hover:bg-slate-50 transition-all cursor-pointer group"
                  onClick={handleAttach}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 tracking-tight">Click to upload</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PDF, DOCX, or images (max 25MB)</p>
                  </div>
                </div>

                {pendingDocs.length > 0 && (
                  <div className="space-y-2">
                    {pendingDocs.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-100 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                            <FileIcon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{doc.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {(doc.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-rose-500 h-8 w-8 rounded-md hover:bg-rose-50 transition-all active:scale-95"
                          onClick={() => removePending(i)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base font-bold tracking-tight">Financial Terms</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                  Set the budget and repayment terms.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="budget" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Budget ({formData.currency})
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-9"
                      required
                      value={formData.budget}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="leaseTermMonths" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Lease Term (months)
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input
                      id="leaseTermMonths"
                      name="leaseTermMonths"
                      type="number"
                      min="1"
                      placeholder="12"
                      className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-9"
                      value={formData.leaseTermMonths}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="roi" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Expected ROI (%)
                  </Label>
                  <Input
                    id="roi"
                    name="roi"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="15"
                    value={formData.roi}
                    onChange={handleInputChange}
                    className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="interestRate" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Interest Rate (%)
                  </Label>
                  <Input
                    id="interestRate"
                    name="interestRate"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="repaymentPeriod" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Repayment Period
                  </Label>
                  <Input
                    id="repaymentPeriod"
                    name="repaymentPeriod"
                    placeholder="e.g., 18 Months"
                    value={formData.repaymentPeriod}
                    onChange={handleInputChange}
                    className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="collateral" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">
                    Collateral (Optional)
                  </Label>
                  <Input
                    id="collateral"
                    name="collateral"
                    placeholder="e.g., Land Title"
                    value={formData.collateral}
                    onChange={handleInputChange}
                    className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 gap-2 text-[11px] font-bold uppercase tracking-wider rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Submit & Publish
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={(e) => submit(e, false)}
                className="w-full h-10 text-[11px] font-bold uppercase tracking-wider rounded-md border-slate-200 bg-white shadow-sm transition-all active:scale-95"
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                className="w-full h-10 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all active:scale-95"
                onClick={onBack}
              >
                Cancel
              </Button>
            </div>

            <Card className="border border-primary/10 shadow-sm bg-primary/5 rounded-lg overflow-hidden">
              <CardContent className="p-4 flex gap-3">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Drafts are private. Published proposals notify the target and can be negotiated, accepted, or rejected.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
