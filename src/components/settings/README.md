# Account Management Settings Components

This directory contains components for managing deleted accounts, viewing restoration history, and tracking account lifecycle events.

## Components

### DeletedAccountsPanel

Main panel for viewing and managing soft-deleted client accounts.

**Features:**
- View all deleted accounts with deletion reason, date, and purge countdown
- Restore deleted accounts (with required restoration reason)
- Manually purge accounts immediately (admin only)
- View full account history via timeline modal
- Search and filter deleted accounts

**Props:**
```typescript
interface DeletedAccountsPanelProps {
  currentUserEmail: string;
  hasRestorePermission: boolean;
  hasPurgePermission: boolean;
  onClientRestored?: () => void;
}
```

**Usage:**
```tsx
<DeletedAccountsPanel
  currentUserEmail="admin@example.com"
  hasRestorePermission={true}
  hasPurgePermission={true}
  onClientRestored={() => refreshClientList()}
/>
```

---

### RestorationHistoryViewer

Complete audit trail of all account restorations with full context.

**Features:**
- View all restoration events with timestamps
- See both deletion and restoration reasons
- Filter by date range or search by company/user
- Export to CSV for compliance reporting
- Shows days account was in deleted state

**Props:**
```typescript
interface RestorationHistoryViewerProps {
  currentUserEmail: string;
}
```

**Usage:**
```tsx
<RestorationHistoryViewer currentUserEmail="admin@example.com" />
```

---

### AccountLifecycleTimeline

Visual timeline showing complete account history including creation, deletions, restorations, and purges.

**Features:**
- Chronological event timeline with visual indicators
- Shows user who performed each action
- Displays reasons for deletions and restorations
- Color-coded events for quick identification
- Modal overlay for easy viewing

**Props:**
```typescript
interface AccountLifecycleTimelineProps {
  clientId: string;
  companyName: string;
  onClose: () => void;
}
```

**Usage:**
```tsx
<AccountLifecycleTimeline
  clientId="apex-solutions"
  companyName="Apex Solutions"
  onClose={() => setShowTimeline(false)}
/>
```

---

### RestorationBadge

Reusable badge component that displays restoration status for recently restored accounts.

**Features:**
- Automatically checks if account was recently restored
- Shows "Restored X days ago" badge
- Optional tooltip with full restoration details
- Configurable days threshold (default: 30 days)
- Only displays for recently restored accounts

**Props:**
```typescript
interface RestorationBadgeProps {
  clientId: string;
  showDetails?: boolean;  // Show tooltip with full details
  daysThreshold?: number;  // Days to consider "recent" (default: 30)
}
```

**Usage:**
```tsx
// Simple badge
<RestorationBadge clientId="apex-solutions" />

// With detailed tooltip
<RestorationBadge clientId="apex-solutions" showDetails={true} />

// Custom threshold (only show if restored within 7 days)
<RestorationBadge clientId="apex-solutions" daysThreshold={7} />
```

**Example in a client list:**
```tsx
{clients.map(client => (
  <div key={client.id} className="client-card">
    <h3>{client.name}</h3>
    <RestorationBadge clientId={client.id} showDetails={true} />
  </div>
))}
```

---

## Utility Functions

### checkClientRestoration

Checks if a client was restored and returns detailed restoration information.

```typescript
async function checkClientRestoration(clientId: string): Promise<RestorationInfo>

interface RestorationInfo {
  wasRestored: boolean;
  restoredAt: string | null;
  restoredBy: string | null;
  restorationReason: string | null;
  daysAgo: number | null;
}
```

**Usage:**
```typescript
const restorationInfo = await checkClientRestoration('apex-solutions');

if (restorationInfo.wasRestored) {
  console.log(`Restored ${restorationInfo.daysAgo} days ago by ${restorationInfo.restoredBy}`);
  console.log(`Reason: ${restorationInfo.restorationReason}`);
}
```

### isRecentlyRestored

Helper to determine if a restoration is considered "recent" based on days threshold.

```typescript
function isRecentlyRestored(daysAgo: number | null, threshold: number = 30): boolean
```

**Usage:**
```typescript
const info = await checkClientRestoration('apex-solutions');

if (isRecentlyRestored(info.daysAgo)) {
  // Show special UI for recently restored accounts
}

if (isRecentlyRestored(info.daysAgo, 7)) {
  // Only within last 7 days
}
```

---

## Database Tables Used

These components interact with the following database tables:

- **success_planning_overview** - Main client records with soft delete fields
- **client_restoration_log** - Audit log of all restoration events
- **purge_log** - Permanent deletion records
- **notification_alerts** - In-app notifications for deletions/restorations

---

## Notifications

When accounts are deleted or restored, team members automatically receive notifications:

**Deletion Notifications:**
- Alert type: 'risk'
- Includes deletion reason
- Shows purge date (90 days)

**Restoration Notifications:**
- Alert type: 'opportunity'
- Includes restoration reason
- Confirms data recovery

Update notifications are created via database functions:
- `create_deletion_notifications()` - Called on soft delete
- `create_restoration_notifications()` - Called on restore

---

## Integration Example

Full example of integrating these components into a settings page:

```tsx
import {
  DeletedAccountsPanel,
  RestorationHistoryViewer,
  RestorationBadge
} from './components/settings';

function SettingsPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('deleted');

  return (
    <div>
      <nav>
        <button onClick={() => setActiveTab('deleted')}>Deleted Accounts</button>
        <button onClick={() => setActiveTab('history')}>Restoration History</button>
      </nav>

      {activeTab === 'deleted' && (
        <DeletedAccountsPanel
          currentUserEmail={currentUser.email}
          hasRestorePermission={currentUser.isAdmin}
          hasPurgePermission={currentUser.isAdmin}
          onClientRestored={() => {
            // Refresh your client list
            fetchClients();
          }}
        />
      )}

      {activeTab === 'history' && (
        <RestorationHistoryViewer currentUserEmail={currentUser.email} />
      )}
    </div>
  );
}
```

---

## Security Considerations

- **Restore Permission**: Should be limited to admin users
- **Purge Permission**: Should be limited to admin users (permanent deletion)
- **Restoration Reasons**: Always required for audit trail
- **Notifications**: Automatically created for team transparency
- **Export**: CSV export available for compliance reporting

---

## Future Enhancements

Potential improvements that could be added:

1. **Bulk Operations**: Select multiple accounts to restore/purge at once
2. **Advanced Filtering**: Filter by deletion reason, deleted by user, etc.
3. **Email Notifications**: Send emails in addition to in-app notifications
4. **Scheduled Restores**: Set future date to automatically restore an account
5. **Restoration Templates**: Pre-defined restoration reasons for common scenarios
6. **Analytics Dashboard**: Metrics on deletion/restoration patterns
