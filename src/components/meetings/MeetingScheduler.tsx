import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Loader2,
  Trash2,
  User,
  ChevronLeft,
  ChevronRight,
  Video,
  Send,
  Play,
  Users,
  MapPin,
  MoreHorizontal,
  CalendarCheck,
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
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useRole } from '@/src/contexts/RoleContext';
import { useMeetings, type MeetingDto } from '@/src/hooks/useMeetings';
import { useAvailability, DAY_NAMES, type AvailabilitySlot } from '@/src/hooks/useAvailability';
import { usersAPI } from '@/src/services/api';
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
    SCHEDULED: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    ONGOING: { label: 'In Progress', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    COMPLETED: { label: 'Completed', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
  };
  const cfg = map[status];
  return (
    <Badge className={cn('font-semibold px-3 py-1 rounded-full text-xs', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// UNIFIED MEETING VIEW - Calendar-based design for all roles
// ─────────────────────────────────────────────────────────────────────────

function UnifiedMeetingView({ 
  meetings, 
  isLoading, 
  role,
  isClusterRep,
  isInvestor,
  isAdmin,
  isFarmer,
  bookSlot,
  adminCancelMeeting 
}: any) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDto | null>(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [newMeetingDialogOpen, setNewMeetingDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingDuration, setMeetingDuration] = useState(30);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, MeetingDto[]>();
    meetings.forEach(m => {
      const d = new Date(m.scheduledAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    });
    return map;
  }, [meetings]);

  const meetingsOnSelected = useMemo(() => {
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return (meetingsByDate.get(key) ?? []).sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  }, [meetingsByDate, selectedDate]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
  };

  const handleStartMeeting = (meeting: MeetingDto) => {
    if (meeting.joinUrl) {
      window.open(meeting.joinUrl, '_blank', 'noopener,noreferrer');
      toast.success('Meeting started in new tab');
    } else {
      toast.info('This is an in-person meeting');
    }
  };

  const handleReschedule = async () => {
    if (!selectedMeeting || !newDate || !newTime) return;
    try {
      const scheduledAt = new Date(`${newDate}T${newTime}:00`).toISOString();
      await (await import('@/src/services/api')).meetingsAPI.updateMeeting(selectedMeeting.id, { scheduledAt });
      toast.success('Meeting rescheduled successfully');
      setRescheduleDialogOpen(false);
    } catch (err) {
      toast.error('Failed to reschedule meeting');
    }
  };

  const handleSendInvite = async () => {
    if (!selectedMeeting || !inviteEmail) return;
    try {
      console.log('Sending invitation to:', inviteEmail, 'for meeting:', selectedMeeting.id);
      await (await import('@/src/services/api')).meetingsAPI.sendInvitation(selectedMeeting.id, { email: inviteEmail });
      toast.success('Invitation sent successfully');
      setInviteDialogOpen(false);
      setInviteEmail('');
    } catch (err: any) {
      console.error('Failed to send invitation:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send invitation';
      toast.error(errorMessage);
    }
  };

  const openRescheduleDialog = (meeting: MeetingDto) => {
    setSelectedMeeting(meeting);
    const date = new Date(meeting.scheduledAt);
    setNewDate(date.toISOString().split('T')[0]);
    setNewTime(date.toTimeString().slice(0, 5));
    setRescheduleDialogOpen(true);
  };

  const openInviteDialog = (meeting: MeetingDto) => {
    setSelectedMeeting(meeting);
    setInviteDialogOpen(true);
  };

  const getRoleTitle = () => {
    if (isAdmin) return 'Admin';
    if (isClusterRep) return 'Cluster Rep';
    if (isInvestor) return 'Investor';
    if (isFarmer) return 'Farmer';
    return 'My';
  };

  const fetchUsers = async () => {
    try {
      const { adminAPI } = await import('@/src/services/api');
      const res = await adminAPI.getAllUsers();
      console.log('Users response:', res);
      console.log('Response data:', res.data);
      console.log('Response structure:', JSON.stringify(res, null, 2));
      
      // Handle the response structure from listUsers: { items: [...], pagination: {...} }
      let userList = [];
      if (res.data && Array.isArray(res.data.items)) {
        userList = res.data.items;
      } else if (Array.isArray(res.data)) {
        userList = res.data;
      } else if (Array.isArray(res)) {
        userList = res;
      } else if (res.data && Array.isArray(res.data.users)) {
        userList = res.data.users;
      } else if (res.users) {
        userList = res.users;
      }
      
      console.log('Final user list:', userList);
      console.log('User count:', userList.length);
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load users:', err);
      console.error('Error details:', err.response?.data || err.message);
      toast.error('Failed to load users: ' + (err.response?.data?.message || err.message));
      setUsers([]);
    }
  };

  const openNewMeetingDialog = () => {
    console.log('Opening new meeting dialog');
    setNewMeetingDialogOpen(true);
  };

  useEffect(() => {
    if (newMeetingDialogOpen) {
      fetchUsers();
    }
  }, [newMeetingDialogOpen]);

  const handleCreateMeeting = async () => {
    console.log('Creating meeting with data:', { meetingTitle, selectedUser, newDate, newTime });
    if (!meetingTitle || !selectedUser || !newDate || !newTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const scheduledAt = new Date(`${newDate}T${newTime}:00`).toISOString();
      const { meetingsAPI } = await import('@/src/services/api');
      
      // Generate a simple Google Meet link format (not using backend integration)
      const meetCode = Math.random().toString(36).substring(2, 8) + '-' + 
                       Math.random().toString(36).substring(2, 8) + '-' + 
                       Math.random().toString(36).substring(2, 4);
      const googleMeetLink = `https://meet.google.com/${meetCode}`;
      
      console.log('Calling meetingsAPI.schedule with:', {
        title: meetingTitle,
        description: meetingDescription,
        scheduledAt,
        durationMinutes: meetingDuration,
        joinUrl: googleMeetLink,
        provider: 'none',
        participantIds: [selectedUser],
      });
      
      const result = await meetingsAPI.schedule({
        title: meetingTitle,
        description: meetingDescription,
        scheduledAt,
        durationMinutes: meetingDuration,
        joinUrl: googleMeetLink,
        provider: 'none',
      });
      console.log('Meeting created successfully:', result);
      toast.success('Meeting created successfully with Google Meet link');
      setNewMeetingDialogOpen(false);
      setMeetingTitle('');
      setMeetingDescription('');
      setSelectedUser('');
      setNewDate('');
      setNewTime('');
    } catch (err: any) {
      console.error('Failed to create meeting:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error details:', err.response?.data?.details);
      const errorMessage = err.response?.data?.details?.[0]?.message || 
                          err.response?.data?.message || 
                          err.message;
      toast.error('Failed to create meeting: ' + errorMessage);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {getRoleTitle()} <span className="text-primary">Meetings</span>
          </h1>
          <p className="text-slate-500 mt-1">Manage your meetings and schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className={cn('gap-2', viewMode === 'calendar' ? 'bg-white shadow-sm' : 'text-slate-500')}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarCheck className="w-4 h-4" />
              Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn('gap-2', viewMode === 'list' ? 'bg-white shadow-sm' : 'text-slate-500')}
              onClick={() => setViewMode('list')}
            >
              <User className="w-4 h-4" />
              List
            </Button>
          </div>
          {(isAdmin || isClusterRep) && (
            <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={openNewMeetingDialog}>
              <Plus className="w-4 h-4" />
              New Meeting
            </Button>
          )}
        </div>
      </motion.div>

      {viewMode === 'calendar' ? (
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="p-6 pb-4 bg-gradient-to-r from-primary to-primary/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold text-white">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-full hover:bg-white/20 text-white">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-full hover:bg-white/20 text-white">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-sm font-semibold text-slate-500 py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24" />
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
                        'h-24 p-2 rounded-xl border-2 transition-all relative group flex flex-col items-start justify-between',
                        isSelected(day) ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white border-slate-200 hover:border-primary hover:bg-primary/5',
                        isToday(day) && !isSelected(day) && 'border-primary border-2'
                      )}
                    >
                      <span className={cn('text-lg font-bold', isSelected(day) ? 'text-white' : 'text-slate-700')}>
                        {day}
                      </span>
                      {count > 0 && (
                        <div className={cn('w-full', isSelected(day) ? 'text-white/90' : 'text-primary')}>
                          <div className="flex items-center gap-1">
                            <CalendarCheck className="w-3 h-3" />
                            <span className="text-xs font-bold">{count} meeting{count > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      )}
                      {isToday(day) && !isSelected(day) && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Meetings */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="p-6 pb-4 bg-gradient-to-r from-slate-50 to-slate-100">
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Upcoming Meetings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {isLoading ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {meetingsOnSelected.length > 0 && (
                    <p className="text-sm text-slate-500 mb-4">
                      Meetings on {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}:
                    </p>
                  )}
                  {meetingsOnSelected.length > 0 ? (
                    meetingsOnSelected.map(meeting => (
                      <div key={meeting.id} className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">{meeting.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock className="w-4 h-4" />
                              {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <StatusBadge status={meeting.status} />
                        </div>
                        <div className="flex items-center gap-2">
                          {meeting.status === 'SCHEDULED' && (
                            <>
                              <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90" onClick={() => handleStartMeeting(meeting)}>
                                <Play className="w-3 h-3 mr-1" />
                                Start
                              </Button>
                              {isAdmin && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => openRescheduleDialog(meeting)}>
                                    <CalendarIcon className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => openInviteDialog(meeting)}>
                                    <Send className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                          {meeting.status === 'ONGOING' && (
                            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStartMeeting(meeting)}>
                              <Video className="w-3 h-3 mr-1" />
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 mb-4">No meetings on this date.</p>
                  )}
                  {meetingsOnSelected.length === 0 && (
                    <p className="text-sm text-slate-500 mb-4">Here are your upcoming meetings:</p>
                  )}
                  {meetings
                    .filter(m => m.status === 'SCHEDULED' && new Date(m.scheduledAt) >= new Date())
                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                    .slice(0, 5)
                    .map(meeting => (
                      <div key={meeting.id} className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 mb-1">{meeting.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Clock className="w-4 h-4" />
                              {new Date(meeting.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <StatusBadge status={meeting.status} />
                        </div>
                        <div className="flex items-center gap-2">
                          {meeting.status === 'SCHEDULED' && (
                            <>
                              <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90" onClick={() => handleStartMeeting(meeting)}>
                                <Play className="w-3 h-3 mr-1" />
                                Start
                              </Button>
                              {isAdmin && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => openRescheduleDialog(meeting)}>
                                    <CalendarIcon className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => openInviteDialog(meeting)}>
                                    <Send className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                          {meeting.status === 'ONGOING' && (
                            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStartMeeting(meeting)}>
                              <Video className="w-3 h-3 mr-1" />
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  {meetings.filter(m => m.status === 'SCHEDULED' && new Date(m.scheduledAt) >= new Date()).length === 0 && meetingsOnSelected.length === 0 && (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                        <CalendarIcon className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">No upcoming meetings</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={item} className="space-y-4">
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No meetings yet</h3>
              <p className="text-slate-500">Create your first meeting to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map(meeting => (
                <Card key={meeting.id} className="border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardHeader className="p-5 pb-3 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge status={meeting.status} />
                      <div className="text-xs text-slate-500">
                        {new Date(meeting.scheduledAt).toLocaleDateString()}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-900">{meeting.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-primary" />
                      {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-primary" />
                      {meeting.durationMinutes} min
                    </div>
                    {meeting.host && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <User className="w-4 h-4 text-primary" />
                        {meeting.host.fullName}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-5 pt-0 gap-2">
                    {meeting.status === 'SCHEDULED' && (
                      <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => handleStartMeeting(meeting)}>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    )}
                    {meeting.status === 'ONGOING' && (
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStartMeeting(meeting)}>
                        <Video className="w-4 h-4 mr-2" />
                        Join
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Meeting</DialogTitle>
            <DialogDescription>Pick a new date and time for "{selectedMeeting?.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReschedule}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
            <DialogDescription>Send an invitation to join "{selectedMeeting?.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" placeholder="participant@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendInvite}>
              <Send className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Meeting Dialog */}
      <Dialog open={newMeetingDialogOpen} onOpenChange={setNewMeetingDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Meeting</DialogTitle>
            <DialogDescription>Schedule a new meeting with a Google Meet link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Meeting Title *</Label>
              <Input placeholder="Enter meeting title" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Enter meeting description" value={meetingDescription} onChange={(e) => setMeetingDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Select User *</Label>
              {users.length === 0 ? (
                <div className="text-sm text-slate-500">Loading users...</div>
              ) : (
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" value={meetingDuration} onChange={(e) => setMeetingDuration(Number(e.target.value))} min="15" step="15" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewMeetingDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateMeeting}>
              <Plus className="w-4 h-4 mr-2" />
              Create Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export function MeetingScheduler() {
  const { role, isClusterRep, isInvestor, isAdmin, isFarmer } = useRole();
  const { meetings, isLoading, bookSlot, adminCancelMeeting } = useMeetings();

  // Unified calendar-based UI for all roles
  return <UnifiedMeetingView 
    meetings={meetings} 
    isLoading={isLoading} 
    role={role}
    isClusterRep={isClusterRep}
    isInvestor={isInvestor}
    isAdmin={isAdmin}
    isFarmer={isFarmer}
    bookSlot={bookSlot}
    adminCancelMeeting={adminCancelMeeting}
  />;
}
