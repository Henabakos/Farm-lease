import express from 'express';

const router = express.Router();

// Get meetings
router.get('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { status } = req.query;

    let query = supabase
      .from('meetings')
      .select('*')
      .or(`initiated_by_id.eq.${userId},participant_id.eq.${userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('scheduled_at', { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get meetings error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get single meeting
router.get('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('[v0] Get meeting error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Schedule meeting
router.post('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const io = req.app.locals.io;
    const userId = req.userId;
    const {
      participantId,
      scheduledAt,
      meetingType,
      relatedToId,
      relatedToType,
      notes
    } = req.body;

    if (!participantId || !scheduledAt) {
      return res.status(400).json({ error: 'Participant ID and scheduled time required' });
    }

    const { data, error } = await supabase
      .from('meetings')
      .insert({
        initiated_by_id: userId,
        participant_id: participantId,
        scheduled_at: scheduledAt,
        meeting_type: meetingType || 'discussion',
        status: 'scheduled',
        related_to_id: relatedToId,
        related_to_type: relatedToType,
        notes
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for participant
    await supabase
      .from('notifications')
      .insert({
        user_id: participantId,
        actor_id: userId,
        type: 'system',
        title: 'Meeting Scheduled',
        content: `Meeting scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        related_to_id: data.id,
        related_to_type: 'meeting'
      });

    // Emit real-time notification
    io.to(`notifications:${participantId}`).emit('meeting_scheduled', {
      meetingId: data.id,
      scheduledAt
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('[v0] Schedule meeting error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Update meeting
router.put('/:id', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const updates = req.body;

    // Check authorization
    const { data: meeting } = await supabase
      .from('meetings')
      .select('initiated_by_id, participant_id')
      .eq('id', id)
      .single();

    if (!meeting || (meeting.initiated_by_id !== userId && meeting.participant_id !== userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('[v0] Update meeting error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start meeting
router.post('/:id/start', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;

    const { data: meeting } = await supabase
      .from('meetings')
      .select('initiated_by_id, participant_id')
      .eq('id', id)
      .single();

    if (!meeting || (meeting.initiated_by_id !== userId && meeting.participant_id !== userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('meetings')
      .update({
        status: 'ongoing',
        started_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('[v0] Start meeting error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// End meeting
router.post('/:id/end', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const { notes } = req.body;

    const { data: meeting } = await supabase
      .from('meetings')
      .select('initiated_by_id, participant_id')
      .eq('id', id)
      .single();

    if (!meeting || (meeting.initiated_by_id !== userId && meeting.participant_id !== userId)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('meetings')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        notes: notes || meeting.notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('[v0] End meeting error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Cancel meeting
router.post('/:id/cancel', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const { data: meeting } = await supabase
      .from('meetings')
      .select('initiated_by_id, participant_id')
      .eq('id', id)
      .single();

    if (!meeting || meeting.initiated_by_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('meetings')
      .update({
        status: 'cancelled'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Notify participant
    await supabase
      .from('notifications')
      .insert({
        user_id: meeting.participant_id,
        actor_id: userId,
        type: 'system',
        title: 'Meeting Cancelled',
        content: reason || 'The meeting has been cancelled'
      });

    res.json(data);
  } catch (error) {
    console.error('[v0] Cancel meeting error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
