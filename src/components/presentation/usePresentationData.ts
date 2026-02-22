import { useState, useEffect, useCallback, useRef } from 'react';
import { useReportData } from '../report/useReportData';
import { fetchPresentationConfig, upsertPresentationConfig, touchPresentationConfig } from './presentationService';
import { generateSlidesFromDashboard, mergeSlidesWithOverrides, extractOverridesFromSlides } from './generateSlides';
import type { SlideData, PresentationConfig, PresentationGlobalSettings, SlideOverride, PresentationBranding } from './types';

const DEFAULT_GLOBAL_SETTINGS: PresentationGlobalSettings = {
  animation: 'fade',
  compactMode: false,
};

export function usePresentationData(
  clientId: string,
  customization: any,
  dashboardData: any,
  formSchemaGetter: (clientId?: string) => any,
  fieldTypes: any,
  branding: PresentationBranding,
  monthLabel: string,
  isOpen: boolean,
) {
  const reportData = useReportData(clientId, customization, dashboardData, formSchemaGetter, fieldTypes);

  const [slides, setSlides] = useState<SlideData[]>([]);
  const [savedConfig, setSavedConfig] = useState<PresentationConfig | null>(null);
  const [globalSettings, setGlobalSettings] = useState<PresentationGlobalSettings>(DEFAULT_GLOBAL_SETTINGS);
  const [configLoading, setConfigLoading] = useState(true);
  const [dataTimestamp, setDataTimestamp] = useState<number>(Date.now());

  const generatedSlidesRef = useRef<SlideData[]>([]);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  const generateAndMerge = useCallback((config: PresentationConfig | null, compactOverride?: boolean) => {
    const compact = compactOverride ?? config?.global_settings?.compactMode ?? globalSettings.compactMode;

    const generated = generateSlidesFromDashboard({
      tabs: reportData.tabs,
      stories: reportData.stories,
      priorities: reportData.priorities,
      csmInfo: reportData.csmInfo,
      clientOverview: reportData.clientOverview,
      branding,
      monthLabel,
      compactMode: compact,
    });
    generatedSlidesRef.current = generated;

    const overrides = config?.slide_overrides || {};
    const customSlides = (config?.custom_slides || []) as SlideData[];
    const merged = mergeSlidesWithOverrides(generated, overrides as Record<string, SlideOverride>, customSlides);

    return merged;
  }, [reportData, branding, monthLabel, globalSettings.compactMode]);

  const generateAndMergeRef = useRef(generateAndMerge);
  generateAndMergeRef.current = generateAndMerge;
  const savedConfigRef = useRef(savedConfig);
  savedConfigRef.current = savedConfig;

  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
      setConfigLoading(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !clientId) return;
    if (reportData.loading) return;

    if (initializedRef.current) {
      const merged = generateAndMergeRef.current(savedConfigRef.current);
      setSlides(merged);
      return;
    }

    let cancelled = false;

    const init = async () => {
      setConfigLoading(true);
      try {
        const config = await fetchPresentationConfig(clientId);
        if (cancelled) return;

        setSavedConfig(config);
        savedConfigRef.current = config;

        if (config?.global_settings) {
          setGlobalSettings({
            ...DEFAULT_GLOBAL_SETTINGS,
            ...config.global_settings,
          });
        }

        const merged = generateAndMergeRef.current(config);
        setSlides(merged);
        setDataTimestamp(Date.now());

        await touchPresentationConfig(clientId);
      } catch (err) {
        console.error('[usePresentationData] Init error:', err);
        const merged = generateAndMergeRef.current(null);
        setSlides(merged);
      } finally {
        if (!cancelled) {
          setConfigLoading(false);
          initializedRef.current = true;
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [isOpen, clientId, reportData.loading, reportData.tabs, reportData.stories, reportData.priorities, reportData.csmInfo, reportData.clientOverview]);

  const scheduleSave = useCallback((updatedSlides: SlideData[], updatedSettings: PresentationGlobalSettings) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (!clientId) return;
      try {
        const { overrides, customSlides } = extractOverridesFromSlides(updatedSlides, generatedSlidesRef.current);
        const result = await upsertPresentationConfig(clientId, overrides, updatedSettings, customSlides);
        if (result) {
          setSavedConfig(result);
        }
      } catch (err) {
        console.error('[usePresentationData] Save error:', err);
      }
    }, 1500);
  }, [clientId]);

  const updateSlides = useCallback((updater: (prev: SlideData[]) => SlideData[]) => {
    setSlides(prev => {
      const next = updater(prev);
      scheduleSave(next, globalSettings);
      return next;
    });
  }, [scheduleSave, globalSettings]);

  const updateGlobalSettings = useCallback((updates: Partial<PresentationGlobalSettings>) => {
    setGlobalSettings(prev => {
      const next = { ...prev, ...updates };

      if (updates.compactMode !== undefined && updates.compactMode !== prev.compactMode) {
        const merged = generateAndMerge(savedConfig, updates.compactMode);
        setSlides(merged);
        scheduleSave(merged, next);
      } else {
        scheduleSave(slides, next);
      }

      return next;
    });
  }, [generateAndMerge, savedConfig, scheduleSave, slides]);

  const refreshData = useCallback(async () => {
    if (!clientId) return;
    const config = await fetchPresentationConfig(clientId);
    setSavedConfig(config);
    const merged = generateAndMerge(config);
    setSlides(merged);
    setDataTimestamp(Date.now());
  }, [clientId, generateAndMerge]);

  const forceSave = useCallback(async () => {
    if (!clientId) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const { overrides, customSlides } = extractOverridesFromSlides(slides, generatedSlidesRef.current);
    await upsertPresentationConfig(clientId, overrides, globalSettings, customSlides);
  }, [clientId, slides, globalSettings]);

  return {
    slides,
    setSlides: updateSlides,
    globalSettings,
    updateGlobalSettings,
    loading: reportData.loading || configLoading,
    dataTimestamp,
    refreshData,
    forceSave,
    reportData,
  };
}
