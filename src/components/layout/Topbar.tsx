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
import { Link, useNavigate } from 'react-router-dom';

import { NotificationDropdown } from '@/src/components/layout/NotificationDropdown';

import { useStore } from '@/src/store/useStore';

export function Topbar() {
  const { user, setRole, logout } = useRole();
  const { resetNavigation } = useStore();
  const navigate = useNavigate();

  const roleIcons: Record<UserRole, React.ElementType> = {
    INVESTOR: TrendingUp,
    FARMER: Sprout,
    CLUSTER_REP: Map,
    ADMIN: Shield,
  };

  const RoleIcon = roleIcons[user.role];

  const handleNavClick = (path: string) => {
    resetNavigation();
    navigate(path);
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex-1 max-w-md relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
        <Input 
          placeholder="Search investments, farms, or reports..." 
          className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary/20 transition-all duration-200 focus-visible:bg-white h-9 rounded-md text-xs"
        />
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />

        <Separator orientation="vertical" className="h-6 bg-slate-200" />

        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "gap-3 px-2 hover:bg-slate-50 h-9 py-1.5 transition-all duration-200 rounded-md border border-transparent hover:border-slate-200")}>
            <div className="relative">
              <Avatar className="w-7 h-7 border border-slate-200 shadow-sm">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-slate-50 text-primary font-bold text-xs">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold leading-none tracking-tight text-slate-700">{user.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <RoleIcon className="w-2.5 h-2.5 text-slate-400" />
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                  {user.role.toLowerCase().replace('_', ' ')}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-md border-slate-200">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem onClick={() => handleNavClick('/profile')} className="text-sm py-2 cursor-pointer">
                <User className="mr-2 h-4 w-4 text-slate-400" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavClick('/settings')} className="text-sm py-2 cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-slate-400" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator className="bg-slate-100" />
            
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-sm py-2 cursor-pointer">
                  <Shield className="mr-2 h-4 w-4 text-slate-400" />
                  <span>Switch Role (Demo)</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="rounded-md border-slate-200">
                    <DropdownMenuItem onClick={() => { setRole('INVESTOR'); handleNavClick('/dashboard'); }} className="text-sm py-2 cursor-pointer">
                      <TrendingUp className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Investor</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setRole('FARMER'); handleNavClick('/dashboard'); }} className="text-sm py-2 cursor-pointer">
                      <Sprout className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Farmer</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setRole('CLUSTER_REP'); handleNavClick('/dashboard'); }} className="text-sm py-2 cursor-pointer">
                      <Map className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Cluster Rep</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setRole('ADMIN'); handleNavClick('/dashboard'); }} className="text-sm py-2 cursor-pointer">
                      <Shield className="mr-2 h-4 w-4 text-slate-400" />
                      <span>Admin</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-destructive text-sm py-2 cursor-pointer focus:text-destructive focus:bg-destructive/5" onClick={logout}>
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
