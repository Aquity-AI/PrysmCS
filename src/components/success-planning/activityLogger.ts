import { supabase } from './supabaseClient';

export type ActivityType = 'meeting' | 'email' | 'phone_call' | 'milestone' | 'system_event' | 'note';

export interface ActivityLogEntry {
  id?: string;
  client_id: string;
  activity_type: ActivityType;
  description: string;
  is_auto_logged: boolean;
  created_by: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at?: string;
}

export async function logActivity(activity: Omit<ActivityLogEntry, 'id' | 'created_at'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('success_planning_activities')
      .insert([activity]);

    if (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

export async function logHealthScoreChange(
  clientId: string,
  previousScore: string,
  newScore: string,
  userName: string
): Promise<void> {
  await logActivity({
    client_id: clientId,
    activity_type: 'system_event',
    description: `Health score changed from ${previousScore} to ${newScore}`,
    is_auto_logged: true,
    created_by: userName,
    related_entity_type: 'health_score',
  });
}

export async function logContractUpdate(
  clientId: string,
  fieldName: string,
  userName: string
): Promise<void> {
  await logActivity({
    client_id: clientId,
    activity_type: 'system_event',
    description: `Contract details updated: ${fieldName}`,
    is_auto_logged: true,
    created_by: userName,
    related_entity_type: 'contract',
  });
}

export async function logActionItemCreated(
  clientId: string,
  actionTitle: string,
  userName: string,
  actionId?: string
): Promise<void> {
  await logActivity({
    client_id: clientId,
    activity_type: 'system_event',
    description: `New action item created: ${actionTitle}`,
    is_auto_logged: true,
    created_by: userName,
    related_entity_type: 'action',
    related_entity_id: actionId,
  });
}

export async function logActionItemCompleted(
  clientId: string,
  actionTitle: string,
  userName: string,
  actionId?: string
): Promise<void> {
  await logActivity({
    client_id: clientId,
    activity_type: 'system_event',
    description: `Action item completed: ${actionTitle}`,
    is_auto_logged: true,
    created_by: userName,
    related_entity_type: 'action',
    related_entity_id: actionId,
  });
}

export async function logGoalAchieved(
  clientId: string,
  goalTitle: string,
  userName: string,
  goalId?: string
): Promise<void> {
  await logActivity({
    client_id: clientId,
    activity_type: 'milestone',
    description: `Goal achieved: ${goalTitle}`,
    is_auto_logged: true,
    created_by: userName,
    related_entity_type: 'goal',
    related_entity_id: goalId,
  });
}

export async function logGoalUpdated(
  clientId: string,
  goalTitle: string,
  userName: string,
  goalId?: string
): Promise<void> {
  await logActivity({
    client_id: clientId,
    activity_type: 'system_event',
    description: `Goal updated: ${goalTitle}`,
    is_auto_logged: true,
    created_by: userName,
    related_entity_type: 'goal',
    related_entity_id: goalId,
  });
}

export async function logTeamAssignment(
  clientId: string,
  memberName: string,
  role: string,
  userName: string
): Promise<void> {
  await logActivity({
    client_id: clientId,
    activity_type: 'system_event',
    description: `${memberName} assigned as ${role}`,
    is_auto_logged: true,
    created_by: userName,
    related_entity_type: 'team',
  });
}

export async function logManualActivity(
  clientId: string,
  activityType: ActivityType,
  description: string,
  userName: string
): Promise<void> {
  await logActivity({
    client_id: clientId,
    activity_type: activityType,
    description,
    is_auto_logged: false,
    created_by: userName,
  });
}
