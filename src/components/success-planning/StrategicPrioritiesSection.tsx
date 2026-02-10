import React, { useState } from 'react';
import { Lightbulb, Edit3, Plus, X, Eye, EyeOff, Pill, Smartphone, HeartPulse, Stethoscope, Users, Activity, Calendar, ClipboardCheck, Target, TrendingUp, Shield, Zap, Sparkles } from 'lucide-react';
import { useStrategicPrioritiesSync, StrategicPriority } from './useStrategicPrioritiesSync';

interface StrategicPrioritiesSectionProps {
  clientId: string;
}

const ICON_OPTIONS = [
  { name: 'Lightbulb', component: Lightbulb, color: '#f59e0b' },
  { name: 'Pill', component: Pill, color: '#ef4444' },
  { name: 'Smartphone', component: Smartphone, color: '#3b82f6' },
  { name: 'HeartPulse', component: HeartPulse, color: '#ec4899' },
  { name: 'Stethoscope', component: Stethoscope, color: '#06b6d4' },
  { name: 'Users', component: Users, color: '#8b5cf6' },
  { name: 'Activity', component: Activity, color: '#10b981' },
  { name: 'Calendar', component: Calendar, color: '#6366f1' },
  { name: 'ClipboardCheck', component: ClipboardCheck, color: '#14b8a6' },
  { name: 'Target', component: Target, color: '#f97316' },
  { name: 'TrendingUp', component: TrendingUp, color: '#84cc16' },
  { name: 'Shield', component: Shield, color: '#6366f1' },
  { name: 'Zap', component: Zap, color: '#eab308' },
  { name: 'Sparkles', component: Sparkles, color: '#a855f7' },
];

function getIconComponent(iconName: string) {
  const icon = ICON_OPTIONS.find(opt => opt.name === iconName);
  return icon || ICON_OPTIONS[0];
}

