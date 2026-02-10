export interface MonthOption {
  id: string;
  label: string;
  isCurrent: boolean;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function generateAvailableMonths(monthsToGenerate: number = 12): MonthOption[] {
  const currentMonthKey = getCurrentMonthKey();
  const months: MonthOption[] = [];
  const now = new Date();

  for (let i = 0; i < monthsToGenerate; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;

    months.push({
      id: monthKey,
      label: getMonthLabel(monthKey),
      isCurrent: monthKey === currentMonthKey
    });
  }

  return months;
}

export function isCurrentMonth(monthKey: string): boolean {
  return monthKey === getCurrentMonthKey();
}

export function isPastMonth(monthKey: string): boolean {
  const current = getCurrentMonthKey();
  return monthKey < current;
}

export function isFutureMonth(monthKey: string): boolean {
  const current = getCurrentMonthKey();
  return monthKey > current;
}

export function formatDateForDisplay(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getMonthsDifference(startMonthKey: string, endMonthKey: string): number {
  const [startYear, startMonth] = startMonthKey.split('-').map(Number);
  const [endYear, endMonth] = endMonthKey.split('-').map(Number);

  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

export function getTodayFormatted(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function getAvailableMonthsForClient(clientData: any): MonthOption[] {
  const currentMonthKey = getCurrentMonthKey();
  const monthsSet = new Set<string>();

  const last12Months = generateAvailableMonths(12);
  last12Months.forEach(month => monthsSet.add(month.id));

  if (clientData?.monthlyData) {
    Object.keys(clientData.monthlyData).forEach(monthKey => {
      monthsSet.add(monthKey);
    });
  }

  const monthsArray = Array.from(monthsSet).sort((a, b) => {
    return b.localeCompare(a);
  });

  return monthsArray.map(monthKey => ({
    id: monthKey,
    label: getMonthLabel(monthKey),
    isCurrent: monthKey === currentMonthKey
  }));
}
