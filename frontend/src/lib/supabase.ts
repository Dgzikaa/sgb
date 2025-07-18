import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { SupabaseClient } from '@supabase/supabase-js';

// Cliente Supabase global
let supabaseClient: SupabaseClient | null = null;
let configLoaded = false;

// Configurações do projeto - URL fixa, anon key atualizada automaticamente
const SUPABASE_CONFIG = {
  url: 'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M'
}

// Função para inicializar o cliente Supabase
async function initializeSupabaseClient(): Promise<SupabaseClient> {
  if (configLoaded && supabaseClient) {
    return supabaseClient;
  }

  try {
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
    return supabaseClient

  } catch (error) {
    console.error('Erro ao inicializar cliente Supabase:', error)
    throw new Error('Falha ao conectar com Supabase')
  }
}

// Proxy que intercepta chamadas e garante que o cliente está inicializado
const supabaseProxy = new Proxy({} as SupabaseClient, {
  get(target: SupabaseClient, prop: string | symbol) {
    if (prop === 'from') {
      return (table: string) => {
        if (!supabaseClient) {
          throw new Error('Cliente Supabase não inicializado. Use await getSupabaseClient() primeiro.');
        }
        return supabaseClient.from(table);
      };
    }
    if (prop === 'auth') {
      return {
        getUser: (): Promise<import('@supabase/supabase-js').UserResponse> => {
          if (!supabaseClient) {
            throw new Error('Cliente Supabase não inicializado. Use await getSupabaseClient() primeiro.');
          }
          return supabaseClient.auth.getUser();
        }
      };
    }
    if (prop === 'rpc') {
      return (fn: string, params?: Record<string, unknown>) => {
        if (!supabaseClient) {
          throw new Error('Cliente Supabase não inicializado. Use await getSupabaseClient() primeiro.');
        }
        return supabaseClient.rpc(fn, params);
      };
    }
    if (supabaseClient && typeof prop === 'string' && prop in supabaseClient) {
      // Acesso dinâmico seguro com type assertion
      return (supabaseClient as unknown as Record<string, unknown>)[prop];
    }
    return undefined;
  }
});

// Cliente exportado
export const supabase = supabaseProxy

// Funções auxiliares
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (!supabaseClient || !configLoaded) {
    await initializeSupabaseClient();
  }
  return supabaseClient as SupabaseClient;
}

export const createClient = async (): Promise<SupabaseClient> => {
  return await getSupabaseClient();
};

export async function getConfig(): Promise<SupabaseClient> {
  await initializeSupabaseClient();
  return supabaseClient as SupabaseClient;
}

export async function getApiTokens(): Promise<{ sympla: string; yuzer: string; supabaseServiceRole: string }> {
  // TODO: Implementar busca real dos tokens se necessário
  return {
    sympla: '',
    yuzer: '',
    supabaseServiceRole: ''
  };
}

// Inicializar cliente automaticamente quando possível
if (typeof window !== 'undefined') {
  initializeSupabaseClient().catch(() => {
    console.warn('Não foi possível inicializar cliente automaticamente')
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

