# Multi-Cluster Support System

## Overview

Multi-cluster support enables users to belong to and manage multiple farm clusters with granular role-based permissions per cluster.

## Features

### Multiple Cluster Membership
- Users can join multiple clusters
- Different roles in each cluster
- Active/archived cluster states
- Cluster switching in UI

### Role-Based Access (Per Cluster)
- **Owner**: Full control (manage members, edit cluster, approve proposals)
- **Manager**: Can manage specific features (proposals, payments)
- **Member**: Limited access (view, participate)
- **Viewer**: Read-only access

### Fine-Grained Permissions
- Manage members
- Edit cluster settings
- Create proposals
- Approve proposals
- Manage payments
- View analytics
- Manage contracts
- Manage geospatial data
- Manage audit logs

### Member Invitation
- Invite by email
- Invitation tokens
- Acceptance workflow
- Bulk invitations (future)

### Cluster Statistics
- Member count
- Active agreements
- Payment status
- Custom metrics

## Database Schema

### user_cluster_memberships
Tracks user membership in clusters.

```sql
CREATE TABLE user_cluster_memberships (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  cluster_id UUID REFERENCES farm_clusters,
  role VARCHAR (owner, manager, member, viewer),
  permissions JSONB,
  is_active BOOLEAN,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  invitation_token VARCHAR,
  invitation_accepted_at TIMESTAMP,
  invited_by UUID
);
```

### cluster_permissions
Fine-grained permissions per user per cluster.

```sql
CREATE TABLE cluster_permissions (
  id UUID PRIMARY KEY,
  cluster_id UUID REFERENCES farm_clusters,
  user_id UUID REFERENCES auth.users,
  can_manage_members BOOLEAN,
  can_edit_cluster BOOLEAN,
  can_create_proposals BOOLEAN,
  can_approve_proposals BOOLEAN,
  can_manage_payments BOOLEAN,
  can_view_analytics BOOLEAN,
  can_manage_contracts BOOLEAN,
  can_view_geospatial BOOLEAN,
  can_edit_geospatial BOOLEAN,
  can_manage_audit_logs BOOLEAN,
  custom_permissions JSONB
);
```

### farm_clusters Updates
Added fields to support multi-cluster:

```sql
ALTER TABLE farm_clusters ADD COLUMN owner_id UUID;
ALTER TABLE farm_clusters ADD COLUMN is_archived BOOLEAN;
ALTER TABLE farm_clusters ADD COLUMN members_count INT;
ALTER TABLE farm_clusters ADD COLUMN active_agreements_count INT;
```

## API Endpoints

### User Clusters

#### Get My Clusters
```
GET /api/multi-cluster/my-clusters
Response: [
  {
    cluster_id,
    cluster_name,
    role,
    is_owner,
    member_count,
    joined_at
  }
]
```

#### Leave Cluster
```
POST /api/multi-cluster/:clusterId/leave
Response: { message }
```

### Member Management

#### Get Cluster Members
```
GET /api/multi-cluster/:clusterId/members
Response: [
  {
    user_id,
    email,
    full_name,
    role,
    joined_at,
    is_active
  }
]
```

#### Invite User (Owner Only)
```
POST /api/multi-cluster/:clusterId/invite
Body: { email, role }
Response: { membership, message }
```

#### Accept Invitation
```
POST /api/multi-cluster/:clusterId/accept-invitation/:token
Response: { membership, message }
```

#### Update User Role (Owner Only)
```
PUT /api/multi-cluster/:clusterId/members/:userId/role
Body: { role }
Response: { updated membership }
```

#### Remove Member (Owner Only)
```
DELETE /api/multi-cluster/:clusterId/members/:userId
Response: { message }
```

### Permissions

#### Get My Permissions
```
GET /api/multi-cluster/:clusterId/permissions
Response: {
  can_manage_members,
  can_edit_cluster,
  can_create_proposals,
  ...
}
```

#### Update Permissions (Owner Only)
```
PUT /api/multi-cluster/:clusterId/permissions/:userId
Body: { can_manage_members, can_edit_cluster, ... }
Response: { permissions }
```

### Statistics

#### Get Cluster Stats
```
GET /api/multi-cluster/:clusterId/stats
Response: {
  total_members,
  active_agreements,
  members_count,
  active_agreements_count
}
```

## Frontend Integration

