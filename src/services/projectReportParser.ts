/**
 * PrysmCS - Client-Side Project Report Parser
 * Uses SheetJS (xlsx) to parse Excel files in the browser
 * 
 * Install: npm install xlsx
 * 
 * Usage in React component:
 *   import { parseProjectReport, storeProjectReport } from './projectReportParser';
 *   
 *   const handleFileUpload = async (file: File) => {
 *     const parsed = await parseProjectReport(file);
 *     const reportId = await storeProjectReport(supabase, clientId, parsed);
 *   };
 */

import * as XLSX from 'xlsx';
import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

interface HealthIndicator {
  status: 'green' | 'yellow' | 'red' | 'unknown';
  rawValue: number | null;
  comment: string;
}

interface BudgetLine {
  capital: number;
  expense: number;
  total: number;
}

interface Milestone {
  name: string;
  baselineDate: string | null;
  forecastDate: string | null;
  status: number | null;
}

interface CostSummaryItem {
  wbs: string;
  description: string;
  carExecutionBudget: number;
  controlBudget: number;
  committedToDate: number;
  expendedToDate: number;
  estimateToComplete: number;
  forecast: number;
  variance: number;
  previousForecast: number;
  periodVariance: number;
}

interface CostDetailItem {
  wbs: string;
  wbsDescription: string;
  activity: string;
  vendorName: string;
  poNumber: string;
  approvedCarBudget: number;
  carExecutionBudget: number;
  controlBudget: number;
  committedToDate: number;
  expendedToDate: number;
  pctExpended: number;
  estimateToComplete: number;
  forecast: number;
  forecastVariance: number;
  previousForecast: number;
  periodVariance: number;
  notes: string;
}

interface CJ74Item {
  fiscalYear: string;
  period: string;
  documentDate: string | null;
  postingDate: string | null;
  wbsElement: string;
  purchasingDocument: string;
  poText: string;
  vendorName: string;
  reference: string;
  value: number;
  currency: string;
}

interface CJ76Item {
  wbsElement: string;
  refDocument: string;
  planValue: number;
  transactionValue: number;
  vendor: string;
  description: string;
  costElement: string;
  costElementDesc: string;
  committedValue: number;
  currency: string;
}

export interface ParsedProjectReport {
  sourceFile: string;
  parsedAt: string;
  sheetsFound: string[];
  dashboard: {
    projectName: string;
    carNumber: string;
    reportingPeriod: string | null;
    issueDate: string | null;
    healthIndicators: Record<string, HealthIndicator>;
    budgetStatus: Record<string, BudgetLine>;
    safety: any;
    milestones: Milestone[];
    contingency: Record<string, BudgetLine>;
    progress: Array<{ phase: string; plannedPct: number; earnedPct: number; variance: number }>;
  };
  costSummary: {
    header: Record<string, string>;
    lineItems: CostSummaryItem[];
    subtotals: Record<string, any>;
  };
  costDetails: CostDetailItem[];
  cashFlow: {
    carNumber: string;
    months: string[];
    items: Array<{
      wbs: string;
      activity: string;
      vendor: string;
      forecastTotal: number;
      monthlyValues: Record<string, number>;
    }>;
  };
  cj74Actuals: CJ74Item[];
  cj76Commitments: CJ76Item[];
  varianceAnalysis: Array<{
    wbsElement: string;
    description: string;
    periodForecastVariance: number;
    explanation: string;
  }>;
}

// ============================================================
// HELPERS
// ============================================================

function safeNum(val: any, def = 0): number {
  if (val == null || val === '' || val === undefined) return def;
  const n = Number(val);
  return isNaN(n) ? def : n;
}

function safeStr(val: any, def = ''): string {
  if (val == null || val === undefined) return def;
  return String(val).trim();
}

function safeDate(val: any): string | null {
  if (val == null) return null;
  // SheetJS returns dates as JS Date objects or serial numbers
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  } catch { }
  return null;
}

// Get cell value from a sheet by row/col (0-indexed)
function cell(sheet: XLSX.WorkSheet, row: number, col: number): any {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const c = sheet[addr];
  return c ? c.v : null;
}

