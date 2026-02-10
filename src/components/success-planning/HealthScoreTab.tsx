import React, { useState } from 'react';
import { Activity, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { HealthData } from './useSuccessPlanning';
import { getHealthScoreColor, getHealthScoreLabel, getHealthScoreBreakdown, HealthScoreFactors, HealthScore } from './healthScoreUtils';
import { SuccessStoriesSection } from './SuccessStoriesSection';

interface HealthScoreTabProps {
  health: HealthData | null;
  onUpdateHealth: (data: Partial<HealthData>) => Promise<void>;
  onSave?: () => Promise<void>;
  clientId?: string;
}

export function HealthScoreTab({ health, onUpdateHealth, onSave, clientId }: HealthScoreTabProps) {
  const [localHealth, setLocalHealth] = useState<Partial<HealthData>>({});
  const [isHovering, setIsHovering] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);

  React.useEffect(() => {
    if (health) {
      setLocalHealth(health);
    }
  }, [health]);

  const handleHealthChange = (field: keyof HealthData, value: any) => {
    setLocalHealth(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      console.log('Saving health data:', localHealth);
      await onUpdateHealth(localHealth);
      setHasChanges(false);
      if (onSave) await onSave();
      console.log('Health data saved successfully');
    } catch (error) {
      console.error('Error saving health data:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleResetToCalculated = async () => {
    try {
      console.log('Resetting to calculated score');
      await onUpdateHealth({ manual_override_score: null });
      setShowOverrideMenu(false);
      if (onSave) await onSave();
      console.log('Reset to calculated score successfully');
    } catch (error) {
      console.error('Error resetting score:', error);
      alert('Failed to reset score. Please try again.');
    }
  };

  const handleSetManualOverride = async (score: HealthScore) => {
    try {
      console.log('Setting manual override to:', score);
      await onUpdateHealth({ manual_override_score: score });
      setShowOverrideMenu(false);
      if (onSave) await onSave();
      console.log('Manual override set successfully');
    } catch (error) {
      console.error('Error setting manual override:', error);
      alert('Failed to set health status. Please try again.');
    }
  };

  const currentHealthScore = health?.manual_override_score || health?.calculated_score || 'green';
  const healthColor = getHealthScoreColor(currentHealthScore as any);
  const healthLabel = getHealthScoreLabel(currentHealthScore as any);
  const isManualOverride = !!health?.manual_override_score;

  const factors: HealthScoreFactors = {
    daysSinceLastContact: health?.days_since_last_contact || 0,
    daysUntilRenewal: health?.days_until_renewal || null,
    openOverdueActions: health?.open_overdue_actions || 0,
  };

  const breakdown = getHealthScoreBreakdown(factors);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px'
          }}>
            <Activity size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Health Score</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Overall client health and engagement</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'start', marginBottom: '32px' }}>
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div
              onClick={() => setShowOverrideMenu(!showOverrideMenu)}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: healthColor,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
                transform: showOverrideMenu ? 'scale(1.05)' : 'scale(1)',
                boxShadow: showOverrideMenu ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)'
              }}
            >
              {currentHealthScore === 'green' && <CheckCircle size={40} />}
              {currentHealthScore === 'yellow' && <AlertTriangle size={40} />}
              {currentHealthScore === 'red' && <AlertCircle size={40} />}
            </div>

            {isManualOverride && isHovering && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetToCalculated();
                }}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
                title="Reset to calculated score"
              >
                <RefreshCw size={18} color="#64748b" />
              </button>
            )}

            {showOverrideMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '12px',
                background: 'white',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                zIndex: 10,
                minWidth: '200px'
              }}>
                <div style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 600, color: '#94a3b8', borderBottom: '1px solid #e2e8f0' }}>
                  SET HEALTH STATUS
                </div>
                {(['green', 'yellow', 'red'] as HealthScore[]).map(score => (
                  <button
                    key={score}
                    onClick={() => handleSetManualOverride(score)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: currentHealthScore === score ? '#f8fafc' : 'white',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#0f172a',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = currentHealthScore === score ? '#f8fafc' : 'white'}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: getHealthScoreColor(score),
                      flexShrink: 0
                    }} />
                    {getHealthScoreLabel(score)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              {healthLabel}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
              {isManualOverride ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                  Manual Override Active
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  Automatically Calculated
                </span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
              Click the health score circle to manually override the status.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#475569', marginBottom: '16px' }}>Contributing Factors</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {breakdown.map((factor, index) => (
              <div key={index} style={{
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#94a3b8'
                }} />
                {factor}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Concerns & Issues
            </label>
            <textarea
              value={localHealth.concerns || ''}
              onChange={(e) => handleHealthChange('concerns', e.target.value)}
              placeholder="Document any concerns, risks, or issues..."
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

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Wins & Achievements
            </label>
            <textarea
              value={localHealth.success_wins || ''}
              onChange={(e) => handleHealthChange('success_wins', e.target.value)}
              placeholder="Document success stories, wins, and achievements..."
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
            <label style={{ display: 'flex', alignItems: 'center', marginTop: '12px', fontSize: '14px', color: '#475569', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localHealth.show_in_success_stories || false}
                onChange={(e) => handleHealthChange('show_in_success_stories', e.target.checked)}
                style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Show in Success Stories tab
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Relationship Notes
            </label>
            <textarea
              value={localHealth.relationship_notes || ''}
              onChange={(e) => handleHealthChange('relationship_notes', e.target.value)}
              placeholder="Notes about the relationship, engagement patterns, communication preferences..."
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

      {clientId && <SuccessStoriesSection clientId={clientId} />}

      {hasChanges && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'white',
          borderRadius: '12px',
          padding: '16px 24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 50
        }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>You have unsaved changes</span>
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}
