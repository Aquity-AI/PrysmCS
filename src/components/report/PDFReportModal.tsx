import React, { useState, useMemo, useCallback } from 'react';
import { X, Printer, Loader, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useReportData } from './useReportData';
import { ReportHeader } from './blocks/ReportHeader';
import { ReportClientBanner } from './blocks/ReportClientBanner';
import { ReportKpiGrid } from './blocks/ReportKpiGrid';
import { ReportTableSection } from './blocks/ReportTableSection';
import { ReportCardGrid } from './blocks/ReportCardGrid';
import { ReportGenericSection } from './blocks/ReportGenericSection';
import { ReportPageSummaryBlock } from './blocks/ReportPageSummaryBlock';
import { ReportGraphCard } from './blocks/ReportGraphCard';
import { ReportStoriesSection } from './blocks/ReportStoriesSection';
import { ReportOpportunitiesSection } from './blocks/ReportOpportunitiesSection';
import { ReportPrioritiesSection } from './blocks/ReportPrioritiesSection';
import { ReportCsmFooter } from './blocks/ReportCsmFooter';
import { ReportPageFooter } from './blocks/ReportPageFooter';
import type { ReportSection, ReportTab } from './useReportData';
import './reportStyles.css';

const KNOWN_SECTION_TYPES: Record<string, string> = {
  coreMetrics: 'kpi',
  enrollmentFunnel: 'table',
  smsCampaign: 'table',
  emailCampaign: 'table',
  mailerCampaign: 'table',
  patientOutcomes: 'cardgrid',
};

const FUNNEL_SECTIONS = new Set(['enrollmentFunnel']);

