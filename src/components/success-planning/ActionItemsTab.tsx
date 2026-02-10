import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Plus, X, AlertTriangle, TrendingUp, AlertCircle, CheckCircle2, Bell } from 'lucide-react';
import { ActionItem, TeamMember } from './useSuccessPlanning';
import { useResponsive, getResponsiveGridCols } from './responsiveUtils';

interface ActionItemsTabProps {
  actions: ActionItem[];
  teamMembers: TeamMember[];
  onUpdateAction: (data: Partial<ActionItem>) => Promise<void>;
  onDeleteAction: (id: string) => Promise<void>;
  clientId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  Standard: '#64748b',
  Renewal: '#8b5cf6',
  Risk: '#ef4444',
  Opportunity: '#10b981',
};

export function ActionItemsTab({
  actions,
  teamMembers,
  onUpdateAction,
  onDeleteAction,
  clientId,
}: ActionItemsTabProps) {
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [highlightedActionId, setHighlightedActionId] = useState<string | null>(null);
  const actionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [newAction, setNewAction] = useState<Partial<ActionItem>>({
    client_id: clientId,
    title: '',
    description: '',
    assignee_id: null,
    assignee_name: '',
    due_date: '',
    priority: 'Medium',
    status: 'Open',
    action_type: 'Standard',
    value_notes: '',
  });

  const { isMobile, isTablet } = useResponsive();

  // Check for highlighted action from sessionStorage
  useEffect(() => {
    const highlightId = window.sessionStorage.getItem('highlightActionId');
    if (highlightId) {
      setHighlightedActionId(highlightId);
      window.sessionStorage.removeItem('highlightActionId');

      // Scroll to the highlighted action after a short delay
      setTimeout(() => {
        const element = actionRefs.current[highlightId];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      // Remove highlight after 3 seconds
      setTimeout(() => {
        setHighlightedActionId(null);
      }, 3000);
    }
  }, [actions]);

  const handleAddAction = async () => {
    if (newAction.title) {
      try {
        console.log('Adding new action:', newAction);
        const assignee = teamMembers.find(m => m.id === newAction.assignee_id);
        await onUpdateAction({
          ...newAction,
          assignee_name: assignee?.user_name || '',
        });
        setNewAction({
          client_id: clientId,
          title: '',
          description: '',
          assignee_id: null,
          assignee_name: '',
          due_date: '',
          priority: 'Medium',
          status: 'Open',
          action_type: 'Standard',
          value_notes: '',
        });
        setIsAddingAction(false);
        console.log('Action added successfully');
      } catch (error) {
        console.error('Error adding action:', error);
        alert('Failed to add action. Please try again.');
      }
    }
  };

  const handleToggleComplete = async (action: ActionItem) => {
    try {
      console.log('Toggling action completion:', action.id);
      const newStatus = action.status === 'Completed' ? 'Open' : 'Completed';
      await onUpdateAction({
        ...action,
        status: newStatus,
        completed_at: newStatus === 'Completed' ? new Date().toISOString() : null,
      });
      console.log('Action toggled successfully');
    } catch (error) {
      console.error('Error toggling action:', error);
      alert('Failed to update action. Please try again.');
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      console.log('Deleting action:', actionId);
      await onDeleteAction(actionId);
      console.log('Action deleted successfully');
    } catch (error) {
      console.error('Error deleting action:', error);
      alert('Failed to delete action. Please try again.');
    }
  };

  const isOverdue = (action: ActionItem): boolean => {
    return action.status !== 'Completed' && action.due_date
      ? new Date(action.due_date) < new Date()
      : false;
  };

  const isUpcoming = (action: ActionItem): boolean => {
    if (!action.due_date || action.status === 'Completed') return false;
    const daysUntilDue = Math.floor((new Date(action.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  };

  const openActions = actions.filter(a => a.status !== 'Completed');
  const completedActions = actions.filter(a => a.status === 'Completed');
  const overdueActions = openActions.filter(isOverdue);
  const upcomingActions = openActions.filter(isUpcoming);
  const riskItems = openActions.filter(a => a.action_type === 'Risk');
  const opportunities = openActions.filter(a => a.action_type === 'Opportunity');
  const renewalActions = openActions.filter(a => a.action_type === 'Renewal');

  return (
    <div style={{ padding: isMobile ? '16px' : '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 2, 4, isMobile, isTablet), gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Open Actions</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{openActions.length}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Overdue</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{overdueActions.length}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Due This Week</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{upcomingActions.length}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Completed</div>
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{completedActions.length}</div>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <AlertTriangle size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Risk Items</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Issues requiring immediate attention</p>
            </div>
          </div>
        </div>

        {riskItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '14px' }}>
            No risk items identified
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {riskItems.map((action) => (
              <ActionItemCard
                key={action.id}
                action={action}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteAction}
                isOverdue={isOverdue(action)}
                isUpcoming={isUpcoming(action)}
                isHighlighted={highlightedActionId === action.id}
                setRef={(el) => { if (action.id) actionRefs.current[action.id] = el; }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <TrendingUp size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Opportunities</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Growth and expansion opportunities</p>
            </div>
          </div>
        </div>

        {opportunities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '14px' }}>
            No opportunities identified
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {opportunities.map((action) => (
              <ActionItemCard
                key={action.id}
                action={action}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteAction}
                isOverdue={isOverdue(action)}
                isUpcoming={isUpcoming(action)}
                isHighlighted={highlightedActionId === action.id}
                setRef={(el) => { if (action.id) actionRefs.current[action.id] = el; }}
              />
            ))}
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
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <ClipboardList size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>All Action Items</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Tasks and next steps</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddingAction(true)}
            style={{
              padding: '10px 16px',
              background: '#3b82f6',
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
            Add Action Item
          </button>
        </div>

        {isAddingAction && (
          <div style={{
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px dashed #cbd5e1'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Add New Action Item</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newAction.title || ''}
                  onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                  placeholder="What needs to be done?"
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
                  value={newAction.description || ''}
                  onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                  placeholder="Additional details..."
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
              <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 2, 4, isMobile, isTablet), gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Assignee
                  </label>
                  <select
                    value={newAction.assignee_id || ''}
                    onChange={(e) => setNewAction({ ...newAction, assignee_id: e.target.value || null })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0f172a'
                    }}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.user_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newAction.due_date || ''}
                    onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })}
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
                    Priority
                  </label>
                  <select
                    value={newAction.priority || 'Medium'}
                    onChange={(e) => setNewAction({ ...newAction, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0f172a'
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Type
                  </label>
                  <select
                    value={newAction.action_type || 'Standard'}
                    onChange={(e) => setNewAction({ ...newAction, action_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#0f172a'
                    }}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Renewal">Renewal</option>
                    <option value="Risk">Risk</option>
                    <option value="Opportunity">Opportunity</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleAddAction}
                  style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Add Action
                </button>
                <button
                  onClick={() => setIsAddingAction(false)}
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

        {actions.length === 0 && !isAddingAction && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No action items yet</div>
            <div>Click "Add Action Item" to create your first task</div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '12px' }}>
          {actions.map((action) => (
            <ActionItemCard
              key={action.id}
              action={action}
              onToggleComplete={handleToggleComplete}
              onDelete={onDeleteAction}
              isOverdue={isOverdue(action)}
              isUpcoming={isUpcoming(action)}
              isHighlighted={highlightedActionId === action.id}
              setRef={(el) => { if (action.id) actionRefs.current[action.id] = el; }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionItemCard({
  action,
  onToggleComplete,
  onDelete,
  isOverdue,
  isUpcoming,
  isHighlighted = false,
  setRef,
}: {
  action: ActionItem;
  onToggleComplete: (action: ActionItem) => void;
  onDelete: (id: string) => void;
  isOverdue: boolean;
  isUpcoming: boolean;
  isHighlighted?: boolean;
  setRef?: (el: HTMLDivElement | null) => void;
}) {
  const priorityColor = PRIORITY_COLORS[action.priority] || '#64748b';
  const typeColor = ACTION_TYPE_COLORS[action.action_type] || '#64748b';
  const isCompleted = action.status === 'Completed';

  return (
    <div
      ref={setRef}
      style={{
        padding: '16px',
        background: isHighlighted ? '#dbeafe' : isOverdue && !isCompleted ? '#fef2f2' : isUpcoming && !isCompleted ? '#fffbeb' : '#f8fafc',
        border: `2px solid ${isHighlighted ? '#3b82f6' : isOverdue && !isCompleted ? '#fee2e2' : isUpcoming && !isCompleted ? '#fef3c7' : '#e2e8f0'}`,
        borderRadius: '12px',
        opacity: isCompleted ? 0.6 : 1,
        transition: 'all 0.3s ease',
        boxShadow: isHighlighted ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
      }}>
      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={() => onToggleComplete(action)}
          style={{
            width: '20px',
            height: '20px',
            marginTop: '2px',
            cursor: 'pointer',
            accentColor: '#14b8a6'
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#0f172a',
                  margin: '0 0 4px 0',
                  textDecoration: isCompleted ? 'line-through' : 'none'
                }}>
                  {action.title}
                </h3>
                {isOverdue && !isCompleted && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px 6px',
                      background: '#fef2f2',
                      border: '1px solid #fee2e2',
                      borderRadius: '6px'
                    }}
                    title="Alert notification sent"
                  >
                    <Bell size={12} color="#ef4444" />
                  </div>
                )}
              </div>
              {action.description && (
                <p style={{
                  fontSize: '13px',
                  color: '#64748b',
                  margin: '0 0 8px 0',
                  textDecoration: isCompleted ? 'line-through' : 'none'
                }}>
                  {action.description}
                </p>
              )}
            </div>
            <button
              onClick={() => action.id && onDelete(action.id)}
              style={{
                padding: '6px',
                background: 'white',
                color: '#ef4444',
                border: '1px solid #fee2e2',
                borderRadius: '6px',
                cursor: 'pointer',
                marginLeft: '12px'
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{
              padding: '4px 10px',
              background: priorityColor,
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {action.priority}
            </span>

            <span style={{
              padding: '4px 10px',
              background: typeColor,
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              {action.action_type}
            </span>

            {action.assignee_name && (
              <span style={{
                padding: '4px 10px',
                background: 'white',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {action.assignee_name}
              </span>
            )}

            {action.due_date && (
              <span style={{
                padding: '4px 10px',
                background: 'white',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                Due: {new Date(action.due_date).toLocaleDateString()}
              </span>
            )}

            {isOverdue && !isCompleted && (
              <span style={{
                padding: '4px 10px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                OVERDUE
              </span>
            )}

            {isUpcoming && !isCompleted && (
              <span style={{
                padding: '4px 10px',
                background: '#f59e0b',
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                DUE SOON
              </span>
            )}
          </div>

          {action.value_notes && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b',
              fontStyle: 'italic'
            }}>
              {action.value_notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
