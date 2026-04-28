# Farm Lease Platform - Complete Architecture Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FARM LEASE PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────┐  │
│  │   Web Browser (React)  │  │   API Client (Axios)   │  │  Socket.IO   │  │
│  │                        │  │                        │  │   Client     │  │
│  │  - Components          │  │  - Request/Response    │  │              │  │
│  │  - Contexts            │  │  - Auth tokens         │  │  - Messages  │  │
│  │  - Hooks               │  │  - Interceptors        │  │  - Events    │  │
│  └────────────┬───────────┘  └────────────┬───────────┘  └──────┬───────┘  │
│               │                           │                      │          │
│  FRONTEND LAYER (React + TypeScript)                           │          │
├───────────────┼───────────────────────────┼──────────────────────┼──────────┤
│               │                           │                      │          │
│               ├─── HTTP/REST ────────────┤                      │          │
│               │                           │                      │          │
│  ┌────────────▼──────────────────────────▼──────────┐           │          │
│  │       Express.js REST API Server                  │           │          │
│  │                                                   │           │          │
│  │  ┌──────────────────────────────────────────┐   │           │          │
│  │  │  Middleware Stack                        │   │           │          │
│  │  │  - Auth verification (JWT)              │   │           │          │
│  │  │  - RBAC enforcement                      │   │           │          │
│  │  │  - Audit logging                         │   │           │          │
│  │  │  - Error handling                        │   │           │          │
│  │  └──────────────────────────────────────────┘   │           │          │
│  │                                                   │           │          │
│  │  ┌──────────────────────────────────────────┐   │           │          │
│  │  │  Route Modules (11 modules)              │   │           │          │
│  │  │                                          │   │           │          │
│  │  │  /api/auth          → Auth controller    │   │           │          │
│  │  │  /api/users         → User profiles      │   │           │          │
│  │  │  /api/clusters      → Farm clusters      │   │           │          │
│  │  │  /api/proposals     → Lease proposals    │   │           │          │
│  │  │  /api/agreements    → Lease agreements   │   │           │          │
│  │  │  /api/payments      → Payment tracking   │   │           │          │
│  │  │  /api/messages      → Messaging          │   │           │          │
│  │  │  /api/notifications → Notifications      │   │           │          │
│  │  │  /api/meetings      → Meeting scheduling │   │           │          │
│  │  │  /api/analytics     → Reporting          │   │           │          │
│  │  │  /api/admin         → Admin operations   │   │           │          │
│  │  └──────────────────────────────────────────┘   │           │          │
│  │                                                   │           │          │
│  │  ┌──────────────────────────────────────────┐   │           │          │
│  │  │  Socket.IO Server                        │   │◄──────────┘          │
│  │  │                                          │   │                       │
│  │  │  - Real-time messaging                  │   │                       │
│  │  │  - Push notifications                   │   │                       │
│  │  │  - User presence                        │   │                       │
│  │  │  - Live updates                         │   │                       │
│  │  └──────────────────────────────────────────┘   │                       │
│  └─────────────┬──────────────────────────────────┬┘                       │
│                │                                  │                        │
│                │                                  │                        │
│  BACKEND LAYER (Node.js + Express)               │                        │
├────────────────┼──────────────────────────────────┼────────────────────────┤
│                │                                  │                        │
│  ┌─────────────▼─────────────────────────────────▼─────────┐             │
│  │          PostgreSQL Database (Supabase)                  │             │
│  │                                                           │             │
│  │  ┌──────────────────────────────────────────────────┐   │             │
│  │  │  Core Tables (12 tables)                         │   │             │
│  │  │                                                  │   │             │
│  │  │  ┌─────────────┐  ┌──────────────┐              │   │             │
│  │  │  │   users     │  │   clusters   │              │   │             │
│  │  │  │             │  │              │              │   │             │
│  │  │  │ - id        │  │ - id         │              │   │             │
│  │  │  │ - email     │  │ - owner_id   │              │   │             │
│  │  │  │ - role      │  │ - name       │              │   │             │
│  │  │  │ - verified  │  │ - location   │              │   │             │
│  │  │  └─────────────┘  └──────────────┘              │   │             │
│  │  │                                                  │   │             │
│  │  │  ┌──────────────┐  ┌──────────────┐             │   │             │
│  │  │  │  proposals   │  │  agreements  │             │   │             │
│  │  │  │              │  │              │             │   │             │
│  │  │  │ - cluster_id │  │ - proposal_id│             │   │             │
│  │  │  │ - status     │  │ - tenant_id  │             │   │             │
│  │  │  │ - price      │  │ - status     │             │   │             │
│  │  │  │ - terms      │  │ - start_date │             │   │             │
│  │  │  └──────────────┘  └──────────────┘             │   │             │
│  │  │                                                  │   │             │
│  │  │  ┌──────────────┐  ┌──────────────┐             │   │             │
│  │  │  │   payments   │  │   messages   │             │   │             │
│  │  │  │              │  │              │             │   │             │
│  │  │  │ - agreement_ │  │ - sender_id  │             │   │             │
│  │  │  │   id         │  │ - receiver_id│             │   │             │
│  │  │  │ - status     │  │ - content    │             │   │             │
│  │  │  │ - amount     │  │ - is_read    │             │   │             │
│  │  │  └──────────────┘  └──────────────┘             │   │             │
│  │  │                                                  │   │             │
│  │  │  ┌──────────────┐  ┌──────────────┐             │   │             │
│  │  │  │notifications│  │  audit_logs  │             │   │             │
│  │  │  │              │  │              │             │   │             │
│  │  │  │ - user_id    │  │ - user_id    │             │   │             │
│  │  │  │ - type       │  │ - action     │             │   │             │
│  │  │  │ - title      │  │ - entity     │             │   │             │
│  │  │  │ - is_read    │  │ - changes    │             │   │             │
│  │  │  └──────────────┘  └──────────────┘             │   │             │
│  │  │                                                  │   │             │
│  │  │  +4 more tables: conversations, meetings,       │   │             │
│  │  │                  negotiations, analytics        │   │             │
│  │  └──────────────────────────────────────────────────┘   │             │
│  │                                                           │             │
│  │  ┌──────────────────────────────────────────────────┐   │             │
│  │  │  Security Layer                                  │   │             │
│  │  │                                                  │   │             │
│  │  │  ┌─────────────────────────────────────────┐    │   │             │
│  │  │  │  Row Level Security (RLS)              │    │   │             │
│  │  │  │  - Every table has RLS enabled         │    │   │             │
│  │  │  │  - 30+ security policies               │    │   │             │
│  │  │  │  - Users can only access their data    │    │   │             │
│  │  │  │  - Admin can access all               │    │   │             │
│  │  │  └─────────────────────────────────────────┘    │   │             │
│  │  │                                                  │   │             │
│  │  │  ┌─────────────────────────────────────────┐    │   │             │
│  │  │  │  Indexes & Relationships               │    │   │             │
│  │  │  │  - 50+ optimized indexes              │    │   │             │
│  │  │  │  - Foreign key constraints             │    │   │             │
│  │  │  │  - Cascading deletes                   │    │   │             │
│  │  │  └─────────────────────────────────────────┘    │   │             │
│  │  └──────────────────────────────────────────────────┘   │             │
│  └──────────────────────────────────────────────────────────┘             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Creating a Lease Proposal

