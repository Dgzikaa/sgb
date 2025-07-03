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

// Função para formatar datas
export function formatDate(date: string | Date): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return 'N/A'
    
    return new Intl.DateTimeFormat('pt-BR').format(dateObj)
  } catch {
    return 'N/A'
  }
}

// Função para formatar data e hora
export function formatDateTime(date: string | Date): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return 'N/A'
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  } catch {
    return 'N/A'
  }
} 