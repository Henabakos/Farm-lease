import React, { useState } from 'react';
import { Meeting, UserRole } from '@/src/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
  Info,
  CalendarDays,
  ListTodo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/src/contexts/RoleContext';
import { motion, AnimatePresence } from 'motion/react';

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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

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
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">
            Meeting <span className="text-primary">Scheduler</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Coordinate discussions and project reviews with your partners.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-primary/5 p-1.5 rounded-2xl border border-primary/10 backdrop-blur-md">
            <Button 
              variant={view === 'CALENDAR' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn(
                "h-10 px-5 gap-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                view === 'CALENDAR' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-primary/10 hover:text-primary"
              )}
              onClick={() => setView('CALENDAR')}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Calendar</span>
            </Button>
            <Button 
              variant={view === 'LIST' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn(
                "h-10 px-5 gap-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                view === 'LIST' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-primary/10 hover:text-primary"
              )}
              onClick={() => setView('LIST')}
            >
              <ListTodo className="w-4 h-4" />
              <span>Upcoming</span>
            </Button>
          </div>
          <Button className="gap-2 h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-5 h-5" />
            <span className="font-bold">Schedule Meeting</span>
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
              <Card className="lg:col-span-2 border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
                <CardHeader className="p-8 border-b border-primary/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-black tracking-tight">
                      {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl border-primary/10 hover:bg-primary/5 hover:text-primary">
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl border-primary/10 hover:bg-primary/5 hover:text-primary">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-7 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-black text-primary/60 uppercase tracking-widest py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-24" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const hasMeeting = MOCK_MEETINGS.some(m => new Date(m.startTime).getDate() === day && new Date(m.startTime).getMonth() === currentDate.getMonth());
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                          className={cn(
                            "h-24 p-3 rounded-2xl border transition-all relative group flex flex-col items-start justify-between",
                            isSelected(day) ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "bg-background/40 border-primary/5 hover:border-primary/20 hover:bg-background/60",
                            isToday(day) && !isSelected(day) && "border-primary/40"
                          )}
                        >
                          <span className={cn("text-lg font-black", isSelected(day) ? "text-primary-foreground" : "text-foreground")}>
                            {day}
                          </span>
                          {hasMeeting && (
                            <div className={cn(
                              "w-full h-1.5 rounded-full",
                              isSelected(day) ? "bg-primary-foreground/40" : "bg-primary/40"
                            )} />
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

              <div className="space-y-8">
                <Card className="border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5">
                  <CardHeader className="p-8">
                    <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      Schedule for {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    {MOCK_MEETINGS.filter(m => new Date(m.startTime).getDate() === selectedDate.getDate() && new Date(m.startTime).getMonth() === selectedDate.getMonth()).length > 0 ? (
                      MOCK_MEETINGS.filter(m => new Date(m.startTime).getDate() === selectedDate.getDate() && new Date(m.startTime).getMonth() === selectedDate.getMonth()).map(meeting => (
                        <div key={meeting.id} className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4 group hover:bg-primary/10 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{meeting.title}</h4>
                              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center -space-x-2">
                            {meeting.participants.map((p, i) => (
                              <div key={p.id} className="w-8 h-8 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[10px] font-black text-primary uppercase" title={p.name}>
                                {p.name.charAt(0)}
                              </div>
                            ))}
                          </div>
                          {meeting.meetingUrl && (
                            <Button className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                              <Video className="w-4 h-4 mr-2" />
                              Join Meeting
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CalendarIcon className="w-8 h-8 text-primary/30" />
                        </div>
                        <p className="text-sm font-bold text-muted-foreground">No meetings scheduled for this day.</p>
                        <Button variant="link" className="mt-2 text-primary font-black text-xs uppercase tracking-widest">Schedule One</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-primary/5 bg-primary/5 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/10">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <Info className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg tracking-tight">Meeting Tips</h3>
                        <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Best Practices</p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2 text-sm font-medium text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        Keep meetings under 45 minutes for better focus.
                      </li>
                      <li className="flex items-start gap-2 text-sm font-medium text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        Share agenda 24h before the meeting.
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {MOCK_MEETINGS.map((meeting) => (
                <motion.div key={meeting.id} variants={item}>
                  <Card className="group border-none shadow-xl shadow-primary/5 bg-card/60 backdrop-blur-md rounded-[2.5rem] overflow-hidden border border-primary/5 hover:border-primary/20 transition-all hover:-translate-y-2 duration-500">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-primary/10 text-primary border-none font-black px-3 py-1 rounded-xl text-[10px] uppercase tracking-widest">
                          {meeting.status}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {new Date(meeting.startTime).toLocaleDateString()}
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors leading-tight">
                        {meeting.title}
                      </CardTitle>
                      <CardDescription className="text-base font-medium line-clamp-2 mt-2">
                        {meeting.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">Time</p>
                          <div className="flex items-center gap-2 font-bold text-foreground">
                            <Clock className="w-4 h-4 text-primary" />
                            {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">Duration</p>
                          <div className="flex items-center gap-2 font-bold text-foreground">
                            <Clock className="w-4 h-4 text-primary" />
                            60 min
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em]">Participants</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center -space-x-2">
                            {meeting.participants.map((p, i) => (
                              <div key={p.id} className="w-10 h-10 rounded-2xl bg-primary/10 border-2 border-card flex items-center justify-center text-xs font-black text-primary uppercase" title={p.name}>
                                {p.name.charAt(0)}
                              </div>
                            ))}
                          </div>
                          <span className="text-sm font-bold text-muted-foreground">+{meeting.participants.length} others</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-8 pt-0">
                      <Button className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                        {meeting.meetingUrl ? (
                          <>
                            <Video className="w-4 h-4 mr-2" />
                            Join Meeting
                          </>
                        ) : (
                          'View Details'
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
