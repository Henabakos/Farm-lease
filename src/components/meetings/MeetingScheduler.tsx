import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  MoreVertical,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarDays,
  ListTodo,
  ExternalLink,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useMeetings, type MeetingDto } from '@/src/hooks/useMeetings';
import { toast } from 'sonner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function StatusBadge({ status }: { status: MeetingDto['status'] }) {
  const map: Record<MeetingDto['status'], { label: string; className: string }> = {
    SCHEDULED: { label: 'Scheduled', className: 'bg-blue-50 text-blue-600 border-blue-100' },
    ONGOING: { label: 'In Progress', className: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    COMPLETED: { label: 'Completed', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    CANCELLED: { label: 'Cancelled', className: 'bg-destructive/5 text-destructive border-destructive/10' },
  };
  const cfg = map[status];
  return (
    <Badge variant="outline" className={cn('font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

function ProviderIcon({ provider, className }: { provider: MeetingDto['provider']; className?: string }) {
  if (provider === 'IN_PERSON') return <Info className={className} />;
  return <Video className={className} />;
}

export function MeetingScheduler() {
  const { meetings, isLoading, scheduleMeeting, updateStatus, deleteMeeting } = useMeetings();
  const [view, setView] = useState<'CALENDAR' | 'LIST'>('CALENDAR');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const isSelected = (day: number) =>
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === currentDate.getMonth() &&
    selectedDate.getFullYear() === currentDate.getFullYear();

  // Index meetings by yyyy-mm-dd for quick calendar dot lookups.
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, MeetingDto[]>();
    for (const m of meetings) {
      const d = new Date(m.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    return map;
  }, [meetings]);

  const meetingsOnSelected = useMemo(() => {
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return (meetingsByDate.get(key) ?? []).sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [meetingsByDate, selectedDate]);

  const upcoming = useMemo(
    () =>
      meetings
        .filter((m) => m.status === 'SCHEDULED' || m.status === 'ONGOING')
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [meetings],
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10">
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Meeting <span className="text-primary">Scheduler</span>
          </h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">
            Coordinate discussions and project reviews with your partners.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-4 gap-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all',
                view === 'CALENDAR' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary hover:bg-white/50',
              )}
              onClick={() => setView('CALENDAR')}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-4 gap-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all',
                view === 'LIST' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary hover:bg-white/50',
              )}
              onClick={() => setView('LIST')}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Upcoming ({upcoming.length})</span>
            </Button>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Meeting</span>
          </Button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          {view === 'CALENDAR' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold tracking-tight text-slate-900">
                      {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-md border-slate-200 hover:bg-white hover:text-primary shadow-sm transition-all active:scale-95">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-md border-slate-200 hover:bg-white hover:text-primary shadow-sm transition-all active:scale-95">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-7 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-20" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const key = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
                      const count = meetingsByDate.get(key)?.length ?? 0;
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                          className={cn(
                            'h-20 p-2 rounded-md border transition-all relative group flex flex-col items-start justify-between active:scale-95',
                            isSelected(day) ? 'bg-primary text-white border-primary shadow-md' : 'bg-white border-slate-100 hover:border-primary/30 hover:bg-slate-50',
                            isToday(day) && !isSelected(day) && 'border-primary/40 bg-primary/5',
                          )}
                        >
                          <span className={cn('text-sm font-bold', isSelected(day) ? 'text-white' : 'text-slate-700')}>
                            {day}
                          </span>
                          {count > 0 && (
                            <div className={cn(
                              'text-[9px] font-bold w-full text-left',
                              isSelected(day) ? 'text-white/80' : 'text-primary',
                            )}>
                              {count} meeting{count > 1 ? 's' : ''}
                            </div>
                          )}
                          {isToday(day) && !isSelected(day) && (
                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                <CardHeader className="p-6 pb-4">
                  <CardTitle className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Schedule for {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  {isLoading ? (
                    <div className="py-10 flex justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : meetingsOnSelected.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center mx-auto">
                        <CalendarIcon className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No meetings scheduled</p>
                      <Button
                        variant="link"
                        className="text-primary font-bold text-[10px] uppercase tracking-wider hover:no-underline"
                        onClick={() => setDialogOpen(true)}
                      >
                        Schedule One
                      </Button>
                    </div>
                  ) : (
                    meetingsOnSelected.map((m) => (
                      <MeetingRow
                        key={m.id}
                        meeting={m}
                        onUpdateStatus={(s) => updateStatus(m.id, s)}
                        onDelete={() => deleteMeeting(m.id)}
                      />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : upcoming.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">No upcoming meetings</h3>
                  <Button variant="link" className="text-primary" onClick={() => setDialogOpen(true)}>
                    Schedule one
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {upcoming.map((m) => (
                    <motion.div key={m.id} variants={item}>
                      <Card className="group border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
                        <CardHeader className="p-6 pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <StatusBadge status={m.status} />
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <CalendarIcon className="w-3 h-3" />
                              {new Date(m.scheduledAt).toLocaleDateString()}
                            </div>
                          </div>
                          <CardTitle className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-tight">
                            {m.title}
                          </CardTitle>
                          {m.description && (
                            <CardDescription className="text-xs font-medium line-clamp-2 mt-2 leading-relaxed">
                              {m.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="p-6 pt-4 space-y-6 flex-1">
                          <div className="flex items-center gap-6">
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Time</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                {new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                {m.durationMinutes} min
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Provider</p>
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                <ProviderIcon provider={m.provider} className="w-3.5 h-3.5 text-primary" />
                                {m.provider === 'IN_PERSON' ? 'In Person' : m.provider === 'ZOOM' ? 'Zoom' : 'Google Meet'}
                              </div>
                            </div>
                          </div>
                          {m.host && (
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Host</p>
                              <p className="text-xs font-bold text-slate-700">{m.host.fullName}</p>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="p-6 pt-0 gap-2">
                          {m.joinUrl ? (
                            <Button
                              onClick={() => window.open(m.joinUrl!, '_blank', 'noopener,noreferrer')}
                              className="flex-1 h-10 rounded-md bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95"
                            >
                              <Video className="w-3.5 h-3.5 mr-2" />
                              Join Meeting
                            </Button>
                          ) : (
                            <Button disabled className="flex-1 h-10 rounded-md text-[10px] font-bold uppercase tracking-wider">
                              In-Person
                            </Button>
                          )}
                          <MeetingMenu
                            meeting={m}
                            onUpdateStatus={(s) => updateStatus(m.id, s)}
                            onDelete={() => deleteMeeting(m.id)}
                          />
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ScheduleMeetingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={selectedDate}
        onSubmit={async (data) => {
          await scheduleMeeting(data);
          setDialogOpen(false);
        }}
      />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MeetingRow({
  meeting,
  onUpdateStatus,
  onDelete,
}: {
  meeting: MeetingDto;
  onUpdateStatus: (s: 'scheduled' | 'in-progress' | 'completed' | 'cancelled') => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  return (
    <div className="p-4 rounded-md bg-slate-50 border border-slate-200/50 space-y-3 group hover:bg-slate-100 transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <h4 className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors leading-tight truncate">
            {meeting.title}
          </h4>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Clock className="w-3 h-3" />
            {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {meeting.durationMinutes} min
          </div>
        </div>
        <MeetingMenu meeting={meeting} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={meeting.status} />
        {meeting.joinUrl && (
          <Button
            size="sm"
            className="h-7 rounded-md text-[10px] font-bold uppercase tracking-wider ml-auto"
            onClick={() => window.open(meeting.joinUrl!, '_blank', 'noopener,noreferrer')}
          >
            <Video className="w-3 h-3 mr-1" />
            Join
          </Button>
        )}
      </div>
    </div>
  );
}

function MeetingMenu({
  meeting,
  onUpdateStatus,
  onDelete,
}: {
  meeting: MeetingDto;
  onUpdateStatus: (s: 'scheduled' | 'in-progress' | 'completed' | 'cancelled') => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
        aria-label="Meeting actions"
      >
        <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-md">
        {meeting.status === 'SCHEDULED' && (
          <DropdownMenuItem onClick={() => onUpdateStatus('in-progress')}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />
            Mark in-progress
          </DropdownMenuItem>
        )}
        {(meeting.status === 'SCHEDULED' || meeting.status === 'ONGOING') && (
          <DropdownMenuItem onClick={() => onUpdateStatus('completed')}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />
            Mark completed
          </DropdownMenuItem>
        )}
        {meeting.status === 'SCHEDULED' && (
          <DropdownMenuItem onClick={() => onUpdateStatus('cancelled')}>
            <XCircle className="w-3.5 h-3.5 mr-2 text-destructive" />
            Cancel
          </DropdownMenuItem>
        )}
        {meeting.joinUrl && (
          <DropdownMenuItem onClick={() => window.open(meeting.joinUrl!, '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="w-3.5 h-3.5 mr-2" />
            Open join link
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-destructive focus:text-destructive focus:bg-destructive/5"
          onClick={() => {
            if (confirm('Delete this meeting? This cannot be undone.')) onDelete();
          }}
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toLocalDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ScheduleMeetingDialog({
  open,
  onOpenChange,
  defaultDate,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate: Date;
  onSubmit: (data: {
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes: number;
    provider: 'zoom' | 'google' | 'none';
    attendeeEmails?: string[];
  }) => Promise<unknown>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toLocalDateInput(defaultDate));
  const [time, setTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [provider, setProvider] = useState<'zoom' | 'google' | 'none'>('none');
  const [attendees, setAttendees] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) setDate(toLocalDateInput(defaultDate));
  }, [open, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    const attendeeEmails = attendees
      .split(/[,\n;\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
    if (provider === 'google' && attendeeEmails.length === 0) {
      toast.error('Google Meet requires at least one attendee email');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledAt,
        durationMinutes,
        provider,
        attendeeEmails: attendeeEmails.length > 0 ? attendeeEmails : undefined,
      });
      // Reset
      setTitle('');
      setDescription('');
      setAttendees('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule a meeting</DialogTitle>
          <DialogDescription>
            Pick a provider and we'll create the meeting + push it to everyone's notifications.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="m-title" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Title</Label>
            <Input
              id="m-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quarterly review"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-desc" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Description</Label>
            <Textarea
              id="m-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agenda, context..."
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-date" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</Label>
              <Input id="m-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-time" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Time</Label>
              <Input id="m-time" type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-dur" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration (min)</Label>
              <Input
                id="m-dur"
                type="number"
                min={5}
                step={5}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">In-Person</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="google">Google Meet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {provider !== 'none' && (
            <div className="space-y-1.5">
              <Label htmlFor="m-att" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Attendee Emails {provider === 'google' && <span className="text-destructive">*</span>}
              </Label>
              <Textarea
                id="m-att"
                rows={2}
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="alice@example.com, bob@example.com"
              />
              <p className="text-[10px] text-slate-400">Comma, space, or newline separated.</p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CalendarDays className="w-4 h-4 mr-2" />}
              Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
