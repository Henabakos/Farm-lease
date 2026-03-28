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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Proposal</h1>
          <p className="text-muted-foreground">Draft a funding offer for a farmer or cluster.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Define the core details of your proposal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Proposal Title</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="e.g., Maize Expansion Funding 2024" 
                    required 
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Type</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button"
                        variant={targetType === 'FARMER' ? 'default' : 'outline'}
                        className="flex-1 gap-2"
                        onClick={() => setTargetType('FARMER')}
                      >
                        <Sprout className="w-4 h-4" />
                        Farmer
                      </Button>
                      <Button 
                        type="button"
                        variant={targetType === 'CLUSTER' ? 'default' : 'outline'}
                        className="flex-1 gap-2"
                        onClick={() => setTargetType('CLUSTER')}
                      >
                        <Users className="w-4 h-4" />
                        Cluster
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetId">Select Target</Label>
                    <Select name="targetId" onValueChange={(val: string) => setFormData({ ...formData, targetId: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select a ${targetType.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {targetType === 'FARMER' ? (
                          <>
                            <SelectItem value="f1">Sarah Miller</SelectItem>
                            <SelectItem value="f2">John Doe</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="c1">Kaduna North Maize Cluster</SelectItem>
                            <SelectItem value="c2">Zaria Organic Growers</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Describe the purpose and goals of this funding..." 
                    className="min-h-[120px]"
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Upload feasibility studies, land titles, or business plans.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={handleUpload}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, or JPG (max 10MB)</p>
                  </div>
                </div>

                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-3">
                          <File className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.size}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeDoc(i)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Financial Terms</CardTitle>
                <CardDescription>Set the budget and repayment terms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (USD)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="budget" 
                      name="budget" 
                      type="number" 
                      placeholder="0.00" 
                      className="pl-10" 
                      required
                      value={formData.budget}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="timeline" 
                      name="timeline" 
                      placeholder="e.g., 12 Months" 
                      className="pl-10" 
                      required
                      value={formData.timeline}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input 
                    id="interestRate" 
                    name="interestRate" 
                    type="number" 
                    placeholder="0" 
                    required
                    value={formData.interestRate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repaymentPeriod">Repayment Period</Label>
                  <Input 
                    id="repaymentPeriod" 
                    name="repaymentPeriod" 
                    placeholder="e.g., 18 Months" 
                    required
                    value={formData.repaymentPeriod}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collateral">Collateral (Optional)</Label>
                  <Input 
                    id="collateral" 
                    name="collateral" 
                    placeholder="e.g., Land Title" 
                    value={formData.collateral}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button type="submit" className="w-full h-12 gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5" />
                Submit Proposal
              </Button>
              <Button type="button" variant="outline" className="w-full h-12" onClick={onBack}>
                Cancel
              </Button>
            </div>

            <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
              <CardContent className="p-4 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
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
