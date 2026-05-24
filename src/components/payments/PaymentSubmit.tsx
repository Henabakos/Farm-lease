import React, { useRef, useState } from 'react';
import { Payment } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Upload, 
  File, 
  Trash2, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useStore } from '@/src/store/useStore';
import { usePayments } from '@/src/hooks/usePayments';
import { uploadFile, type UploadedFile } from '@/src/services/files';
import { toast } from 'sonner';

export function PaymentSubmit({ 
  payment, 
  onBack, 
  onSubmit 
}: { 
  payment: Payment, 
  onBack: () => void,
  onSubmit: (id: string, receiptUrl: string, notes: string) => void
}) {
  const { updatePayment } = useStore();
  const { processPayment } = usePayments();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [receipt, setReceipt] = useState<UploadedFile | null>(null);
  const [notes, setNotes] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateReceiptFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error('Upload a PDF, JPG, or PNG receipt.');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('Receipt must be 5MB or smaller.');
      return false;
    }

    return true;
  };

  const uploadReceipt = async (file: File) => {
    if (!validateReceiptFile(file)) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file, 'receipts');
      setReceipt(uploaded);
      toast.success('Receipt uploaded successfully');
    } catch {
      toast.error('Failed to upload receipt. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadReceipt(file);
    event.target.value = '';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await uploadReceipt(file);
  };

  const handleRemove = () => {
    setReceipt(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        storage_key: receipt.storage_key,
        file_name: receipt.file_name,
        mime_type: receipt.mime_type,
        file_size: receipt.file_size,
        bank_reference: bankReference.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      await processPayment(payment.id, payload);
      updatePayment(payment.id, { 
        status: 'SUBMITTED', 
        receiptUrl: receipt.file_name,
        submittedAt: new Date().toISOString()
      });
      onSubmit(payment.id, receipt.file_name, notes);
      setIsSubmitting(false);
    } catch (err) {
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Submit Payment Receipt</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Upload your proof of payment for verification.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold tracking-tight">Payment Details</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Review the payment information before submitting.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Amount</p>
                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-100 shadow-sm">
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-sm text-slate-900">${payment.amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Due Date</p>
                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-100 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span className="font-bold text-sm text-slate-900">{new Date(payment.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Agreement</p>
                  <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-700">{payment.agreementTitle}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1">Type</p>
                  <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-700">{payment.type === 'DISBURSEMENT' ? 'Investment Disbursement' : 'Loan Repayment'}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Upload Receipt (PDF, JPG, or PNG)</Label>
                {!receipt ? (
                  <div 
                    className="border border-dashed border-slate-200 rounded-lg p-10 text-center space-y-3 hover:border-primary/50 hover:bg-slate-50 transition-all cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleDrop}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      {isUploading ? <Clock className="w-6 h-6 text-primary animate-spin" /> : <Upload className="w-6 h-6 text-primary" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700 tracking-tight">{isUploading ? 'Uploading receipt...' : 'Click to upload or drag and drop'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Maximum file size: 5MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-md bg-slate-50 border border-slate-100 group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-slate-100 rounded-md flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <File className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{receipt.file_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{formatBytes(receipt.file_size)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-rose-500 h-9 w-9 rounded-md hover:bg-rose-50 transition-all active:scale-95" onClick={handleRemove}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankReference" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Bank Transfer Reference</Label>
                <input
                  id="bankReference"
                  placeholder="e.g., TXN-2024-00451"
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white focus-visible:outline-none transition-all"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                />
                <p className="text-[10px] text-slate-400 font-medium ml-1">
                  Helps the cluster representative match your receipt to the bank statement.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Additional Notes (Optional)</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Any extra details about this payment..." 
                  className="min-h-25 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium p-3 resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
            <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base font-bold tracking-tight">Submission Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment ID</span>
                  <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{payment.id.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</span>
                  <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">Pending Submission</Badge>
                </div>
              </div>

              <div className="h-px bg-slate-100 w-full" />

              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Verification Process</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Once submitted, our team will verify the receipt against the bank records. This typically takes 24-48 hours.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full h-10 gap-2 text-[11px] font-bold uppercase tracking-wider rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95" 
                  disabled={!receipt || isSubmitting || isUploading}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit for Review
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full h-10 text-[11px] font-bold uppercase tracking-wider rounded-md border-slate-200 bg-white shadow-sm transition-all active:scale-95" onClick={onBack}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-amber-200 shadow-sm bg-amber-50 rounded-lg overflow-hidden">
            <CardContent className="p-4 flex gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                Ensure the receipt clearly shows the transaction ID, date, amount, and recipient details to avoid rejection.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Separator() {
  return <div className="h-px bg-border/50 w-full" />;
}
