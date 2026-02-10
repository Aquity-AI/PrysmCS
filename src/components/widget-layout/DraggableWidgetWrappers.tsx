import React from 'react';
import { DraggableResizableWidget } from './DraggableResizableWidget';
import { WidgetType } from './types';
import { useWidgetLayout } from './WidgetLayoutContext';
import { useEditLayout } from '../dashboard-graphs/EditLayoutContext';

interface DraggableWidgetProps {
  widgetId: string;
  widgetType: WidgetType;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  brandColor?: string;
}

export function DraggableWidget({
  widgetId,
  widgetType,
  children,
  defaultWidth = 6,
  defaultHeight = 200,
  className = '',
  style = {},
  brandColor,
}: DraggableWidgetProps) {
  const { isEditing } = useEditLayout();
  const { getWidgetPosition, updateWidgetSize, reorderWidgets } = useWidgetLayout();

  const position = getWidgetPosition(widgetId);
  const width = position?.width ?? defaultWidth;
  const height = position?.height ?? defaultHeight;

  const handleSizeChange = (id: string, newWidth: number, newHeight: number) => {
    updateWidgetSize(id, newWidth, newHeight);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('widgetId', id);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('widgetId');
    if (draggedId && draggedId !== targetId) {
      reorderWidgets(draggedId, targetId);
    }
  };

  if (!isEditing) {
    return (
      <div
        className={className}
        style={{
          gridColumn: `span ${width} / span ${width}`,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <DraggableResizableWidget
      widgetId={widgetId}
      widgetType={widgetType}
      isEditing={isEditing}
      width={width}
      height={height}
      onSizeChange={handleSizeChange}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      brandColor={brandColor}
      className={className}
      style={style}
    >
      {children}
    </DraggableResizableWidget>
  );
}

interface DraggableKpiSectionProps {
  widgetId: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultWidth?: number;
  brandColor?: string;
}

export function DraggableKpiSection({
  widgetId,
  title,
  subtitle,
  children,
  defaultWidth = 12,
  brandColor,
}: DraggableKpiSectionProps) {
  return (
    <DraggableWidget
      widgetId={widgetId}
      widgetType="kpi-section"
      defaultWidth={defaultWidth}
      defaultHeight={150}
      brandColor={brandColor}
    >
      <div style={{ padding: '16px' }}>
        {title && (
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ fontSize: '14px', color: '#64748b' }}>{subtitle}</p>
            )}
          </div>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '16px',
            width: '100%',
          }}
        >
          {children}
        </div>
      </div>
    </DraggableWidget>
  );
}

interface DraggableKpiCardProps {
  widgetId: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string | number;
  delta?: string | null;
  iconColor?: string;
  brandColor?: string;
  defaultWidth?: number;
  defaultHeight?: number;
}

export function DraggableKpiCard({
  widgetId,
  icon: Icon,
  label,
  value,
  delta,
  iconColor = 'teal',
  brandColor,
  defaultWidth = 3,
  defaultHeight = 120,
}: DraggableKpiCardProps) {
  const isPositive = delta?.startsWith('+');
  const iconStyle = iconColor === 'brand' && brandColor ? { background: brandColor, color: 'white' } : {};

  return (
    <DraggableWidget
      widgetId={widgetId}
      widgetType="kpi-card"
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      brandColor={brandColor}
    >
      <div className="kpi-card" style={{ height: '100%', margin: 0 }}>
        <div className={`kpi-icon ${iconColor === 'brand' ? '' : iconColor}`} style={iconStyle}>
          <Icon size={20} />
        </div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value" style={iconColor === 'brand' && brandColor ? { color: brandColor } : {}}>
          {value}
        </div>
        {delta && (
          <span className={`kpi-delta ${isPositive ? 'positive' : 'negative'}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            {delta} vs last month
          </span>
        )}
      </div>
    </DraggableWidget>
  );
}

interface DraggableChartCardProps {
  widgetId: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  brandColor?: string;
}

export function DraggableChartCard({
  widgetId,
  title,
  subtitle,
  children,
  defaultWidth = 6,
  defaultHeight = 350,
  brandColor,
}: DraggableChartCardProps) {
  return (
    <DraggableWidget
      widgetId={widgetId}
      widgetType="graph-card"
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      brandColor={brandColor}
    >
      <div className="chart-card" style={{ height: '100%', margin: 0 }}>
        <div className="chart-header">
          <div>
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </DraggableWidget>
  );
}

interface DraggableFunnelChartProps {
  widgetId: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  brandColor?: string;
}

export function DraggableFunnelChart({
  widgetId,
  title,
  subtitle,
  children,
  defaultWidth = 6,
  defaultHeight = 400,
  brandColor,
}: DraggableFunnelChartProps) {
  return (
    <DraggableWidget
      widgetId={widgetId}
      widgetType="funnel-chart"
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      brandColor={brandColor}
    >
      <div className="chart-card" style={{ height: '100%', margin: 0 }}>
        <div className="chart-header">
          <div>
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </DraggableWidget>
  );
}

interface DraggableSummaryCardProps {
  widgetId: string;
  title?: string;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  brandColor?: string;
}

export function DraggableSummaryCard({
  widgetId,
  title,
  children,
  defaultWidth = 12,
  defaultHeight = 200,
  brandColor,
}: DraggableSummaryCardProps) {
  return (
    <DraggableWidget
      widgetId={widgetId}
      widgetType="page-summary"
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      brandColor={brandColor}
    >
      <div className="summary-card" style={{ height: '100%', margin: 0 }}>
        {title && <h3 className="summary-title">{title}</h3>}
        {children}
      </div>
    </DraggableWidget>
  );
}

interface DraggableCampaignSectionProps {
  widgetId: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  brandColor?: string;
}

export function DraggableCampaignSection({
  widgetId,
  title,
  subtitle,
  children,
  defaultWidth = 6,
  defaultHeight = 300,
  brandColor,
}: DraggableCampaignSectionProps) {
  return (
    <DraggableWidget
      widgetId={widgetId}
      widgetType="campaign-section"
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      brandColor={brandColor}
    >
      <div className="chart-card" style={{ height: '100%', margin: 0 }}>
        <div className="chart-header">
          <div>
            <h3 className="chart-title">{title}</h3>
            {subtitle && <p className="chart-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    </DraggableWidget>
  );
}

interface DraggableGenericSectionProps {
  widgetId: string;
  widgetType?: WidgetType;
  children: React.ReactNode;
  defaultWidth?: number;
  defaultHeight?: number;
  brandColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function DraggableGenericSection({
  widgetId,
  widgetType = 'section-generic',
  children,
  defaultWidth = 12,
  defaultHeight = 200,
  brandColor,
  className = '',
  style = {},
}: DraggableGenericSectionProps) {
  return (
    <DraggableWidget
      widgetId={widgetId}
      widgetType={widgetType}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      brandColor={brandColor}
      className={className}
      style={style}
    >
      {children}
    </DraggableWidget>
  );
}
