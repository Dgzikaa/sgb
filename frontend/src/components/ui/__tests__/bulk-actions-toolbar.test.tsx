// @ts-nocheck
/// <reference types="@testing-library/jest-dom" />
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BulkActionsToolbar, commonBulkActions } from '../bulk-actions-toolbar'
import { Trash2, Edit, Copy } from 'lucide-react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import '@testing-library/jest-dom'

describe('BulkActionsToolbar', () => {
  const mockActions = [
    {
      id: 'delete',
      label: 'Excluir',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: jest.fn((): void => void 0),
      requiresConfirmation: true,
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: Edit,
      variant: 'outline' as const,
      onClick: jest.fn((): void => void 0),
    },
    {
      id: 'duplicate',
      label: 'Duplicar',
      icon: Copy,
      variant: 'outline' as const,
      onClick: jest.fn((): void => void 0),
    },
  ]

  const mockSelectedItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
  ]

  const defaultProps = {
    selectedCount: 2,
    totalCount: 10,
    selectedItems: mockSelectedItems,
    actions: mockActions,
    onClearSelection: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when no items are selected', () => {
    render(
      <BulkActionsToolbar
        {...defaultProps}
        selectedCount={0}
        selectedItems={[]}
      />
    )
    expect(screen.queryByText('selecionado')).not.toBeInTheDocument()
  })

  it('should render with correct selection count', () => {
    render(<BulkActionsToolbar {...defaultProps} />)
    expect(screen.getByText('2 selecionados')).toBeInTheDocument()
  })

  it('should render singular form for single selection', () => {
    render(
      <BulkActionsToolbar
        {...defaultProps}
        selectedCount={1}
        selectedItems={[mockSelectedItems[0]]}
      />
    )
    expect(screen.getByText('1 selecionado')).toBeInTheDocument()
  })

  it('should display percentage when showStats is true', () => {
    render(<BulkActionsToolbar {...defaultProps} showStats={true} />)
    expect(screen.getByText('20% do total')).toBeInTheDocument()
  })

  it('should not display percentage when showStats is false', () => {
    render(<BulkActionsToolbar {...defaultProps} showStats={false} />)
    expect(screen.queryByText('20% do total')).not.toBeInTheDocument()
  })

  it('should render primary actions as buttons', () => {
    render(<BulkActionsToolbar {...defaultProps} />)
    expect(screen.getByText('Excluir')).toBeInTheDocument()
    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getByText('Duplicar')).toBeInTheDocument()
  })

  it('should call action onClick when button is clicked', () => {
    render(<BulkActionsToolbar {...defaultProps} />)
    fireEvent.click(screen.getByText('Editar'))
    expect(mockActions[1].onClick).toHaveBeenCalledWith(mockSelectedItems)
  })

  it('should show confirmation for destructive actions', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => true)
    render(<BulkActionsToolbar {...defaultProps} />)
    fireEvent.click(screen.getByText('Excluir'))
    expect(window.confirm).toHaveBeenCalledWith(
      'Confirma a ação "Excluir" em 2 item(s)?'
    )
    expect(mockActions[0].onClick).toHaveBeenCalledWith(mockSelectedItems)
    // Restore original confirm
    window.confirm = originalConfirm
  })

  it('should not execute action if confirmation is cancelled', () => {
    // Mock window.confirm to return false
    const originalConfirm = window.confirm
    window.confirm = jest.fn(() => false)
    render(<BulkActionsToolbar {...defaultProps} />)
    fireEvent.click(screen.getByText('Excluir'))
    expect(window.confirm).toHaveBeenCalled()
    expect(mockActions[0].onClick).not.toHaveBeenCalled()
    // Restore original confirm
    window.confirm = originalConfirm
  })

  it('should call onClearSelection when clear button is clicked', () => {
    render(<BulkActionsToolbar {...defaultProps} />)
    // Find and click the clear button (X icon)
    const clearButton = screen.getByRole('button', { name: /clear/i }) ||
                       screen.getByTestId('clear-selection') ||
                       document.querySelector('button svg[data-lucide="x"]')?.closest('button')
    if (clearButton) {
      fireEvent.click(clearButton)
      expect(defaultProps.onClearSelection).toHaveBeenCalled()
    }
  })

  it('should apply correct CSS classes for different positions', () => {
    const { rerender } = render(
      <BulkActionsToolbar {...defaultProps} position="fixed" />
    )
    let toolbar = document.querySelector('[class*="fixed"]') as HTMLElement
    expect(toolbar).toHaveClass('fixed')
    rerender(<BulkActionsToolbar {...defaultProps} position="sticky" />)
    toolbar = document.querySelector('[class*="sticky"]') as HTMLElement
    expect(toolbar).toHaveClass('sticky')
  })

  it('should handle disabled actions', () => {
    const disabledActions = [
      {
        ...mockActions[0],
        disabled: true,
      },
    ]
    render(
      <BulkActionsToolbar
        {...defaultProps}
        actions={disabledActions}
      />
    )
    const button = screen.getByText('Excluir') as HTMLButtonElement
    expect(button).toBeDisabled()
  })

  it('should render secondary actions in overflow menu when there are many actions', () => {
    const manyActions = [
      ...mockActions,
      {
        id: 'share',
        label: 'Compartilhar',
        icon: Copy,
        variant: 'outline' as const,
        onClick: jest.fn((): void => void 0),
      },
      {
        id: 'archive',
        label: 'Arquivar',
        icon: Copy,
        variant: 'outline' as const,
        onClick: jest.fn((): void => void 0),
      },
    ]
    render(
      <BulkActionsToolbar
        {...defaultProps}
        actions={manyActions}
      />
    )
    // Should show overflow menu button
    const overflowButton = document.querySelector('[data-lucide="more-horizontal"]')?.closest('button') as HTMLButtonElement | null
    expect(overflowButton).toBeInTheDocument()
  })

  it('should handle empty actions array', () => {
    render(
      <BulkActionsToolbar
        {...defaultProps}
        actions={[]}
      />
    )
    expect(screen.getByText('2 selecionados')).toBeInTheDocument()
    expect(screen.queryByText('Excluir')).not.toBeInTheDocument()
  })

  describe('commonBulkActions', () => {
    it('should create delete action with correct properties', () => {
      const onDelete = jest.fn()
      const deleteAction = commonBulkActions.delete(onDelete)
      expect(deleteAction.id).toBe('delete')
      expect(deleteAction.label).toBe('Excluir')
      expect(deleteAction.variant).toBe('destructive')
      expect(deleteAction.requiresConfirmation).toBe(true)
    })
    it('should create edit action with correct properties', () => {
      const onEdit = jest.fn()
      const editAction = commonBulkActions.edit(onEdit)
      expect(editAction.id).toBe('edit')
      expect(editAction.label).toBe('Editar')
      expect(editAction.variant).toBe('outline')
    })
    it('should create duplicate action with correct properties', () => {
      const onDuplicate = jest.fn()
      const duplicateAction = commonBulkActions.duplicate(onDuplicate)
      expect(duplicateAction.id).toBe('duplicate')
      expect(duplicateAction.label).toBe('Duplicar')
      expect(duplicateAction.variant).toBe('outline')
    })
  })
}) 

