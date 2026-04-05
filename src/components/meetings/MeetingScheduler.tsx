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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Meeting <span className="text-primary">Scheduler</span>
          </h1>
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-wider">Coordinate discussions and project reviews with your partners.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
            <Button 
              variant={view === 'CALENDAR' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn(
                "h-8 px-4 gap-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all",
                view === 'CALENDAR' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-primary hover:bg-white/50"
              )}
              onClick={() => setView('CALENDAR')}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </Button>
            <Button 
              variant={view === 'LIST' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={cn(
                "h-8 px-4 gap-2 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all",
                view === 'LIST' ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-primary hover:bg-white/50"
              )}
              onClick={() => setView('LIST')}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Upcoming</span>
            </Button>
          </div>
          <Button className="gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 text-[10px] font-bold uppercase tracking-wider">
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
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-20" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const hasMeeting = MOCK_MEETINGS.some(m => new Date(m.startTime).getDate() === day && new Date(m.startTime).getMonth() === currentDate.getMonth());
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                          className={cn(
                            "h-20 p-2 rounded-md border transition-all relative group flex flex-col items-start justify-between active:scale-95",
                            isSelected(day) ? "bg-primary text-white border-primary shadow-md" : "bg-white border-slate-100 hover:border-primary/30 hover:bg-slate-50",
                            isToday(day) && !isSelected(day) && "border-primary/40 bg-primary/5"
                          )}
                        >
                          <span className={cn("text-sm font-bold", isSelected(day) ? "text-white" : "text-slate-700")}>
                            {day}
                          </span>
                          {hasMeeting && (
                            <div className={cn(
                              "w-full h-1 rounded-full",
                              isSelected(day) ? "bg-white/40" : "bg-primary/30"
                            )} />
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

              <div className="space-y-6">
                <Card className="border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden">
                  <CardHeader className="p-6 pb-4">
                    <CardTitle className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Schedule for {selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    {MOCK_MEETINGS.filter(m => new Date(m.startTime).getDate() === selectedDate.getDate() && new Date(m.startTime).getMonth() === selectedDate.getMonth()).length > 0 ? (
                      MOCK_MEETINGS.filter(m => new Date(m.startTime).getDate() === selectedDate.getDate() && new Date(m.startTime).getMonth() === selectedDate.getMonth()).map(meeting => (
                        <div key={meeting.id} className="p-4 rounded-md bg-slate-50 border border-slate-200/50 space-y-4 group hover:bg-slate-100 transition-all active:scale-[0.99]">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors leading-tight">{meeting.title}</h4>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <Clock className="w-3 h-3" />
                                {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-md hover:bg-white border border-transparent hover:border-slate-200">
                              <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                            </Button>
                          </div>
                          <div className="flex items-center -space-x-1.5">
                            {meeting.participants.map((p, i) => (
                              <div key={p.id} className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-[9px] font-bold text-primary uppercase shadow-sm" title={p.name}>
                                {p.name.charAt(0)}
                              </div>
                            ))}
                          </div>
                          {meeting.meetingUrl && (
                            <Button className="w-full h-9 rounded-md bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95">
                              <Video className="w-3.5 h-3.5 mr-2" />
                              Join Meeting
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center mx-auto mb-4">
                          <CalendarIcon className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">No meetings scheduled</p>
                        <Button variant="link" className="mt-1 text-primary font-bold text-[10px] uppercase tracking-wider hover:no-underline">Schedule One</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-sm bg-slate-50 rounded-lg overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-md bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm tracking-tight text-slate-900">Meeting Tips</h3>
                        <p className="text-[9px] font-bold text-primary uppercase tracking-wider">Best Practices</p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2 text-xs font-medium text-slate-500 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        Keep meetings under 45 minutes for better focus.
                      </li>
                      <li className="flex items-start gap-2 text-xs font-medium text-slate-500 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        Share agenda 24h before the meeting.
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {MOCK_MEETINGS.map((meeting) => (
                <motion.div key={meeting.id} variants={item}>
                  <Card className="group border border-slate-200 shadow-sm bg-white rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full active:scale-[0.99]">
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-primary/10 text-primary border-none font-bold px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
                          {meeting.status}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <CalendarIcon className="w-3 h-3" />
                          {new Date(meeting.startTime).toLocaleDateString()}
                        </div>
                      </div>
                      <CardTitle className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-tight">
                        {meeting.title}
                      </CardTitle>
                      <CardDescription className="text-xs font-medium line-clamp-2 mt-2 leading-relaxed">
                        {meeting.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-4 space-y-6 flex-1">
                      <div className="flex items-center gap-6">
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Time</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            60 min
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Participants</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center -space-x-1.5">
                            {meeting.participants.map((p, i) => (
                              <div key={p.id} className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-primary uppercase shadow-sm" title={p.name}>
                                {p.name.charAt(0)}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">+{meeting.participants.length} others</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-6 pt-0">
                      <Button className="w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95">
                        {meeting.meetingUrl ? (
                          <>
                            <Video className="w-3.5 h-3.5 mr-2" />
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