// ============================================================
// PARSERS (mirror the Python logic exactly)
// ============================================================

function parseDashboard(sheet: XLSX.WorkSheet) {
  const statusMap: Record<number, string> = { 0: 'green', 50: 'yellow', 100: 'red' };

  const healthIndicators: Record<string, HealthIndicator> = {};
  for (const [rowIdx, name] of [[4, 'safety'], [5, 'cost'], [6, 'schedule'], [7, 'risk']] as [number, string][]) {
    const val = safeNum(cell(sheet, rowIdx, 1), -1);
    healthIndicators[name] = {
      status: (statusMap[val] || 'unknown') as any,
      rawValue: val >= 0 ? val : null,
      comment: safeStr(cell(sheet, rowIdx, 2)),
    };
  }

  const budgetStatus: Record<string, BudgetLine> = {};
  for (const [rowIdx, key] of [
    [4, 'approvedCarAmount'], [5, 'controlBudget'], [6, 'committedToDate'],
    [7, 'expendedToDate'], [8, 'estimateToComplete'],
    [9, 'forecast'], [10, 'forecastVariance'], [11, 'periodVariance']
  ] as [number, string][]) {
    budgetStatus[key] = {
      capital: safeNum(cell(sheet, rowIdx, 9)),
      expense: safeNum(cell(sheet, rowIdx, 10)),
      total: safeNum(cell(sheet, rowIdx, 11)),
    };
  }

  const milestoneNames = [
    'Concept Funding Approved', 'Basis of Design Complete', 'Implementation Funding Approved',
    '90% Design Review', 'Issued for Construction Drawings Complete', 'Construction Start',
    'Final Equipment Procurement Complete', 'Final Equipment FAT', 'Mechanical Completion',
    'CQV Complete / Beneficial Use', 'Project Closeout'
  ];
  const milestones: Milestone[] = milestoneNames.map((defaultName, idx) => {
    const rowIdx = 14 + idx;
    return {
      name: safeStr(cell(sheet, rowIdx, 0)) || defaultName,
      baselineDate: safeDate(cell(sheet, rowIdx, 3)),
      forecastDate: safeDate(cell(sheet, rowIdx, 4)),
      status: safeNum(cell(sheet, rowIdx, 5), -1) >= 0 ? safeNum(cell(sheet, rowIdx, 5)) : null,
    };
  });

  const contingency: Record<string, BudgetLine> = {};
  for (const [rowIdx, key] of [
    [14, 'startingBudget'], [15, 'drawdownToDate'],
    [16, 'drawdownThisPeriod'], [17, 'remaining']
  ] as [number, string][]) {
    contingency[key] = {
      capital: safeNum(cell(sheet, rowIdx, 9)),
      expense: safeNum(cell(sheet, rowIdx, 10)),
      total: safeNum(cell(sheet, rowIdx, 11)),
    };
  }

  const progressPhases = ['Detailed Design', 'BMS Equipment Purchases', 'Construction', 'CQV', 'Total Project'];
  const progress = progressPhases.map((defaultName, idx) => ({
    phase: safeStr(cell(sheet, 27 + idx, 0)) || defaultName,
    plannedPct: safeNum(cell(sheet, 27 + idx, 3)),
    earnedPct: safeNum(cell(sheet, 27 + idx, 4)),
    variance: safeNum(cell(sheet, 27 + idx, 5)),
  }));

  return {
    projectName: safeStr(cell(sheet, 1, 1)),
    carNumber: safeStr(cell(sheet, 2, 1)),
    reportingPeriod: safeDate(cell(sheet, 1, 11)),
    issueDate: safeDate(cell(sheet, 2, 11)),
    healthIndicators,
    budgetStatus,
    safety: {
      thisMonth: {
        hoursWorked: safeNum(cell(sheet, 10, 1)),
        lostWorkDays: safeNum(cell(sheet, 10, 2)),
        recordables: safeNum(cell(sheet, 10, 3)),
        nearMiss: safeNum(cell(sheet, 10, 4)),
      },
      totalProject: {
        hoursWorked: safeNum(cell(sheet, 11, 1)),
        lostWorkDays: safeNum(cell(sheet, 11, 2)),
        recordables: safeNum(cell(sheet, 11, 3)),
        nearMiss: safeNum(cell(sheet, 11, 4)),
      },
    },
    milestones,
    contingency,
    progress,
  };
}

