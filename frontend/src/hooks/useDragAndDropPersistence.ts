import { useState, useEffect, useCallback } from 'react';

export interface PersistenceOptions {
  key: string;
  enabled?: boolean;
  debounceMs?: number;
  version?: number;
}

export function useDragAndDropPersistence<T>(
  defaultItems: T[],
  { key, enabled = true, debounceMs = 500, version = 1 }: PersistenceOptions
) {
  const [items, setItems] = useState<T[]>(defaultItems);
  const [isLoading, setIsLoading] = useState(true);

  // Create storage key with version
  const storageKey = `dragdrop_${key}_v${version}`;



  // Load from localStorage on mount
  useEffect(() => {
    if (!enabled) {
      setItems(defaultItems);
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedItems = JSON.parse(stored);

        // Validate that stored items have same structure
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          // Merge with default items to handle new items or structure changes
          const mergedItems = mergeWithDefaults(parsedItems, defaultItems);
          setItems(mergedItems);
        } else {
          setItems(defaultItems);
        }
      } else {
        setItems(defaultItems);
      }
    } catch (error) {
      console.warn('Failed to load persisted drag & drop data:', error);
      setItems(defaultItems);
    }

    setIsLoading(false);
  }, [storageKey, enabled, defaultItems]);

  // Debounced save to localStorage
  useEffect(() => {
    if (!enabled || isLoading) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(items));
      } catch (error) {
        console.warn('Failed to persist drag & drop data:', error);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [items, storageKey, enabled, debounceMs, isLoading]);

  // Merge function to handle structure changes
  const mergeWithDefaults = useCallback((stored: T[], defaults: T[]): T[] => {
    if (!defaults.length) return stored;

    // If stored items have same length as defaults, assume structure is compatible
    if (stored.length === defaults.length) {
      return stored;
    }

    // Otherwise, merge by ID if possible
    const hasIds = defaults.every(
      item => item && typeof item === 'object' && 'id' in item
    );

    if (hasIds) {
      const defaultMap = new Map(
        defaults.map(item => [(item as any).id, item])
      );
      const storedMap = new Map(
        stored.map(item => [(item as any).id, item])
      );

      // Preserve order from stored, add new items from defaults
      const merged: T[] = [];

      // First, add stored items that still exist in defaults
      stored.forEach(item => {
        if (defaultMap.has((item as any).id)) {
          merged.push(item);
        }
      });

      // Then, add new items from defaults that aren't in stored
      defaults.forEach(item => {
        if (!storedMap.has((item as any).id)) {
          merged.push(item);
        }
      });

      return merged;
    }

    // Fallback: return defaults if can't merge intelligently
    return defaults;
  }, []);

  // Reset to defaults
  const reset = useCallback(() => {
    setItems(defaultItems);
    if (enabled) {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn('Failed to clear persisted data:', error);
      }
    }
  }, [defaultItems, storageKey, enabled]);

  // Clear all persistence data for this key
  const clearPersistence = useCallback(() => {
    if (!enabled) return;

    try {
      // Remove current version
      localStorage.removeItem(storageKey);

      // Also try to remove other versions (cleanup)
      for (let v = 1; v <= 10; v++) {
        const versionKey = `dragdrop_${key}_v${v}`;
        localStorage.removeItem(versionKey);
      }
    } catch (error) {
      console.warn('Failed to clear persistence data:', error);
    }
  }, [storageKey, key, enabled]);

  // Force save current state
  const forceSave = useCallback(() => {
    if (!enabled) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to force save:', error);
    }
  }, [items, storageKey, enabled]);

  return {
    items,
    setItems,
    isLoading,
    reset,
    clearPersistence,
    forceSave,
    isPersistenceEnabled: enabled,
  };
}

// ATENÇÃO: NÃO USAR! Este hook viola as regras dos hooks do React e causa erro de lint.
// export function useMultipleDragAndDropPersistence<T>(
//   configs: Array<{ key: string; defaultItems: T[]; options?: Omit<PersistenceOptions, 'key'> }>
// ) {
//   const results = configs.map(({ key, defaultItems, options = {} }) =>
//     useDragAndDropPersistence(defaultItems, { key, ...options })
//   )
//
//   const isLoading = results.some(result => result.isLoading)
//
//   const resetAll = useCallback(() => {
//     results.forEach(result => result.reset())
//   }, [results])
//
//   const clearAllPersistence = useCallback(() => {
//     results.forEach(result => result.clearPersistence())
//   }, [results])
//
//   return {
//     results,
//     isLoading,
//     resetAll,
//     clearAllPersistence
//   }
// }

// Hook específico para checklists
export function useChecklistPersistence(defaultChecklists: unknown[]) {
  return useDragAndDropPersistence(defaultChecklists, {
    key: 'checklists',
    enabled: true,
    debounceMs: 1000,
    version: 1,
  });
}

// Hook específico para tasks
export function useTasksPersistence(defaultTasks: unknown[]) {
  return useDragAndDropPersistence(defaultTasks, {
    key: 'tasks',
    enabled: true,
    debounceMs: 800,
    version: 1,
  });
}
