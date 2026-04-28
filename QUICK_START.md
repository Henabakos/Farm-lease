# Farm Lease Platform - Quick Start Guide

Get the Farm Lease Platform up and running in 5 minutes.

## Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account (free tier works)
- Git

## Step 1: Clone and Setup

```bash
# Install dependencies
npm install

# Create .env file with your Supabase credentials
cp .env.example .env

# Edit .env and add your Supabase details:
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POSTGRES_URL, etc.
```

## Step 2: Initialize Database

```bash
# Run database migration to create all tables
npm run migrate

# This creates 12 tables with proper relationships and RLS policies
```

## Step 3: Start the Application

**Option A: Backend Only**
```bash
npm run dev:server
# Server runs on http://localhost:3001
```

**Option B: Frontend Only**
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

**Option C: Both Together (Recommended)**
```bash
npm run dev:all
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

## Step 4: Login/Register

1. Open http://localhost:5173 in your browser
2. Click "Get Started" or "Sign In"
3. Register with email, password, full name, and role
4. Choose role: **Owner** (manage farms) or **Tenant** (lease farms)

## Test Accounts

### Owner Account
```
Email: owner@example.com
Password: password123
Role: Owner
```

### Tenant Account
```
Email: tenant@example.com
Password: password123
Role: Tenant
```

## Feature Walkthroughs

### For Farm Owners

1. **Create a Farm Cluster**
   - Go to "Clusters" → "Create New"
   - Enter farm name, location, area, description
   - Click "Create"

2. **Create a Lease Proposal**
   - Go to "Proposals" → "Create Proposal"
   - Select a cluster
   - Set lease term and price
   - Publish to make visible to tenants

3. **Accept Tenant Applications**
   - View incoming applications in "Proposals"
   - Review proposed terms
   - Accept or reject application

4. **Manage Payments**
   - View pending payments in "Payments"
   - Verify payment receipts
   - Track revenue in "Analytics"

5. **View Analytics**
   - Check dashboard for statistics
   - View revenue by month
   - Monitor active agreements

### For Tenants

1. **Browse Available Farms**
   - Go to "Clusters"
   - View all active listings
   - Check farm details and owner info

2. **Apply to Proposals**
   - Find a farm you like
   - Click "Apply" on the proposal
   - Or "Negotiate" to discuss terms

3. **Negotiate Terms**
   - Counter-offer lease price if needed
   - Discuss with owner via messaging
   - Finalize when both parties agree

4. **Sign Agreement**
   - Once proposal accepted, agreement is created
   - Review lease terms
   - Click "Sign Agreement"

5. **Make Payments**
   - Go to "Payments"
   - Submit payment for due invoices
   - Upload receipt as proof
   - Track payment status

6. **Message Your Partner**
   - Go to "Messages"
   - Start conversation with farm owner
   - Discuss operational details

### For Admins

1. **Manage Users**
   - Go to Admin Dashboard
   - View all users and their roles
   - Change user roles if needed
   - Verify user accounts

2. **View Audit Logs**
   - Go to "Audit Logs"
   - See all system activities
   - Filter by user or action
   - Export for compliance

3. **Monitor System**
   - Check overview dashboard
   - View platform statistics
   - Monitor pending approvals

## API Quick Reference

### Authentication
```javascript
// Login
POST /api/auth/login
{ email: "user@example.com", password: "password123" }
// Returns: { access_token, refresh_token, user }

// Register
POST /api/auth/register
{ email, password, fullName, role }

// Get current user
GET /api/auth/me
```

### Clusters
```javascript
// Get all clusters
GET /api/clusters

// Create cluster
POST /api/clusters
{ name, location, areaHectares, description }

// Get cluster details
GET /api/clusters/:id

// Update cluster
PUT /api/clusters/:id
{ name, description, ... }
```

### Proposals
```javascript
// Get proposals
GET /api/proposals?status=published

// Create proposal
POST /api/proposals
{ clusterId, title, leaseTermMonths, proposedPrice, terms }

// Accept proposal
POST /api/proposals/:id/accept

// Reject proposal
POST /api/proposals/:id/reject
```

### Agreements
```javascript
// Get agreements
GET /api/agreements?status=active

// Create agreement
POST /api/agreements
{ proposalId, clusterId, tenantId, startDate, endDate, monthlyAmount }

// Terminate agreement
POST /api/agreements/:id/terminate
{ reason }
```

### Payments
```javascript
// Get payments
GET /api/payments?status=pending

// Create payment
POST /api/payments
{ agreementId, amount, paymentMethod }