interface PDFReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  selectedMonth?: string;
  dashboardData: any;
  clientInfo: any;
  stories: any[];
  opportunities: any[];
  monthLabel: string;
  customization: any;
  getFormSchema: (clientId?: string) => any;
  FIELD_TYPES: any;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthYear(monthKey: string) {
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

export function PDFReportModal({
  isOpen,
  onClose,
  clientId,
  selectedMonth,
  dashboardData,
  clientInfo,
  stories: legacyStories,
  opportunities,
  monthLabel,
  customization,
  getFormSchema,
  FIELD_TYPES,
}: PDFReportModalProps) {
  const reportData = useReportData(clientId, customization, dashboardData, getFormSchema, FIELD_TYPES);

  const [reportTitle, setReportTitle] = useState('Monthly Impact Report');
  const [hiddenTabs, setHiddenTabs] = useState<Set<string>>(new Set());
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const [hiddenGraphs, setHiddenGraphs] = useState<Set<string>>(new Set());
  const [hideStories, setHideStories] = useState(false);
  const [hideOpportunities, setHideOpportunities] = useState(false);
  const [hidePriorities, setHidePriorities] = useState(false);
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());

  const branding = customization?.branding || {};
  const brandColor = branding.primaryColor || '#06b6d4';
  const platformName = branding.platformName || 'PrysmCS';
  const platformTagline = branding.platformTagline || '';
  const fontFamily = branding.fontFamily || 'Inter';
  const logoUrl = branding.logoUrl || null;
  const logoMode = branding.logoMode || 'default';

  const month = monthLabel || formatMonthYear(selectedMonth || getCurrentMonthKey());
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const rawFormData = dashboardData?.rawFormData || dashboardData || {};

  const deltas: Record<string, string | null> = useMemo(() => ({
    enrolledThisMonth: dashboardData?.overview?.deltaEnrollment || null,
    activePatients: dashboardData?.overview?.deltaActive || null,
    servicesDelivered: dashboardData?.overview?.deltaServices || null,
    revenue: dashboardData?.overview?.deltaRevenue || null,
  }), [dashboardData]);

  const formatValue = useCallback((field: any, value: any) => {
    if (!field) return value || '';
    switch (field.fieldType) {
      case FIELD_TYPES?.DATE:
        return value ? new Date(value).toLocaleDateString() : '';
      case FIELD_TYPES?.CURRENCY:
        return typeof value === 'string' && value.startsWith('$') ? value : `$${Number(value || 0).toLocaleString()}`;
      case FIELD_TYPES?.PERCENT:
        return `${value || 0}%`;
      case FIELD_TYPES?.TOGGLE:
        return value ? 'Yes' : 'No';
      case FIELD_TYPES?.TEXT:
      case FIELD_TYPES?.TEXTAREA:
      case FIELD_TYPES?.SELECT:
        return value || '';
      default:
        if (field.prefix === '$') {
          return typeof value === 'string' && value.startsWith('$') ? value : `$${Number(value || 0).toLocaleString()}`;
        }
        if (field.suffix === '%') return `${value || 0}%`;
        return typeof value === 'number' ? value.toLocaleString() : Number(value || 0).toLocaleString();
    }
  }, [FIELD_TYPES]);

  const storiesData = reportData.stories.length > 0 ? reportData.stories : (legacyStories || []);

  const toggleTab = (tabId: string) => {
    setHiddenTabs(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  };

  const toggleSection = (sectionId: string) => {
    setHiddenSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const toggleGraph = (graphId: string) => {
    setHiddenGraphs(prev => {
      const next = new Set(prev);
      if (next.has(graphId)) next.delete(graphId);
      else next.add(graphId);
      return next;
    });
  };

  const toggleExpandTab = (tabId: string) => {
    setExpandedTabs(prev => {
      const next = new Set(prev);
      if (next.has(tabId)) next.delete(tabId);
      else next.add(tabId);
      return next;
    });
  };

  const handlePrint = () => {
    document.body.classList.add('printing-pdf-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-pdf-report');
    }, 1000);
  };

  const renderSectionBlock = (section: ReportSection, tab: ReportTab) => {
    const sectionType = KNOWN_SECTION_TYPES[section.id] || 'generic';

    switch (sectionType) {
      case 'kpi':
        return (
          <ReportKpiGrid
            key={section.id}
            section={section}
            deltas={deltas}
            formatValue={formatValue}
            brandColor={brandColor}
          />
        );
      case 'table':
        return (
          <ReportTableSection
            key={section.id}
            section={section}
            formatValue={formatValue}
            showConversionRate={FUNNEL_SECTIONS.has(section.id)}
            brandColor={brandColor}
          />
        );
      case 'cardgrid':
        return (
          <ReportCardGrid
            key={section.id}
            section={section}
            formatValue={formatValue}
            brandColor={brandColor}
          />
        );
      default:
        return (
          <ReportGenericSection
            key={section.id}
            section={section}
            formatValue={formatValue}
            brandColor={brandColor}
          />
        );
    }
  };

  const visibleTabs = reportData.tabs.filter(t => !hiddenTabs.has(t.id));

  const hasTabContent = (tab: ReportTab) =>
    tab.sections.length > 0 || tab.graphs.length > 0 || tab.pageSummaries.length > 0;

  if (!isOpen) return null;

  return (
    <div className="rpt-modal-overlay rpt-printable">
      <div className="rpt-modal-toolbar no-print">
        <div className="rpt-modal-title">
          <h2>Report Preview</h2>
          <p>Review and customize the report content, then print or save as PDF</p>
        </div>
        <div className="rpt-modal-actions">
          <button className="rpt-print-btn" onClick={handlePrint} style={{ background: brandColor }}>
            <Printer size={16} />
            Print / Save as PDF
          </button>
          <button className="rpt-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="rpt-modal-body">
        {/* Sidebar with toggles */}
        <aside className="rpt-sidebar no-print">
          <div className="rpt-sidebar-section">
            <label className="rpt-sidebar-label">Report Title</label>
            <input
              type="text"
              className="rpt-sidebar-input"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
          </div>

          <div className="rpt-sidebar-section">
            <label className="rpt-sidebar-label">Sections</label>
            <div className="rpt-sidebar-tree">
              {reportData.tabs.map(tab => {
                const isExpanded = expandedTabs.has(tab.id);
                const tabVisible = !hiddenTabs.has(tab.id);
                const hasContent = hasTabContent(tab);

                if (!hasContent) return null;

                return (
                  <div key={tab.id} className="rpt-sidebar-tab-group">
                    <div className="rpt-sidebar-tab-row">
                      <button
                        className="rpt-sidebar-expand"
                        onClick={() => toggleExpandTab(tab.id)}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <button
                        className={`rpt-sidebar-toggle ${tabVisible ? 'active' : ''}`}
                        onClick={() => toggleTab(tab.id)}
                        title={tabVisible ? 'Hide tab' : 'Show tab'}
                      >
                        {tabVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <span className={`rpt-sidebar-tab-label ${!tabVisible ? 'dimmed' : ''}`}>
                        {tab.label}
                      </span>
                    </div>

                    {isExpanded && tabVisible && (
                      <div className="rpt-sidebar-children">
                        {tab.sections.map(s => (
                          <div key={s.id} className="rpt-sidebar-child-row">
                            <button
                              className={`rpt-sidebar-toggle ${!hiddenSections.has(s.id) ? 'active' : ''}`}
                              onClick={() => toggleSection(s.id)}
                            >
                              {!hiddenSections.has(s.id) ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>
                            <span className={hiddenSections.has(s.id) ? 'dimmed' : ''}>
                              {s.title}
                            </span>
                          </div>
                        ))}
                        {tab.graphs.map(g => (
                          <div key={g.graph.id} className="rpt-sidebar-child-row">
                            <button
                              className={`rpt-sidebar-toggle ${!hiddenGraphs.has(g.graph.id) ? 'active' : ''}`}
                              onClick={() => toggleGraph(g.graph.id)}
                            >
                              {!hiddenGraphs.has(g.graph.id) ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>
                            <span className={hiddenGraphs.has(g.graph.id) ? 'dimmed' : ''}>
                              {g.graph.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Global sections */}
              <div className="rpt-sidebar-divider" />

              {storiesData.length > 0 && (
                <div className="rpt-sidebar-child-row">
                  <button
                    className={`rpt-sidebar-toggle ${!hideStories ? 'active' : ''}`}
                    onClick={() => setHideStories(!hideStories)}
                  >
                    {!hideStories ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <span className={hideStories ? 'dimmed' : ''}>Success Stories</span>
                </div>
              )}

              {reportData.priorities.length > 0 && (
                <div className="rpt-sidebar-child-row">
                  <button
                    className={`rpt-sidebar-toggle ${!hidePriorities ? 'active' : ''}`}
                    onClick={() => setHidePriorities(!hidePriorities)}
                  >
                    {!hidePriorities ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <span className={hidePriorities ? 'dimmed' : ''}>Strategic Priorities</span>
                </div>
              )}

              {opportunities.length > 0 && (
                <div className="rpt-sidebar-child-row">
                  <button
                    className={`rpt-sidebar-toggle ${!hideOpportunities ? 'active' : ''}`}
                    onClick={() => setHideOpportunities(!hideOpportunities)}
                  >
                    {!hideOpportunities ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <span className={hideOpportunities ? 'dimmed' : ''}>Opportunities</span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Report content */}
        <div className="rpt-report-container">
          {reportData.loading ? (
            <div className="rpt-loading">
              <Loader size={32} className="animate-spin" style={{ color: brandColor }} />
              <p>Loading report data...</p>
            </div>
          ) : (
            <div className="rpt-report" id="rpt-report-content">
              <ReportHeader
                platformName={platformName}
                platformTagline={platformTagline}
                logoUrl={logoUrl}
                logoMode={logoMode}
                brandColor={brandColor}
                fontFamily={fontFamily}
                reportTitle={reportTitle}
                monthLabel={month}
                generatedDate={generatedDate}
              />

              <ReportClientBanner
                companyName={reportData.clientOverview?.company_name || clientInfo?.clientName || ''}
                address={reportData.clientOverview?.address || clientInfo?.address || ''}
              />

              {/* Dynamic tab-by-tab content */}
              {visibleTabs.map(tab => {
                if (!hasTabContent(tab)) return null;

                const visibleSections = tab.sections.filter(s => !hiddenSections.has(s.id));
                const visibleGraphs = tab.graphs.filter(g => !hiddenGraphs.has(g.graph.id));
                const hasVisibleContent = visibleSections.length > 0 || visibleGraphs.length > 0 || tab.pageSummaries.length > 0;

                if (!hasVisibleContent) return null;

                const isStoriesTab = tab.id === 'stories';
                const isOppsTab = tab.id === 'opportunities';
                const isInitiativesTab = tab.id === 'initiatives';

                if (isStoriesTab || isOppsTab || isInitiativesTab) return null;

                return (
                  <div key={tab.id} className="rpt-tab-group">
                    {/* Tab sections */}
                    {visibleSections.map(section => renderSectionBlock(section, tab))}

                    {/* Page summaries */}
                    {tab.pageSummaries.map(ps => (
                      <ReportPageSummaryBlock
                        key={ps.id}
                        summary={ps}
                        brandColor={brandColor}
                      />
                    ))}

                    {/* Dashboard graphs for this tab */}
                    {visibleGraphs.length > 0 && (
                      <div className="rpt-graphs-grid">
                        {visibleGraphs.map(rg => (
                          <ReportGraphCard
                            key={rg.graph.id}
                            reportGraph={rg}
                            brandColor={brandColor}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Stories section */}
              {!hideStories && storiesData.length > 0 && (
                <ReportStoriesSection
                  stories={storiesData}
                  brandColor={brandColor}
                />
              )}

              {/* Strategic priorities section */}
              {!hidePriorities && reportData.priorities.length > 0 && (
                <ReportPrioritiesSection
                  priorities={reportData.priorities}
                  brandColor={brandColor}
                />
              )}

              {/* Opportunities section */}
              {!hideOpportunities && opportunities.length > 0 && (
                <ReportOpportunitiesSection
                  opportunities={opportunities}
                  brandColor={brandColor}
                />
              )}

              {/* CSM Footer */}
              <ReportCsmFooter
                csmInfo={reportData.csmInfo}
                fallbackCsm={clientInfo?.csmAssigned}
                platformName={platformName}
              />

              {/* Page Footer */}
              <ReportPageFooter
                platformName={platformName}
                platformTagline={platformTagline}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