```
User (Owner)                  Frontend                 Backend              Database
    │                            │                         │                    │
    ├─ Fill form ─────────────────>│                         │                    │
    │                            │                         │                    │
    │                            ├─ POST /api/proposals ──>│                    │
    │                            │                         │ Validate           │
    │                            │                         │ Create             │
    │                            │                         ├──── INSERT ───────>│
    │                            │                         │                    │
    │                            │                         │ Create notification│
    │                            │                         ├──── INSERT ───────>│
    │                            │                         │                    │
    │                            │<─── 201 Created ────────│                    │
    │                            │ {proposal, notification}│                    │
    │                            │                         │ Emit WebSocket     │
    │                            │<────── WebSocket ───────│ "new_proposal"     │
    │                            │ {proposal: {...}}       │                    │
    │<─── Show success toast ────│                         │                    │
    │ "Proposal created!"        │                         │                    │
```

### Payment Processing Flow

```
Tenant                        Frontend              Backend             Database    Notifications
    │                            │                     │                    │               │
    ├─ View payment ────────────>│                     │                    │               │
    │                            │                     │                    │               │
    ├─ Submit payment ──────────>│                     │                    │               │
    │                            │                     │                    │               │
    │                            ├─ POST /payments ──>│                    │               │
    │                            │                     │ Create payment     │               │
    │                            │                     ├──── INSERT ───────>│               │
    │                            │                     │ status: "pending"  │               │
    │                            │                     │                    │               │
    │                            │<─ 201 Created ────│                    │               │
    │                            │                     │                    │               │
    │<─ Show loading ────────────│                     │                    │               │
    │ "Processing..."            │                     │                    │               │
    │                            │ WebSocket listen ──>│ Subscribe: payments│               │
    │                            │                     │                    │               │
Owner (receiving side)          │                     │ POST /payments/:id/│               │
    │                            │                     │ process (admin)    │               │
    ├─ Verify receipt ──────────>│                     │                    │               │
    │                            ├─ POST /pay/:id ──>│ Update payment     │               │
    │                            │ /process           │ status: "completed"│               │
    │                            │                     ├──── UPDATE ──────>│               │
    │                            │                     │ Create audit log   │               │
    │                            │                     ├──── INSERT ──────>│               │
    │                            │                     │ Create notification│               │
    │                            │                     ├──── INSERT ──────>├─ Send to tenant
    │                            │                     │ Emit WebSocket     │               │
    │<─ WebSocket ───────────────│<─── WebSocket ─────│ "payment_processed"│               │
    │ {payment: completed}       │ {status: completed}│ {payment: {...}}   │               │
    │                            │                     │                    │               │
    │<─ Show success ────────────│                     │                    │               │
    │ "Payment verified!"        │                    │                    │               │
    │ Toast notification         │                    │                    │               │
```