// Process payment
POST /api/payments/:id/process
{ transactionId }

// Refund payment
POST /api/payments/:id/refund
{ reason }
```

### Messages
```javascript
// Get conversations
GET /api/messages/conversations

// Get messages in conversation
GET /api/messages/conversation/:conversationId

// Send message
POST /api/messages
{ receiverId, content }
```

### Notifications
```javascript
// Get notifications
GET /api/notifications

// Get unread count
GET /api/notifications/unread/count

// Mark as read
PUT /api/notifications/:id/read
```

## Common Tasks

### Add Toast Notification
```typescript
import { toast } from 'sonner';

// Success
toast.success('Cluster created successfully');

// Error
toast.error('Failed to create cluster');

// Info
toast.info('Processing your request...');

// Warning
toast.warning('This action cannot be undone');
```

### Use Custom Hook
```typescript
import { useClusters } from '@/hooks/useClusters';

function MyComponent() {
  const { clusters, isLoading, createCluster } = useClusters();

  const handleCreate = async () => {
    try {
      await createCluster({
        name: 'New Farm',
        location: 'California',
        areaHectares: 50
      });
      // Toast notification shown automatically
    } catch (error) {
      // Error already shown via toast
    }
  };

  return <div>{/* ... */}</div>;
}
```

### Check User Role
```typescript
import { useRole } from '@/contexts/RoleContext';

function MyComponent() {
  const { role, isOwner, isTenant, isAdmin, canAccess } = useRole();

  if (isOwner) {
    return <div>Owner features</div>;
  }

  if (isTenant) {
    return <div>Tenant features</div>;
  }

  if (canAccess(['owner', 'admin'])) {
    return <div>Owner and Admin features</div>;
  }

  return <div>Public features</div>;
}
```

### Get Current User
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.full_name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Troubleshooting

### Server won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill the process using the port
kill -9 <PID>

# Or use a different port
PORT=3002 npm run dev:server
```

### Database migration fails
```bash
# Verify environment variables
echo $SUPABASE_URL
echo $POSTGRES_URL

# Test database connection
psql $POSTGRES_URL -c "SELECT 1"

# Check Supabase dashboard for errors
```

### Can't connect to backend from frontend
```bash
# Make sure backend is running
curl http://localhost:3001/api/health

# Check CORS settings in server/index.js
# Verify CLIENT_URL environment variable
```

### Toast notifications not showing
```bash
# Make sure Sonner is imported in App.tsx
import { Toaster } from 'sonner';

// And added to render
<Toaster position="top-right" richColors closeButton />
```

### Real-time messages not working
```bash
# Check WebSocket connection in browser console
# Make sure Socket.IO server is running
# Check for console errors about connection

# Verify in network tab that WebSocket connects to:
# ws://localhost:3001/socket.io/?...
```

## Next Steps

1. **Customize Branding**
   - Update colors in `globals.css`
   - Change logo in layout components
   - Modify company name in landing page

2. **Add Payment Processing**
   - Integrate Stripe or PayPal
   - Update payment routes
   - Add webhook handling

3. **Deploy to Production**
   - Push to GitHub
   - Deploy frontend to Vercel
   - Deploy backend to Heroku/Railway/Fly
   - Update environment variables

4. **Add Email Notifications**
   - Integrate SendGrid or Mailgun
   - Send notifications for key events
   - Update notification service

5. **Enhance Features**
   - Add document management
   - Implement e-signatures
   - Add advanced reporting

## Resources

- **Backend Setup**: See `BACKEND_SETUP.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **API Docs**: Full API reference in `BACKEND_SETUP.md`
- **React Hooks**: See `src/hooks/` directory
- **Contexts**: See `src/contexts/` directory

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review the backend setup guide
3. Check server logs: `npm run dev:server 2>&1 | grep "[v0]"`
4. Review browser console for frontend errors
5. Check Supabase dashboard logs

## Architecture Summary

```
Farm Lease Platform
├── Frontend (React + Vite + TailwindCSS)
│   ├── Components for all features
│   ├── API Service layer
│   ├── Custom React hooks
│   └── Authentication contexts
│
├── Backend (Node.js + Express)
│   ├── 11 API route modules
│   ├── Authentication & RBAC
│   ├── Real-time WebSocket server
│   └── Audit logging middleware
│
└── Database (PostgreSQL via Supabase)
    ├── 12 normalized tables
    ├── Row Level Security
    └── Complete audit trail
```

Happy coding! 🚀
