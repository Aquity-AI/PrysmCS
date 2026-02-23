import type { ReportTab, ReportSection, ReportGraph, ReportPageSummary, ReportStory, ReportPriority, ReportCsmInfo, ReportClientOverview } from '../report/useReportData';

export type SlideType =
  | 'title'
  | 'tab-title'
  | 'section-kpi'
  | 'section-table'
  | 'section-cardgrid'
  | 'section-generic'
  | 'graph'
  | 'page-summary'
  | 'stories'
  | 'priorities'
  | 'closing'
  | 'custom';

export interface OverlayElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  content?: string;
  src?: string;
  isBuiltIn?: boolean;
}

export interface ContentLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SlideData {
  id: string;
  type: SlideType;
  title: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  background?: string;
  contentLayout: ContentLayout;
  overlayElements: OverlayElement[];
  isCustom?: boolean;

  tabId?: string;
  tabIcon?: string;

  section?: ReportSection;
  graph?: ReportGraph;
  pageSummary?: ReportPageSummary;
  stories?: ReportStory[];
  priorities?: ReportPriority[];
  csmInfo?: ReportCsmInfo | null;

  meta?: string;
  companyName?: string;
  logoUrl?: string;
  platformName?: string;
}

export interface SlideOverride {
  enabled?: boolean;
  background?: string;
  overlayElements?: OverlayElement[];
  contentLayout?: ContentLayout;
  order?: number;
}

export interface PresentationGlobalSettings {
  animation: string;
  compactMode: boolean;
  customTitle?: string;
  customSubtitle?: string;
}

export interface PresentationConfig {
  id: string;
  client_id: string;
  config_name: string;
  slide_overrides: Record<string, SlideOverride>;
  global_settings: PresentationGlobalSettings;
  custom_slides: SlideData[];
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PresentationBranding {
  primaryColor: string;
  accentColor: string;
  secondaryColor?: string;
  slideBg: string;
  fontFamily: string;
  platformName: string;
  platformTagline?: string;
  logoUrl?: string;
  logoMode?: string;
}

export { ReportTab, ReportSection, ReportGraph, ReportPageSummary, ReportStory, ReportPriority, ReportCsmInfo, ReportClientOverview };
