import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para formatar valores monetários
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// =====================================================
// 🇧🇷 FUNÇÕES DE DATA - USANDO TIMEZONE CENTRALIZADO
// =====================================================
import { formatarData, formatarDataHora } from './timezone'

// Função para formatar datas (migrada para timezone.ts)
export function formatDate(date: string | Date): string {
  return formatarData(date)
}

// Função para formatar data e hora (migrada para timezone.ts)
export function formatDateTime(date: string | Date): string {
  return formatarDataHora(date)
} 
