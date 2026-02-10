import React, { useState, useEffect } from 'react';
import { Building2, Users, Target, Activity, ClipboardList, FileText } from 'lucide-react';
import { useSuccessPlanning } from './useSuccessPlanning';
import { ClientOverviewTab } from './ClientOverviewTab';
import { InternalTeamTab } from './InternalTeamTab';
import { SuccessPlanTab } from './SuccessPlanTab';
import { ActivityLogTab } from './ActivityLogTab';
import { ActionItemsTab } from './ActionItemsTab';
import { HealthScoreTab } from './HealthScoreTab';
import { useResponsive } from './responsiveUtils';

interface SuccessPlanningProps {
  clientId: string;
  clientName: string;
  currentUserName: string;
  clientInfo?: any;
  setClientInfo?: (info: any) => void;
  onSave?: (formData: any, stories: any, opportunities: any, clientInfo: any) => void;
  onClientNameChange?: (newName: string) => void;
  defaultTab?: TabType;
}

type TabType = 'overview' | 'health' | 'team' | 'plan' | 'activity' | 'actions';

const TABS: Array<{ id: TabType; label: string; icon: any }> = [
  { id: 'overview', label: 'Client Overview', icon: Building2 },
  { id: 'health', label: 'Health Score', icon: Activity },
  { id: 'team', label: 'Internal Team', icon: Users },
  { id: 'plan', label: 'Success Plan', icon: Target },
  { id: 'activity', label: 'Activity Log', icon: FileText },
  { id: 'actions', label: 'Action Items', icon: ClipboardList },
];

