import type { SlideType } from './types';

export interface SlideTypeConfig {
  thumbIcon: string;
  label: string;
}

export const slideTypeRegistry: Record<SlideType, SlideTypeConfig> = {
  'title': { thumbIcon: 'Presentation', label: 'Title' },
  'tab-title': { thumbIcon: 'Layout', label: 'Section Title' },
  'section-kpi': { thumbIcon: 'BarChart3', label: 'KPIs' },
  'section-table': { thumbIcon: 'Table', label: 'Table' },
  'section-cardgrid': { thumbIcon: 'Grid3x3', label: 'Card Grid' },
  'section-generic': { thumbIcon: 'FileText', label: 'Data' },
  'graph': { thumbIcon: 'TrendingUp', label: 'Chart' },
  'page-summary': { thumbIcon: 'ClipboardList', label: 'Summary' },
  'stories': { thumbIcon: 'Quote', label: 'Stories' },
  'priorities': { thumbIcon: 'Lightbulb', label: 'Priorities' },
  'closing': { thumbIcon: 'Heart', label: 'Closing' },
  'custom': { thumbIcon: 'Sparkles', label: 'Custom' },
};
