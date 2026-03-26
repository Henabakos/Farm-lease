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
import { Separator } from '@/components/ui/separator';

interface NavItem {
  title: string;
  icon: React.ElementType;
  href: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Investments', icon: TrendingUp, href: '/investments', roles: ['INVESTOR', 'ADMIN'] },
  { title: 'Proposals', icon: FileText, href: '/proposals', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Agreements', icon: ShieldCheck, href: '/agreements', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Payments', icon: Wallet, href: '/payments', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Messages', icon: MessageSquare, href: '/messages', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Meetings', icon: Calendar, href: '/meetings', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Analytics', icon: BarChart3, href: '/analytics', roles: ['INVESTOR', 'ADMIN'] },
  { title: 'Admin Panel', icon: ShieldAlert, href: '/admin', roles: ['ADMIN'] },
  { title: 'Audit Logs', icon: History, href: '/audit', roles: ['ADMIN'] },
  { title: 'Resources', icon: Briefcase, href: '/resources', roles: ['FARMER', 'CLUSTER_REP', 'ADMIN', 'INVESTOR'] },
  { title: 'My Farms', icon: Sprout, href: '/farms', roles: ['FARMER', 'CLUSTER_REP', 'ADMIN'] },
  { title: 'Clusters', icon: Map, href: '/clusters', roles: ['CLUSTER_REP', 'ADMIN'] },
  { title: 'Investors', icon: Users, href: '/investors', roles: ['ADMIN', 'CLUSTER_REP'] },
  { title: 'Reports', icon: FileText, href: '/reports', roles: ['ADMIN', 'CLUSTER_REP', 'INVESTOR'] },
  { title: 'Wallet', icon: Wallet, href: '/wallet', roles: ['INVESTOR', 'FARMER', 'CLUSTER_REP'] },
  { title: 'User Management', icon: ShieldCheck, href: '/users', roles: ['ADMIN'] },
];

export function Sidebar({ className, onNavigate }: { className?: string, onNavigate: (view: 'DASHBOARD' | 'PROFILE' | 'CLUSTERS' | 'PROPOSALS' | 'AGREEMENTS' | 'PAYMENTS' | 'MESSAGES' | 'MEETINGS' | 'ANALYTICS' | 'ADMIN_DASHBOARD' | 'AUDIT_LOGS' | 'RESOURCES') => void }) {
  const { user, logout } = useRole();
  const [collapsed, setCollapsed] = React.useState(false);

  const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(user.role));

  const handleNavClick = (title: string) => {
    if (title === 'Dashboard') onNavigate('DASHBOARD');
    if (title === 'Clusters') onNavigate('CLUSTERS');
    if (title === 'Proposals') onNavigate('PROPOSALS');
    if (title === 'Agreements') onNavigate('AGREEMENTS');
    if (title === 'Payments') onNavigate('PAYMENTS');
    if (title === 'Messages') onNavigate('MESSAGES');
    if (title === 'Meetings') onNavigate('MEETINGS');
    if (title === 'Analytics') onNavigate('ANALYTICS');
    if (title === 'Admin Panel') onNavigate('ADMIN_DASHBOARD');
    if (title === 'Audit Logs') onNavigate('AUDIT_LOGS');
    if (title === 'Resources') onNavigate('RESOURCES');
  };

  return (
    <aside className={cn(
      "relative h-screen border-r bg-card transition-all duration-300 ease-in-out flex flex-col",
      collapsed ? "w-20" : "w-64",
      className
    )}>
      <div className="flex h-16 items-center px-6 border-b cursor-pointer" onClick={() => onNavigate('DASHBOARD')}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Sprout className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-xl tracking-tight text-foreground whitespace-nowrap">
              AgriInvest
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {filteredNavItems.map((item) => (
            <Button
              key={item.title}
              variant="ghost"
              onClick={() => handleNavClick(item.title)}
              className={cn(
                "w-full justify-start gap-3 h-11 px-3",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t space-y-2">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-11 px-3",
            collapsed && "justify-center px-0"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Button>
        <Button
          variant="ghost"
          onClick={logout}
          className={cn(
            "w-full justify-start gap-3 h-11 px-3 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm z-10"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  );
}
