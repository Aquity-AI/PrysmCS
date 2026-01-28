# Page Summary Management

This module provides inline CRUD (Create, Read, Update, Delete) functionality for managing page summary items within the Data Management interface.

## Features

### Core Functionality
- **Create** summary items with inline form
- **Edit** existing items directly on the page
- **Delete** items with confirmation
- **Reorder** items using up/down controls
- **Real-time** database synchronization with Supabase

### User Interface
- Clean, intuitive card-based layout
- Visual trend indicators (positive/negative/neutral)
- Character counters with validation
- Success/error notifications
- Loading and error states
- Empty state guidance

### Data Validation
- Required fields: Label, Metric Value, Trend Direction
- Character limits:
  - Label: 100 characters
  - Metric Value: 50 characters
  - Description: 500 characters
- Real-time validation feedback
- Inline error messages

### Item Display
- Numbered order badges
- Trend-colored metrics
- Visibility indicators
- AI-generated badges
- Description previews

## Components

### PageSummaryManager
Main orchestrator component that handles:
- Loading summary data from Supabase
- Managing local state
- Coordinating CRUD operations
- Showing/hiding forms
- Displaying notifications

### PageSummaryItemForm
Form component for creating and editing items with:
- Controlled inputs with validation
- Character counters
- Trend direction selector
- Visibility toggle
- Save/cancel actions

### PageSummaryItemCard
Display card for each summary item featuring:
- Order number badge
- Label and metric value
- Trend indicator with color coding
- Description text
- Reorder controls (up/down)
- Edit and delete buttons

## Database Schema

### page_summaries
- Stores summary section configuration
- Links to specific page and client
- Defines mode (manual/AI) and layout

### page_summary_items
- Individual summary cards
- Ordered list with item_order field
- Trend direction and visibility settings
- AI-generated flag

## Usage

The PageSummaryManager is automatically rendered when a form section has `sectionType: 'page_summary'`.

```jsx
<PageSummaryManager
  section={section}
  clientId="demo-client"
  pageId="overview"
  showEditControls={true}
/>
```

## Validation Rules

1. **Label**: Required, 1-100 characters
2. **Metric Value**: Required, 1-50 characters
3. **Trend Direction**: Required, one of: positive, negative, neutral
4. **Description**: Optional, 0-500 characters
5. **Max Items**: Configurable per section (default: 4)

## Error Handling

- Network errors: Retry button with error message
- Validation errors: Inline field-level feedback
- Database errors: Toast notifications
- Empty states: Helpful guidance messages

## Future Enhancements

- AI-powered summary generation
- Drag-and-drop reordering
- Bulk operations
- Export functionality
- History/audit trail
