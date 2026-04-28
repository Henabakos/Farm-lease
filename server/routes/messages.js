import express from 'express';

const router = express.Router();

// Get conversations
router.get('/conversations', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get conversations error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get messages in conversation
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('[v0] Get messages error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get or create conversation
router.post('/conversation', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { otherUserId, relatedToId, relatedToType } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID required' });
    }

    // Check if conversation exists
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
      .single();

    if (!conversation) {
      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user1_id: userId,
          user2_id: otherUserId,
          related_to_id: relatedToId,
          related_to_type: relatedToType
        })
        .select()
        .single();

      if (error) throw error;
      conversation = newConv;
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error('[v0] Get/create conversation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const io = req.app.locals.io;
    const userId = req.userId;
    const { receiverId, conversationId, content, attachmentUrl, relatedToId, relatedToType } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content required' });
    }

    // Get or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${userId})`)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user1_id: userId,
          user2_id: receiverId,
          related_to_id: relatedToId,
          related_to_type: relatedToType
        })
        .select()
        .single();
      conversation = newConv;
    }

    // Create message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        receiver_id: receiverId,
        conversation_id: conversation.id,
        content,
        attachment_url: attachmentUrl,
        related_to_id: relatedToId,
        related_to_type: relatedToType,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversation.id);

    // Emit real-time message
    io.to(`messages:${conversation.id}`).emit('new_message', data);

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        actor_id: userId,
        type: 'message',
        title: 'New Message',
        content: content.substring(0, 100),
        related_to_id: conversation.id,
        related_to_type: 'conversation'
      });

    res.status(201).json(data);
  } catch (error) {
    console.error('[v0] Send message error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('[v0] Mark as read error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Mark all messages as read
router.put('/conversation/:conversationId/read-all', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const userId = req.userId;
    const { conversationId } = req.params;

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId);

    if (error) throw error;

    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    console.error('[v0] Mark all read error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
