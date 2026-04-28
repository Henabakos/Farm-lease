# Farm Lease Platform - Backend Setup Guide

## Overview

This document explains the complete backend implementation for the Farm Lease Platform. The backend is built with **Node.js + Express + Supabase**, providing a production-ready API with authentication, role-based access control (RBAC), real-time messaging, and comprehensive audit logging.

## Architecture

### Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 4.22+
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth + JWT
- **Real-time**: Socket.IO
- **ORM**: Direct SQL queries (Row Level Security)

### Database Schema

The backend uses 12 core tables:

1. **users** - User profiles with roles (owner/tenant/admin)
2. **farm_clusters** - Agricultural properties
3. **proposals** - Lease proposals with terms and pricing
4. **negotiations** - Price negotiation history
5. **agreements** - Signed lease agreements
6. **payments** - Payment records with status tracking
7. **messages** - Direct messaging between users
8. **conversations** - Grouped message threads
9. **notifications** - Real-time user notifications
10. **meetings** - Scheduled meetings and discussions
11. **audit_logs** - Complete activity audit trail
12. **analytics** - Event tracking and analytics

All tables have **Row Level Security (RLS)** enabled with proper policies to ensure users can only access their own data.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the project root with:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
POSTGRES_URL=your_postgres_url_here

# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Frontend API URL
VITE_API_URL=http://localhost:3001/api
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Database Migration

Run the database migration script to create all tables and policies:

```bash
npm run migrate
```

This executes `scripts/run-migration.js` which applies `scripts/01_create_schema.sql`.

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Backend

#### Option A: Backend Only
```bash
npm run dev:server
```

#### Option B: Frontend & Backend Together
```bash
npm run dev:all
```

The server will run on `http://localhost:3001`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user
- `POST /refresh` - Refresh JWT token
- `GET /me` - Get current user profile

### Users (`/api/users`)
- `GET /` - Search users
- `GET /:id` - Get user profile
- `PUT /:id` - Update user profile
- `POST /:id/verify` - Verify user (admin only)

### Farm Clusters (`/api/clusters`)
- `GET /` - List clusters
- `GET /:id` - Get cluster details
- `POST /` - Create cluster (owner only)
- `PUT /:id` - Update cluster
- `DELETE /:id` - Delete cluster

### Proposals (`/api/proposals`)
- `GET /` - List proposals
- `GET /:id` - Get proposal details
- `POST /` - Create proposal (owner only)
- `PUT /:id` - Update proposal
- `POST /:id/accept` - Accept proposal (tenant)
- `POST /:id/reject` - Reject proposal

### Agreements (`/api/agreements`)
- `GET /` - List agreements
- `GET /:id` - Get agreement details
- `POST /` - Create agreement
- `PUT /:id` - Update agreement
- `POST /:id/terminate` - Terminate agreement

### Payments (`/api/payments`)
- `GET /` - List payments
- `GET /:id` - Get payment details
- `POST /` - Create payment
- `POST /:id/process` - Process payment
- `POST /:id/refund` - Refund payment

### Messages (`/api/messages`)
- `GET /conversations` - List conversations
- `GET /conversation/:id` - Get messages in conversation
- `POST /conversation` - Get or create conversation
- `POST /` - Send message
- `PUT /:id/read` - Mark message as read
- `PUT /conversation/:id/read-all` - Mark all as read

### Notifications (`/api/notifications`)
- `GET /` - List notifications
- `GET /unread/count` - Get unread count
- `PUT /:id/read` - Mark notification as read
- `PUT /read-all/bulk` - Mark all as read
- `DELETE /:id` - Delete notification

### Meetings (`/api/meetings`)
- `GET /` - List meetings
- `GET /:id` - Get meeting details
- `POST /` - Schedule meeting
- `PUT /:id` - Update meeting
- `POST /:id/start` - Start meeting
- `POST /:id/end` - End meeting
- `POST /:id/cancel` - Cancel meeting

### Analytics (`/api/analytics`)
- `POST /events` - Log analytics event
- `GET /dashboard` - Get dashboard stats
- `GET /revenue` - Get revenue analytics (owner only)
- `GET /payments` - Get payment statistics
- `GET /clusters/:id` - Get cluster analytics

### Admin (`/api/admin`)
- `GET /users` - List all users
- `GET /users/:id` - Get user details
- `PUT /users/:id/role` - Change user role (admin only)
- `POST /users/:id/deactivate` - Deactivate user (admin only)
- `GET /audit-logs` - Get audit logs (admin only)
- `GET /stats` - Get system statistics (admin only)
- `GET /overview` - Get platform overview (admin only)

## Role-Based Access Control (RBAC)

The system supports three roles:

### Owner
- Create and manage farm clusters
- Create and publish lease proposals
- Review and accept/reject proposals from tenants
- Create agreements and manage lease terms
- Receive and verify payments
- View revenue analytics

