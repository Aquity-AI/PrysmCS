import React, { useState, useEffect } from 'react';
import { Target, Plus, X, TrendingUp, Calendar, Flag, CheckCircle, Trophy, AlertTriangle } from 'lucide-react';
import { Goal, SuccessOverview } from './useSuccessPlanning';
import { StrategicPrioritiesSection } from './StrategicPrioritiesSection';
import { useResponsive, getResponsiveGridCols } from './responsiveUtils';

interface SuccessPlanTabProps {
  goals: Goal[];
  onUpdateGoal: (data: Partial<Goal>) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  clientId: string;
  overview: SuccessOverview | null;
  onUpdateOverview: (data: Partial<SuccessOverview>) => Promise<void>;
}

const STATUS_COLORS: Record<string, string> = {
  'Not Started': '#94a3b8',
  'In Progress': '#3b82f6',
  'On Track': '#10b981',
  'At Risk': '#f59e0b',
  'Completed': '#14b8a6',
};

export function SuccessPlanTab({
  goals,
  onUpdateGoal,
  onDeleteGoal,
  clientId,
  overview,
  onUpdateOverview,
}: SuccessPlanTabProps) {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    client_id: clientId,
    title: '',
    description: '',
    target_date: '',
    status: 'Not Started',
    priority: goals.length + 1,
    current_value: null,
    target_value: null,
    metric_unit: '',
    next_milestone: '',
    milestone_date: '',
    notes: '',
  });

  const { isMobile, isTablet } = useResponsive();
  const canAddGoal = goals.length < 3;

  const handleAddGoal = async () => {
    if (newGoal.title) {
      try {
        console.log('Adding new goal:', newGoal);
        await onUpdateGoal(newGoal);
        setNewGoal({
          client_id: clientId,
          title: '',
          description: '',
          target_date: '',
          status: 'Not Started',
          priority: goals.length + 2,
          current_value: null,
          target_value: null,
          metric_unit: '',
          next_milestone: '',
          milestone_date: '',
          notes: '',
        });
        setIsAddingGoal(false);
        console.log('Goal added successfully');
      } catch (error) {
        console.error('Error adding goal:', error);
        alert('Failed to add goal. Please try again.');
      }
    }
  };

  const handleUpdateGoal = async (goal: Goal, updates: Partial<Goal>) => {
    try {
      console.log('Updating goal:', goal.id, updates);
      await onUpdateGoal({ ...goal, ...updates });
      console.log('Goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Failed to update goal. Please try again.');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      console.log('Deleting goal:', goalId);
      await onDeleteGoal(goalId);
      console.log('Goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  };

  const getProgressPercentage = (goal: Goal): number => {
    if (!goal.current_value || !goal.target_value) return 0;
    return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  };

  const [localOverview, setLocalOverview] = useState({
    success_criteria: overview?.success_criteria || '',
    value_delivered: overview?.value_delivered || '',
    risks_mitigations: overview?.risks_mitigations || '',
  });

  useEffect(() => {
    if (overview) {
      setLocalOverview({
        success_criteria: overview.success_criteria || '',
        value_delivered: overview.value_delivered || '',
        risks_mitigations: overview.risks_mitigations || '',
      });
    }
  }, [overview]);

  const handleOverviewChange = async (field: string, value: string) => {
    setLocalOverview(prev => ({ ...prev, [field]: value }));
    try {
      await onUpdateOverview({ [field]: value });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
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
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <Target size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Client Goals</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Maximum of 3 active goals ({goals.length}/3)</p>
            </div>
          </div>
          {canAddGoal && (
            <button
              onClick={() => setIsAddingGoal(true)}
              style={{
                padding: '10px 16px',
                background: '#14b8a6',
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
              Add Goal
            </button>
          )}
        </div>

        {isAddingGoal && (
          <div style={{
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px dashed #cbd5e1'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Add New Goal</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={newGoal.title || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="What do you want to achieve?"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={newGoal.description || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Detailed description of the goal..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 2, 3, isMobile, isTablet), gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={newGoal.target_date || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0f172a'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={newGoal.target_value || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) || null })}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0f172a'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Unit
                  </label>
                  <input
                    type="text"
                    value={newGoal.metric_unit || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, metric_unit: e.target.value })}
                    placeholder="e.g., users, %, $"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleAddGoal}
                  style={{
                    padding: '10px 20px',
                    background: '#14b8a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Add Goal
                </button>
                <button
                  onClick={() => setIsAddingGoal(false)}
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

        {goals.length === 0 && !isAddingGoal && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            <Target size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No goals defined yet</div>
            <div>Click "Add Goal" to create your first client goal</div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '20px' }}>
          {goals.map((goal) => {
            const progress = getProgressPercentage(goal);
            const statusColor = STATUS_COLORS[goal.status] || '#94a3b8';

            return (
              <div key={goal.id} style={{
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '2px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <Flag size={20} color={statusColor} fill={statusColor} />
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        {goal.title}
                      </h3>
                    </div>
                    {goal.description && (
                      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 12px 32px' }}>
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => goal.id && handleDeleteGoal(goal.id)}
                    style={{
                      padding: '8px',
                      background: 'white',
                      color: '#ef4444',
                      border: '1px solid #fee2e2',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      marginLeft: '12px'
                    }}
                    title="Delete goal"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 1, 2, isMobile, isTablet), gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                      STATUS
                    </label>
                    <select
                      value={goal.status}
                      onChange={(e) => handleUpdateGoal(goal, { status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#0f172a',
                        background: 'white'
                      }}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Track">On Track</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                      TARGET DATE
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <Calendar size={16} color="#64748b" style={{ marginRight: '8px' }} />
                      <span style={{ fontSize: '14px', color: '#0f172a' }}>
                        {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                {goal.target_value && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                        Progress
                      </span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        {goal.current_value || 0} / {goal.target_value} {goal.metric_unit}
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: statusColor,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                        UPDATE CURRENT VALUE
                      </label>
                      <input
                        type="number"
                        value={goal.current_value || ''}
                        onChange={(e) => handleUpdateGoal(goal, { current_value: parseFloat(e.target.value) || null })}
                        placeholder="0"
                        style={{
                          width: '200px',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#0f172a',
                          background: 'white'
                        }}
                      />
                    </div>
                  </div>
                )}

                {goal.next_milestone && (
                  <div style={{
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      NEXT MILESTONE
                    </div>
                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 500 }}>
                      {goal.next_milestone}
                    </div>
                    {goal.milestone_date && (
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        Due: {new Date(goal.milestone_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}

                {goal.notes && (
                  <div style={{
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px' }}>
                      NOTES
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                      {goal.notes}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategic Planning Sections */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <CheckCircle size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Strategic Planning</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Define success criteria, track value, and mitigate risks</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Success Criteria */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <CheckCircle size={18} color="#10b981" style={{ marginRight: '8px' }} />
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                Success Criteria
              </label>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', marginLeft: '26px' }}>
              Define what "good" looks like for this client
            </p>
            <textarea
              value={localOverview.success_criteria}
              onChange={(e) => handleOverviewChange('success_criteria', e.target.value)}
              placeholder="What metrics, milestones, or outcomes define success? What does a thriving partnership look like?"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a',
                minHeight: '120px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.6'
              }}
            />
          </div>

          {/* Value Delivered */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <Trophy size={18} color="#f59e0b" style={{ marginRight: '8px' }} />
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                Value Delivered
              </label>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', marginLeft: '26px' }}>
              Document ROI and value delivered for renewal conversations
            </p>
            <textarea
              value={localOverview.value_delivered}
              onChange={(e) => handleOverviewChange('value_delivered', e.target.value)}
              placeholder="What tangible value have we provided? Cost savings, efficiency gains, revenue growth, time saved, problems solved..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a',
                minHeight: '120px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.6'
              }}
            />
          </div>

          {/* Risks & Mitigations */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <AlertTriangle size={18} color="#ef4444" style={{ marginRight: '8px' }} />
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                Risks & Mitigations
              </label>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', marginLeft: '26px' }}>
              Identify potential churn risks and mitigation strategies
            </p>
            <textarea
              value={localOverview.risks_mitigations}
              onChange={(e) => handleOverviewChange('risks_mitigations', e.target.value)}
              placeholder="What risks could lead to churn? Budget constraints, leadership changes, competitor activity, unmet expectations? How are we addressing each risk?"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0f172a',
                minHeight: '120px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.6'
              }}
            />
          </div>
        </div>
      </div>

      {/* Strategic Priorities Section */}
      <StrategicPrioritiesSection clientId={clientId} />
    </div>
  );
}
