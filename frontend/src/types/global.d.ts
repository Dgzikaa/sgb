/// <reference types="@testing-library/jest-dom" />

// Interfaces globais para o sistema SGB_V2

// ===== SUPABASE RESPONSES =====
export interface SupabaseResponse<T = unknown> {
  data: T | null
  error: SupabaseError | null
}

export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

// ===== API RESPONSES =====
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ===== USER TYPES =====
export interface User {
  id: string
  email: string
  nome?: string
  role?: string
  modulos_permitidos?: string[]
  bar_id?: string
  ativo?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserInfo {
  id: string
  email: string
  nome: string
  role: string
  modulos_permitidos: string[]
  bar_id: string
  ativo: boolean
  created_at: string
  updated_at: string
}

// ===== BAR TYPES =====
export interface Bar {
  id: string
  nome: string
  cnpj?: string
  endereco?: string
  telefone?: string
  email?: string
  logo_url?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

// ===== CHECKLIST TYPES =====
export interface Checklist {
  id: string
  titulo: string
  descricao?: string
  bar_id: string
  template_id?: string
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado'
  data_limite?: string
  data_conclusao?: string
  score?: number
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  checklist_id: string
  descricao: string
  tipo: 'texto' | 'numero' | 'boolean' | 'select' | 'multiselect'
  obrigatorio: boolean
  ordem: number
  opcoes?: string[]
  resposta?: string
  observacao?: string
  created_at: string
  updated_at: string
}

export interface ChecklistTemplate {
  id: string
  nome: string
  descricao?: string
  categoria: string
  itens: ChecklistItem[]
  ativo: boolean
  created_at: string
  updated_at: string
}

// ===== EVENT TYPES =====
export interface Event {
  id: string
  titulo: string
  descricao?: string
  bar_id: string
  data_inicio: string
  data_fim?: string
  tipo: 'evento' | 'promocao' | 'feriado'
  status: 'ativo' | 'inativo' | 'cancelado'
  created_at: string
  updated_at: string
}

// ===== NOTIFICATION TYPES =====
export interface Notification {
  id: string
  user_id: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  lida: boolean
  data_envio: string
  data_leitura?: string
  acoes?: NotificationAction[]
  created_at: string
}

export interface NotificationAction {
  id: string
  titulo: string
  url?: string
  acao?: string
  dados?: Record<string, unknown>
}

export interface NotificationTemplate {
  id: string
  nome: string
  titulo: string
  mensagem: string
  variaveis: Record<string, unknown>
  ativo: boolean
  created_at: string
  updated_at: string
}

// ===== ANALYTICS TYPES =====
export interface AnalyticsData {
  periodos: string[]
  valores: number[]
  meta?: number
  crescimento?: number
}

export interface DashboardData {
  checklists: {
    pendentes: number
    concluidos: number
    atrasados: number
    score_medio: number
  }
  eventos: {
    hoje: number
    semana: number
    mes: number
  }
  financeiro: {
    receita_mes: number
    despesa_mes: number
    lucro_mes: number
  }
}

// ===== AI AGENT TYPES =====
export interface AIAgentConfig {
  id: string
  bar_id: string
  tipo: string
  configuracao: Record<string, unknown>
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface AgentStatus {
  id: string
  tipo: string
  status: 'ativo' | 'inativo' | 'erro'
  ultima_execucao?: string
  proxima_execucao?: string
  metricas?: Record<string, unknown>
}

// ===== FORM TYPES =====
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  validation?: Record<string, unknown>
}

export interface FormData {
  [key: string]: string | number | boolean | string[] | null
}

// ===== UPLOAD TYPES =====
export interface UploadedFile {
  id: string
  nome: string
  url: string
  tamanho: number
  tipo: string
  uploaded_at: string
}

// ===== COMMON TYPES =====
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface FilterParams {
  search?: string
  status?: string
  data_inicio?: string
  data_fim?: string
  bar_id?: string
  [key: string]: unknown
}

export interface SortParams {
  field: string
  direction: 'asc' | 'desc'
}

// ===== ERROR TYPES =====
export interface AppError {
  code: string
  message: string
  details?: unknown
  timestamp: string
}

// ===== SUCCESS TYPES =====
export interface SuccessResponse {
  success: true
  message: string
  data?: unknown
}

// ===== UTILITY TYPES =====
export type StatusType = 'success' | 'error' | 'warning' | 'info'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type SortDirection = 'asc' | 'desc' 