function parseCostSummary(sheet: XLSX.WorkSheet) {
  const header = {
    projectTitle: safeStr(cell(sheet, 1, 4)),
    reportDate: safeDate(cell(sheet, 2, 4)) || '',
    issueDate: safeDate(cell(sheet, 2, 7)) || '',
    carNumber: safeStr(cell(sheet, 3, 4)),
    projectManager: safeStr(cell(sheet, 3, 7)),
    site: safeStr(cell(sheet, 2, 10)),
  };

  const wbsRows = [7, 9, 11, 13, 15, 17, 19, 21, 25, 27, 29, 31];
  const lineItems: CostSummaryItem[] = [];

  for (const rowIdx of wbsRows) {
    const wbs = safeStr(cell(sheet, rowIdx, 1));
    const desc = safeStr(cell(sheet, rowIdx, 3));
    if (!wbs && !desc) continue;
    lineItems.push({
      wbs, description: desc,
      carExecutionBudget: safeNum(cell(sheet, rowIdx, 5)),
      controlBudget: safeNum(cell(sheet, rowIdx, 6)),
      committedToDate: safeNum(cell(sheet, rowIdx, 7)),
      expendedToDate: safeNum(cell(sheet, rowIdx, 8)),
      estimateToComplete: safeNum(cell(sheet, rowIdx, 9)),
      forecast: safeNum(cell(sheet, rowIdx, 10)),
      variance: safeNum(cell(sheet, rowIdx, 11)),
      previousForecast: safeNum(cell(sheet, rowIdx, 16)),
      periodVariance: safeNum(cell(sheet, rowIdx, 17)),
    });
  }

  return { header, lineItems, subtotals: {} };
}

function parseCostDetails(sheet: XLSX.WorkSheet): CostDetailItem[] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const items: CostDetailItem[] = [];
  let currentWbs = '', currentWbsDesc = '';

  for (let i = 5; i <= range.e.r; i++) {
    const wbs = safeStr(cell(sheet, i, 1));
    const activity = safeStr(cell(sheet, i, 2));
    const vendor = safeStr(cell(sheet, i, 4));

    if (wbs && (wbs.startsWith('CD') || wbs.startsWith('ED'))) {
      currentWbs = wbs;
      currentWbsDesc = activity;
    }

    if (!vendor && !activity) continue;
    if (['Subtotal Capital', 'Subtotal Expense', 'Project Totals'].includes(activity)) continue;

    const committed = safeNum(cell(sheet, i, 12));
    const expended = safeNum(cell(sheet, i, 13));
    const forecast = safeNum(cell(sheet, i, 20));
    if (committed === 0 && expended === 0 && forecast === 0) continue;

    items.push({
      wbs: currentWbs, wbsDescription: currentWbsDesc,
      activity, vendorName: vendor, poNumber: safeStr(cell(sheet, i, 5)),
      approvedCarBudget: safeNum(cell(sheet, i, 6)),
      carExecutionBudget: safeNum(cell(sheet, i, 7)),
      controlBudget: safeNum(cell(sheet, i, 9)),
      committedToDate: committed, expendedToDate: expended,
      pctExpended: safeNum(cell(sheet, i, 14)),
      estimateToComplete: safeNum(cell(sheet, i, 19)),
      forecast, forecastVariance: safeNum(cell(sheet, i, 21)),
      previousForecast: safeNum(cell(sheet, i, 22)),
      periodVariance: safeNum(cell(sheet, i, 23)),
      notes: safeStr(cell(sheet, i, 24)),
    });
  }
  return items;
}

