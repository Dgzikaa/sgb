import { useState, useCallback } from 'react';

export function useBulkSelection<T extends { id: string }>(items: T[] = []) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedItems(prev => {
      if (prev.size === items.length) {
        return new Set();
      } else {
        return new Set(items.map(item => item.id));
      }
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isSelected = useCallback(
    (id: string) => {
      return selectedItems.has(id);
    },
    [selectedItems]
  );

  const isAllSelected = items.length > 0 && selectedItems.size === items.length;
  const isIndeterminate =
    selectedItems.size > 0 && selectedItems.size < items.length;
  const selectedCount = selectedItems.size;

  return {
    selectedItems,
    isAllSelected,
    isIndeterminate,
    selectedCount,
    toggleItem,
    toggleAll,
    clearSelection,
    isSelected,
  };
}
