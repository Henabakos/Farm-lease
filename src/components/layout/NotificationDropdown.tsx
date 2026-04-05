import React, { useState } from 'react';
import { Notification } from '@/src/types';
import { 
  Bell, 
  CheckCircle2, 
  XCircle, 
  Info, 
  AlertTriangle, 
  Clock, 
  MoreVertical, 
  Check, 
  Trash2, 
  ExternalLink,
  Settings,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'New Proposal Received',
    message: 'Alex Johnson submitted a new proposal for Solar Irrigation System.',
    timestamp: '2024-03-26T08:30:00Z',
    type: 'INFO',
    read: false,
    link: '/proposals'
  },
  {
    id: 'n2',
    title: 'Payment Verified',
    message: 'Your disbursement of $12,500 has been verified by the admin.',
    timestamp: '2024-03-25T14:20:00Z',
    type: 'SUCCESS',
    read: true,
    link: '/payments'
  },
  {
    id: 'n3',
    title: 'Agreement Signed',
    message: 'Zaria Organic Growers signed the Solar Irrigation System Agreement.',
    timestamp: '2024-03-25T11:00:00Z',
    type: 'SUCCESS',
    read: false,
    link: '/agreements'
  }
];

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'ERROR': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-400 hover:text-primary hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 rounded-md">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border border-slate-200 shadow-lg bg-white overflow-hidden rounded-md" align="end">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Notifications</h3>
            {unreadCount > 0 && <Badge className="h-4 px-1.5 text-[9px] bg-primary border-none font-bold">{unreadCount} New</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white border border-transparent hover:border-slate-200" onClick={markAllAsRead} title="Mark all as read">
              <Check className="w-3.5 h-3.5 text-slate-400" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-white border border-transparent hover:border-slate-200" title="Notification settings">
              <Settings className="w-3.5 h-3.5 text-slate-400" />
            </Button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={cn(
                  "p-4 transition-all hover:bg-slate-50 group relative",
                  !notification.read && "bg-primary/5"
                )}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={cn("text-xs leading-none tracking-tight", !notification.read ? "font-bold text-slate-900" : "font-semibold text-slate-600")}>
                        {notification.title}
                      </h4>
                      <span className="text-[9px] text-slate-400 whitespace-nowrap flex items-center gap-1 font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-normal">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      {notification.link && (
                        <Button variant="link" className="h-auto p-0 text-[10px] text-primary font-bold gap-1 hover:no-underline">
                          View Details <ExternalLink className="w-2.5 h-2.5" />
                        </Button>
                      )}
                      {!notification.read && (
                        <Button variant="ghost" className="h-auto p-0 text-[10px] text-slate-400 hover:text-primary font-bold" onClick={() => markAsRead(notification.id)}>
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-destructive rounded-md hover:bg-white border border-transparent hover:border-slate-200"
                  onClick={() => deleteNotification(notification.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
              <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-900">All caught up!</p>
                <p className="text-[11px] text-slate-400 font-normal">No new notifications for you.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
          <Button variant="ghost" className="w-full h-8 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-primary hover:bg-white rounded-md border border-transparent hover:border-slate-200">
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
