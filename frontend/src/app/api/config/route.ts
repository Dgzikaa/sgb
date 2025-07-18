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

﻿import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cache das configuraÃ§Ãµes para evitar mÃºltiplas chamadas
let configCache: unknown = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

async function fetchSupabaseSecrets() {
  try {
    // Buscar secrets diretamente do Supabase usando edge function com autenticaÃ§Ã£o
    const response = await fetch('https://iddtrhexgjbfhxebpklf.supabase.co/functions/v1/get-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sgb-internal-config-token-2025'
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      throw new Error('Falha ao buscar configuraÃ§Ãµes')
    }

    const config = await response.json()
    return config
  } catch (error) {
    console.error('ÂÅ’ Erro ao buscar secrets:', error)
    
    // Secrets sÃ£o obrigatÃ³rios
    throw new Error('ConfiguraÃ§Ãµes dos secrets nÃ£o disponÃ­veis - verificar edge function get-config')
  }
}

export async function GET() {
  try {
    const now = Date.now()
    
    // Verificar se o cache ainda Ã© vÃ¡lido
    if (configCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(configCache)
    }

    // Buscar novas configuraÃ§Ãµes
    const config = await fetchSupabaseSecrets()
    
    // Atualizar cache
    configCache = config
    cacheTimestamp = now

    return NextResponse.json(config)
  } catch (error) {
    console.error('ÂÅ’ Erro na API de configuraÃ§Ã£o:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configuraÃ§Ãµes' },
      { status: 500 }
    )
  }
} 