## Authentication & Authorization Flow

```
User Registration/Login                API Processing              Database
                                                                        
    1. User enters credentials
       │
       ├─ Email validation
       ├─ Password hashing (bcrypt)
       │
       └─> POST /auth/register
            │
            ├─> Create in Supabase Auth
            │   (JWT generation)
            │
            ├─> Create user profile
            │   - id
            │   - email
            │   - full_name
            │   - role
            │
            └─> Database INSERT
                ├─ users table
                ├─ Set RLS policies
                ├─ Create audit log
                │
                └─> Return:
                    {
                      access_token: "...",
                      refresh_token: "...",
                      user: {...}
                    }
    
    2. Client stores tokens
       └─> localStorage:
           - accessToken
           - refreshToken
    
    3. Subsequent requests
       └─> Add Authorization header
           GET /api/clusters
           Header: Authorization: Bearer {accessToken}
    
    4. Server verification
       ├─> Decode JWT
       ├─> Get user from token
       ├─> Check role with RBAC
       ├─> Verify row-level security
       └─> Return data or 403 Forbidden
    
    5. Token refresh (when expired)
       └─> POST /auth/refresh
           with refreshToken
           └─> Return new accessToken
```

## Role-Based Access Control (RBAC)

```
Owner Role                     Tenant Role                    Admin Role
═════════════════════════════════════════════════════════════════════════════

✓ Create clusters            ✓ Browse clusters              ✓ View all users
✓ Manage clusters            ✓ Apply to proposals           ✓ Change user roles
✓ Create proposals           ✓ Negotiate terms              ✓ View audit logs
✓ Accept/reject proposals    ✓ Sign agreements              ✓ System statistics
✓ Create agreements          ✓ Submit payments              ✓ Platform overview
✓ Receive payments           ✓ View payment history         ✓ Deactivate users
✓ View revenue analytics     ✓ Message owners               ✓ Verify accounts
✓ Schedule meetings          ✓ View obligations
✓ Message tenants            ✓ Track agreements

RBAC Enforcement (Three Levels):
────────────────────────────────

Level 1: API Route Protection
    POST /api/clusters (owner only)
    └─ rbacMiddleware(['owner', 'admin'])
    └─ Returns 403 if user is tenant

Level 2: Database Row-Level Security (RLS)
    SELECT * FROM farm_clusters
    WHERE owner_id = auth.uid() OR auth.role() = 'admin'
    └─ Even if API is bypassed, database denies access

Level 3: Business Logic
    Create agreement
    └─ Check tenant has accepted proposal
    └─ Check dates are valid
    └─ Check payment terms make sense
```

