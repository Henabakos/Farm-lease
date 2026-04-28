import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';
import http from 'http';

// Import route handlers
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import clusterRoutes from './routes/clusters.js';
import proposalRoutes from './routes/proposals.js';
import agreementRoutes from './routes/agreements.js';
import paymentRoutes from './routes/payments.js';
import messageRoutes from './routes/messages.js';
import notificationRoutes from './routes/notifications.js';
import meetingRoutes from './routes/meetings.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import geospatialRoutes from './routes/geospatial.js';
import paymentVerificationRoutes from './routes/payment-verification.js';
import contractTemplateRoutes from './routes/contract-templates.js';
import multiClusterRoutes from './routes/multi-cluster.js';

// Import middleware
import { authMiddleware, errorHandler, auditLogger } from './middleware/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Attach Supabase to app
app.locals.supabase = supabase;
app.locals.io = io;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Audit logging middleware
app.use(auditLogger(supabase));

// Authentication middleware (optional for some routes)
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    app.locals.token = token;
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/clusters', authMiddleware, clusterRoutes);
app.use('/api/proposals', authMiddleware, proposalRoutes);
app.use('/api/agreements', authMiddleware, agreementRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/messages', authMiddleware, messageRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/meetings', authMiddleware, meetingRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/geospatial', authMiddleware, geospatialRoutes);
app.use('/api/payment-verification', authMiddleware, paymentVerificationRoutes);
app.use('/api/contract-templates', authMiddleware, contractTemplateRoutes);
app.use('/api/multi-cluster', authMiddleware, multiClusterRoutes);

// Real-time WebSocket connections
io.on('connection', (socket) => {
  console.log('[v0] User connected:', socket.id);

  socket.on('subscribe_notifications', (userId) => {
    socket.join(`notifications:${userId}`);
    console.log(`[v0] User ${userId} subscribed to notifications`);
  });

  socket.on('subscribe_messages', (conversationId) => {
    socket.join(`messages:${conversationId}`);
    console.log(`[v0] Subscribed to messages:${conversationId}`);
  });

  socket.on('subscribe_user_presence', (userId) => {
    socket.join(`presence:${userId}`);
    io.to(`presence:${userId}`).emit('user_online', { userId, online: true });
  });

  socket.on('disconnect', () => {
    console.log('[v0] User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[v0] Farm Lease Server running on port ${PORT}`);
  console.log(`[v0] Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, server, io, supabase };
