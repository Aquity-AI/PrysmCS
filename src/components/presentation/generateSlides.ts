import type {
  SlideData,
  ContentLayout,
  ReportTab,
  ReportStory,
  ReportPriority,
  ReportCsmInfo,
  ReportClientOverview,
  PresentationBranding,
  SlideOverride,
} from './types';

const KNOWN_KPI_SECTIONS = new Set(['coreMetrics']);
const KNOWN_TABLE_SECTIONS = new Set(['enrollmentFunnel', 'smsCampaign', 'emailCampaign', 'mailerCampaign']);
const KNOWN_CARDGRID_SECTIONS = new Set(['patientOutcomes']);
const SPECIAL_TABS = new Set(['stories', 'opportunities', 'initiatives']);

const DEFAULT_LAYOUT: ContentLayout = { x: 0, y: 0, width: 100, height: 100 };
const MAX_STORIES_PER_SLIDE = 3;
const MAX_PRIORITIES_PER_SLIDE = 4;

function getSectionSlideType(sectionId: string): 'section-kpi' | 'section-table' | 'section-cardgrid' | 'section-generic' {
  if (KNOWN_KPI_SECTIONS.has(sectionId)) return 'section-kpi';
  if (KNOWN_TABLE_SECTIONS.has(sectionId)) return 'section-table';
  if (KNOWN_CARDGRID_SECTIONS.has(sectionId)) return 'section-cardgrid';
  return 'section-generic';
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

interface GenerateOptions {
  tabs: ReportTab[];
  stories: ReportStory[];
  priorities: ReportPriority[];
  csmInfo: ReportCsmInfo | null;
  clientOverview: ReportClientOverview | null;
  branding: PresentationBranding;
  monthLabel: string;
  compactMode: boolean;
}

export function generateSlidesFromDashboard(options: GenerateOptions): SlideData[] {
  const { tabs, stories, priorities, csmInfo, clientOverview, branding, monthLabel, compactMode } = options;

  const slides: SlideData[] = [];
  let order = 0;

  slides.push({
    id: 'title',
    type: 'title',
    title: `${branding.platformName} Impact Report`,
    subtitle: clientOverview?.company_name || '',
    meta: monthLabel,
    enabled: true,
    order: order++,
    contentLayout: { ...DEFAULT_LAYOUT },
    overlayElements: [],
    platformName: branding.platformName,
    logoUrl: branding.logoUrl,
    companyName: clientOverview?.company_name || '',
  });

  const contentTabs = tabs.filter(t => !SPECIAL_TABS.has(t.id));
  const hasTabContent = (tab: ReportTab) =>
    tab.sections.length > 0 || tab.graphs.length > 0 || tab.pageSummaries.length > 0;

  for (const tab of contentTabs) {
    if (!hasTabContent(tab)) continue;

    if (!compactMode) {
      slides.push({
        id: `tab-title-${tab.id}`,
        type: 'tab-title',
        title: tab.label,
        tabId: tab.id,
        tabIcon: tab.icon,
        enabled: true,
        order: order++,
        contentLayout: { ...DEFAULT_LAYOUT },
        overlayElements: [],
      });
    }

    for (const ps of tab.pageSummaries) {
      slides.push({
        id: `summary-${ps.id}`,
        type: 'page-summary',
        title: ps.title || `${tab.label} Summary`,
        pageSummary: ps,
        tabId: tab.id,
        enabled: true,
        order: order++,
        contentLayout: { ...DEFAULT_LAYOUT },
        overlayElements: [],
      });
    }

    if (compactMode) {
      const smallSections = tab.sections.filter(s => s.fields.length <= 4);
      const largeSections = tab.sections.filter(s => s.fields.length > 4);

      const pairs = chunkArray(smallSections, 2);
      for (const pair of pairs) {
        if (pair.length === 2) {
          slides.push({
            id: `section-${pair[0].id}-${pair[1].id}`,
            type: getSectionSlideType(pair[0].id),
            title: `${pair[0].title} & ${pair[1].title}`,
            section: { ...pair[0], fields: [...pair[0].fields, ...pair[1].fields] },
            tabId: tab.id,
            enabled: true,
            order: order++,
            contentLayout: { ...DEFAULT_LAYOUT },
            overlayElements: [],
          });
        } else {
          slides.push({
            id: `section-${pair[0].id}`,
            type: getSectionSlideType(pair[0].id),
            title: pair[0].title,
            section: pair[0],
            tabId: tab.id,
            enabled: true,
            order: order++,
            contentLayout: { ...DEFAULT_LAYOUT },
            overlayElements: [],
          });
        }
      }

      for (const section of largeSections) {
        slides.push({
          id: `section-${section.id}`,
          type: getSectionSlideType(section.id),
          title: section.title,
          section,
          tabId: tab.id,
          enabled: true,
          order: order++,
          contentLayout: { ...DEFAULT_LAYOUT },
          overlayElements: [],
        });
      }

      const halfGraphs = tab.graphs.filter(g => g.graph.size === 'quarter' || g.graph.size === 'half');
      const largeGraphs = tab.graphs.filter(g => g.graph.size !== 'quarter' && g.graph.size !== 'half');

      const graphPairs = chunkArray(halfGraphs, 2);
      for (const pair of graphPairs) {
        if (pair.length === 2) {
          slides.push({
            id: `graph-${pair[0].graph.id}-${pair[1].graph.id}`,
            type: 'graph',
            title: `${pair[0].graph.title} & ${pair[1].graph.title}`,
            graph: pair[0],
            tabId: tab.id,
            enabled: true,
            order: order++,
            contentLayout: { ...DEFAULT_LAYOUT },
            overlayElements: [],
          });
        } else {
          slides.push({
            id: `graph-${pair[0].graph.id}`,
            type: 'graph',
            title: pair[0].graph.title,
            graph: pair[0],
            tabId: tab.id,
            enabled: true,
            order: order++,
            contentLayout: { ...DEFAULT_LAYOUT },
            overlayElements: [],
          });
        }
      }
      for (const rg of largeGraphs) {
        slides.push({
          id: `graph-${rg.graph.id}`,
          type: 'graph',
          title: rg.graph.title,
          graph: rg,
          tabId: tab.id,
          enabled: true,
          order: order++,
          contentLayout: { ...DEFAULT_LAYOUT },
          overlayElements: [],
        });
      }
    } else {
      for (const section of tab.sections) {
        slides.push({
          id: `section-${section.id}`,
          type: getSectionSlideType(section.id),
          title: section.title,
          section,
          tabId: tab.id,
          enabled: true,
          order: order++,
          contentLayout: { ...DEFAULT_LAYOUT },
          overlayElements: [],
        });
      }

      for (const rg of tab.graphs) {
        slides.push({
          id: `graph-${rg.graph.id}`,
          type: 'graph',
          title: rg.graph.title,
          graph: rg,
          tabId: tab.id,
          enabled: true,
          order: order++,
          contentLayout: { ...DEFAULT_LAYOUT },
          overlayElements: [],
        });
      }
    }
  }

  if (stories.length > 0) {
    const storiesTab = tabs.find(t => t.id === 'stories');
    if (storiesTab) {
      const storyChunks = chunkArray(stories, MAX_STORIES_PER_SLIDE);
      storyChunks.forEach((chunk, i) => {
        slides.push({
          id: `stories-${i}`,
          type: 'stories',
          title: i === 0 ? 'Success Stories' : `Success Stories (continued)`,
          stories: chunk,
          tabId: 'stories',
          enabled: true,
          order: order++,
          contentLayout: { ...DEFAULT_LAYOUT },
          overlayElements: [],
        });
      });
    }
  }

  if (priorities.length > 0) {
    const initiativesTab = tabs.find(t => t.id === 'initiatives');
    if (initiativesTab) {
      const priorityChunks = chunkArray(priorities, MAX_PRIORITIES_PER_SLIDE);
      priorityChunks.forEach((chunk, i) => {
        slides.push({
          id: `priorities-${i}`,
          type: 'priorities',
          title: i === 0 ? 'Strategic Priorities' : `Strategic Priorities (continued)`,
          priorities: chunk,
          tabId: 'initiatives',
          enabled: true,
          order: order++,
          contentLayout: { ...DEFAULT_LAYOUT },
          overlayElements: [],
        });
      });
    }
  }

  slides.push({
    id: 'closing',
    type: 'closing',
    title: 'Thank You',
    subtitle: 'Questions & Discussion',
    csmInfo,
    enabled: true,
    order: order++,
    contentLayout: { ...DEFAULT_LAYOUT },
    overlayElements: [],
    platformName: branding.platformName,
    logoUrl: branding.logoUrl,
  });

  return slides;
}

export function mergeSlidesWithOverrides(
  generatedSlides: SlideData[],
  overrides: Record<string, SlideOverride>,
  customSlides: SlideData[],
): SlideData[] {
  const merged = generatedSlides.map(slide => {
    const override = overrides[slide.id];
    if (!override) return slide;

    return {
      ...slide,
      enabled: override.enabled ?? slide.enabled,
      background: override.background ?? slide.background,
      overlayElements: override.overlayElements ?? slide.overlayElements,
      contentLayout: override.contentLayout ?? slide.contentLayout,
      order: override.order ?? slide.order,
    };
  });

  const validCustom = (customSlides || []).map(cs => ({
    ...cs,
    isCustom: true,
    type: 'custom' as const,
  }));

  return [...merged, ...validCustom].sort((a, b) => a.order - b.order);
}

export function extractOverridesFromSlides(
  currentSlides: SlideData[],
  generatedSlides: SlideData[],
): { overrides: Record<string, SlideOverride>; customSlides: SlideData[] } {
  const overrides: Record<string, SlideOverride> = {};
  const customSlides: SlideData[] = [];

  for (const slide of currentSlides) {
    if (slide.isCustom) {
      customSlides.push(slide);
      continue;
    }

    const generated = generatedSlides.find(g => g.id === slide.id);
    if (!generated) continue;

    const diff: SlideOverride = {};
    let hasDiff = false;

    if (slide.enabled !== generated.enabled) { diff.enabled = slide.enabled; hasDiff = true; }
    if (slide.background !== generated.background) { diff.background = slide.background; hasDiff = true; }
    if (slide.order !== generated.order) { diff.order = slide.order; hasDiff = true; }
    if (slide.overlayElements.length > 0) { diff.overlayElements = slide.overlayElements; hasDiff = true; }
    if (JSON.stringify(slide.contentLayout) !== JSON.stringify(generated.contentLayout)) {
      diff.contentLayout = slide.contentLayout;
      hasDiff = true;
    }

    if (hasDiff) {
      overrides[slide.id] = diff;
    }
  }

  return { overrides, customSlides };
}
