import { supabase } from './supabaseClient';

interface LegacyClientInfo {
  clientName: string;
  phone?: string;
  address?: string;
  email?: string;
  website?: string;
  contractSignedDate?: string;
  enrollmentStartDate?: string;
  stakeholders?: Array<{
    id: number;
    name: string;
    title: string;
    role: string;
    email: string;
    phone: string;
    reportsTo: number | null;
  }>;
  csmAssigned?: {
    name: string;
    email: string;
    phone: string;
  };
  enrollmentSpecialists?: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
  }>;
  clientGoals?: string;
  valueMetrics?: string;
  notes?: string;
}

export async function migrateClientInfoToSupabase(
  clientId: string,
  legacyClientInfo: LegacyClientInfo
): Promise<void> {
  console.log('Starting migration for client:', clientId);

  try {
    await migrateOverview(clientId, legacyClientInfo);
    await migrateStakeholders(clientId, legacyClientInfo);
    await migrateTeamMembers(clientId, legacyClientInfo);
    await migrateGoalsFromNotes(clientId, legacyClientInfo);
    await initializeHealthScore(clientId);

    console.log('Migration completed successfully for client:', clientId);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function migrateOverview(clientId: string, legacyInfo: LegacyClientInfo): Promise<void> {
  const overviewData = {
    client_id: clientId,
    company_name: legacyInfo.clientName || '',
    address: legacyInfo.address || '',
    phone: legacyInfo.phone || '',
    email: legacyInfo.email || '',
    website: legacyInfo.website || '',
    arr: 0,
    mrr: 0,
    renewal_date: null,
    contract_start_date: legacyInfo.contractSignedDate || legacyInfo.enrollmentStartDate || null,
    contract_term_months: 12,
  };

  const { error } = await supabase
    .from('success_planning_overview')
    .upsert([overviewData], { onConflict: 'client_id' });

  if (error) {
    console.error('Error migrating overview:', error);
    throw error;
  }

  console.log('Overview migrated');
}

async function migrateStakeholders(clientId: string, legacyInfo: LegacyClientInfo): Promise<void> {
  if (!legacyInfo.stakeholders || legacyInfo.stakeholders.length === 0) {
    return;
  }

  const stakeholdersData = legacyInfo.stakeholders.map(stakeholder => ({
    client_id: clientId,
    name: stakeholder.name || '',
    title: stakeholder.title || '',
    role: stakeholder.role || '',
    email: stakeholder.email || '',
    phone: stakeholder.phone || '',
    reports_to_id: null,
    notes: '',
  }));

  const { error } = await supabase
    .from('success_planning_stakeholders')
    .upsert(stakeholdersData);

  if (error) {
    console.error('Error migrating stakeholders:', error);
    throw error;
  }

  console.log(`Migrated ${stakeholdersData.length} stakeholders`);
}

async function migrateTeamMembers(clientId: string, legacyInfo: LegacyClientInfo): Promise<void> {
  const teamData: any[] = [];

  if (legacyInfo.csmAssigned && legacyInfo.csmAssigned.name) {
    teamData.push({
      client_id: clientId,
      user_name: legacyInfo.csmAssigned.name,
      user_email: legacyInfo.csmAssigned.email || '',
      user_phone: legacyInfo.csmAssigned.phone || '',
      role_type: 'CSM',
      is_primary: true,
      assignment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  }

  if (legacyInfo.enrollmentSpecialists && legacyInfo.enrollmentSpecialists.length > 0) {
    legacyInfo.enrollmentSpecialists.forEach(specialist => {
      if (specialist.name) {
        teamData.push({
          client_id: clientId,
          user_name: specialist.name,
          user_email: specialist.email || '',
          user_phone: specialist.phone || '',
          role_type: specialist.role || 'Other',
          is_primary: false,
          assignment_date: new Date().toISOString().split('T')[0],
          notes: '',
        });
      }
    });
  }

  if (teamData.length > 0) {
    const { error } = await supabase
      .from('success_planning_team')
      .upsert(teamData);

    if (error) {
      console.error('Error migrating team members:', error);
      throw error;
    }

    console.log(`Migrated ${teamData.length} team members`);
  }
}

async function migrateGoalsFromNotes(clientId: string, legacyInfo: LegacyClientInfo): Promise<void> {
  const goalsData: any[] = [];

  if (legacyInfo.clientGoals) {
    goalsData.push({
      client_id: clientId,
      title: 'Client Goals',
      description: legacyInfo.clientGoals,
      target_date: null,
      status: 'In Progress',
      priority: 1,
      current_value: null,
      target_value: null,
      metric_unit: '',
      next_milestone: '',
      milestone_date: null,
      notes: '',
    });
  }

  if (legacyInfo.valueMetrics) {
    goalsData.push({
      client_id: clientId,
      title: 'Value Metrics',
      description: legacyInfo.valueMetrics,
      target_date: null,
      status: 'In Progress',
      priority: 2,
      current_value: null,
      target_value: null,
      metric_unit: '',
      next_milestone: '',
      milestone_date: null,
      notes: '',
    });
  }

  if (goalsData.length > 0) {
    const { error } = await supabase
      .from('success_planning_goals')
      .upsert(goalsData);

    if (error) {
      console.error('Error migrating goals:', error);
      throw error;
    }

    console.log(`Migrated ${goalsData.length} goals from notes`);
  }
}

async function initializeHealthScore(clientId: string): Promise<void> {
  const healthData = {
    client_id: clientId,
    calculated_score: 'green',
    manual_override_score: null,
    days_since_last_contact: 0,
    days_until_renewal: null,
    open_overdue_actions: 0,
    concerns: '',
    success_wins: '',
    relationship_notes: '',
    show_in_success_stories: false,
  };

  const { error } = await supabase
    .from('success_planning_health')
    .upsert([healthData], { onConflict: 'client_id' });

  if (error) {
    console.error('Error initializing health score:', error);
    throw error;
  }

  console.log('Health score initialized');
}

export async function checkIfMigrationNeeded(clientId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('success_planning_overview')
    .select('id')
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) {
    console.error('Error checking migration status:', error);
    return true;
  }

  return !data;
}
