export interface HealthScoreFactors {
  daysSinceLastContact: number;
  daysUntilRenewal: number | null;
  openOverdueActions: number;
}

export type HealthScore = 'green' | 'yellow' | 'red';

export function calculateHealthScore(factors: HealthScoreFactors): HealthScore {
  const { daysSinceLastContact, daysUntilRenewal, openOverdueActions } = factors;

  let score = 100;

  if (daysSinceLastContact > 30) {
    score -= 30;
  } else if (daysSinceLastContact > 14) {
    score -= 15;
  }

  if (daysUntilRenewal !== null) {
    if (daysUntilRenewal < 15) {
      score -= 25;
    } else if (daysUntilRenewal < 30) {
      score -= 15;
    } else if (daysUntilRenewal < 60) {
      score -= 5;
    }
  }

  if (openOverdueActions > 5) {
    score -= 30;
  } else if (openOverdueActions > 2) {
    score -= 20;
  } else if (openOverdueActions > 0) {
    score -= 10;
  }

  if (score >= 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
}

export function getHealthScoreColor(score: HealthScore): string {
  switch (score) {
    case 'green':
      return '#10b981';
    case 'yellow':
      return '#f59e0b';
    case 'red':
      return '#ef4444';
  }
}

export function getHealthScoreLabel(score: HealthScore): string {
  switch (score) {
    case 'green':
      return 'Healthy';
    case 'yellow':
      return 'At Risk';
    case 'red':
      return 'Critical';
  }
}

export function getHealthScoreBreakdown(factors: HealthScoreFactors): string[] {
  const breakdown: string[] = [];
  const { daysSinceLastContact, daysUntilRenewal, openOverdueActions } = factors;

  if (daysSinceLastContact > 30) {
    breakdown.push(`No contact in ${daysSinceLastContact} days (high risk)`);
  } else if (daysSinceLastContact > 14) {
    breakdown.push(`No contact in ${daysSinceLastContact} days (moderate risk)`);
  } else {
    breakdown.push(`Last contact ${daysSinceLastContact} days ago (healthy)`);
  }

  if (daysUntilRenewal !== null) {
    if (daysUntilRenewal < 15) {
      breakdown.push(`Renewal in ${daysUntilRenewal} days (urgent)`);
    } else if (daysUntilRenewal < 30) {
      breakdown.push(`Renewal in ${daysUntilRenewal} days (approaching)`);
    } else if (daysUntilRenewal < 60) {
      breakdown.push(`Renewal in ${daysUntilRenewal} days (monitor)`);
    } else {
      breakdown.push(`Renewal in ${daysUntilRenewal} days (healthy)`);
    }
  }

  if (openOverdueActions > 5) {
    breakdown.push(`${openOverdueActions} overdue actions (critical)`);
  } else if (openOverdueActions > 2) {
    breakdown.push(`${openOverdueActions} overdue actions (high)`);
  } else if (openOverdueActions > 0) {
    breakdown.push(`${openOverdueActions} overdue action(s) (moderate)`);
  } else {
    breakdown.push(`No overdue actions (healthy)`);
  }

  return breakdown;
}
