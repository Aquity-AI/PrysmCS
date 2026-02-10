# Time Series Chart System

This module provides flexible historical data tracking and visualization with line graphs that can be applied to any page in the Customer Success platform.

## Features

### Core Functionality
- **Historical metric tracking** with automatic snapshots or manual data entry
- **Flexible time ranges** (Last 3/6/12 months, Year to Date, All Time, Custom)
- **Multiple granularities** (Daily, Weekly, Monthly, Quarterly)
- **Multi-metric charts** supporting up to 5 metrics per chart with different colors
- **Chart types** supporting Line, Area, and Bar charts
- **CSV bulk import** for loading historical data
- **Goal/target lines** for performance benchmarking
- **Responsive design** with mobile-friendly layouts

### Data Sources
The system supports two data source types:
1. **Automatic snapshots** from form fields (opt-in per field)
2. **Manual data entry** for metrics not captured in forms
3. **CSV import** for bulk historical data loading

## Architecture

### Database Schema

#### metric_definitions
Catalog of all trackable metrics:
- `client_id` - Client identifier
- `metric_name` - Display name
- `metric_key` - Unique identifier
- `data_type` - number, currency, percentage, decimal
- `category` - enrollment, financial, engagement, outcomes, custom
- `source_type` - form_field, manual, calculated
- `form_field_id` - Link to form field (if applicable)
- `unit` - Unit of measurement
- `description` - Metric description
- `is_active` - Active status

#### historical_metric_data
Time-series data points:
- `metric_id` - Reference to metric_definitions
- `client_id` - Client identifier
- `data_date` - Date of the data point
- `value` - Numeric value
- `data_source` - auto_snapshot, manual_entry, csv_import, api_import
- `metadata` - Additional JSON metadata

#### chart_sections
Chart configuration:
- `client_id`, `page_id`, `section_id` - Location identifiers
- `title`, `subtitle` - Display text
- `chart_type` - line, area, bar
- `time_range_preset` - Predefined ranges
- `custom_start_date`, `custom_end_date` - Custom date ranges
- `granularity` - Data aggregation level
- `height` - Chart height in pixels
- `show_legend`, `show_grid`, `show_data_points` - Display options
- `show_goal_line`, `goal_value`, `goal_label` - Goal line configuration
- `enabled` - Active status

#### chart_metrics
Many-to-many relationship between charts and metrics:
- `chart_section_id` - Reference to chart_sections
- `metric_id` - Reference to metric_definitions
- `line_color` - Hex color code
- `line_style` - solid, dashed, dotted
- `axis_position` - left, right
- `display_name_override` - Custom display name
- `show_in_legend` - Legend visibility
- `display_order` - Sort order

#### metric_tracking_config
Opt-in configuration for automatic field tracking:
- `client_id`, `page_id`, `form_field_id` - Field identifiers
- `metric_id` - Reference to metric_definitions
- `auto_capture_enabled` - Auto-capture toggle
- `capture_frequency` - on_save, daily, weekly, monthly
- `last_captured_at` - Last capture timestamp

## Components

### TimeSeriesChartManager
Main orchestrator component that handles:
- Loading chart configuration from database
- Loading associated metrics
- Coordinating data fetching
- Rendering chart sections
- Managing edit controls and configuration

**Props:**
- `section` - Section configuration object
- `clientId` - Client identifier
- `pageId` - Page identifier
- `showEditControls` - Show/hide edit buttons

### TimeSeriesChartCard
Chart rendering component featuring:
- Recharts integration for visualization
- Responsive containers
- Custom tooltips with formatted values
- Legend with toggle functionality
- Loading and error states
- Data refresh capability
- Multiple chart types (Line, Area, Bar)

**Props:**
- `chartSection` - Chart configuration
- `chartMetrics` - Array of metrics to display
- `metricDefinitions` - Metric metadata
- `clientId` - Client identifier
- `showEditControls` - Show/hide edit buttons
- `onConfigure` - Configuration callback

## Utility Functions

### chartUtils.ts

**Date Range Functions:**
- `getDateRangeFromPreset(preset)` - Converts preset to start/end dates
- `formatDateByGranularity(date, granularity)` - Formats date for display
- `formatDateKeyByGranularity(date, granularity)` - Generates date keys
- `generateDateKey(date)` - Creates YYYY-MM-DD key
- `parseDateKey(dateKey)` - Converts key back to Date object

