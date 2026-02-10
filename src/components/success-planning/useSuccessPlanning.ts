import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { calculateHealthScore, HealthScoreFactors } from './healthScoreUtils';

export interface SuccessOverview {
  id?: string;
  client_id: string;
  company_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  arr: number;
  mrr: number;
  renewal_date: string | null;
  contract_start_date: string | null;
  contract_term_months: number;
  meeting_cadence?: string;
  hours_of_operation?: string;
  communication_preferences?: string;
  billing_contact_name?: string;
  billing_contact_email?: string;
  billing_contact_phone?: string;
  billing_notes?: string;
  success_criteria?: string;
  value_delivered?: string;
  risks_mitigations?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Stakeholder {
  id?: string;
  client_id: string;
  name: string;
  title: string;
  role: string;
  email: string;
  phone: string;
  reports_to_id: string | null;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id?: string;
  client_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  role_type: string;
  is_primary: boolean;
  assignment_date: string;
  notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface Goal {
  id?: string;
  client_id: string;
  title: string;
  description: string;
  target_date: string | null;
  status: string;
  priority: number;
  current_value: number | null;
  target_value: number | null;
  metric_unit: string;
  next_milestone: string;
  milestone_date: string | null;
  notes: string;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Activity {
  id?: string;
  client_id: string;
  activity_type: string;
  description: string;
  is_auto_logged: boolean;
  created_by: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at?: string;
}

export interface ActionItem {
  id?: string;
  client_id: string;
  title: string;
  description: string;
  assignee_id: string | null;
  assignee_name: string;
  due_date: string | null;
  priority: string;
  status: string;
  action_type: string;
  value_notes: string;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HealthData {
  id?: string;
  client_id: string;
  calculated_score: string;
  manual_override_score: string | null;
  days_since_last_contact: number;
  days_until_renewal: number | null;
  open_overdue_actions: number;
  concerns: string;
  success_wins: string;
  relationship_notes: string;
  show_in_success_stories: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Document {
  id?: string;
  client_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  file_size?: string;
  notes?: string;
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
}

export function useSuccessPlanning(clientId: string) {
  const [overview, setOverview] = useState<SuccessOverview | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      fetchAllData();
    }
  }, [clientId]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchOverview(),
        fetchStakeholders(),
        fetchTeamMembers(),
        fetchGoals(),
        fetchActivities(),
        fetchActions(),
        fetchHealth(),
        fetchDocuments(),
      ]);
    } catch (err) {
      console.error('Error fetching success planning data:', err);
      setError('Failed to load success planning data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    const { data, error } = await supabase
      .from('success_planning_overview')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching overview:', error);
      return;
    }

    setOverview(data);
  };

  const fetchStakeholders = async () => {
    const { data, error } = await supabase
      .from('success_planning_stakeholders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching stakeholders:', error);
      return;
    }

