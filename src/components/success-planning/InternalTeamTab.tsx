import React, { useState, useEffect } from 'react';
import { Users, UserCog, Plus, X, Save } from 'lucide-react';
import { TeamMember } from './useSuccessPlanning';
import { supabase } from './supabaseClient';
import { useResponsive, getResponsiveGridCols, getResponsiveModalWidth } from './responsiveUtils';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  job_title?: string;
  department?: string;
}

interface InternalTeamTabProps {
  teamMembers: TeamMember[];
  onUpdateTeamMember: (data: Partial<TeamMember>) => Promise<void>;
  onDeleteTeamMember: (id: string) => Promise<void>;
  clientId: string;
  currentUserEmail?: string;
}

export function InternalTeamTab({
  teamMembers,
  onUpdateTeamMember,
  onDeleteTeamMember,
  clientId,
  currentUserEmail,
}: InternalTeamTabProps) {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [localTeamMembers, setLocalTeamMembers] = useState<TeamMember[]>(teamMembers);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    client_id: clientId,
    user_name: '',
    user_email: '',
    user_phone: '',
    role_type: '',
    is_primary: false,
    assignment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    setLocalTeamMembers(teamMembers);
    setPendingDeletes(new Set());
    setHasUnsavedChanges(false);
  }, [teamMembers]);

  const visibleMembers = localTeamMembers.filter(m => !pendingDeletes.has(m.id!));
  const primaryCSM = visibleMembers.find(m => m.is_primary);
  const otherMembers = visibleMembers.filter(m => !m.is_primary);

  const roleColors: Record<string, string> = {
    CSM: '#14b8a6',
    'Account Executive': '#3b82f6',
    'Support Contact': '#8b5cf6',
    'Implementation Specialist': '#f59e0b',
    'Executive Sponsor': '#ec4899',
    'Other': '#64748b',
  };

  useEffect(() => {
    fetchUserProfiles();
  }, []);

  const fetchUserProfiles = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('full_name');

    if (error) {
      console.error('Error fetching user profiles:', error);
      return;
    }

    setUserProfiles(data || []);
  };

  const handleSelectProfile = (profile: UserProfile) => {
    const roleType = profile.job_title || '';

    setNewMember({
      client_id: clientId,
      user_name: profile.full_name,
      user_email: profile.email,
      user_phone: profile.phone || '',
      role_type: roleType,
      is_primary: false,
      assignment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setShowProfileSelector(false);
    setIsAddingMember(true);
  };

  const handleAddMember = () => {
    if (newMember.user_name && newMember.role_type) {
      const tempId = `temp-${Date.now()}`;
      const memberToAdd: TeamMember = {
        ...newMember,
        id: tempId,
      } as TeamMember;

      setLocalTeamMembers([...localTeamMembers, memberToAdd]);
      setHasUnsavedChanges(true);
      setNewMember({
        client_id: clientId,
        user_name: '',
        user_email: '',
        user_phone: '',
        role_type: '',
        is_primary: false,
        assignment_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setIsAddingMember(false);
    }
  };

  const handleUpdateMember = (member: TeamMember, updates: Partial<TeamMember>) => {
    setLocalTeamMembers(
      localTeamMembers.map(m =>
        m.id === member.id ? { ...m, ...updates } : m
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleDeleteMember = (memberId: string) => {
    setPendingDeletes(new Set([...pendingDeletes, memberId]));
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      for (const memberId of pendingDeletes) {
        if (!memberId.startsWith('temp-')) {
          await onDeleteTeamMember(memberId);
        }
      }

      for (const member of localTeamMembers) {
        if (!pendingDeletes.has(member.id!)) {
          if (member.id?.startsWith('temp-')) {
            const { id, ...memberData } = member;
            await onUpdateTeamMember(memberData);
          } else {
            const originalMember = teamMembers.find(m => m.id === member.id);
            if (JSON.stringify(originalMember) !== JSON.stringify(member)) {
              await onUpdateTeamMember(member);
            }
          }
        }
      }

      setPendingDeletes(new Set());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleDiscardChanges = () => {
    setLocalTeamMembers(teamMembers);
    setPendingDeletes(new Set());
    setHasUnsavedChanges(false);
    setIsAddingMember(false);
  };

  return (
    <div style={{ padding: '24px' }}>
      {hasUnsavedChanges && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 0',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '16px',
            color: '#64748b',
            fontWeight: 500
          }}>
            You have unsaved changes
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleDiscardChanges}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#64748b',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Discard
            </button>
            <button
              onClick={handleSaveChanges}
              style={{
                padding: '12px 24px',
                background: '#14b8a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      )}

      {primaryCSM && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
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
              <UserCog size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Customer Success Manager</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Primary point of contact</p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'start',
            padding: '20px',
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
            borderRadius: '12px',
            border: '2px solid #14b8a6'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#14b8a6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 700,
              marginRight: '20px',
              flexShrink: 0
            }}>
              {primaryCSM.user_name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                {primaryCSM.user_name}
              </div>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                Assigned: {new Date(primaryCSM.assignment_date).toLocaleDateString()}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 1, 2, isMobile, isTablet), gap: '12px' }}>
                {primaryCSM.user_email && (
                  <div style={{ fontSize: '14px', color: '#475569' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Email</div>
                    {primaryCSM.user_email}
                  </div>
                )}
                {primaryCSM.user_phone && (
                  <div style={{ fontSize: '14px', color: '#475569' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Phone</div>
                    {primaryCSM.user_phone}
                  </div>
                )}
              </div>
              {primaryCSM.notes && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                  {primaryCSM.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              <Users size={20} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Team Members</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Additional support and resources</p>
            </div>
          </div>
          <button
            onClick={() => setShowProfileSelector(true)}
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
            Add Team Member
          </button>
        </div>

        {isAddingMember && (
          <div style={{
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px dashed #cbd5e1'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>Add New Team Member</h3>
            <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 1, 2, isMobile, isTablet), gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={newMember.user_name || ''}
                  onChange={(e) => setNewMember({ ...newMember, user_name: e.target.value })}
                  placeholder="Full name"
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
                  Role *
                </label>
                <select
                  value={newMember.role_type || ''}
                  onChange={(e) => setNewMember({ ...newMember, role_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0f172a'
                  }}
                >
                  <option value="">Select role...</option>
                  <option value="CSM">Customer Success Manager</option>
                  <option value="Account Executive">Account Executive</option>
                  <option value="Support Contact">Support Contact</option>
                  <option value="Implementation Specialist">Implementation Specialist</option>
                  <option value="Executive Sponsor">Executive Sponsor</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={newMember.user_email || ''}
                  onChange={(e) => setNewMember({ ...newMember, user_email: e.target.value })}
                  placeholder="email@company.com"
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
                  Phone
                </label>
                <input
                  type="text"
                  value={newMember.user_phone || ''}
                  onChange={(e) => setNewMember({ ...newMember, user_phone: e.target.value })}
                  placeholder="(555) 555-5555"
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
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Notes
              </label>
              <textarea
                value={newMember.notes || ''}
                onChange={(e) => setNewMember({ ...newMember, notes: e.target.value })}
                placeholder="Additional context about their involvement..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#0f172a',
                  minHeight: '60px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddMember}
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
                Add Member
              </button>
              <button
                onClick={() => setIsAddingMember(false)}
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
        )}

        {otherMembers.length === 0 && !isAddingMember && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            No additional team members assigned. Click "Add Team Member" to assign someone.
          </div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          {otherMembers.map((member) => (
            <div key={member.id} style={{
              padding: '20px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'start' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: roleColors[member.role_type] || '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 700,
                    marginRight: '16px',
                    flexShrink: 0
                  }}>
                    {member.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      {member.user_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      Assigned: {new Date(member.assignment_date).toLocaleDateString()}
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      background: roleColors[member.role_type] || '#64748b',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      {member.role_type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => member.id && handleDeleteMember(member.id)}
                  style={{
                    padding: '8px',
                    background: 'white',
                    color: '#ef4444',
                    border: '1px solid #fee2e2',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Remove team member"
                >
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: getResponsiveGridCols(1, 1, 2, isMobile, isTablet), gap: '12px', marginBottom: member.notes ? '12px' : 0 }}>
                {member.user_email && (
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Email</div>
                    {member.user_email}
                  </div>
                )}
                {member.user_phone && (
                  <div style={{ fontSize: '13px', color: '#475569' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Phone</div>
                    {member.user_phone}
                  </div>
                )}
              </div>
              {member.notes && (
                <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  {member.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showProfileSelector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: isMobile ? '90vw' : '500px',
            maxWidth: isMobile ? '90vw' : '500px',
            maxHeight: '600px',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Select Your Profile
              </h3>
              <button
                onClick={() => setShowProfileSelector(false)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <button
                  onClick={() => {
                    setShowProfileSelector(false);
                    setIsAddingMember(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'white',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#14b8a6';
                    e.currentTarget.style.color = '#14b8a6';
                    e.currentTarget.style.background = '#f0fdfa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <Plus size={18} />
                  Enter Details Manually
                </button>
              </div>

              {userProfiles.length > 0 && (
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#64748b',
                  marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  Or select from existing team members
                </div>
              )}

              {userProfiles.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#94a3b8',
                  fontSize: '14px'
                }}>
                  No user profiles found.
                </div>
              )}

              <div style={{ display: 'grid', gap: '12px' }}>
                {userProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    style={{
                      padding: '16px',
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#8b5cf6';
                      e.currentTarget.style.background = '#f5f3ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#8b5cf6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 700,
                        flexShrink: 0
                      }}>
                        {profile.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
                          {profile.full_name}
                        </div>
                        {profile.job_title && (
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                            {profile.job_title}
                          </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {profile.email}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
