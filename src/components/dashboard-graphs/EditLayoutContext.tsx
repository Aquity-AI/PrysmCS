import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface EditLayoutState {
  isEditing: boolean;
  toggleEditing: () => void;
  setEditing: (editing: boolean) => void;
  hasPendingChanges: boolean;
  canUndo: boolean;
  saveEditing: () => void;
  cancelEditing: () => void;
  undoLastAction: () => void;
  registerCallbacks: (callbacks: GridCallbacks) => () => void;
  registerLayoutCallbacks: (callbacks: LayoutCallbacks) => () => void;
  notifyChange: () => void;
}

export interface GridCallbacks {
  commitDeletions: () => Promise<void>;
  discardDeletions: () => void;
  hasPendingDeletions: () => boolean;
  handleUndo: () => void;
  canUndo: () => boolean;
}

export interface LayoutCallbacks {
  commitChanges: () => Promise<void>;
  discardChanges: () => void;
  hasPendingChanges: () => boolean;
  handleUndo: () => void;
  canUndo: () => boolean;
}

const EditLayoutContext = createContext<EditLayoutState>({
  isEditing: false,
  toggleEditing: () => {},
  setEditing: () => {},
  hasPendingChanges: false,
  canUndo: false,
  saveEditing: () => {},
  cancelEditing: () => {},
  undoLastAction: () => {},
  registerCallbacks: () => () => {},
  registerLayoutCallbacks: () => () => {},
  notifyChange: () => {},
});

export function useEditLayout() {
  return useContext(EditLayoutContext);
}

export function EditLayoutProvider({ children }: { children: React.ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const registeredGrids = useRef<Map<number, GridCallbacks>>(new Map());
  const registeredLayouts = useRef<Map<number, LayoutCallbacks>>(new Map());
  const nextId = useRef(0);

  const refreshDerivedState = useCallback(() => {
    let pending = false;
    let undo = false;
    registeredGrids.current.forEach(cb => {
      if (cb.hasPendingDeletions()) pending = true;
      if (cb.canUndo()) undo = true;
    });
    registeredLayouts.current.forEach(cb => {
      if (cb.hasPendingChanges()) pending = true;
      if (cb.canUndo()) undo = true;
    });
    setHasPendingChanges(pending);
    setCanUndo(undo);
  }, []);

  const registerCallbacks = useCallback((callbacks: GridCallbacks) => {
    const id = nextId.current++;
    registeredGrids.current.set(id, callbacks);
    refreshDerivedState();
    return () => {
      registeredGrids.current.delete(id);
      refreshDerivedState();
    };
  }, [refreshDerivedState]);

  const registerLayoutCallbacks = useCallback((callbacks: LayoutCallbacks) => {
    const id = nextId.current++;
    registeredLayouts.current.set(id, callbacks);
    refreshDerivedState();
    return () => {
      registeredLayouts.current.delete(id);
      refreshDerivedState();
    };
  }, [refreshDerivedState]);

  const saveEditing = useCallback(async () => {
    const promises: Promise<void>[] = [];
    registeredGrids.current.forEach(cb => {
      promises.push(cb.commitDeletions());
    });
    registeredLayouts.current.forEach(cb => {
      promises.push(cb.commitChanges());
    });
    await Promise.all(promises);
    setIsEditing(false);
    setHasPendingChanges(false);
    setCanUndo(false);
  }, []);

  const cancelEditing = useCallback(() => {
    registeredGrids.current.forEach(cb => {
      cb.discardDeletions();
    });
    registeredLayouts.current.forEach(cb => {
      cb.discardChanges();
    });
    setIsEditing(false);
    setHasPendingChanges(false);
    setCanUndo(false);
  }, []);

  const undoLastAction = useCallback(() => {
    let didUndo = false;
    registeredGrids.current.forEach(cb => {
      if (cb.canUndo() && !didUndo) {
        cb.handleUndo();
        didUndo = true;
      }
    });
    registeredLayouts.current.forEach(cb => {
      if (cb.canUndo() && !didUndo) {
        cb.handleUndo();
        didUndo = true;
      }
    });
    setTimeout(refreshDerivedState, 0);
  }, [refreshDerivedState]);

  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undoLastAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, undoLastAction]);

  const toggleEditing = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  const setEditing = useCallback((editing: boolean) => {
    setIsEditing(editing);
  }, []);

  return (
    <EditLayoutContext.Provider value={{
      isEditing,
      toggleEditing,
      setEditing,
      hasPendingChanges,
      canUndo,
      saveEditing,
      cancelEditing,
      undoLastAction,
      registerCallbacks,
      registerLayoutCallbacks,
      notifyChange: refreshDerivedState,
    }}>
      {children}
    </EditLayoutContext.Provider>
  );
}
