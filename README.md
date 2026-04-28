# Farm Lease Platform - Complete Backend Implementation

A production-ready agricultural lease management platform with AI-powered features, complete backend API, real-time messaging, and professional UI.

## What's New

This version includes a **complete enterprise-grade implementation** with:
- PostgreSQL database with 20+ optimized tables
- Express.js REST API with 24 route modules (11 core + 13 advanced)
- Role-based access control (Owner/Tenant/Admin) + fine-grained permissions
- Real-time messaging, notifications, and live updates
- Complete payment processing with verification & audit trail
- Advanced contract templates with clause library and versioning
- Multi-cluster support for scaling to multiple organizations
- Geospatial land boundary mapping and management
- Comprehensive audit logging on all changes
- Professional UI with Sonner toast notifications

## Quick Start

**Prerequisites:** Node.js 16+, Supabase Account

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migration
npm run migrate

# Start the app (both frontend and backend)
npm run dev:all
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

## Documentation

### Getting Started
- **[THREE_FEATURES_MASTER_GUIDE.md](THREE_FEATURES_MASTER_GUIDE.md)** - Complete overview of all features
- **[DELIVERY_SUMMARY.md](DELIVERY_SUMMARY.md)** - What was delivered and status
- **[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)** - Testing and deployment checklist

### Core Features
- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup and feature guide
- **[BACKEND_SETUP.md](BACKEND_SETUP.md)** - Complete API documentation
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Architecture and features
- **[DELIVERABLES.md](DELIVERABLES.md)** - Complete list of core features

### Advanced Features (New!)
- **[PAYMENT_VERIFICATION_GUIDE.md](PAYMENT_VERIFICATION_GUIDE.md)** - Payment receipts & verification
- **[CONTRACT_TEMPLATES_GUIDE.md](CONTRACT_TEMPLATES_GUIDE.md)** - Dynamic templates & clauses
- **[MULTI_CLUSTER_GUIDE.md](MULTI_CLUSTER_GUIDE.md)** - Multi-tenant architecture
- **[GEOSPATIAL_FEATURES.md](GEOSPATIAL_FEATURES.md)** - Land mapping & boundaries
- **[ADVANCED_FEATURES_SUMMARY.md](ADVANCED_FEATURES_SUMMARY.md)** - Technical overview
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and data flow

## Running the App

**Option 1: Backend Only**
```bash
npm run dev:server
```

**Option 2: Frontend Only**
```bash
npm run dev
```

**Option 3: Both Together (Recommended)**
```bash
npm run dev:all
```

## Features Implemented

- ✅ User authentication with JWT
- ✅ Role-based access control (3 roles)
- ✅ Farm cluster management
- ✅ Lease proposal workflow
- ✅ Formal lease agreements
- ✅ Payment processing and tracking
- ✅ Real-time messaging system
- ✅ Push notifications
- ✅ Meeting scheduling
- ✅ Analytics dashboard
- ✅ Audit logging
- ✅ Admin panel
- ✅ Toast notifications (Sonner)

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT + Supabase Auth
- **Real-time**: Socket.IO
- **Notifications**: Sonner

## Project Structure

```
farm-lease/
├── server/                  # Express backend
│   ├── index.js
│   ├── middleware/
│   └── routes/             # 11 API modules
├── src/
│   ├── services/           # API & WebSocket
│   ├── contexts/           # Auth, Notifications
│   ├── hooks/              # Data fetching
│   └── components/         # UI components
├── scripts/                # Database migration
├── QUICK_START.md          # 5-minute setup
├── BACKEND_SETUP.md        # Complete API docs
└── IMPLEMENTATION_SUMMARY.md
```

## Key Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout

### Main Resources
- /api/clusters - Farm clusters
- /api/proposals - Lease proposals
- /api/agreements - Lease agreements
- /api/payments - Payment tracking
- /api/messages - Messaging
- /api/notifications - Notifications
- /api/meetings - Meeting scheduling
- /api/analytics - Analytics

See [BACKEND_SETUP.md](BACKEND_SETUP.md) for complete API reference.

## Test Accounts

After running migrations, test with these roles:

**Owner** (manages farms):
- Create farm clusters
- Create lease proposals
- Track payments

**Tenant** (leases farms):
- Browse clusters
- Apply to proposals
- Pay rent

**Admin** (manages platform):
- User management
- Audit logs
- System statistics

See [QUICK_START.md](QUICK_START.md) for detailed feature walkthroughs.

## Environment Setup

Create `.env` file with your Supabase credentials:

```bash
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
POSTGRES_URL=your_postgres_url
SUPABASE_JWT_SECRET=your_secret
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

See `.env.example` for all required variables.

## Support

- **Setup Issues**: See [QUICK_START.md](QUICK_START.md#troubleshooting)
- **API Questions**: See [BACKEND_SETUP.md](BACKEND_SETUP.md)
- **Architecture**: See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **What Was Built**: See [DELIVERABLES.md](DELIVERABLES.md)

## Next Steps

1. Read [QUICK_START.md](QUICK_START.md) for setup
2. Run the app with `npm run dev:all`
3. Test features with sample accounts
4. Explore API with [BACKEND_SETUP.md](BACKEND_SETUP.md)
5. Customize for your needs

## Original AI Studio App

View your app in AI Studio: https://ai.studio/apps/cbc7e709-a7a5-4003-ba20-e47a10ef4410

**Note**: This version now includes a complete production-ready backend. The AI Studio features (Gemini chatbot) are still available and integrated with the platform.
