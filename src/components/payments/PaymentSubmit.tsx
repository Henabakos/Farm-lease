import React, { useState } from 'react';
import { Payment } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Info,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function PaymentSubmit({ 
  payment, 
  onBack, 
  onSubmit 
}: { 
  payment: Payment, 
  onBack: () => void,
  onSubmit: (id: string, receiptUrl: string, notes: string) => void
}) {
  const [receipt, setReceipt] = useState<{ name: string; size: string } | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpload = () => {
    // Mock upload
    setReceipt({ name: 'payment_receipt_march.pdf', size: '1.2MB' });
  };

  const handleRemove = () => {
    setReceipt(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(payment.id, receipt.name, notes);
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submit Payment Receipt</h1>
          <p className="text-muted-foreground">Upload your proof of payment for verification.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Review the payment information before submitting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="font-bold text-lg">${payment.amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Due Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{new Date(payment.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Agreement</p>
                  <p className="text-sm font-medium">{payment.agreementTitle}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
                  <p className="text-sm font-medium">{payment.type === 'DISBURSEMENT' ? 'Investment Disbursement' : 'Loan Repayment'}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Upload Receipt (PDF, JPG, or PNG)</Label>
                {!receipt ? (
                  <div 
                    className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-12 text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={handleUpload}
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-muted-foreground">Maximum file size: 5MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <File className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{receipt.name}</p>
                        <p className="text-xs text-muted-foreground">{receipt.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive h-10 w-10" onClick={handleRemove}>
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Any extra details about this payment..." 
                  className="min-h-[100px] bg-background/50"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Submission Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono text-xs">{payment.id.toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-none">Pending Submission</Badge>
                </div>
              </div>

              <Separator />

              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold">Verification Process</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Once submitted, our team will verify the receipt against the bank records. This typically takes 24-48 hours.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  className="w-full h-12 gap-2 text-lg" 
                  disabled={!receipt || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-5 h-5 animate-pulse" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Submit for Review
                    </>
                  )}
                </Button>
                <Button variant="outline" className="w-full h-12" onClick={onBack}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-amber-500/5 border border-amber-500/10">
            <CardContent className="p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700 leading-relaxed">
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
