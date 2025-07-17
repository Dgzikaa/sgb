import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funá§á£o para formatar valores monetá¡rios
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// =====================================================
// ðŸ‡§ðŸ‡· FUNá‡á•ES DE DATA - USANDO TIMEZONE CENTRALIZADO
// =====================================================
import { formatarData, formatarDataHora } from './timezone'

// Funá§á£o para formatar datas (migrada para timezone.ts)
export function formatDate(date: string | Date): string {
  return formatarData(date)
}

// Funá§á£o para formatar data e hora (migrada para timezone.ts)
export function formatDateTime(date: string | Date): string {
  return formatarDataHora(date)
} 
