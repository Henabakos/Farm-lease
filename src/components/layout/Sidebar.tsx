import React from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Sprout, 
  Users, 
  TrendingUp, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Map,
  FileText,
  Wallet,
  MessageSquare,
  Calendar,
  BarChart3,
  ShieldAlert,
  History,
  Briefcase
} from 'lucide-react';
import { useRole } from '@/src/contexts/RoleContext';
import { UserRole } from '@/src/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore, ViewType } from '@/src/store/useStore';

interface NavItem {
  title: string;
  icon: React.ElementType;
  view: ViewType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, view: 'DASHBOARD', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Proposals', icon: FileText, view: 'PROPOSALS', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Agreements', icon: ShieldCheck, view: 'AGREEMENTS', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Payments', icon: Wallet, view: 'PAYMENTS', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Messages', icon: MessageSquare, view: 'MESSAGES', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Meetings', icon: Calendar, view: 'MEETINGS', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Analytics', icon: BarChart3, view: 'ANALYTICS', roles: ['INVESTOR', 'ADMIN'] },
  { title: 'Admin Panel', icon: ShieldAlert, view: 'ADMIN_DASHBOARD', roles: ['ADMIN'] },
  { title: 'Audit Logs', icon: History, view: 'AUDIT_LOGS', roles: ['ADMIN'] },
  { title: 'Resources', icon: Briefcase, view: 'RESOURCES', roles: ['FARMER', 'CLUSTER_REP', 'ADMIN', 'INVESTOR'] },
  { title: 'Clusters', icon: Map, view: 'CLUSTERS', roles: ['CLUSTER_REP', 'ADMIN', 'INVESTOR'] },
];

export function Sidebar({ className, onNavigate }: { className?: string, onNavigate?: (view: ViewType) => void }) {
  const { user, logout } = useRole();
  const { currentView, setCurrentView, resetNavigation } = useStore();
  const [collapsed, setCollapsed] = React.useState(false);

  const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  const handleNavClick = (view: ViewType) => {
    resetNavigation();
    setCurrentView(view);
    if (onNavigate) onNavigate(view);
  };

  return (
    <aside className={cn(
      "relative h-screen border-r bg-card/50 backdrop-blur-xl transition-all duration-500 ease-in-out flex flex-col z-30",
      collapsed ? "w-20" : "w-64",
      className
    )}>
      <div className="flex h-16 items-center px-6 border-b border-border/50 cursor-pointer group" onClick={() => handleNavClick('DASHBOARD')}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
            <Sprout className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-xl tracking-tight text-foreground whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              AgriInvest
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 py-6">
        <nav className="px-3 space-y-1.5">
          {filteredNavItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              onClick={() => handleNavClick(item.view)}
              className={cn(
                "w-full justify-start gap-3 h-11 px-3 transition-all duration-200 group relative",
                collapsed && "justify-center px-0",
                currentView === item.view ? "bg-primary/10 text-primary" : "hover:bg-primary/5 hover:text-primary"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110",
                currentView === item.view && "scale-110"
              )} />
              {!collapsed && (
                <span className="font-medium tracking-tight">{item.title}</span>
              )}
              {currentView === item.view && !collapsed && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border/50 space-y-2 bg-muted/20">
        <Button
          variant="ghost"
          onClick={() => handleNavClick('PROFILE')}
          className={cn(
            "w-full justify-start gap-3 h-11 px-3 hover:bg-primary/5 hover:text-primary transition-all duration-200",
            collapsed && "justify-center px-0",
            currentView === 'PROFILE' && "bg-primary/10 text-primary"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium">Profile</span>}
        </Button>
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full justify-start gap-3 h-11 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </Button>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border/50 bg-background shadow-md z-40 hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  );
}