### Multi-Cluster Service
```typescript
import { multiClusterService } from '@/src/services/multi-cluster';

// Get user's clusters
const clusters = await multiClusterService.getUserClusters();

// Switch cluster (store in context)
setCurrentCluster(clusterId);

// Invite member
await multiClusterService.inviteUser(clusterId, 'user@example.com', 'manager');

// Get members
const members = await multiClusterService.getClusterMembers(clusterId);

// Update role
await multiClusterService.updateUserRole(clusterId, userId, 'owner');
```

## Component: ClusterSwitcher

Dropdown to switch between user's clusters.

```tsx
<ClusterSwitcher 
  currentClusterId={currentClusterId}
  onSwitch={handleClusterSwitch}
/>
```

## Component: MemberManagementPanel

Manage cluster members and permissions.

```tsx
<MemberManagementPanel clusterId={clusterId} />
```

## Component: InvitationForm

Invite new members to cluster.

```tsx
<InvitationForm clusterId={clusterId} onInviteSuccess={handleSuccess} />
```

## Component: PermissionsGrid

Manage granular permissions per user.

```tsx
<PermissionsGrid clusterId={clusterId} userId={userId} />
```

## Workflow

### User Joining a Cluster

1. Cluster owner clicks "Invite Member"
2. Enters member email
3. Selects role (manager, member, viewer)
4. System generates invitation token
5. Invited user receives email notification
6. User clicks invitation link
7. System validates token
8. User added to cluster
9. User can now access cluster

### Switching Clusters

1. User clicks cluster switcher
2. Sees list of all their clusters
3. Selects cluster to switch to
4. App context updates with new cluster
5. All resources (proposals, payments) filtered by cluster
6. UI updates with cluster-specific data

### Managing Permissions

1. Cluster owner goes to Member Settings
2. Selects member to configure
3. Sees current role and permissions
4. Can override with custom permissions
5. Granular toggles for each permission
6. Changes saved and take effect immediately

## Security Features

- **RLS Policies**: Database-level access control
  - Users see only clusters they're members of
  - Owners can manage cluster members
  - Custom permissions enforce authorization

- **Audit Logging**: Track membership changes
  - Who joined/left cluster
  - When role changed
  - Permissions modifications logged

- **Token Security**: Invitation tokens
  - One-time use tokens
  - Expiration after 7 days
  - Revocable by cluster owner

## Integration with Other Features

### Clusters in Proposals
```sql
-- Proposals belong to a cluster
ALTER TABLE proposals ADD COLUMN cluster_id UUID;
WHERE cluster_id = current_cluster_id
```

### Clusters in Agreements
```sql
-- Agreements belong to a cluster
ALTER TABLE lease_agreements ADD COLUMN cluster_id UUID;
```

### Clusters in Payments
```sql
-- Payments belong to cluster (through agreement)
-- Filtered by cluster when viewing
```

### Clusters in Messaging
```sql
-- Messages can be cluster-specific
-- Conversations scoped to cluster
```

### Clusters in Analytics
```sql
-- Analytics dashboard filters by cluster
-- Metrics per cluster, not global
```

## Context Management

### React Context for Current Cluster

```typescript
interface ClusterContext {
  currentCluster: Cluster | null;
  clusters: Cluster[];
  setCurrentCluster: (clusterId: string) => void;
  permissions: ClusterPermissions;
  can: (permission: string) => boolean;
}

// Usage in components
const { currentCluster, can } = useClusterContext();

if (can('create_proposals')) {
  // Show create button
}
```

## Migration Strategy

### For Existing Users

1. Run migration function: `migrate_clusters_to_multi_cluster()`
2. Creates memberships for all cluster owners
3. Assigns full permissions to owners
4. Non-owners assigned as 'member' role

### Backward Compatibility

- Old single-cluster queries still work
- Default cluster context set to first cluster
- Gradual migration to multi-cluster features

## Configuration

Environment variables:
```
VITE_API_URL=http://localhost:3001/api
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Troubleshooting

**User not seeing clusters**
- Verify membership in user_cluster_memberships
- Check is_active flag is TRUE
- Ensure RLS policies are correct

**Invitation not working**
- Verify user email exists
- Check invitation token is valid
- Ensure cluster_id matches

**Permissions not enforcing**
- Verify cluster_permissions record exists
- Check permission flags are set correctly
- Ensure has_cluster_permission() function works

**Can't switch clusters**
- Verify cluster switcher context
- Check multiple memberships exist
- Ensure clusters are active

## Future Enhancements

- Invite multiple users at once
- Scheduled member removal
- Sub-groups within clusters
- Custom cluster roles
- Cluster-level audit logs
- Member activity tracking
- Time-limited memberships
- Delegation of permissions
