import React, { useState } from 'react';
import { Activity as ActivityIcon, Calendar, Mail, Phone, MessageSquare, Award, Settings, Plus, Filter } from 'lucide-react';
import { Activity } from './useSuccessPlanning';
import { logManualActivity, ActivityType } from './activityLogger';

interface ActivityLogTabProps {
  activities: Activity[];
  clientId: string;
  userName: string;
  onRefresh: () => void;
}

const ACTIVITY_ICONS: Record<string, any> = {
  meeting: Calendar,
  email: Mail,
  phone_call: Phone,
  note: MessageSquare,
  milestone: Award,
  system_event: Settings,
};

const ACTIVITY_COLORS: Record<string, string> = {
  meeting: '#3b82f6',
  email: '#8b5cf6',
  phone_call: '#10b981',
  note: '#f59e0b',
  milestone: '#ec4899',
  system_event: '#64748b',
};

export function ActivityLogTab({
  activities,
  clientId,
  userName,
  onRefresh,
}: ActivityLogTabProps) {
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [newActivity, setNewActivity] = useState({
    type: 'meeting' as ActivityType,
    description: '',
  });

  const lastManualActivity = activities.find(a => !a.is_auto_logged);
  const daysSinceLastContact = lastManualActivity
    ? Math.floor((Date.now() - new Date(lastManualActivity.created_at!).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const handleAddActivity = async () => {
    if (newActivity.description.trim()) {
      try {
        console.log('Adding manual activity:', newActivity);
        await logManualActivity(
          clientId,
          newActivity.type,
          newActivity.description,
          userName
        );
        setNewActivity({ type: 'meeting', description: '' });
        setIsAddingActivity(false);
        onRefresh();
        console.log('Activity added successfully');
      } catch (error) {
        console.error('Error adding activity:', error);
        alert('Failed to add activity. Please try again.');
      }
    }
  };

  const filteredActivities = filterType === 'all'
    ? activities
    : filterType === 'manual'
    ? activities.filter(a => !a.is_auto_logged)
    : activities.filter(a => a.is_auto_logged);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        color: 'white'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Last Contact</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <div style={{ fontSize: '48px', fontWeight: 700 }}>{daysSinceLastContact}</div>
          <div style={{ fontSize: '18px', opacity: 0.9 }}>days ago</div>
        </div>
        {lastManualActivity && (
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px' }}>
            {new Date(lastManualActivity.created_at!).toLocaleDateString()} - {lastManualActivity.description}
          </div>
        )}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <ActivityIcon size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Activity Log</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Track all interactions and events</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Activities</option>
              <option value="manual">Manual Only</option>
              <option value="auto">System Only</option>
            </select>
            <button
              onClick={() => setIsAddingActivity(true)}
              style={{
                padding: '10px 16px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Plus size={18} />
              Log Activity
            </button>
          </div>
        </div>

        {isAddingActivity && (
          <div style={{
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px dashed #cbd5e1'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Log New Activity</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Activity Type
                </label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as ActivityType })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                >
                  <option value="meeting">Meeting</option>
                  <option value="email">Email</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="note">Note</option>
                  <option value="milestone">Milestone</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  placeholder="What happened in this interaction..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a',
                    minHeight: '100px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleAddActivity}
                  style={{
                    padding: '10px 20px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Log Activity
                </button>
                <button
                  onClick={() => setIsAddingActivity(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'white',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredActivities.length === 0 && !isAddingActivity && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            <ActivityIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No activities logged yet</div>
            <div>Click "Log Activity" to record your first interaction</div>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '0',
            bottom: '0',
            width: '2px',
            background: '#e2e8f0'
          }} />

          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredActivities.map((activity, index) => {
              const Icon = ACTIVITY_ICONS[activity.activity_type] || MessageSquare;
              const color = ACTIVITY_COLORS[activity.activity_type] || '#64748b';
              const isAutoLogged = activity.is_auto_logged;

              return (
                <div key={activity.id} style={{ position: 'relative', paddingLeft: '56px' }}>
                  <div style={{
                    position: 'absolute',
                    left: '8px',
                    top: '0',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}>
                    <Icon size={14} color="white" />
                  </div>

                  <div style={{
                    padding: '16px',
                    background: isAutoLogged ? '#f8fafc' : 'white',
                    border: `2px solid ${isAutoLogged ? '#e2e8f0' : color}`,
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                          {activity.description}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {activity.created_by} • {new Date(activity.created_at!).toLocaleString()}
                        </div>
                      </div>
                      {isAutoLogged && (
                        <span style={{
                          padding: '4px 8px',
                          background: '#e2e8f0',
                          color: '#64748b',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          AUTO
                        </span>
                      )}
                    </div>

                    {activity.related_entity_type && (
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #e2e8f0'
                      }}>
                        Related to: {activity.related_entity_type}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
