// Constantes do sistema SGB_V2

// Status
export const STATUS = {
  PENDENTE: 'pendente',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDO: 'concluido',
  ATRASADO: 'atrasado',
} as const;

export const STATUS_LABELS = {
  [STATUS.PENDENTE]: 'Pendente',
  [STATUS.EM_ANDAMENTO]: 'Em Andamento',
  [STATUS.CONCLUIDO]: 'Concluído',
  [STATUS.ATRASADO]: 'Atrasado',
} as const;

// Tipos de evento
export const EVENT_TYPES = {
  EVENTO: 'evento',
  PROMOCAO: 'promocao',
  FERIADO: 'feriado',
} as const;

// Tipos de notificação
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// Tipos de checklist
export const CHECKLIST_ITEM_TYPES = {
  TEXTO: 'texto',
  NUMERO: 'numero',
  BOOLEAN: 'boolean',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
} as const;

// Limites
export const LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_ITEMS_PER_CHECKLIST: 50,
  MAX_NOTIFICATIONS_PER_PAGE: 20,
} as const;

// URLs
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    REDEFINIR_SENHA: '/api/auth/redefinir-senha',
  },
  USUARIOS: {
    BASE: '/api/usuarios',
    BULK: '/api/usuarios/bulk',
    WITH_WHATSAPP: '/api/usuarios/with-whatsapp',
  },
  CHECKLISTS: {
    BASE: '/api/checklists',
    BADGE_DATA: '/api/checklists/badge-data',
    NOTIFICATIONS: '/api/checklists/notifications',
    BULK: '/api/checklists/bulk',
    AGENDAMENTOS: '/api/checklists/agendamentos',
    ALERTS: '/api/checklists/alerts',
  },
  EVENTOS: {
    BASE: '/api/eventos',
    ANALYTICS: '/api/eventos/analytics',
    IMPORT: '/api/eventos/import',
  },
  DASHBOARD: {
    RESUMO: '/api/dashboard/resumo',
    STATS: '/api/dashboard/stats',
    PRODUTIVIDADE: '/api/dashboard/produtividade',
  },
} as const;

// Mensagens de erro
export const ERROR_MESSAGES = {
  GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION: 'Dados inválidos. Verifique as informações.',
  SERVER: 'Erro no servidor. Tente novamente mais tarde.',
} as const;

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  SAVED: 'Dados salvos com sucesso!',
  DELETED: 'Item excluído com sucesso!',
  UPDATED: 'Dados atualizados com sucesso!',
  CREATED: 'Item criado com sucesso!',
} as const;

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_PAGE_SIZE: 100,
} as const;

// Configurações de cache
export const CACHE = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
  LONG_TTL: 30 * 60 * 1000, // 30 minutos
  SHORT_TTL: 1 * 60 * 1000, // 1 minuto
} as const;

// Configurações de upload
export const UPLOAD = {
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
  MAX_IMAGES_PER_UPLOAD: 5,
} as const; 