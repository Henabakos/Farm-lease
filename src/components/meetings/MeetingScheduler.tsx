import React, { useState } from 'react';
import { Meeting, UserRole } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  MoreVertical, 
  CheckCircle2, 
  XCircle,
  MapPin,
  ExternalLink,
  Search,
  Filter,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/src/contexts/RoleContext';

const MOCK_MEETINGS: Meeting[] = [
  {
    id: 'm1',
    title: 'Investment Review: Solar Irrigation',
    description: 'Quarterly review of the solar irrigation project milestones and financial performance.',
    startTime: '2024-03-27T10:00:00Z',
    endTime: '2024-03-27T11:00:00Z',
    participants: [
      { id: 'u1', name: 'Alex Johnson', role: 'INVESTOR' },
      { id: 'u2', name: 'Zaria Organic Growers', role: 'FARMER' }
    ],
    status: 'SCHEDULED',
    meetingUrl: 'https://meet.google.com/abc-defg-hij'
  },
  {
    id: 'm2',
    title: 'Cluster Strategy Meeting',
    description: 'Discussing expansion plans for the Northern Cluster and new farmer onboarding.',
    startTime: '2024-03-28T14:30:00Z',
    endTime: '2024-03-28T15:30:00Z',
    participants: [
      { id: 'u3', name: 'Sarah Miller', role: 'CLUSTER_REP' },
      { id: 'u4', name: 'Admin User', role: 'ADMIN' }
    ],
    status: 'SCHEDULED'
  }
];

export function MeetingScheduler() {
  const { user } = useRole();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'CALENDAR' | 'LIST'>('CALENDAR');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  };

  const isSelected = (day: number) => {
    return selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Scheduler</h1>
          <p className="text-muted-foreground">Coordinate discussions and project reviews with your partners.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
            <Button 
              variant={view === 'CALENDAR' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-2"
              onClick={() => setView('CALENDAR')}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendar</span>
            </Button>
            <Button 
              variant={view === 'LIST' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-2"
              onClick={() => setView('LIST')}
            >
              <Clock className="w-4 h-4" />
              <span>Upcoming</span>
            </Button>
          </div>
          <Button className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <CardDescription>Select a date to view or schedule meetings.</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-px bg-border/50 border border-border/50 rounded-xl overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-muted/30 p-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {day}
                  </div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-background/30 p-4 min-h-[100px]" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const hasMeeting = MOCK_MEETINGS.some(m => new Date(m.startTime).getDate() === day && new Date(m.startTime).getMonth() === currentDate.getMonth());
                  
                  return (
                    <div 
                      key={day} 
                      className={cn(
                        "bg-background/30 p-3 min-h-[100px] cursor-pointer transition-all hover:bg-primary/5 group relative",
                        isSelected(day) && "bg-primary/5 ring-1 ring-inset ring-primary/30"
                      )}
                      onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    >
                      <span className={cn(
                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-all",
                        isToday(day) ? "bg-primary text-primary-foreground font-bold shadow-md" : "text-foreground",
                        isSelected(day) && !isToday(day) && "bg-primary/20 text-primary"
                      )}>
                        {day}
                      </span>
                      {hasMeeting && (
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 w-full bg-primary/20 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-primary" />
                          </div>
                          <p className="text-[8px] text-primary font-bold truncate">1 Meeting</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">Need a quick sync?</p>
                  <p className="text-xs text-muted-foreground">Start an instant video call with your team.</p>
                </div>
              </div>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                <span>Instant Call</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Upcoming Meetings</CardTitle>
              <CardDescription>Your schedule for the next 7 days.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {MOCK_MEETINGS.map((meeting) => (
                  <div key={meeting.id} className="p-4 hover:bg-muted/30 transition-all group">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[10px] uppercase font-bold tracking-wider">
                          {new Date(meeting.startTime).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm leading-tight">{meeting.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {meeting.participants.map((p, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center" title={p.name}>
                              <Users className="w-3 h-3 text-muted-foreground" />
                            </div>
                          ))}
                        </div>
                        {meeting.meetingUrl && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
                            <Video className="w-3 h-3" />
                            <span>Join</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full h-10 text-xs text-muted-foreground hover:text-primary">
                View Full Schedule
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Time Slot Picker</CardTitle>
              <CardDescription>Available slots for {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map((slot) => (
                  <Button 
                    key={slot} 
                    variant="outline" 
                    className="h-10 text-xs hover:border-primary hover:text-primary transition-all"
                  >
                    {slot}
                  </Button>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Time slots are shown in your local timezone (GMT+0).
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
