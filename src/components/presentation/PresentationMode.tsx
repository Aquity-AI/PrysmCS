import { useState, useMemo } from 'react';
import { Loader } from 'lucide-react';
import { PresentationEditor } from './PresentationEditor';
import { PresentationViewer } from './PresentationViewer';
import { usePresentationData } from './usePresentationData';
import type { PresentationBranding } from './types';

interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  selectedMonth: string;
  dashboardData: any;
  clientInfo: any;
  monthLabel: string;
  customization: any;
  getFormSchema: (clientId?: string) => any;
  FIELD_TYPES: any;
}

export function PresentationMode({
  isOpen,
  onClose,
  clientId,
  dashboardData,
  monthLabel,
  customization,
  getFormSchema,
  FIELD_TYPES,
}: PresentationModeProps) {
  const [isPresenting, setIsPresenting] = useState(false);

  const branding: PresentationBranding = useMemo(() => ({
    primaryColor: customization?.branding?.primaryColor || '#06b6d4',
    accentColor: customization?.branding?.accentColor || '#14b8a6',
    secondaryColor: customization?.branding?.secondaryColor,
    slideBg: customization?.branding?.slideBg || 'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)',
    fontFamily: customization?.branding?.fontFamily || 'Inter',
    platformName: customization?.branding?.platformName || 'PrysmCS',
    platformTagline: customization?.branding?.platformTagline || '',
    logoUrl: customization?.branding?.logoUrl || null,
    logoMode: customization?.branding?.logoMode || 'default',
  }), [customization?.branding]);

  const {
    slides,
    setSlides,
    globalSettings,
    updateGlobalSettings,
    loading,
    dataTimestamp,
    refreshData,
    forceSave,
  } = usePresentationData(
    clientId,
    customization,
    dashboardData,
    getFormSchema,
    FIELD_TYPES,
    branding,
    monthLabel,
    isOpen,
  );

  const enabledSlides = useMemo(() =>
    slides.filter(s => s.enabled).sort((a, b) => a.order - b.order),
    [slides]
  );

  const handleClose = async () => {
    await forceSave();
    setIsPresenting(false);
    onClose();
  };

  if (!isOpen) return null;

  if (isPresenting && enabledSlides.length > 0) {
    return (
      <PresentationViewer
        slides={enabledSlides}
        branding={branding}
        animation={globalSettings.animation}
        onClose={() => setIsPresenting(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="pres-editor-overlay">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, color: 'rgba(255,255,255,0.6)',
        }}>
          <Loader size={32} className="animate-spin" style={{ color: branding.primaryColor }} />
          <p style={{ fontSize: 14 }}>Loading presentation data...</p>
        </div>
      </div>
    );
  }

  return (
    <PresentationEditor
      slides={slides}
      branding={branding}
      animation={globalSettings.animation}
      compactMode={globalSettings.compactMode}
      dataTimestamp={dataTimestamp}
      onSlidesChange={setSlides}
      onAnimationChange={(anim) => updateGlobalSettings({ animation: anim })}
      onCompactModeChange={(compact) => updateGlobalSettings({ compactMode: compact })}
      onPresent={() => setIsPresenting(true)}
      onRefresh={refreshData}
      onClose={handleClose}
    />
  );
}
