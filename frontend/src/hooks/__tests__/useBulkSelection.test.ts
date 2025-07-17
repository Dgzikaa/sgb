import { renderHook, act } from '@testing-library/react'
import { useBulkSelection } from '../useBulkSelection'

describe('useBulkSelection', () => {
  const mockItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
    { id: '4', name: 'Item 4' },
  ]

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    expect(result.current.selectedIds.size).toBe(0)
    expect(result.current.selectedItems).toEqual([])
    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.isIndeterminate).toBe(false)
    expect(result.current.selectionCount).toBe(0)
  })

  it('should select individual items', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    act(() => {
      result.current.selectItem('1')
    })

    expect(result.current.selectedIds.has('1')).toBe(true)
    expect(result.current.selectedItems).toEqual([{ id: '1', name: 'Item 1' }])
    expect(result.current.selectionCount).toBe(1)
    expect(result.current.isSelected('1')).toBe(true)
  })

  it('should deselect items when clicked again', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    // Select item
    act(() => {
      result.current.selectItem('1')
    })

    expect(result.current.isSelected('1')).toBe(true)

    // Deselect same item
    act(() => {
      result.current.selectItem('1')
    })

    expect(result.current.isSelected('1')).toBe(false)
    expect(result.current.selectionCount).toBe(0)
  })

  it('should select all items', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectedIds.size).toBe(4)
    expect(result.current.isAllSelected).toBe(true)
    expect(result.current.selectedItems).toEqual(mockItems)
  })

  it('should deselect all when selectAll is called with all selected', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    // Select all
    act(() => {
      result.current.selectAll()
    })

    expect(result.current.isAllSelected).toBe(true)

    // Select all again should deselect all
    act(() => {
      result.current.selectAll()
    })

    expect(result.current.selectedIds.size).toBe(0)
    expect(result.current.isAllSelected).toBe(false)
  })

  it('should show indeterminate state when some items are selected', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    act(() => {
      result.current.selectItem('1')
      result.current.selectItem('2')
    })

    expect(result.current.isIndeterminate).toBe(true)
    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.selectionCount).toBe(2)
  })

  it('should clear all selections', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    // Select some items
    act(() => {
      result.current.selectItem('1')
      result.current.selectItem('2')
    })

    expect(result.current.selectionCount).toBe(2)

    // Clear selection
    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selectionCount).toBe(0)
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('should select multiple items at once', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    act(() => {
      result.current.selectMultiple(['1', '3'])
    })

    expect(result.current.selectedIds.has('1')).toBe(true)
    expect(result.current.selectedIds.has('3')).toBe(true)
    expect(result.current.selectionCount).toBe(2)
  })

  it('should respect max selection limit', () => {
    const { result } = renderHook(() => 
      useBulkSelection(mockItems, { maxSelection: 2 })
    )

    // Try to select 3 items when max is 2
    act(() => {
      result.current.selectItem('1')
      result.current.selectItem('2')
      result.current.selectItem('3') // This should be ignored
    })

    expect(result.current.selectionCount).toBe(2)
    expect(result.current.isSelected('3')).toBe(false)
  })

  it('should call onSelectionChange callback', () => {
    const onSelectionChange = jest.fn()
    const { result } = renderHook(() => 
      useBulkSelection(mockItems, { onSelectionChange })
    )

    act(() => {
      result.current.selectItem('1')
    })

    expect(onSelectionChange).toHaveBeenCalledWith([{ id: '1', name: 'Item 1' }])
  })

  it('should provide correct selection statistics', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    act(() => {
      result.current.selectItem('1')
      result.current.selectItem('2')
    })

    const stats = result.current.getSelectionStats()
    expect(stats.total).toBe(4)
    expect(stats.selected).toBe(2)
    expect(stats.percentage).toBe(50)
  })

  it('should handle range selection', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    act(() => {
      result.current.selectRange('1', '3')
    })

    // Should select items 1, 2, and 3 (inclusive range)
    expect(result.current.isSelected('1')).toBe(true)
    expect(result.current.isSelected('2')).toBe(true)
    expect(result.current.isSelected('3')).toBe(true)
    expect(result.current.isSelected('4')).toBe(false)
    expect(result.current.selectionCount).toBe(3)
  })

  it('should handle toggle with shift key for range selection', () => {
    const { result } = renderHook(() => useBulkSelection(mockItems))

    // First select an item
    act(() => {
      result.current.selectItem('1')
    })

    // Then toggle another item with shift key (simulated)
    const mockEvent = { shiftKey: true } as React.MouseEvent
    act(() => {
      result.current.toggleItem('3', mockEvent)
    })

    // Should select range from last selected to current
    expect(result.current.isSelected('1')).toBe(true)
    expect(result.current.isSelected('2')).toBe(true)
    expect(result.current.isSelected('3')).toBe(true)
  })

  it('should handle empty items array', () => {
    const { result } = renderHook(() => useBulkSelection([]))

    expect(result.current.selectedIds.size).toBe(0)
    expect(result.current.isAllSelected).toBe(false)
    expect(result.current.isIndeterminate).toBe(false)

    const stats = result.current.getSelectionStats()
    expect(stats.total).toBe(0)
    expect(stats.percentage).toBe(0)
  })
}) 
