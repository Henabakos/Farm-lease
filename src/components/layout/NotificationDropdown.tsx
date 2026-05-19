import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type Notification } from '@/src/contexts/NotificationContext';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Clock,
  Check,
  ExternalLink,
  X,
  MessageSquare,
  FileText,
  CreditCard,
  CalendarDays,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

function iconFor(type: Notification['type']) {
  switch (type) {
    case 'SUCCESS':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'WARNING':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case 'ERROR':
      return <XCircle className="w-4 h-4 text-destructive" />;
    case 'MESSAGE':
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case 'PROPOSAL':
      return <FileText className="w-4 h-4 text-indigo-500" />;
    case 'AGREEMENT':
      return <FileText className="w-4 h-4 text-violet-500" />;
    case 'PAYMENT':
      return <CreditCard className="w-4 h-4 text-emerald-500" />;
    case 'MEETING':
      return <CalendarDays className="w-4 h-4 text-orange-500" />;
    case 'SYSTEM':
      return <ShieldAlert className="w-4 h-4 text-slate-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
}

/** Compute a route from a notification's related entity if no explicit link. */
function deriveLink(n: Notification): string | null {
  if (n.link) return n.link;
  if (!n.related_id || !n.related_type) return null;
  switch (n.related_type) {
    case 'proposal':
      return `/proposals/${n.related_id}`;
    case 'agreement':
      return `/agreements/${n.related_id}`;
    case 'payment':
      return `/payments/${n.related_id}`;
    case 'meeting':
      return `/meetings`;
    case 'conversation':
      return `/messages?conversation=${n.related_id}`;
    default:
      return null;
  }
}

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleOpen = async (n: Notification) => {
    const link = deriveLink(n);
    if (!n.read) await markAsRead(n.id);
    if (link) navigate(link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-slate-400 hover:text-primary hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 rounded-md"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-1 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 border border-slate-200 shadow-lg bg-white overflow-hidden rounded-md"
        align="end"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Notifications</h3>
            {unreadCount > 0 && (
              <Badge className="h-4 px-1.5 text-[9px] bg-primary border-none font-bold">{unreadCount} New</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md hover:bg-white border border-transparent hover:border-slate-200"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              title="Mark all as read"
            >
              <Check className="w-3.5 h-3.5 text-slate-400" />
            </Button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-100">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'p-4 transition-all hover:bg-slate-50 group relative cursor-pointer',
                  !n.read && 'bg-primary/5',
                )}
                onClick={() => handleOpen(n)}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0">{iconFor(n.type)}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4
                        className={cn(
                          'text-xs leading-none tracking-tight',
                          !n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-600',
                        )}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[9px] text-slate-400 whitespace-nowrap flex items-center gap-1 font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 font-normal">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      {deriveLink(n) && (
                        <Button
                          variant="link"
                          className="h-auto p-0 text-[10px] text-primary font-bold gap-1 hover:no-underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpen(n);
                          }}
                        >
                          View Details <ExternalLink className="w-2.5 h-2.5" />
                        </Button>
                      )}
                      {!n.read && (
                        <Button
                          variant="ghost"
                          className="h-auto p-0 text-[10px] text-slate-400 hover:text-primary font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n.id);
                          }}
                        >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n.id);
                  }}
                  aria-label="Delete notification"
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
                <p className="text-[11px] text-slate-400 font-normal">No notifications yet.</p>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
