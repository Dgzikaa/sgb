import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { BarProvider } from '@/contexts/BarContext'
import { PageTitleProvider } from '@/contexts/PageTitleContext'

// Mock providers para testes
const mockBarContext = {
  selectedBar: {
    id: '1',
    nome: 'Bar Teste',
    email: 'teste@bar.com',
    telefone: '11999999999',
    endereco: 'Rua Teste, 123',
    ativo: true,
    plano: 'premium' as const,
    created_at: '2024-01-01T00:00:00Z',
    configuracoes: {},
  },
  bars: [],
  isLoading: false,
  selectBar: jest.fn(),
  refreshBars: jest.fn(),
}

const mockPageTitleContext = {
  pageTitle: 'Página Teste',
  setPageTitle: jest.fn(),
  breadcrumbs: [],
  setBreadcrumbs: jest.fn(),
}

const mockThemeContext = {
  theme: 'light' as const,
  setTheme: jest.fn(),
  isDark: false,
}

// Mock dos contextos
jest.mock('@/contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => mockThemeContext,
}))

jest.mock('@/contexts/BarContext', () => ({
  BarProvider: ({ children }: { children: React.ReactNode }) => children,
  useBar: () => mockBarContext,
}))

jest.mock('@/contexts/PageTitleContext', () => ({
  PageTitleProvider: ({ children }: { children: React.ReactNode }) => children,
  usePageTitle: () => mockPageTitleContext,
}))

// Wrapper com todos os providers necessários
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  )
}

// Render customizado com providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Helpers para mocking de APIs
export const mockApiResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

export const mockApiError = (message: string, status = 500) => {
  return Promise.reject({
    ok: false,
    status,
    message,
  })
}

// Helper para aguardar loading states
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

// Helper para simular dados de usuário
export const mockUser = {
  id: '123',
  email: 'teste@exemplo.com',
  nome: 'Usuário Teste',
  role: 'admin' as const,
  bar_id: '1',
  ativo: true,
  created_at: '2024-01-01T00:00:00Z',
}

// Helper para simular dados de bar
export const mockBar = {
  id: '1',
  nome: 'Bar Teste',
  email: 'teste@bar.com',
  telefone: '11999999999',
  endereco: 'Rua Teste, 123',
  ativo: true,
  plano: 'premium' as const,
  created_at: '2024-01-01T00:00:00Z',
  configuracoes: {},
}

// Helper para simular dados de checklist
export const mockChecklist = {
  id: '1',
  nome: 'Checklist Teste',
  descricao: 'Descrição do checklist teste',
  tipo: 'abertura' as const,
  ativo: true,
  bar_id: '1',
  created_at: '2024-01-01T00:00:00Z',
  checklist_items: [
    {
      id: '1',
      nome: 'Item 1',
      descricao: 'Descrição do item 1',
      tipo: 'checkbox' as const,
      obrigatorio: true,
      ordem: 1,
    },
  ],
}

// Helper para eventos de usuário
export const userEvent = require('@testing-library/user-event').default

// Helper para queries customizadas
export const queryHelpers = {
  // Encontrar elemento por data-testid
  getByTestId: (testId: string) => document.querySelector(`[data-testid="${testId}"]`),
  
  // Encontrar botão por texto
  getButtonByText: (text: string) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    return buttons.find(button => button.textContent?.includes(text))
  },
  
  // Encontrar input por placeholder
  getInputByPlaceholder: (placeholder: string) => {
    return document.querySelector(`input[placeholder="${placeholder}"]`)
  },
}

// Mock de hooks personalizados
export const mockHooks = {
  useBulkSelection: (items: any[] = []) => ({
    selectedIds: new Set(),
    selectedItems: [],
    isAllSelected: false,
    isIndeterminate: false,
    selectItem: jest.fn(),
    selectMultiple: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
    selectRange: jest.fn(),
    toggleItem: jest.fn(),
    isSelected: jest.fn(() => false),
    getSelectionStats: jest.fn(() => ({
      total: items.length,
      selected: 0,
      percentage: 0,
    })),
    selectionCount: 0,
  }),
  
  useCache: () => ({
    data: null,
    isLoading: false,
    error: null,
    mutate: jest.fn(),
    invalidate: jest.fn(),
  }),
  
  usePermissions: () => ({
    isRole: jest.fn(() => true),
    hasPermission: jest.fn(() => true),
    hasModule: jest.fn(() => true),
  }),
}

// Utilitário para testar componentes com estado async
export const renderWithAsyncState = async (component: ReactElement) => {
  const result = customRender(component)
  await waitForLoadingToFinish()
  return result
}

// Utilitário para simular fetch API
export const setupFetchMock = () => {
  const fetchMock = jest.fn()
  global.fetch = fetchMock
  
  return {
    mockResolvedValue: (data: any) => fetchMock.mockResolvedValue(mockApiResponse(data)),
    mockRejectedValue: (error: string) => fetchMock.mockRejectedValue(mockApiError(error)),
    mockImplementation: (fn: any) => fetchMock.mockImplementation(fn),
    restore: () => fetchMock.mockRestore(),
  }
}

// Utilitário para testes de acessibilidade
export const axeHelpers = {
  // Verificar se elemento tem aria-label ou text content
  hasAccessibleName: (element: Element) => {
    return element.getAttribute('aria-label') || element.textContent
  },
  
  // Verificar se elemento é focável
  isFocusable: (element: Element) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ]
    
    return focusableSelectors.some(selector => element.matches(selector))
  },
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
export { userEvent } 