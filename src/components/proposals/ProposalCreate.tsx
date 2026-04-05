import React, { useState } from 'react';
import { Proposal, UserRole } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Upload, 
  File, 
  Trash2, 
  Users, 
  Sprout, 
  DollarSign, 
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useStore } from '@/src/store/useStore';
import { toast } from 'sonner';

export function ProposalCreate({ onBack, onSubmit }: { onBack: () => void, onSubmit?: (proposal: Partial<Proposal>) => void }) {
  const { addProposal, user } = useStore();
  const [targetType, setTargetType] = useState<'FARMER' | 'CLUSTER'>('FARMER');
  const [formData, setFormData] = useState({
    title: '',
    targetId: '',
    description: '',
    budget: '',
    timeline: '',
    interestRate: '',
    repaymentPeriod: '',
    collateral: ''
  });
  const [documents, setDocuments] = useState<{ name: string; size: string }[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpload = () => {
    const mockDocs = [
      { name: 'business_plan.pdf', size: '1.2MB' },
      { name: 'land_title.pdf', size: '0.8MB' }
    ];
    setDocuments([...documents, ...mockDocs]);
    toast.success('Documents uploaded successfully');
  };

  const removeDoc = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetName = targetType === 'FARMER' 
      ? (formData.targetId === 'f1' ? 'Sarah Miller' : 'John Doe')
      : (formData.targetId === 'c1' ? 'Kaduna North Maize Cluster' : 'Zaria Organic Growers');

    const newProposal: Proposal = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title,
      targetType,
      targetId: formData.targetId,
      targetName,
      description: formData.description,
      budget: Number(formData.budget),
      amount: Number(formData.budget),
      location: 'Kaduna, Nigeria',
      roi: 15,
      timeline: formData.timeline,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      documents: documents.map(d => ({ ...d, type: 'PDF' })),
      terms: {
        interestRate: Number(formData.interestRate),
        repaymentPeriod: formData.repaymentPeriod,
        collateral: formData.collateral
      },
      history: [{ date: new Date().toISOString(), action: 'Proposal Created', user: user.name }]
    };

    addProposal(newProposal);
    toast.success('Proposal submitted successfully');
    if (onSubmit) onSubmit(newProposal);
    onBack();
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-md hover:bg-slate-100 transition-all active:scale-95">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Create New Proposal</h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Draft a funding offer for a farmer or cluster.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base font-bold tracking-tight">Basic Information</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Define the core details of your proposal.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Proposal Title</Label>
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
                          "flex-1 h-9 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all active:scale-95",
                          targetType === 'FARMER' ? "bg-primary text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 shadow-sm"
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
                          "flex-1 h-9 gap-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all active:scale-95",
                          targetType === 'CLUSTER' ? "bg-primary text-white shadow-sm" : "bg-white border-slate-200 text-slate-600 shadow-sm"
                        )}
                        onClick={() => setTargetType('CLUSTER')}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Cluster
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="targetId" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Select Target</Label>
                    <Select name="targetId" onValueChange={(val: string) => setFormData({ ...formData, targetId: val })}>
                      <SelectTrigger className="h-9 bg-slate-50 border-slate-200 rounded-md focus:ring-primary/20 text-xs font-medium pl-3">
                        <SelectValue placeholder={`Select a ${targetType.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-slate-200">
                        {targetType === 'FARMER' ? (
                          <>
                            <SelectItem value="f1" className="text-xs font-medium">Sarah Miller</SelectItem>
                            <SelectItem value="f2" className="text-xs font-medium">John Doe</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="c1" className="text-xs font-medium">Kaduna North Maize Cluster</SelectItem>
                            <SelectItem value="c2" className="text-xs font-medium">Zaria Organic Growers</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Description</Label>
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
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
              <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base font-bold tracking-tight">Documents</CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Upload feasibility studies, land titles, or business plans.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div 
                  className="border border-dashed border-slate-200 rounded-lg p-6 text-center space-y-3 hover:border-primary/50 hover:bg-slate-50 transition-all cursor-pointer group"
                  onClick={handleUpload}
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700 tracking-tight">Click to upload or drag and drop</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">PDF, DOCX, or JPG (max 10MB)</p>
                  </div>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-100 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                            <File className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{doc.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{doc.size}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-rose-500 h-8 w-8 rounded-md hover:bg-rose-50 transition-all active:scale-95" onClick={() => removeDoc(i)}>
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
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Set the budget and repayment terms.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="budget" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Budget (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input 
                      id="budget" 
                      name="budget" 
                      type="number" 
                      placeholder="0.00" 
                      className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-9" 
                      required
                      value={formData.budget}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="timeline" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Timeline</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <Input 
                      id="timeline" 
                      name="timeline" 
                      placeholder="e.g., 12 Months" 
                      className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-9" 
                      required
                      value={formData.timeline}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="interestRate" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Interest Rate (%)</Label>
                  <Input 
                    id="interestRate" 
                    name="interestRate" 
                    type="number" 
                    placeholder="0" 
                    required
                    value={formData.interestRate}
                    onChange={handleInputChange}
                    className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="repaymentPeriod" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Repayment Period</Label>
                  <Input 
                    id="repaymentPeriod" 
                    name="repaymentPeriod" 
                    placeholder="e.g., 18 Months" 
                    required
                    value={formData.repaymentPeriod}
                    onChange={handleInputChange}
                    className="h-9 bg-slate-50 border-slate-200 rounded-md focus-visible:ring-primary/20 focus-visible:bg-white transition-all text-xs font-medium pl-3"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="collateral" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Collateral (Optional)</Label>
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
              <Button type="submit" className="w-full h-10 gap-2 text-[11px] font-bold uppercase tracking-wider rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95">
                <CheckCircle2 className="w-4 h-4" />
                Submit Proposal
              </Button>
              <Button type="button" variant="outline" className="w-full h-10 text-[11px] font-bold uppercase tracking-wider rounded-md border-slate-200 bg-white shadow-sm transition-all active:scale-95" onClick={onBack}>
                Cancel
              </Button>
            </div>

            <Card className="border border-primary/10 shadow-sm bg-primary/5 rounded-lg overflow-hidden">
              <CardContent className="p-4 flex gap-3">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Your proposal will be reviewed by the target and our compliance team. You can negotiate terms if they request changes.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
