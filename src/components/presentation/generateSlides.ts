import type {
  SlideData,
  ContentLayout,
  OverlayElement,
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

function makeTitleElement(content: string, x: number, y: number, width: number, fontSize: number, fontWeight: string, color: string): OverlayElement {
  return {
    id: '__title__',
    type: 'text',
    content,
    x,
    y,
    width,
    height: Math.ceil(fontSize * 1.4),
    fontSize,
    fontWeight,
    color,
    isBuiltIn: true,
  };
}

function makeSubtitleElement(content: string, x: number, y: number, width: number, fontSize: number): OverlayElement {
  return {
    id: '__subtitle__',
    type: 'text',
    content,
    x,
    y,
    width,
    height: Math.ceil(fontSize * 1.4),
    fontSize,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    isBuiltIn: true,
  };
}

function makeMetaElement(content: string, x: number, y: number, width: number): OverlayElement {
  return {
    id: '__meta__',
    type: 'text',
    content,
    x,
    y,
    width,
    height: 20,
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    isBuiltIn: true,
  };
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

  const titleOverlays: OverlayElement[] = [];
  if (branding.logoUrl) {
    titleOverlays.push({
      id: '__logo__',
      type: 'image',
      src: branding.logoUrl,
      x: 48,
      y: 32,
      width: 160,
      height: 56,
      isBuiltIn: true,
    });
  }
  const titleText = `${branding.platformName} Impact Report`;
  titleOverlays.push(makeTitleElement(titleText, 80, 160, 640, 52, '700', '#ffffff'));
  if (clientOverview?.company_name) {
    titleOverlays.push(makeSubtitleElement(clientOverview.company_name, 80, 230, 500, 24));
  }
  if (monthLabel) {
    titleOverlays.push(makeMetaElement(monthLabel, 80, 270, 300));
  }

  slides.push({
    id: 'title',
    type: 'title',
    title: titleText,
    subtitle: clientOverview?.company_name || '',
    meta: monthLabel,
    enabled: true,
    order: order++,
    contentLayout: { ...DEFAULT_LAYOUT },
    overlayElements: titleOverlays,
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
      const tabTitleOverlays: OverlayElement[] = [
        makeTitleElement(tab.label, 80, 180, 640, 52, '700', '#ffffff'),
      ];
      slides.push({
        id: `tab-title-${tab.id}`,
        type: 'tab-title',
        title: tab.label,
        tabId: tab.id,
        tabIcon: tab.icon,
        enabled: true,
        order: order++,
        contentLayout: { ...DEFAULT_LAYOUT },
        overlayElements: tabTitleOverlays,
      });
    }

    for (const ps of tab.pageSummaries) {
      const psTitle = ps.title || `${tab.label} Summary`;
      slides.push({
        id: `summary-${ps.id}`,
        type: 'page-summary',
        title: psTitle,
        pageSummary: ps,
        tabId: tab.id,
        enabled: true,
        order: order++,
        contentLayout: { ...DEFAULT_LAYOUT },
        overlayElements: [makeTitleElement(psTitle, 56, 48, 500, 28, '700', '#ffffff')],
      });
    }

    if (compactMode) {
      const smallSections = tab.sections.filter(s => s.fields.length <= 4);
      const largeSections = tab.sections.filter(s => s.fields.length > 4);

      const pairs = chunkArray(smallSections, 2);
      for (const pair of pairs) {
        if (pair.length === 2) {
          const combinedTitle = `${pair[0].title} & ${pair[1].title}`;
          slides.push({
            id: `section-${pair[0].id}-${pair[1].id}`,
            type: getSectionSlideType(pair[0].id),
            title: combinedTitle,
            section: { ...pair[0], fields: [...pair[0].fields, ...pair[1].fields] },
            tabId: tab.id,
            enabled: true,
            order: order++,
            contentLayout: { ...DEFAULT_LAYOUT },
            overlayElements: [makeTitleElement(combinedTitle, 56, 48, 600, 32, '700', '#ffffff')],
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
            overlayElements: [makeTitleElement(pair[0].title, 56, 48, 600, 32, '700', '#ffffff')],
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
          overlayElements: [makeTitleElement(section.title, 56, 48, 600, 32, '700', '#ffffff')],
        });
      }

      const halfGraphs = tab.graphs.filter(g => g.graph.size === 'quarter' || g.graph.size === 'half');
      const largeGraphs = tab.graphs.filter(g => g.graph.size !== 'quarter' && g.graph.size !== 'half');

      const graphPairs = chunkArray(halfGraphs, 2);
      for (const pair of graphPairs) {
        if (pair.length === 2) {
          const combinedTitle = `${pair[0].graph.title} & ${pair[1].graph.title}`;
          slides.push({
            id: `graph-${pair[0].graph.id}-${pair[1].graph.id}`,
            type: 'graph',
            title: combinedTitle,
            graph: pair[0],
            tabId: tab.id,
            enabled: true,
            order: order++,
            contentLayout: { ...DEFAULT_LAYOUT },
            overlayElements: [makeTitleElement(combinedTitle, 56, 48, 600, 28, '700', '#ffffff')],
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
            overlayElements: [makeTitleElement(pair[0].graph.title, 56, 48, 600, 28, '700', '#ffffff')],
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
          overlayElements: [makeTitleElement(rg.graph.title, 56, 48, 600, 28, '700', '#ffffff')],
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
          overlayElements: [makeTitleElement(section.title, 56, 48, 600, 32, '700', '#ffffff')],
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
          overlayElements: [makeTitleElement(rg.graph.title, 56, 48, 600, 28, '700', '#ffffff')],
        });
      }
    }
  }

  if (stories.length > 0) {
    const storiesTab = tabs.find(t => t.id === 'stories');
    if (storiesTab) {
      const storyChunks = chunkArray(stories, MAX_STORIES_PER_SLIDE);
      storyChunks.forEach((chunk, i) => {
        const storyTitle = i === 0 ? 'Success Stories' : 'Success Stories (continued)';
        slides.push({
          id: `stories-${i}`,
          type: 'stories',
          title: storyTitle,
          stories: chunk,
          tabId: 'stories',
          enabled: true,
          order: order++,
          contentLayout: { ...DEFAULT_LAYOUT },
          overlayElements: [makeTitleElement(storyTitle, 56, 48, 600, 32, '700', '#ffffff')],
        });
      });
    }
  }

  if (priorities.length > 0) {
    const initiativesTab = tabs.find(t => t.id === 'initiatives');
    if (initiativesTab) {
      const priorityChunks = chunkArray(priorities, MAX_PRIORITIES_PER_SLIDE);
      priorityChunks.forEach((chunk, i) => {
        const priorityTitle = i === 0 ? 'Strategic Priorities' : 'Strategic Priorities (continued)';
        slides.push({
          id: `priorities-${i}`,
          type: 'priorities',
          title: priorityTitle,
          priorities: chunk,
          tabId: 'initiatives',
          enabled: true,
          order: order++,
          contentLayout: { ...DEFAULT_LAYOUT },
          overlayElements: [makeTitleElement(priorityTitle, 56, 48, 600, 32, '700', '#ffffff')],
        });
      });
    }
  }

  const closingOverlays: OverlayElement[] = [];
  if (branding.logoUrl) {
    closingOverlays.push({
      id: '__logo__',
      type: 'image',
      src: branding.logoUrl,
      x: 48,
      y: 32,
      width: 160,
      height: 56,
      isBuiltIn: true,
    });
  }
  closingOverlays.push(makeTitleElement('Thank You', 80, 150, 640, 56, '700', '#ffffff'));
  closingOverlays.push(makeSubtitleElement('Questions & Discussion', 80, 230, 500, 22));

  slides.push({
    id: 'closing',
    type: 'closing',
    title: 'Thank You',
    subtitle: 'Questions & Discussion',
    csmInfo,
    enabled: true,
    order: order++,
    contentLayout: { ...DEFAULT_LAYOUT },
    overlayElements: closingOverlays,
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

    let overlayElements = override.overlayElements ?? slide.overlayElements;

    if (override.overlayElements) {
      overlayElements = override.overlayElements.map(el => {
        if (el.id === '__logo__' && slide.logoUrl) {
          return { ...el, src: slide.logoUrl };
        }
        if (el.isBuiltIn) {
          const generated = slide.overlayElements.find(g => g.id === el.id);
          if (generated) {
            const userEditedContent = el.content !== generated.content;
            return {
              ...el,
              content: userEditedContent ? el.content : generated.content,
            };
          }
        }
        return el;
      });

      const existingIds = new Set(overlayElements.map(el => el.id));
      for (const genEl of slide.overlayElements) {
        if (!existingIds.has(genEl.id)) {
          overlayElements = [...overlayElements, genEl];
        }
      }
    }

    return {
      ...slide,
      enabled: override.enabled ?? slide.enabled,
      background: override.background ?? slide.background,
      overlayElements,
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
