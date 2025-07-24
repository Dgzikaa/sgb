import { SupabaseClient, createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Cliente Supabase global tipado
let supabaseClient: SupabaseClient<Database> | null = null
let configLoaded = false

// Configurações do projeto - URL fixa, anon key atualizada automaticamente
const SUPABASE_CONFIG = {
  url: 'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M'
}

// Função para inicializar o cliente Supabase
async function initializeSupabaseClient() {
  if (configLoaded && supabaseClient) {
    return supabaseClient
  }

  try {
    // Criar cliente com configurações públicas
    supabaseClient = createSupabaseClient<Database>(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    )
    
    configLoaded = true
    return supabaseClient

  } catch (error) {
    console.error('❌ Erro ao inicializar cliente Supabase:', error)
    throw new Error('Falha ao conectar com Supabase')
  }
}

// Proxy que intercepta chamadas e garante que o cliente está inicializado
// eslint-disable-next-line
const supabaseProxy = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    if (prop === 'from') {
      return (table: string) => {
        if (!supabaseClient) {
          throw new Error('Cliente Supabase não inicializado. Use await getSupabaseClient() primeiro.')
        }
        if (supabaseClient) {
          return supabaseClient.from(table)
        }
        return undefined
      }
    }
    
    if (prop === 'auth') {
      return supabaseClient?.auth
    }
    
    if (prop === 'rpc') {
      return (fn: string, params?: Record<string, unknown>) => {
        if (!supabaseClient) {
          throw new Error('Cliente Supabase não inicializado. Use await getSupabaseClient() primeiro.')
        }
        return supabaseClient.rpc(fn, params)
      }
    }
    
    // Para outras propriedades, retornar diretamente do cliente
    if (supabaseClient && typeof supabaseClient === 'object' && supabaseClient !== null && prop in supabaseClient) {
      // eslint-disable-next-line
      const value = (supabaseClient as any)[prop as string]
      if (typeof value === 'function') {
        // eslint-disable-next-line
        return (...args: unknown[]) => (value as Function).apply(supabaseClient, args)
      }
      return value
    }
    return undefined
  }
})

// Cliente exportado
export const supabase = supabaseProxy

// Funções auxiliares
export async function getSupabaseClient() {
  if (!supabaseClient || !configLoaded) {
    await initializeSupabaseClient()
  }
  return supabaseClient
}

export const createClient = async () => {
  return await getSupabaseClient()
}

export async function getConfig() {
  await initializeSupabaseClient()
  return supabaseClient
}

export async function getApiTokens() {
  // Tokens ficam seguros nas Edge Functions do servidor
  // Esta função retorna vazio para evitar exposição de secrets
  return {
    sympla: '',
    yuzer: '',
    supabaseServiceRole: ''
  }
}

// Inicializar cliente automaticamente quando possível
if (typeof window !== 'undefined') {
  initializeSupabaseClient().catch(() => {
    console.warn('⚠️ Não foi possível inicializar cliente automaticamente')
  })
}

// Interfaces
export interface AnaliticoData {
  id?: number
  vd: string
  data_gerencial: string
  valor_total: number
}

export interface PeriodoData {
  id?: number
  data_inicio: string
  data_fim: string
}

export interface PagamentosData {
  id?: number
  tipo_pagamento: string
  valor: number
  data: string
}

export interface FatPorHoraData {
  id?: number
  hora: string
  faturamento: number
}

export interface TempoData {
  id?: number
  data: string
  tempo_operacao: number
}

export interface NFSData {
  id?: number
  numero_nf: string
  cnpj: string
  valor: number
} 
