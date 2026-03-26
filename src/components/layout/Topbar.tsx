import React from 'react';
import { 
  Search, 
  Bell, 
  User, 
  ChevronDown, 
  Settings, 
  LogOut, 
  Shield,
  Sprout,
  TrendingUp,
  Users,
  Map
} from 'lucide-react';
import { useRole } from '@/src/contexts/RoleContext';
import { UserRole } from '@/src/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { NotificationDropdown } from '@/src/components/layout/NotificationDropdown';

export function Topbar({ onNavigate }: { onNavigate: (view: 'DASHBOARD' | 'PROFILE' | 'CLUSTERS' | 'PROPOSALS' | 'AGREEMENTS' | 'PAYMENTS' | 'MESSAGES' | 'MEETINGS' | 'ANALYTICS' | 'ADMIN_DASHBOARD' | 'AUDIT_LOGS') => void }) {
  const { user, setRole, logout } = useRole();

  const roleIcons: Record<UserRole, React.ElementType> = {
    INVESTOR: TrendingUp,
    FARMER: Sprout,
    CLUSTER_REP: Map,
    ADMIN: Shield,
  };

  const RoleIcon = roleIcons[user.role];

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search investments, farms, or reports..." 
          className="pl-10 bg-muted/50 border-none focus-visible:ring-primary/20"
        />
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "gap-3 px-2 hover:bg-muted/50 h-auto py-1.5")}>
            <Avatar className="w-8 h-8 border">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <RoleIcon className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground capitalize">
                  {user.role.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate('PROFILE')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Switch Role (Demo)</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => { setRole('INVESTOR'); onNavigate('DASHBOARD'); }}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      <span>Investor</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setRole('FARMER'); onNavigate('DASHBOARD'); }}>
                      <Sprout className="mr-2 h-4 w-4" />
                      <span>Farmer</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setRole('CLUSTER_REP'); onNavigate('DASHBOARD'); }}>
                      <Map className="mr-2 h-4 w-4" />
                      <span>Cluster Rep</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setRole('ADMIN'); onNavigate('DASHBOARD'); }}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
