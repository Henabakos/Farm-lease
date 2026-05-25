import React from 'react';
import { motion } from 'motion/react';
import { 
  Sprout, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  Globe, 
  Zap, 
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Wallet,
  Lock,
  Activity,
  FileText,
  MessageSquare,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function LandingPage({ onLogin, onRegister }: { onLogin: () => void, onRegister: () => void }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sprout className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Agri<span className="text-primary">Invest</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary transition-colors">How it Works</a>
            <a href="#impact" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-primary transition-colors">Impact</a>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onLogin} className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-primary hover:bg-primary/5 rounded-md px-5 h-10">
              Log In
            </Button>
            <Button onClick={onRegister} className="bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider rounded-md px-6 h-10 shadow-lg shadow-primary/20 transition-all active:scale-95">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto space-y-8"
          >
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              The Future of Agricultural Finance
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Empowering Farmers, <br />
              <span className="text-primary">Enriching Investors.</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
              AgriInvest connects smallholder farmers with global investors through a secure, transparent, and data-driven platform. Grow your wealth while cultivating sustainable futures.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button onClick={onRegister} className="w-full sm:w-auto h-14 px-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider text-xs shadow-xl shadow-primary/20 transition-all active:scale-95 group">
                Start Investing Now
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-xl border-slate-200 bg-white text-slate-600 font-bold uppercase tracking-wider text-xs hover:bg-slate-50 transition-all active:scale-95" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                Watch Demo
              </Button>
            </div>
            
            <div className="pt-12 flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span className="font-bold text-sm tracking-tight">Global Reach</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="font-bold text-sm tracking-tight">Secure Escrow</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span className="font-bold text-sm tracking-tight">Instant Payouts</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="impact" className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: 'Total Investment', value: '$12.4M', sub: 'Last 12 months' },
              { label: 'Active Farmers', value: '15,000+', sub: 'Across 12 countries' },
              { label: 'Avg. ROI', value: '18.5%', sub: 'Annualized returns' },
              { label: 'Success Rate', value: '99.2%', sub: 'Project completion' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-2"
              >
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{stat.label}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Built for Scale, <span className="text-primary">Designed for Trust.</span></h2>
            <p className="text-slate-500 font-medium leading-relaxed">Our platform provides the tools you need to manage complex agricultural investments with ease and security.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Cluster Management',
                desc: 'Organize farmers into efficient clusters with dedicated representatives for better oversight and risk mitigation.',
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-50'
              },
              {
                title: 'Smart Agreements',
                desc: 'Legally binding digital contracts with automated compliance checks and transparent negotiation history.',
                icon: ShieldCheck,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50'
              },
              {
                title: 'Real-time Analytics',
                desc: 'Monitor crop health, weather patterns, and financial performance with our advanced data dashboard.',
                icon: BarChart3,
                color: 'text-purple-600',
                bg: 'bg-purple-50'
              },
              {
                title: 'Escrow Payments',
                desc: 'Secure payment processing with multi-stage verification to ensure funds are released only upon milestone completion.',
                icon: Wallet,
                color: 'text-amber-600',
                bg: 'bg-amber-50'
              },
              {
                title: 'AI Insights',
                desc: 'Leverage machine learning to predict yields, identify risks, and optimize your investment portfolio.',
                icon: Zap,
                color: 'text-rose-600',
                bg: 'bg-rose-50'
              },
              {
                title: 'Global Compliance',
                desc: 'Built-in KYC/AML verification and international legal frameworks to protect all parties involved.',
                icon: Globe,
                color: 'text-indigo-600',
                bg: 'bg-indigo-50'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white rounded-2xl overflow-hidden group">
                  <CardContent className="p-8 space-y-6">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300", feature.bg, feature.color)}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{feature.title}</h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Preview Section */}
      <section className="py-32 bg-slate-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">The Dashboard</Badge>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">Everything You Need <br /><span className="text-primary">In One Place.</span></h2>
              </div>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                Our intuitive dashboard gives you a bird's-eye view of your entire portfolio. Track yields, manage agreements, and communicate with partners in real-time.
              </p>
              
              <div className="space-y-4 pt-4">
                {[
                  { title: 'Portfolio Analytics', desc: 'Visual performance tracking with predictive AI modeling.' },
                  { title: 'Unified Messaging', desc: 'Secure, encrypted chat directly within the platform.' },
                  { title: 'Document Vault', desc: 'All your legal and technical documents, organized and accessible.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 relative">
              <div className="absolute -inset-10 bg-primary/5 rounded-3xl blur-3xl opacity-50" />
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden"
              >
                {/* Mock Dashboard UI */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Sprout className="text-white w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">AgriInvest <span className="text-slate-400 font-medium">/ Dashboard</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200" />
                  </div>
                </div>
                
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Portfolio', val: '$124,500', icon: Wallet, color: 'text-primary' },
                      { label: 'Active Investments', val: '12', icon: TrendingUp, color: 'text-primary' },
                      { label: 'Farms Supported', val: '45', icon: Sprout, color: 'text-primary' },
                      { label: 'Yield Rate', val: '18.4%', icon: ArrowUpRight, color: 'text-primary' }
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 group hover:bg-white hover:shadow-md transition-all duration-300">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <stat.icon className={cn("w-4 h-4", stat.color)} />
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                          <p className="text-xs font-bold text-slate-900">{stat.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Recent Projects</h4>
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider cursor-pointer">View All</span>
                      </div>
                      <div className="space-y-3">
                        {[
                          { title: 'Green Valley Organic Maize', location: 'Kaduna, Nigeria', roi: '22%', amount: '$12,000' },
                          { title: 'Nairobi Drip Irrigation', location: 'Nairobi, Kenya', roi: '18%', amount: '$8,500' }
                        ].map((p, i) => (
                          <div key={i} className="p-3 rounded-xl border border-slate-100 bg-white flex items-center gap-3 shadow-sm hover:border-primary/20 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                              <img src={`https://picsum.photos/seed/farm${i+1}/100/100`} alt="Farm" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">{p.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{p.location}</span>
                                <span className="text-[8px] text-emerald-600 font-bold uppercase tracking-wider">+{p.roi} ROI</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-primary">{p.amount}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Yield Distribution</h4>
                      <div className="space-y-4 pt-1">
                        {[
                          { label: 'Maize', value: 45, color: 'bg-primary' },
                          { label: 'Soybeans', value: 30, color: 'bg-primary/70' },
                          { label: 'Cocoa', value: 15, color: 'bg-primary/40' }
                        ].map((item) => (
                          <div key={item.label} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider">
                              <span className="text-slate-500">{item.label}</span>
                              <span className="text-primary">{item.value}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Impact Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-4">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">Global Presence</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">Cultivating Change <br /><span className="text-primary">Across the Globe.</span></h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              From the highlands of Kenya to the plains of Nigeria, we are building a global network of sustainable agriculture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                region: 'East Africa', 
                projects: '450+', 
                impact: '12,000 Farmers', 
                desc: 'Focusing on high-value horticulture and sustainable irrigation systems in Kenya and Tanzania.',
                img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800'
              },
              { 
                region: 'West Africa', 
                projects: '320+', 
                impact: '8,500 Farmers', 
                desc: 'Empowering smallholders in Nigeria and Ghana through organic fertilizer clusters and grain storage.',
                img: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800'
              },
              { 
                region: 'Southeast Asia', 
                projects: '180+', 
                impact: '4,200 Farmers', 
                desc: 'Implementing climate-resilient rice farming and sustainable palm oil practices in Vietnam and Indonesia.',
                img: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&q=80&w=800'
              }
            ].map((region, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="space-y-6 group"
              >
                <div className="aspect-[4/3] rounded-3xl overflow-hidden relative shadow-xl">
                  <img 
                    src={region.img} 
                    alt={region.region} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-white tracking-tight">{region.region}</h4>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">{region.projects} Active Projects</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 px-2">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{region.desc}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>Impacting {region.impact}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Negotiation & Communication Section */}
      <section className="py-32 bg-slate-50/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7 relative order-2 lg:order-1">
              <div className="absolute -inset-10 bg-primary/5 rounded-3xl blur-3xl opacity-50" />
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden"
              >
                {/* Mock Chat UI */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img src="https://i.pravatar.cc/100?u=farmer" alt="Farmer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Zaria Organic Growers</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online • Cluster Rep</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-slate-400"><Users className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-slate-400"><ShieldCheck className="w-4 h-4" /></Button>
                  </div>
                </div>
                
                <div className="p-8 space-y-6 bg-slate-50/30 h-[400px] overflow-y-auto scrollbar-hide">
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-4 rounded-2xl rounded-tl-none bg-white border border-slate-100 shadow-sm space-y-1">
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Hello! We've reviewed your proposal for the organic maize pilot. The terms look promising, but we'd like to discuss the irrigation timeline.
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase text-right">09:15 AM</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <div className="max-w-[80%] p-4 rounded-2xl rounded-tr-none bg-primary text-white shadow-lg shadow-primary/20 space-y-1">
                      <p className="text-xs leading-relaxed font-medium">
                        Hi Zaria! Glad to hear. We can definitely adjust the irrigation phase to start two weeks earlier. Would that align with your planting schedule?
                      </p>
                      <p className="text-[9px] text-white/60 font-bold uppercase text-right">09:18 AM</p>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-4 rounded-2xl rounded-tl-none bg-white border border-slate-100 shadow-sm space-y-1">
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        Yes, that would be perfect. It ensures the soil is ready before the peak dry season.
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase text-right">09:20 AM</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Proposal Updated</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Agreement Ready for Signing</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                  <div className="flex-1 h-10 rounded-full bg-slate-50 border border-slate-200 px-4 flex items-center text-slate-400 text-xs font-medium">
                    Type your message...
                  </div>
                  <Button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center p-0">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </motion.div>
            </div>

            <div className="lg:col-span-5 space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">Real-time Collaboration</Badge>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">Negotiate Terms <br /><span className="text-primary">In Real-Time.</span></h2>
              </div>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                No more endless email chains. Our integrated messaging system allows you to discuss terms, share updates, and finalize agreements directly within the platform.
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Direct Chat</h4>
                  <p className="text-xs text-slate-500 font-medium">Instant communication with cluster reps and farmers.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Contextual Info</h4>
                  <p className="text-xs text-slate-500 font-medium">Proposals and agreements are always just a click away.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Deep Dive */}
      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-10 bg-primary/20 rounded-full blur-[100px] opacity-30" />
              <div className="grid grid-cols-2 gap-6 relative z-10">
                {[
                  { icon: ShieldCheck, title: 'Escrow Protection', desc: 'Funds are only released when milestones are verified.' },
                  { icon: Lock, title: 'Data Encryption', desc: 'Bank-grade AES-256 encryption for all sensitive data.' },
                  { icon: CheckCircle2, title: 'KYC/AML Verified', desc: 'Rigorous background checks for all platform participants.' },
                  { icon: Activity, title: 'Real-time Audits', desc: 'Continuous monitoring of all system transactions.' }
                ].map((item, i) => (
                  <Card key={i} className="bg-white/10 border-white/20 backdrop-blur-xl rounded-2xl p-6 space-y-4 hover:bg-white/20 transition-colors duration-300 group">
                    <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold tracking-tight text-white">{item.title}</h4>
                      <p className="text-[11px] text-white/70 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <Badge className="bg-primary/20 text-primary border-none px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">Security First</Badge>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">Your Investment, <br /><span className="text-primary">Protected.</span></h2>
              </div>
              <p className="text-lg text-slate-400 font-medium leading-relaxed">
                We prioritize the safety of your capital. Our multi-layered security framework ensures that every transaction is secure, transparent, and legally binding.
              </p>
              <div className="pt-4">
                <Button className="h-12 px-8 rounded-xl bg-white text-slate-900 font-bold uppercase tracking-wider text-[10px] hover:bg-slate-100 transition-all active:scale-95" onClick={() => toast.success("Security whitepaper PDF download started (agriinvest-security-v2.pdf)")}>
                  Read Security Whitepaper
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">Simple Process</Badge>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-slate-900">From Soil to <br /><span className="text-primary">Sustainable Profit.</span></h2>
              </div>
              
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Onboard & Verify', desc: 'Farmers and investors undergo rigorous KYC and land title verification.' },
                  { step: '02', title: 'Propose & Negotiate', desc: 'Investors create tailored proposals; farmers negotiate terms in real-time.' },
                  { step: '03', title: 'Fund & Execute', desc: 'Agreements are signed digitally and funds are held in secure escrow.' },
                  { step: '04', title: 'Harvest & Return', desc: 'Monitor progress through AI insights and receive returns upon harvest.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="text-2xl font-black text-slate-100 group-hover:text-primary transition-colors duration-300">{item.step}</div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold tracking-tight text-slate-900">{item.title}</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl opacity-50" />
              <Card className="relative border-slate-200 bg-white rounded-3xl overflow-hidden shadow-xl">
                <CardContent className="p-0">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/20" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AgriInvest Dashboard</div>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-24 rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="h-2 w-12 bg-slate-200 rounded" />
                        <div className="h-3 w-20 bg-slate-300 rounded" />
                      </div>
                      <div className="h-24 rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="h-2 w-12 bg-slate-200 rounded" />
                        <div className="h-3 w-20 bg-slate-300 rounded" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-4 w-1/3 bg-slate-100 rounded" />
                      <div className="space-y-2">
                        <div className="h-12 w-full rounded-xl bg-white border border-slate-100 flex items-center px-4 justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-slate-100" />
                            <div className="h-2 w-24 bg-slate-200 rounded" />
                          </div>
                          <div className="h-5 w-16 bg-primary/10 rounded-full" />
                        </div>
                        <div className="h-12 w-full rounded-xl bg-white border border-slate-100 flex items-center px-4 justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-slate-100" />
                            <div className="h-2 w-24 bg-slate-200 rounded" />
                          </div>
                          <div className="h-5 w-16 bg-slate-100 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="bg-primary rounded-3xl p-12 md:p-24 text-center text-white relative overflow-hidden shadow-xl shadow-primary/20">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
              </svg>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto space-y-10 relative z-10"
            >
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">Ready to Cultivate <br />Your Future?</h2>
              <p className="text-white/80 font-medium text-lg">Join thousands of investors and farmers already growing together on the world's most trusted agricultural platform.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button onClick={onRegister} className="w-full sm:w-auto h-16 px-12 rounded-2xl bg-white text-primary hover:bg-slate-50 font-bold uppercase tracking-wider text-xs shadow-xl transition-all active:scale-95">
                  Create Free Account
                </Button>
                <Button variant="ghost" className="w-full sm:w-auto h-16 px-12 rounded-2xl text-white hover:bg-white/10 font-bold uppercase tracking-wider text-xs transition-all" onClick={() => window.location.href = 'mailto:sales@farmlease.local'}>
                  Contact Sales
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 pt-24 pb-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Sprout className="text-white w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Agri<span className="text-primary">Invest</span>
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Transforming agricultural finance through transparency, technology, and trust.
              </p>
            </div>
            
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">For Investors</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">For Farmers</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Clusters</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Impact Report</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              © 2026 AgriInvest Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Globe className="w-4 h-4" /></a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors"><Users className="w-4 h-4" /></a>
              <a href="#" className="text-slate-400 hover:text-primary transition-colors"><ShieldCheck className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