    setStakeholders(data || []);
  };

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from('success_planning_team')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('Error fetching team members:', error);
      return;
    }

    setTeamMembers(data || []);
  };

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('success_planning_goals')
      .select('*')
      .eq('client_id', clientId)
      .order('priority', { ascending: true });

    if (error) {
      console.error('Error fetching goals:', error);
      return;
    }

    setGoals(data || []);
  };

  const fetchActivities = async () => {
    const { data, error } = await supabase
      .from('success_planning_activities')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching activities:', error);
      return;
    }

    setActivities(data || []);
  };

  const fetchActions = async () => {
    const { data, error } = await supabase
      .from('success_planning_actions')
      .select('*')
      .eq('client_id', clientId)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching actions:', error);
      return;
    }

    setActions(data || []);
  };

  const fetchHealth = async () => {
    const { data, error } = await supabase
      .from('success_planning_health')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching health:', error);
      return;
    }

    setHealth(data);
  };

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('success_planning_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return;
    }

    setDocuments(data || []);
  };

  const saveOverview = async (overviewData: Partial<SuccessOverview>) => {
    const dataToSave = {
      ...overviewData,
      client_id: clientId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('success_planning_overview')
      .upsert([dataToSave], { onConflict: 'client_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving overview:', error);
      throw error;
    }

    setOverview(data);
    await fetchHealth();
    return data;
  };

  const saveStakeholder = async (stakeholder: Partial<Stakeholder>) => {
    const dataToSave = {
      ...stakeholder,
      client_id: clientId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('success_planning_stakeholders')
      .upsert([dataToSave])
      .select()
      .single();

    if (error) {
      console.error('Error saving stakeholder:', error);
      throw error;
    }

    await fetchStakeholders();
    return data;
  };

  const deleteStakeholder = async (stakeholderId: string) => {
    const { error } = await supabase
      .from('success_planning_stakeholders')
      .delete()
      .eq('id', stakeholderId);

    if (error) {
      console.error('Error deleting stakeholder:', error);
      throw error;
    }

    await fetchStakeholders();
  };

  const saveTeamMember = async (member: Partial<TeamMember>) => {
    const dataToSave = {
      ...member,
      client_id: clientId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('success_planning_team')
      .upsert([dataToSave])
      .select()
      .single();

    if (error) {
      console.error('Error saving team member:', error);
      throw error;
    }

    await fetchTeamMembers();
    return data;
  };

  const deleteTeamMember = async (memberId: string) => {
    const { error } = await supabase
      .from('success_planning_team')
      .delete()
      .eq('id', memberId);

    if (error) {
      console.error('Error deleting team member:', error);
      throw error;
    }

    await fetchTeamMembers();
  };

  const saveGoal = async (goal: Partial<Goal>) => {
    const dataToSave = {
      ...goal,
      client_id: clientId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('success_planning_goals')
      .upsert([dataToSave])
      .select()
      .single();

    if (error) {
      console.error('Error saving goal:', error);
      throw error;
    }

    await fetchGoals();
    return data;
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from('success_planning_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }

    await fetchGoals();
  };

  const saveAction = async (action: Partial<ActionItem>) => {
    const dataToSave = {
      ...action,
      client_id: clientId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('success_planning_actions')
      .upsert([dataToSave])
      .select()
      .single();

    if (error) {
      console.error('Error saving action:', error);
      throw error;
    }

    await fetchActions();
    await fetchHealth();
    return data;
  };

  const deleteAction = async (actionId: string) => {
    const { error } = await supabase
      .from('success_planning_actions')
      .delete()
      .eq('id', actionId);

    if (error) {
      console.error('Error deleting action:', error);
      throw error;
    }

    await fetchActions();
    await fetchHealth();
  };

  const saveHealth = async (healthData: Partial<HealthData>) => {
    const currentHealth = health || {
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

    const mergedData = { ...currentHealth, ...healthData };

    const factors: HealthScoreFactors = {
      daysSinceLastContact: mergedData.days_since_last_contact || 0,
      daysUntilRenewal: mergedData.days_until_renewal || null,
      openOverdueActions: mergedData.open_overdue_actions || 0,
    };

    const calculatedScore = calculateHealthScore(factors);

    const dataToSave = {
      ...mergedData,
      client_id: clientId,
      calculated_score: calculatedScore,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('success_planning_health')
      .upsert([dataToSave], { onConflict: 'client_id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving health:', error);
      throw error;
    }

    setHealth(data);
    return data;
  };

  const saveDocument = async (document: Partial<Document>) => {
    const dataToSave = {
      ...document,
      client_id: clientId,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('success_planning_documents')
      .upsert([dataToSave])
      .select()
      .single();

    if (error) {
      console.error('Error saving document:', error);
      throw error;
    }

    await fetchDocuments();
    return data;
  };

  const deleteDocument = async (documentId: string) => {
    const { error } = await supabase
      .from('success_planning_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }

    await fetchDocuments();
  };

  return {
    overview,
    stakeholders,
    teamMembers,
    goals,
    activities,
    actions,
    health,
    documents,
    loading,
    error,
    saveOverview,
    saveStakeholder,
    deleteStakeholder,
    saveTeamMember,
    deleteTeamMember,
    saveGoal,
    deleteGoal,
    saveAction,
    deleteAction,
    saveHealth,
    saveDocument,
    deleteDocument,
    refetch: fetchAllData,
  };
}