export function StrategicPrioritiesSection({ clientId }: StrategicPrioritiesSectionProps) {
  const { priorities, isLoading, addPriority, updatePriority, deletePriority, refreshPriorities } = useStrategicPrioritiesSync(clientId);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPriorities, setEditingPriorities] = useState<StrategicPriority[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Filter to only show visible priorities in the client-facing view
  const visiblePriorities = priorities.filter(p => p.is_visible);

  console.log('=== NEW CODE v2024-01-13-DEBUG ===');
  console.log('[StrategicPrioritiesSection] All priorities:', priorities.map(p => ({ title: p.title, is_visible: p.is_visible })));
  console.log('[StrategicPrioritiesSection] Visible priorities:', visiblePriorities.map(p => ({ title: p.title, is_visible: p.is_visible })));
  console.log('[StrategicPrioritiesSection] Will render', visiblePriorities.length, 'cards');

  const handleOpenEditor = () => {
    setEditingPriorities(priorities.map(p => ({ ...p })));
    setIsEditing(true);
    setHasChanges(false);
  };

  const handleAddNewPriority = () => {
    const newPriority: StrategicPriority = {
      client_id: clientId,
      icon: 'Lightbulb',
      title: '',
      subtitle: '',
      focus_areas: [''],
      is_visible: true,
      show_in_data_management: true,
      display_order: editingPriorities.length,
    };
    setEditingPriorities([...editingPriorities, newPriority]);
    setHasChanges(true);
  };

  const handleRemovePriority = (index: number) => {
    const updated = editingPriorities.filter((_, i) => i !== index);
    setEditingPriorities(updated);
    setHasChanges(true);
  };

  const handleUpdatePriority = (index: number, field: keyof StrategicPriority, value: any) => {
    const updated = [...editingPriorities];
    updated[index] = { ...updated[index], [field]: value };
    setEditingPriorities(updated);
    setHasChanges(true);
  };

  const handleAddFocusArea = (priorityIndex: number) => {
    const updated = [...editingPriorities];
    const focusAreas = [...updated[priorityIndex].focus_areas, ''];
    updated[priorityIndex] = { ...updated[priorityIndex], focus_areas: focusAreas };
    setEditingPriorities(updated);
    setHasChanges(true);
  };

  const handleRemoveFocusArea = (priorityIndex: number, focusIndex: number) => {
    const updated = [...editingPriorities];
    const focusAreas = updated[priorityIndex].focus_areas.filter((_, i) => i !== focusIndex);
    if (focusAreas.length === 0) focusAreas.push('');
    updated[priorityIndex] = { ...updated[priorityIndex], focus_areas: focusAreas };
    setEditingPriorities(updated);
    setHasChanges(true);
  };

  const handleUpdateFocusArea = (priorityIndex: number, focusIndex: number, value: string) => {
    const updated = [...editingPriorities];
    const focusAreas = [...updated[priorityIndex].focus_areas];
    focusAreas[focusIndex] = value;
    updated[priorityIndex] = { ...updated[priorityIndex], focus_areas: focusAreas };
    setEditingPriorities(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      console.log('[StrategicPriorities] Starting batch save operation');
      console.log('[StrategicPriorities] Editing priorities:', editingPriorities);

      // Delete priorities that were removed
      const prioritiesToDelete = priorities.filter(p => !editingPriorities.find(ep => ep.id === p.id));
      console.log('[StrategicPriorities] Priorities to delete:', prioritiesToDelete);
      for (const priority of prioritiesToDelete) {
        if (priority.id) {
          console.log('[StrategicPriorities] Deleting priority:', priority.id, priority.title);
          await deletePriority(priority.id);
          console.log('[StrategicPriorities] Delete complete for', priority.id);
        }
      }

      // Update or add priorities (batch without reload)
      for (let i = 0; i < editingPriorities.length; i++) {
        const priority = editingPriorities[i];
        const priorityData = {
          client_id: priority.client_id,
          icon: priority.icon,
          title: priority.title,
          subtitle: priority.subtitle,
          focus_areas: priority.focus_areas.filter(fa => fa.trim() !== ''),
          is_visible: priority.is_visible,
          show_in_data_management: priority.show_in_data_management,
          display_order: i,
          month_association: priority.month_association,
        };

        if (priority.id) {
          // Update existing (skip reload until all done)
          console.log('[StrategicPriorities] Updating priority:', priority.id, 'Data:', priorityData);
          await updatePriority(priority.id, priorityData, true);
          console.log('[StrategicPriorities] Update complete for', priority.id);
        } else {
          // Add new
          console.log('[StrategicPriorities] Adding new priority:', priorityData);
          await addPriority(priorityData);
          console.log('[StrategicPriorities] Add complete');
        }
      }

      console.log('[StrategicPriorities] All updates complete, refreshing data');

      // Explicitly refresh priorities to show changes immediately
      await refreshPriorities();

      // Close modal after data is refreshed
      setIsEditing(false);
      setHasChanges(false);

      console.log('[StrategicPriorities] Save complete');
    } catch (error: any) {
      console.error('[StrategicPriorities] Error saving priorities:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      const errorDetails = error?.details || error?.hint || '';
      const fullMessage = errorDetails
        ? `${errorMessage}\n\nDetails: ${errorDetails}`
        : errorMessage;
      alert(`Failed to save priorities:\n\n${fullMessage}\n\nCheck browser console for more details.`);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px'
      }}>
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          Loading strategic priorities...
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginTop: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <Lightbulb size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Strategic Priorities</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Monthly initiatives and focus areas for this client</p>
            </div>
          </div>
          <button
            onClick={handleOpenEditor}
            style={{
              padding: '10px 16px',
              background: '#f59e0b',
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
            <Edit3 size={18} />
            Edit Priorities
          </button>
        </div>

        {visiblePriorities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            <Lightbulb size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No strategic priorities yet</div>
            <div>Click "Edit Priorities" to add your first priority card</div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            {visiblePriorities.map((priority) => {
              const iconConfig = getIconComponent(priority.icon);
              const IconComponent = iconConfig.component;

              return (
                <div
                  key={priority.id}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    border: '2px solid #e2e8f0',
                    borderLeft: `4px solid #14b8a6`,
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${iconConfig.color} 0%, ${iconConfig.color}dd 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16px',
                      flexShrink: 0
                    }}>
                      <IconComponent size={24} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0 0 8px 0',
                        lineHeight: '1.3'
                      }}>
                        {priority.title}
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        color: '#64748b',
                        margin: 0,
                        lineHeight: '1.5'
                      }}>
                        {priority.subtitle}
                      </p>
                    </div>
                  </div>

                  {priority.focus_areas && priority.focus_areas.length > 0 && (
                    <>
                      <div style={{
                        height: '1px',
                        background: '#e2e8f0',
                        margin: '16px 0'
                      }} />

                      <div style={{ marginTop: '16px' }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#0f172a',
                          marginBottom: '12px'
                        }}>
                          This Month's Focus Areas:
                        </div>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '20px',
                          fontSize: '14px',
                          color: '#475569',
                          lineHeight: '1.8'
                        }}>
                          {priority.focus_areas.map((area, index) => (
                            <li key={index} style={{ marginBottom: '6px' }}>
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isEditing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: 0 }}>
                  Edit Strategic Priorities
                </h2>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                  Create and manage priority cards for this client
                </p>
              </div>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{
              padding: '24px',
              overflowY: 'auto',
              flex: 1
            }}>
              <div style={{ display: 'grid', gap: '20px' }}>
                {editingPriorities.map((priority, priorityIndex) => (
                  <div
                    key={priorityIndex}
                    style={{
                      background: '#0f172a',
                      borderRadius: '12px',
                      padding: '20px',
                      border: '2px solid #334155'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: 'white' }}>
                        Priority Card #{priorityIndex + 1}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdatePriority(priorityIndex, 'is_visible', !priority.is_visible)}
                          style={{
                            padding: '8px 12px',
                            background: priority.is_visible ? '#10b981' : '#64748b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {priority.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          {priority.is_visible ? 'Visible' : 'Hidden'}
                        </button>
                        <button
                          onClick={() => handleRemovePriority(priorityIndex)}
                          style={{
                            padding: '8px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Remove priority"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                          Icon
                        </label>
                        <select
                          value={priority.icon}
                          onChange={(e) => handleUpdatePriority(priorityIndex, 'icon', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: 'white'
                          }}
                        >
                          {ICON_OPTIONS.map(icon => (
                            <option key={icon.name} value={icon.name}>{icon.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                          Title *
                        </label>
                        <input
                          type="text"
                          value={priority.title}
                          onChange={(e) => handleUpdatePriority(priorityIndex, 'title', e.target.value)}
                          placeholder="e.g., Chronic Care Management (CCM)"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: 'white'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
                          Subtitle
                        </label>
                        <textarea
                          value={priority.subtitle}
                          onChange={(e) => handleUpdatePriority(priorityIndex, 'subtitle', e.target.value)}
                          placeholder="Brief description of this priority..."
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: 'white',
                            minHeight: '60px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
                            Focus Areas
                          </label>
                          <button
                            onClick={() => handleAddFocusArea(priorityIndex)}
                            style={{
                              padding: '6px 10px',
                              background: '#14b8a6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Plus size={14} />
                            Add Focus Area
                          </button>
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {priority.focus_areas.map((focusArea, focusIndex) => (
                            <div key={focusIndex} style={{ display: 'flex', gap: '8px' }}>
                              <input
                                type="text"
                                value={focusArea}
                                onChange={(e) => handleUpdateFocusArea(priorityIndex, focusIndex, e.target.value)}
                                placeholder="Focus area description..."
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  background: '#1e293b',
                                  border: '1px solid #334155',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  color: 'white'
                                }}
                              />
                              {priority.focus_areas.length > 1 && (
                                <button
                                  onClick={() => handleRemoveFocusArea(priorityIndex, focusIndex)}
                                  style={{
                                    padding: '8px',
                                    background: '#334155',
                                    color: '#94a3b8',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  title="Remove focus area"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleAddNewPriority}
                  style={{
                    padding: '20px',
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '2px dashed #334155',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Plus size={20} />
                  Add Another Priority Card
                </button>
              </div>
            </div>

            <div style={{
              padding: '24px',
              borderTop: '1px solid #334155',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '10px 20px',
                  background: '#334155',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
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
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