export function SuccessPlanning({
  clientId,
  clientName,
  currentUserName,
  clientInfo,
  setClientInfo,
  onSave,
  onClientNameChange,
  defaultTab = 'overview'
}: SuccessPlanningProps) {
  console.log('[SuccessPlanning] Rendering with defaultTab:', defaultTab, 'clientId:', clientId);
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const { isMobile } = useResponsive();

  // Sync active tab when defaultTab changes (e.g., when navigating from Data Management)
  useEffect(() => {
    console.log('[SuccessPlanning] defaultTab changed to:', defaultTab);
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const {
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
    refetch,
  } = useSuccessPlanning(clientId);

  useEffect(() => {
    const generateDemoData = () => {
      const baseData = {
        company_name: clientInfo?.clientName || clientName,
        address: clientInfo?.address || '',
        phone: clientInfo?.phone || '',
        email: clientInfo?.email || '',
        website: clientInfo?.website || '',
        arr: 0,
        contract_term_months: 12,
        contract_start_date: '2025-01-01',
        renewal_date: '2025-12-31',
      };

      const clientDemoData: Record<string, any> = {
        'apex-solutions': {
          address: '456 Healthcare Plaza, Suite 200, Boston, MA 02101',
          phone: '(617) 555-0100',
          email: 'contact@apexsolutions.com',
          website: 'www.apexsolutions.com',
          arr: 240000,
          contract_term_months: 24,
          contract_start_date: '2024-06-01',
          renewal_date: '2026-06-01',
        },
        'cascade-enterprises': {
          address: '789 Enterprise Way, Seattle, WA 98101',
          phone: '(206) 555-0200',
          email: 'info@cascadeenterprises.com',
          website: 'www.cascadeenterprises.com',
          arr: 180000,
          contract_term_months: 12,
          contract_start_date: '2024-11-01',
          renewal_date: '2025-11-01',
        },
        'summit-partners-group': {
          address: '321 Summit Avenue, Denver, CO 80202',
          phone: '(303) 555-0300',
          email: 'hello@summitpartners.com',
          website: 'www.summitpartners.com',
          arr: 360000,
          contract_term_months: 36,
          contract_start_date: '2024-01-01',
          renewal_date: '2027-01-01',
        },
      };

      return {
        ...baseData,
        ...(clientDemoData[clientId] || {
          address: '123 Main Street, Suite 100, San Francisco, CA 94105',
          phone: '(555) 123-4567',
          email: 'contact@example.com',
          website: 'www.example.com',
          arr: 120000,
        }),
      };
    };

    if (!loading && overview && !overview.company_name && clientInfo) {
      const demoData = generateDemoData();
      console.log('[SuccessPlanning] Populating empty overview with demo data:', demoData);
      saveOverview(demoData);
    } else if (!loading && !overview && clientInfo) {
      const demoData = generateDemoData();
      console.log('[SuccessPlanning] Creating new overview with demo data:', demoData);
      saveOverview(demoData);
    }
  }, [loading, overview, clientInfo, clientId, clientName]);

  const notificationCounts = {
    overview: 0,
    health: health?.calculated_score === 'red' || health?.manual_override_score === 'red' ? 1 : 0,
    team: 0,
    plan: goals.filter(g => g.status === 'At Risk').length,
    activity: 0,
    actions: actions.filter(a => a.status !== 'Completed' && a.due_date && new Date(a.due_date) < new Date()).length,
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#94a3b8',
        fontSize: '16px'
      }}>
        Loading success planning data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#ef4444',
        fontSize: '16px'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc'
    }}>
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: isMobile ? '16px' : '24px 32px'
      }}>
        <h1 style={{
          fontSize: isMobile ? '22px' : '28px',
          fontWeight: 700,
          color: '#0f172a',
          margin: '0 0 8px 0'
        }}>
          Success Planning
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          margin: 0
        }}>
          Comprehensive success management for {clientName}
        </p>
      </div>

      <div style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: isMobile ? '0 8px' : '0 32px',
        overflowX: isMobile ? 'auto' : 'visible'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '4px' : '8px'
        }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasNotification = notificationCounts[tab.id] > 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: isMobile ? '12px 12px' : '16px 24px',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#14b8a6' : '#64748b',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderBottom: isActive ? '3px solid #14b8a6' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <Icon size={18} />
                {isMobile ? tab.label.split(' ')[0] : tab.label}
                {hasNotification && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '20px',
                    height: '20px',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {notificationCounts[tab.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {activeTab === 'overview' && (
          <ClientOverviewTab
            overview={overview}
            stakeholders={stakeholders}
            health={health}
            documents={documents}
            onUpdateOverview={async (data) => {
              const savedData = await saveOverview(data);

              if (setClientInfo && clientInfo) {
                const updatedClientInfo = {
                  ...clientInfo,
                  clientName: data.company_name || clientInfo.clientName,
                  address: data.address || clientInfo.address,
                  phone: data.phone || clientInfo.phone,
                  email: data.email || clientInfo.email,
                  website: data.website || clientInfo.website,
                };
                setClientInfo(updatedClientInfo);

                if (onSave) {
                  onSave(null, null, null, updatedClientInfo);
                }

                if (onClientNameChange && data.company_name) {
                  onClientNameChange(data.company_name);
                }
              }

              return savedData;
            }}
            onUpdateStakeholder={saveStakeholder}
            onDeleteStakeholder={deleteStakeholder}
            onUpdateDocument={saveDocument}
            onDeleteDocument={deleteDocument}
            onSave={refetch}
          />
        )}

        {activeTab === 'health' && (
          <HealthScoreTab
            health={health}
            onUpdateHealth={saveHealth}
            onSave={refetch}
            clientId={clientId}
          />
        )}

        {activeTab === 'team' && (
          <InternalTeamTab
            teamMembers={teamMembers}
            onUpdateTeamMember={saveTeamMember}
            onDeleteTeamMember={deleteTeamMember}
            clientId={clientId}
          />
        )}

        {activeTab === 'plan' && (
          <SuccessPlanTab
            goals={goals}
            onUpdateGoal={saveGoal}
            onDeleteGoal={deleteGoal}
            clientId={clientId}
            overview={overview}
            onUpdateOverview={saveOverview}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityLogTab
            activities={activities}
            clientId={clientId}
            userName={currentUserName}
            onRefresh={refetch}
          />
        )}

        {activeTab === 'actions' && (
          <ActionItemsTab
            actions={actions}
            teamMembers={teamMembers}
            onUpdateAction={saveAction}
            onDeleteAction={deleteAction}
            clientId={clientId}
          />
        )}
      </div>
    </div>
  );
}
