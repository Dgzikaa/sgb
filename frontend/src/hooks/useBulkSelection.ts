import { useState, useCallback, useMemo } from 'react'

export interface BulkSelectionItem {
  id: string | number;
  [key: string]: unknown;
}

export interface BulkSelectionConfig {
  onSelectAll?: (selected: boolean) => void
  onSelectionChange?: (selectedItems: BulkSelectionItem[]) => void
  maxSelection?: number
}

export function useBulkSelection<T extends BulkSelectionItem>(
  items: T[] = [],
  config: BulkSelectionConfig = {}
) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())
  
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(item.id))
  }, [items, selectedIds])

  const isAllSelected = useMemo(() => {
    return items.length > 0 && items.every(item => selectedIds.has(item.id))
  }, [items, selectedIds])

  const isIndeterminate = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < items.length
  }, [selectedIds.size, items.length])

  const selectItem = useCallback((id: string | number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        // Check max selection limit
        if (config.maxSelection && newSet.size >= config.maxSelection) {
          return prev // Don't add if max reached
        }
        newSet.add(id)
      }
      
      // Trigger callbacks
      const newSelectedItems = items.filter((item) => newSet.has(item.id))
      config.onSelectionChange?.(newSelectedItems)
      
      return newSet
    })
  }, [items, config])

  const selectMultiple = useCallback((ids: (string | number)[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      
      ids.forEach(id => {
        if (config.maxSelection && newSet.size >= config.maxSelection) {
          return
        }
        newSet.add(id)
      })
      
      const newSelectedItems = items.filter((item) => newSet.has(item.id))
      config.onSelectionChange?.(newSelectedItems)
      
      return newSet
    })
  }, [items, config])

  const selectAll = useCallback(() => {
    const newSelected = !isAllSelected
    
    if (newSelected) {
      const itemsToSelect = config.maxSelection 
        ? items.slice(0, config.maxSelection)
        : items
      
      setSelectedIds(new Set(itemsToSelect.map((item) => item.id)))
      config.onSelectionChange?.(itemsToSelect)
    } else {
      setSelectedIds(new Set())
      config.onSelectionChange?.([])
    }
    
    config.onSelectAll?.(newSelected)
  }, [isAllSelected, items, config])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    config.onSelectionChange?.([])
  }, [config])

  const selectRange = useCallback((startId: string | number, endId: string | number) => {
    const startIndex = items.findIndex(item => item.id === startId)
    const endIndex = items.findIndex(item => item.id === endId)
    
    if (startIndex === -1 || endIndex === -1) return
    
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    
    const rangeIds = items.slice(start, end + 1).map((item) => item.id)
    selectMultiple(rangeIds)
  }, [items, selectMultiple])

  const toggleItem = useCallback((id: string | number, event?: React.MouseEvent) => {
    if (event?.shiftKey && selectedIds.size > 0) {
      // Shift+click for range selection
      const lastSelected = Array.from(selectedIds).pop()
      if (lastSelected) {
        selectRange(lastSelected, id)
        return
      }
    }
    
    selectItem(id)
  }, [selectedIds, selectItem, selectRange])

  const isSelected = useCallback((id: string | number) => {
    return selectedIds.has(id)
  }, [selectedIds])

  const getSelectionStats = useCallback(() => {
    return {
      total: items.length,
      selected: selectedIds.size,
      percentage: items.length > 0 ? Math.round((selectedIds.size / items.length) * 100) : 0
    }
  }, [items.length, selectedIds.size])

  return {
    selectedIds,
    selectedItems,
    isAllSelected,
    isIndeterminate,
    selectItem,
    selectMultiple,
    selectAll,
    clearSelection,
    selectRange,
    toggleItem,
    isSelected,
    getSelectionStats,
    selectionCount: selectedIds.size
  }
} 