## Real-Time Communication Flow

```
Client A (Owner)              Server                    Client B (Tenant)
                              (Socket.IO)
    
    Message Sending:
    ───────────────
    "Hi, ready to lease?"
         │
         ├─ socket.emit('send_message', {...})
         │
         ├────────────────────>│ Save to DB
         │                      │ Broadcast to recipient
         │                      │
         │                      ├──────────────────────────>│ Display message
         │                      │ socket.on('new_message') │
         │                      │ {sender: owner, content}  │
         │                      │
         │                      │ Emit notification
         │<─────────────────────┤ socket.emit('notification')
         │ (optional)           │
         │                      │
    
    Real-time Features:
    ──────────────────
    ┌─ Notifications ─────┐
    │ Proposal received   │ WebSocket → Push notification
    │ Payment verified    │ → Toast in UI
    │ Meeting scheduled   │ → Unread count update
    └─────────────────────┘
    
    ┌─ Presence ──────────┐
    │ User online?        │ Subscribe: subscribeNotifications(userId)
    │ Last seen           │ → Socket.IO broadcasts online status
    │ Typing indicator    │ → Real-time list updates
    └─────────────────────┘
    
    ┌─ Auto-sync ─────────┐
    │ New payment         │ One user creates → All dashboards update
    │ Updated proposal    │ Auto-fetch via WebSocket
    │ Agreement signed    │ No polling needed
    └─────────────────────┘
```

## Error Handling & Recovery

```
User Action                   Client                    Backend              Recovery
──────────────────────────────────────────────────────────────────────────────────────

Normal Flow:
    POST /api/payments  ──────────────────>  200 OK
    ├─ Success toast                          ├─ Save to DB
    │ "Payment created!"                      ├─ Log action
    │                                         ├─ Create notification
    │                                         └─ Broadcast via WebSocket
    
Error Flow #1 (Validation):
    POST /api/payments  ──────────────────>  400 Bad Request
    │ (missing amount)                        {error: "Amount required"}
    │
    ├─ Error toast
    │ "Amount is required"
    │ (red background)
    
Error Flow #2 (Authorization):
    POST /api/clusters  ──────────────────>  403 Forbidden
    │ (user is tenant)                       {error: "Only owners..."}
    │
    ├─ Error toast
    │ "Only owners can create..."
    │
    └─ Optional: Redirect to dashboard
    
Error Flow #3 (Server Error):
    POST /api/agreements ─────────────────>  500 Internal Server Error
    │                                        {error: "DB connection..."}
    │
    ├─ Error toast
    │ "Something went wrong"
    │
    ├─ Retry button
    │ └─ User can retry action
    │
    └─ Log to monitoring (Sentry, etc)
    
Network Error:
    POST /api/messages (no connection)  ──>  Network Error
    │
    ├─ Error toast
    │ "Connection lost, retrying..."
    │
    └─ Auto-retry with exponential backoff
       └─ Eventually succeed when online
```

## Database Query Flow