function parseCJ74(sheet: XLSX.WorkSheet): CJ74Item[] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const items: CJ74Item[] = [];
  for (let i = 1; i <= range.e.r; i++) {
    const fy = safeStr(cell(sheet, i, 0));
    if (!fy) continue;
    items.push({
      fiscalYear: fy, period: safeStr(cell(sheet, i, 1)),
      documentDate: safeDate(cell(sheet, i, 2)),
      postingDate: safeDate(cell(sheet, i, 3)),
      wbsElement: safeStr(cell(sheet, i, 5)),
      purchasingDocument: safeStr(cell(sheet, i, 6)),
      poText: safeStr(cell(sheet, i, 7)),
      vendorName: safeStr(cell(sheet, i, 8)),
      reference: safeStr(cell(sheet, i, 9)),
      value: safeNum(cell(sheet, i, 11)),
      currency: safeStr(cell(sheet, i, 12)) || 'USD',
    });
  }
  return items;
}

function parseCJ76(sheet: XLSX.WorkSheet): CJ76Item[] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const items: CJ76Item[] = [];
  for (let i = 1; i <= range.e.r; i++) {
    const proj = safeStr(cell(sheet, i, 0));
    if (!proj) continue;
    items.push({
      wbsElement: safeStr(cell(sheet, i, 1)),
      refDocument: safeStr(cell(sheet, i, 2)),
      planValue: safeNum(cell(sheet, i, 3)),
      transactionValue: safeNum(cell(sheet, i, 4)),
      vendor: safeStr(cell(sheet, i, 5)),
      description: safeStr(cell(sheet, i, 7)),
      costElement: safeStr(cell(sheet, i, 9)),
      costElementDesc: safeStr(cell(sheet, i, 10)),
      committedValue: safeNum(cell(sheet, i, 14)),
      currency: safeStr(cell(sheet, i, 6)) || 'USD',
    });
  }
  return items;
}

// ============================================================
// MAIN PARSE FUNCTION (browser)
// ============================================================

export async function parseProjectReport(file: File): Promise<ParsedProjectReport> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const result: any = {
    sourceFile: file.name,
    parsedAt: new Date().toISOString(),
    sheetsFound: workbook.SheetNames,
  };

  if (workbook.SheetNames.includes('Dashboard')) {
    result.dashboard = parseDashboard(workbook.Sheets['Dashboard']);
  }
  if (workbook.SheetNames.includes('Cost Report Summary')) {
    result.costSummary = parseCostSummary(workbook.Sheets['Cost Report Summary']);
  }
  if (workbook.SheetNames.includes('Cost Report Details')) {
    result.costDetails = parseCostDetails(workbook.Sheets['Cost Report Details']);
  }
  if (workbook.SheetNames.includes('CJ 74')) {
    result.cj74Actuals = parseCJ74(workbook.Sheets['CJ 74']);
  }
  if (workbook.SheetNames.includes('CJ 76')) {
    result.cj76Commitments = parseCJ76(workbook.Sheets['CJ 76']);
  }

  return result as ParsedProjectReport;
}

// ============================================================
// STORE TO SUPABASE (browser)
// ============================================================

