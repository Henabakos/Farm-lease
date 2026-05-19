// ============================================================================
// Meetings panel component for scheduling and managing meetings
// ============================================================================
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Video, 
  Plus, 
  Clock, 
  Users, 
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { meetingsAPI, Meeting, CreateMeetingData } from '../../services/meetings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const MeetingsPanel: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateMeetingData>({
    title: '',
    description: '',
    scheduledAt: '',
    durationMinutes: 30,
    provider: 'none',
    attendeeEmails: [],
  });

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const response = await meetingsAPI.listMeetings({ page: 1, limit: 20 });
      setMeetings(response.items);
    } catch (error) {
      console.error('Failed to load meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await meetingsAPI.createMeeting(formData);
      toast.success('Meeting created successfully');
      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        scheduledAt: '',
        durationMinutes: 30,
        provider: 'none',
        attendeeEmails: [],
      });
      loadMeetings();
    } catch (error) {
      console.error('Failed to create meeting:', error);
      toast.error('Failed to create meeting');
    }
  };

  const handleJoinMeeting = (meeting: Meeting) => {
    if (meeting.joinUrl) {
      window.open(meeting.joinUrl, '_blank');
    } else {
      toast.info('This meeting does not have a video link');
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'ZOOM':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'GOOGLE_MEET':
        return <Video className="w-4 h-4 text-green-600" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'ONGOING':
        return 'bg-green-50 text-green-600 border-green-100';
      case 'COMPLETED':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Meetings</h2>
          <p className="text-sm text-slate-500">Schedule and manage your meetings</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Meeting title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Meeting description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="provider">Platform</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => setFormData({ ...formData, provider: value as any })}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">In-Person</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="google">Google Meet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Meeting</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">No meetings yet</h3>
            <p className="text-sm text-slate-500 mb-4">Schedule your first meeting to get started</p>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center">
                      {getProviderIcon(meeting.provider)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{meeting.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(meeting.scheduledAt).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {meeting.durationMinutes} min
                        </span>
                      </div>
                      {meeting.description && (
                        <p className="text-sm text-slate-500 mt-2">{meeting.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(meeting.status)}>
                      {meeting.status.toLowerCase()}
                    </Badge>
                    {meeting.status === 'SCHEDULED' && meeting.joinUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleJoinMeeting(meeting)}
                        className="gap-1"
                      >
                        <Video className="w-3 h-3" />
                        Join
                      </Button>
                    )}
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