```
API Request                    Backend Code              Database Query       Cache
                               ─────────────────────────────────────────────────────
GET /api/clusters?status=active

    ├─ Extract params
    │
    ├─ Verify JWT token
    │
    ├─ Check RBAC (rbacMiddleware)
    │
    ├─ Build query
    │  │
    │  ├─ Base query:
    │  │  SELECT * FROM farm_clusters
    │  │
    │  ├─ Filter conditions:
    │  │  WHERE status = 'active'
    │  │
    │  └─ RLS automatically adds:
    │     WHERE (owner_id = auth.uid() OR auth.role() = 'admin')
    │
    ├─ Execute query  ────────────────────>  SELECT * FROM clusters
    │                                        WHERE status = 'active'
    │                                        AND (owner_id = $1 OR role = 'admin')
    │                                        ORDER BY created_at DESC
    │                                        ├─ Hit index on (owner_id, status)
    │                                        ├─ Fetch 50 rows (default limit)
    │                                        │
    │                                        └─────> Database returns rows
    │
    ├─ Format response
    │
    ├─ Log action (audit log)
    │  │
    │  ├─ INSERT INTO audit_logs
    │  │  (user_id, action, entity, entity_id, ...)
    │  │
    │  └─> Logged for compliance
    │
    └─ Return 200 OK
       [{cluster}, {cluster}, ...]
       └─> Frontend receives and updates state
```

## Component Communication

```
App.tsx
 ├─ AuthProvider
 │  ├─ useAuth()
 │  │  ├─ user
 │  │  ├─ isAuthenticated
 │  │  └─ login(), logout(), register()
 │  │
 │  └─ AuthContext state synced with:
 │     ├─ localStorage (tokens)
 │     ├─ API service (auth headers)
 │     └─ Components (useAuth hook)
 │
 ├─ RoleProvider
 │  ├─ useRole()
 │  │  ├─ role
 │  │  ├─ isOwner, isTenant, isAdmin
 │  │  └─ canAccess(roles)
 │  │
 │  └─ Derives from AuthContext user.role
 │
 ├─ NotificationProvider
 │  ├─ useNotifications()
 │  │  ├─ notifications[]
 │  │  ├─ unreadCount
 │  │  ├─ fetchNotifications()
 │  │  └─ markAsRead(), deleteNotification()
 │  │
 │  └─ WebSocket listener for new notifications
 │
 └─ Components
    ├─ ClusterList
    │  └─ useClusters()
    │     ├─ clusters[]
    │     ├─ createCluster()
    │     └─ useRole() for access control
    │
    ├─ PaymentList
    │  └─ usePayments()
    │     ├─ payments[]
    │     ├─ processPayment()
    │     └─ toast notifications
    │
    └─ ChatWindow
       └─ useMessages()
          ├─ messages[]
          ├─ sendMessage()
          └─ Real-time socket updates
```

## Deployment Architecture

```
Development:
    npm run dev:all
    ├─ Frontend: http://localhost:5173 (Vite)
    ├─ Backend: http://localhost:3001 (Express)
    └─ Database: Connected to Supabase

Production:
    ┌─────────────────┐
    │  Browser        │
    │  (Static Files) │
    └────────┬────────┘
             │
    ┌────────▼─────────────────┐
    │  Vercel (Frontend)        │
    │  - Serves React app       │
    │  - Static optimization    │
    │  - Handles routing        │
    │  - CDN: global delivery   │
    └────────┬─────────────────┘
             │
    ┌────────▼─────────────────┐    ┌──────────────────┐
    │  Heroku/Railway/Fly       │    │  Supabase        │
    │  (Backend)                │───→│  PostgreSQL      │
    │  - Express server         │    │  Hosted DB       │
    │  - Socket.IO              │    │  Auth included   │
    │  - API routes             │    │  RLS enabled     │
    │  - Business logic         │    └──────────────────┘
    └──────────────────────────┘
    
Environment Variables:
    ├─ Frontend:
    │  └─ VITE_API_URL (backend URL)
    │     VITE_SUPABASE_URL
    │
    └─ Backend:
       └─ SUPABASE_SERVICE_ROLE_KEY
          POSTGRES_URL
          JWT_SECRET
```

## Summary

This architecture provides:

1. **Frontend** - React + TypeScript with modern patterns
2. **Backend** - Express.js REST API with comprehensive routes
3. **Database** - PostgreSQL with RLS for security
4. **Real-time** - Socket.IO for live updates
5. **Auth** - JWT + Supabase with RBAC
6. **Notifications** - Toast UI + push notifications
7. **Logging** - Complete audit trail
8. **Error Handling** - Graceful degradation
9. **Security** - Multi-level protection
10. **Scalability** - Optimized queries and indexes

All components work together seamlessly to provide a professional, secure, and scalable platform.
