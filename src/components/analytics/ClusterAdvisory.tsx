import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, TrendingUp, DollarSign, Target, Loader2, FileText, ChevronRight, History, Calendar } from 'lucide-react';
import { aiAPI } from '@/src/services/ai';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface ClusterAdvisoryProps {
  clusterId: string;
  clusterName: string;
}

export function ClusterAdvisory({ clusterId, clusterName }: ClusterAdvisoryProps) {
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [clusterId]);

  const loadHistory = async () => {
    try {
      const response = await aiAPI.getAdvisoryHistory(clusterId);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const generateReport = async () => {
    if (!focus.trim()) {
      toast.error('Please specify what you want to focus on (e.g., ROI, High-yield crop)');
      return;
    }

    setLoading(true);
    try {
      const response = await aiAPI.getAdvisoryReport({
        cluster_id: clusterId,
        focus: focus,
      });
      setReport(response.data);
      toast.success('Advisory report generated successfully!');
      loadHistory(); // Refresh history after new generation
    } catch (err: any) {
      console.error('Advisory failed:', err);
      toast.error('Failed to generate advisory report. Check if AI service is online.');
    } finally {
      setLoading(false);
    }
  };

  const selectFromHistory = (item: any) => {
    setReport(item);
    setFocus(item.focus);
    setShowHistory(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          Investment Intelligence
        </h2>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="mr-2 h-4 w-4" />
            {showHistory ? 'Back to Analysis' : `View History (${history.length})`}
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid gap-4"
          >
            {history.map((item) => (
              <Card 
                key={item.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => selectFromHistory(item)}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-medium">{item.focus}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(item.createdAt), 'PPP p')}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Generate New Strategic Advisory</CardTitle>
                <CardDescription>
                  Personalized business model analysis for <strong>{clusterName}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <Input
                      placeholder="Describe your focus (e.g. 'Maximize ROI with high-value crops')"
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      className="bg-background"
                      onKeyDown={(e) => e.key === 'Enter' && generateReport()}
                    />
                  </div>
                  <Button onClick={generateReport} disabled={loading || !focus}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Assess Cluster
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results section */}
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-12 text-center space-y-4"
                >
                  <div className="relative">
                    <Brain className="h-12 w-12 text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Generating Strategic Report</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Analyzing cluster financial throughput and RAG documents...
                    </p>
                  </div>
                </motion.div>
              )}

              {report && !loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid gap-6 md:grid-cols-3"
                >
                  {/* Stats Sidebar (Only if we have full report data) */}
                  <div className="md:col-span-1 space-y-4">
                    {report.stats && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Finances
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span>Active Capital</span>
                            <span className="font-bold">${report.stats.activeCapital.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span>Pending</span>
                            <span className="font-medium text-yellow-600">${report.stats.pendingCapital.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm pt-2 border-t">
                            <span>Scale</span>
                            <span className="font-medium">{report.stats.area} ha</span>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card className="bg-primary/5 border-primary/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Context
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground italic">
                          Focus: "{report.focus}"
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {report.createdAt ? `Generated on ${format(new Date(report.createdAt), 'PPP')}` : 'Live Analysis'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Report */}
                  <div className="md:col-span-2">
                    <Card className="h-full">
                      <CardContent className="pt-6">
                        <ScrollArea className="h-[600px] pr-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{report.report}</ReactMarkdown>
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
