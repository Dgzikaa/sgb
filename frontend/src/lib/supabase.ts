import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente Supabase global
let supabaseClient: any = null
let configLoaded = false

// Configurações do projeto (hardcoded temporariamente para resolver erro)
const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNzY3NjQsImV4cCI6MjA0OTk1Mjc2NH0.gApVhN9HdwWUKQnw8FHqDUNgmtQFb1i_cz0IucQzY-g'
}

// Função para inicializar o cliente Supabase
async function initializeSupabaseClient() {
  if (configLoaded && supabaseClient) {
    return supabaseClient
  }

  try {
    console.log('🔐 Inicializando cliente Supabase...')
    console.log('🔗 URL:', SUPABASE_CONFIG.url)
    console.log('🔑 Anon Key presente:', !!SUPABASE_CONFIG.anonKey)
    
    // Criar cliente com configurações públicas
    supabaseClient = createSupabaseClient(
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
    console.log('✅ Cliente Supabase inicializado com sucesso')
    return supabaseClient

  } catch (error) {
    console.error('❌ Erro ao inicializar cliente Supabase:', error)
    throw new Error('Falha ao conectar com Supabase')
  }
}

// Proxy que intercepta chamadas e garante que o cliente está inicializado
const supabaseProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === 'from') {
      return (table: string) => {
        if (!supabaseClient) {
          throw new Error('Cliente Supabase não inicializado. Use await getSupabaseClient() primeiro.')
        }
        return supabaseClient.from(table)
      }
    }
    
    if (prop === 'auth') {
      return {
        getUser: () => {
          if (!supabaseClient) {
            throw new Error('Cliente Supabase não inicializado. Use await getSupabaseClient() primeiro.')
          }
          return supabaseClient.auth.getUser()
        }
      }
    }
    
    if (prop === 'rpc') {
      return (fn: string, params?: any) => {
        if (!supabaseClient) {
          throw new Error('Cliente Supabase não inicializado. Use await getSupabaseClient() primeiro.')
        }
        return supabaseClient.rpc(fn, params)
      }
    }
    
    // Para outras propriedades, retornar diretamente do cliente
    if (supabaseClient && prop in supabaseClient) {
      return supabaseClient[prop]
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
  console.log('ℹ️ Tokens de API são gerenciados server-side por segurança')
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