export async function storeProjectReport(
  supabase: SupabaseClient,
  clientId: string,
  parsed: ParsedProjectReport
): Promise<string> {
  const d = parsed.dashboard;
  const carNumber = d.carNumber;

  // 1. Upsert main report
  const { data: reportData, error: reportError } = await supabase
    .from('project_reports')
    .upsert({
      client_id: clientId,
      car_number: carNumber,
      project_name: d.projectName,
      reporting_period: d.reportingPeriod,
      issue_date: d.issueDate,
      source_filename: parsed.sourceFile,
      site: parsed.costSummary?.header?.site || '',
      project_manager: parsed.costSummary?.header?.projectManager || '',
      health_safety: d.healthIndicators.safety?.status || 'unknown',
      health_cost: d.healthIndicators.cost?.status || 'unknown',
      health_schedule: d.healthIndicators.schedule?.status || 'unknown',
      health_risk: d.healthIndicators.risk?.status || 'unknown',
      approved_car_total: d.budgetStatus.approvedCarAmount?.total || 0,
      control_budget_total: d.budgetStatus.controlBudget?.total || 0,
      committed_total: d.budgetStatus.committedToDate?.total || 0,
      expended_total: d.budgetStatus.expendedToDate?.total || 0,
      etc_total: d.budgetStatus.estimateToComplete?.total || 0,
      forecast_total: d.budgetStatus.forecast?.total || 0,
      forecast_variance_total: d.budgetStatus.forecastVariance?.total || 0,
      budget_status: d.budgetStatus,
      safety_data: d.safety,
      contingency_data: d.contingency,
      progress_data: d.progress,
      raw_dashboard_json: d,
    }, { onConflict: 'client_id,car_number,reporting_period' })
    .select('id')
    .single();

  if (reportError) throw reportError;
  const reportId = reportData.id;

  // 2. Clear old child data
  const childTables = [
    'project_milestones', 'project_cost_summary', 'project_cost_details',
    'project_cash_flow', 'project_sap_actuals', 'project_sap_commitments',
    'project_variance_analysis'
  ];
  for (const table of childTables) {
    await supabase.from(table).delete().eq('report_id', reportId);
  }

  // 3. Insert milestones
  if (d.milestones?.length) {
    await supabase.from('project_milestones').insert(
      d.milestones.map((m, idx) => ({
        report_id: reportId, client_id: clientId, car_number: carNumber,
        milestone_name: m.name,
        baseline_date: m.baselineDate, forecast_date: m.forecastDate,
        status: m.status != null ? { 0: 'green', 50: 'yellow', 100: 'red' }[m.status] : null,
        sort_order: idx,
      }))
    );
  }

  // 4. Insert cost summary
  if (parsed.costSummary?.lineItems?.length) {
    await supabase.from('project_cost_summary').insert(
      parsed.costSummary.lineItems.map(item => ({
        report_id: reportId, client_id: clientId, car_number: carNumber,
        wbs_code: item.wbs, description: item.description,
        cost_type: item.wbs.startsWith('ED') ? 'expense' : 'capital',
        car_execution_budget: item.carExecutionBudget,
        control_budget: item.controlBudget,
        committed_to_date: item.committedToDate,
        expended_to_date: item.expendedToDate,
        estimate_to_complete: item.estimateToComplete,
        forecast: item.forecast, variance: item.variance,
        previous_forecast: item.previousForecast,
        period_variance: item.periodVariance,
      }))
    );
  }

  // 5. Insert cost details
  if (parsed.costDetails?.length) {
    await supabase.from('project_cost_details').insert(
      parsed.costDetails.map(item => ({
        report_id: reportId, client_id: clientId, car_number: carNumber,
        wbs_code: item.wbs, wbs_description: item.wbsDescription,
        activity: item.activity, vendor_name: item.vendorName,
        po_number: item.poNumber,
        committed_to_date: item.committedToDate,
        expended_to_date: item.expendedToDate,
        estimate_to_complete: item.estimateToComplete,
        forecast: item.forecast, forecast_variance: item.forecastVariance,
        period_variance: item.periodVariance, notes: item.notes,
      }))
    );
  }

  // 6. Insert CJ74
  if (parsed.cj74Actuals?.length) {
    await supabase.from('project_sap_actuals').insert(
      parsed.cj74Actuals.map(item => ({
        report_id: reportId, client_id: clientId, car_number: carNumber,
        fiscal_year: item.fiscalYear, period: item.period,
        document_date: item.documentDate, posting_date: item.postingDate,
        wbs_element: item.wbsElement, purchasing_document: item.purchasingDocument,
        po_text: item.poText, vendor_name: item.vendorName,
        reference: item.reference, value: item.value, currency: item.currency,
      }))
    );
  }

  // 7. Insert CJ76
  if (parsed.cj76Commitments?.length) {
    await supabase.from('project_sap_commitments').insert(
      parsed.cj76Commitments.map(item => ({
        report_id: reportId, client_id: clientId, car_number: carNumber,
        wbs_element: item.wbsElement, ref_document: item.refDocument,
        plan_value: item.planValue, transaction_value: item.transactionValue,
        vendor: item.vendor, description: item.description,
        committed_value: item.committedValue, currency: item.currency,
      }))
    );
  }

  return reportId;
}
