import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

export const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  helper?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, helper }) => (
  <motion.div variants={item}>
    <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-all duration-200 group overflow-hidden relative rounded-lg">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300">
        <Icon className="w-16 h-16 -mr-4 -mt-4 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
      </div>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-300">
            <Icon className="w-5 h-5" />
          </div>
          {change && (
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium px-2 py-0.5 rounded-md text-xs">
              {change}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-1 tracking-tight text-slate-900">{value}</h3>
          {helper && <p className="text-[10px] text-slate-400 mt-1">{helper}</p>}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

interface WelcomeHeaderProps {
  name: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ name, subtitle, actions }) => (
  <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
        Welcome back, <span className="text-primary">{name.split(' ')[0]}</span>
      </h1>
      <p className="text-slate-500 mt-1 text-xs font-bold uppercase tracking-wider">{subtitle}</p>
    </div>
    {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
  </motion.div>
);

export const EmptyState: React.FC<{ icon: LucideIcon; title: string; message: string }> = ({
  icon: Icon,
  title,
  message,
}) => (
  <div className="text-center py-12 bg-slate-50/50 rounded-lg border-2 border-dashed border-slate-200">
    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <Icon className="w-5 h-5 text-slate-300" />
    </div>
    <h4 className="text-sm font-bold text-slate-900">{title}</h4>
    <p className="text-xs text-slate-500 mt-1">{message}</p>
  </div>
);
