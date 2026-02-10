import { useEffect, useRef } from 'react';
import { useWidgetLayout } from './WidgetLayoutContext';
import { useEditLayout, LayoutCallbacks } from '../dashboard-graphs/EditLayoutContext';
import { savePageLayout } from './layoutService';
import { PageLayoutConfig } from './types';

export function useWidgetLayoutIntegration(clientId: string, pageId: string) {
  const {
    widgets,
    hasPendingChanges,
    canUndo,
    commitChanges,
    discardChanges,
    undoLastChange,
    registerSaveCallback,
  } = useWidgetLayout();

  const { registerLayoutCallbacks, notifyChange } = useEditLayout();

  const hasPendingRef = useRef(hasPendingChanges);
  hasPendingRef.current = hasPendingChanges;

  const canUndoRef = useRef(canUndo);
  canUndoRef.current = canUndo;

  const commitRef = useRef(commitChanges);
  commitRef.current = commitChanges;

  const discardRef = useRef(discardChanges);
  discardRef.current = discardChanges;

  const undoRef = useRef(undoLastChange);
  undoRef.current = undoLastChange;

  useEffect(() => {
    registerSaveCallback(async (layout: PageLayoutConfig) => {
      await savePageLayout(clientId, pageId, layout);
    });
  }, [clientId, pageId, registerSaveCallback]);

  useEffect(() => {
    const callbacks: LayoutCallbacks = {
      commitChanges: () => commitRef.current(),
      discardChanges: () => discardRef.current(),
      hasPendingChanges: () => hasPendingRef.current,
      handleUndo: () => undoRef.current(),
      canUndo: () => canUndoRef.current,
    };

    return registerLayoutCallbacks(callbacks);
  }, [registerLayoutCallbacks]);

  useEffect(() => {
    notifyChange();
  }, [hasPendingChanges, canUndo, notifyChange]);

  return { widgets };
}