### Tenant
- Browse available farm clusters
- Apply to proposals
- Negotiate lease terms
- Sign agreements
- Submit and track payments
- View upcoming lease obligations

### Admin
- Manage all users and their roles
- View and export audit logs
- Access platform statistics
- Verify user accounts
- Monitor system activity

RBAC is enforced at two levels:
1. **API Middleware**: Each route validates user role via `rbacMiddleware`
2. **Database Policies**: Supabase RLS policies prevent unauthorized data access

## Real-Time Features

### WebSocket Events

The server uses Socket.IO for real-time communication:

**Client Subscriptions:**
```javascript
// Subscribe to notifications
socket.emit('subscribe_notifications', userId);

// Subscribe to messages
socket.emit('subscribe_messages', conversationId);

// Subscribe to presence
socket.emit('subscribe_user_presence', userId);
```

**Server Broadcasts:**
```javascript
// Send notification
io.to(`notifications:${userId}`).emit('notification', data);

// Send new message
io.to(`messages:${conversationId}`).emit('new_message', message);

// User presence
io.to(`presence:${userId}`).emit('user_online', { userId, online: true });
```

## Audit Logging

Every action is logged to the `audit_logs` table with:
- User ID
- Action type (CREATE, UPDATE, DELETE, etc.)
- Entity type and ID
- Changes (JSON)
- IP address
- User agent
- Timestamp

Admins can query audit logs via `/api/admin/audit-logs`

## Authentication Flow

1. **Registration**
   - User submits email, password, name, and role
   - Backend creates Supabase Auth user and user profile
   - User can immediately log in

2. **Login**
   - User submits email and password
   - Backend calls Supabase Auth
   - Returns JWT access token and refresh token
   - Frontend stores tokens in localStorage

3. **API Requests**
   - Client includes JWT in `Authorization: Bearer {token}` header
   - Server verifies token with Supabase
   - Server attaches user info to request

4. **Token Refresh**
   - When access token expires, client calls `/auth/refresh`
   - Server returns new access token

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "statusCode": 400
}
```

Common status codes:
- `400` - Validation error
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error

## Frontend Integration

The frontend uses the API service layer (`src/services/api.ts`) to call backend endpoints:

```javascript
import { clustersAPI, proposalsAPI, paymentsAPI } from '@/services/api';

// Fetch clusters
const clusters = await clustersAPI.getAll({ status: 'active' });

// Create proposal
const proposal = await proposalsAPI.create({
  clusterId: '123',
  title: 'Lease Proposal',
  proposedPrice: 5000
});

// Process payment
await paymentsAPI.process(paymentId, transactionId);
```

### Hooks

Custom React hooks for data fetching:
- `useClusters()` - Cluster CRUD
- `useProposals()` - Proposal management
- `useAgreements()` - Agreement management
- `usePayments()` - Payment processing
- `useMessages()` - Messaging
- `useNotifications()` - Notifications (via NotificationContext)

### Contexts

Provider components for global state:
- `AuthProvider` - Authentication state and methods
- `RoleProvider` - User role and permissions
- `NotificationProvider` - Real-time notifications

## Development Tips

### Running the Server with Debug Logging

```bash
NODE_DEBUG=* npm run dev:server
```

### Testing API Endpoints

Use curl or Postman:

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "role": "tenant"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Get current user (with token)
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Database Queries

Access the database via Supabase dashboard:
- URL: https://supabase.com
- Navigate to your project
- Use the SQL Editor to run queries

## Troubleshooting

### "SUPABASE_URL not set"
- Ensure `.env` file exists with Supabase variables
- Verify variables match your Supabase project settings

### "Token expired" errors
- Client should call `/auth/refresh` with refresh token
- Server will return new access token

### Socket.IO connection fails
- Ensure server is running on correct port (3001)
- Check CORS settings in `server/index.js`
- Verify `CLIENT_URL` environment variable

### Database connection errors
- Test connection: `psql $POSTGRES_URL`
- Verify `POSTGRES_URL` format: `postgresql://user:password@host:port/database`

## Production Deployment

When deploying to production:

1. **Environment Variables**
   - Set all `SUPABASE_*` and `POSTGRES_*` variables
   - Set `NODE_ENV=production`
   - Use strong, random `SUPABASE_JWT_SECRET`

2. **Database**
   - Run migration script on deployment
   - Verify RLS policies are enabled
   - Set up automated backups

3. **Security**
   - Enable HTTPS
   - Set restrictive CORS origins
   - Use environment variables for secrets
   - Enable rate limiting (recommended: redis)

4. **Monitoring**
   - Monitor audit logs for unusual activity
   - Set up error tracking (e.g., Sentry)
   - Monitor API response times

## Support

For issues or questions:
- Check the troubleshooting section above
- Review server logs: `npm run dev:server 2>&1 | grep "[v0]"`
- Check Supabase logs in project dashboard