**Data Transformation:**
- `transformToChartData(dataPoints, metricNames, granularity)` - Converts database rows to chart-ready format

**Formatting:**
- `formatMetricValue(value, dataType, unit)` - Formats values with units
- `calculatePercentChange(current, previous)` - Calculates percentage change

**Styling:**
- `DEFAULT_LINE_COLORS` - Array of predefined chart colors
- `getColorForIndex(index)` - Gets color by index

## Usage

### Adding a Chart Section

1. **In Data Management**, add a new section:
   - Select "Time Series Chart (historical data)" as section type
   - Provide title and subtitle
   - Choose page to display on

2. **Configure the chart** (via configuration UI - coming soon):
   - Select metrics to display
   - Choose time range and granularity
   - Customize chart appearance
   - Set goal lines if needed

3. **The chart renders automatically** on the selected page

### Creating Sample Data

Sample data has been provided in `sample_time_series_data.sql`:
- 3 sample metrics (Monthly Enrollments, Active Patients, Monthly Revenue)
- 12 months of historical data for each metric
- 1 pre-configured chart on the Overview page

To test, the sample data is already loaded in the database.

## Current Implementation Status

### ✅ Completed Features
- Database schema with RLS policies
- Core chart rendering components
- TimeSeriesChartManager and TimeSeriesChartCard
- Data fetching and transformation utilities
- Chart type support (Line, Area, Bar)
- Time range presets and granularity options
- Multi-metric support with color coding
- Responsive design
- Loading and error states
- Integration with main application
- Sample data generation

### 🚧 Future Enhancements
- **Chart configuration UI** - Visual interface for configuring charts
- **Metric tracking configuration** - UI for opt-in field tracking
- **Manual data entry interface** - Spreadsheet-like data entry
- **CSV bulk import** - File upload for historical data
- **Automatic snapshot system** - Trigger-based data capture
- **Goal line editor** - Visual goal line configuration
- **Chart templates** - Pre-configured chart patterns
- **Export functionality** - Download charts as PNG or CSV
- **Comparison mode** - Compare multiple time periods
- **Trend lines** - Linear regression overlays
- **Annotations** - Mark significant events on timeline

## Integration with Existing System

The time-series chart system integrates seamlessly with your existing architecture:

1. **Section Type**: New `time_series_chart` section type alongside `standard` and `page_summary`

2. **Rendering Logic**: Charts render via `FormSectionRenderer` checking `section.sectionType === 'time_series_chart'`

3. **Database**: Uses existing Supabase client and follows established RLS patterns

4. **Styling**: Matches existing design system with CSS variables

5. **Component Pattern**: Follows same structure as PageSummaryManager

## Example Queries

### Get all metrics for a client
```javascript
const { data } = await supabase
  .from('metric_definitions')
  .select('*')
  .eq('client_id', clientId)
  .eq('is_active', true);
```

### Get historical data for a date range
```javascript
const { data } = await supabase
  .from('historical_metric_data')
  .select('metric_id, data_date, value')
  .eq('client_id', clientId)
  .in('metric_id', metricIds)
  .gte('data_date', startDate)
  .lte('data_date', endDate)
  .order('data_date', { ascending: true });
```

### Create a new metric
```javascript
const { data } = await supabase
  .from('metric_definitions')
  .insert({
    client_id: clientId,
    metric_name: 'Patient Engagement Rate',
    metric_key: 'engagement_rate',
    data_type: 'percentage',
    category: 'engagement',
    source_type: 'manual',
    unit: '%',
    description: 'Percentage of active patient engagement'
  })
  .select()
  .single();
```

## Security

All tables have Row Level Security (RLS) enabled with policies for:
- Anonymous users can read enabled/visible data
- Authenticated users have full CRUD access
- Data is scoped by client_id where applicable

## Performance Considerations

- Indexes on `(client_id, metric_id, data_date)` for fast time-range queries
- Data aggregation happens at query time for flexibility
- Client-side caching with 5-minute TTL to reduce database load
- Lazy loading for charts below the fold
- Responsive chart sizing to prevent excessive renders

## Testing

To view the sample chart:
1. Navigate to any page in the application
2. Go to Data Management (Settings > Data Management)
3. Add a new section with type "Time Series Chart (historical data)"
4. The chart will display on the selected page with sample enrollment data

The sample chart is pre-configured on the Overview page showing monthly enrollment trends over the last 12 months.
