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

﻿import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificar se Ã¡Â© um horÃ¡Â¡rio vÃ¡Â¡lido para sincronizaÃ¡Â§Ã¡Â£o
function isValidSyncTime(): boolean {
  const now = new Date()
  const hour = now.getHours()
  
  // Executar apenas durante horÃ¡Â¡rio comercial (8h Ã¡Â s 22h)
  return hour >= 8 && hour <= 22
}

// Verificar se jÃ¡Â¡ foi executado recentemente
async function wasRecentlyExecuted(): Promise<boolean> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  
  const { data, error } = await supabase
    .from('contaazul')
    .select('sincronizado_em')
    .gte('sincronizado_em', twoHoursAgo.toISOString())
    .limit(1)
  
  return !error && data && data.length > 0
}

// Executar sincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica
async function executarSincronizacaoAutomatica() {
  console.log('Ã°Å¸Â¤â€“ Iniciando sincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica do ContaAzul...')
  
  // Buscar o bar_id padrÃ¡Â£o (ou configurar como necessÃ¡Â¡rio)
  const { data: barsData, error: barsError } = await supabase
    .from('bars')
    .select('id')
    .eq('ativo', true)
    .limit(1)
  
  if (barsError || !barsData || barsData.length === 0) {
    throw new Error('Nenhum bar ativo encontrado')
  }
  
  const barId = barsData[0].id
  
  // Tentar mÃ¡Â©todo 1: Selenium V5 (mais estÃ¡Â¡vel)
  console.log('Ã°Å¸â€â€ž Tentando mÃ¡Â©todo 1: Selenium V5...')
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/contaazul-v5-selenium`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-cron': 'true'
      },
      body: JSON.stringify({ headless: true })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('Å“â€¦ Selenium V5 executado com sucesso')
      return {
        success: true,
        method: 'selenium_v5',
        registros: result.registros,
        message: result.message
      }
    } else {
      console.warn('Å¡Â Ã¯Â¸Â Selenium V5 falhou:', result.error)
    }
  } catch (error) {
    console.warn('Å¡Â Ã¯Â¸Â Erro no Selenium V5:', error)
  }
  
  // Tentar mÃ¡Â©todo 2: Node.js API
  console.log('Ã°Å¸â€â€ž Tentando mÃ¡Â©todo 2: Node.js API...')
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/contaazul-nodejs-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-cron': 'true'
      },
      body: JSON.stringify({ bar_id: barId })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('Å“â€¦ Node.js API executado com sucesso')
      return {
        success: true,
        method: 'nodejs_api',
        registros: result.registros_processados,
        message: result.message
      }
    } else {
      console.warn('Å¡Â Ã¯Â¸Â Node.js API falhou:', result.error)
    }
  } catch (error) {
    console.warn('Å¡Â Ã¯Â¸Â Erro no Node.js API:', error)
  }
  
  // Tentar mÃ¡Â©todo 3: Playwright V1 (backup)
  console.log('Ã°Å¸â€â€ž Tentando mÃ¡Â©todo 3: Playwright V1...')
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/contaazul-v1-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-cron': 'true'
      },
      body: JSON.stringify({ bar_id: barId })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('Å“â€¦ Playwright V1 executado com sucesso')
      return {
        success: true,
        method: 'playwright_v1',
        registros: result.registros_processados,
        message: result.message
      }
    } else {
      console.warn('Å¡Â Ã¯Â¸Â Playwright V1 falhou:', result.error)
    }
  } catch (error) {
    console.warn('Å¡Â Ã¯Â¸Â Erro no Playwright V1:', error)
  }
  
  // Se todos os mÃ¡Â©todos falharam
  throw new Error('Todos os mÃ¡Â©todos de sincronizaÃ¡Â§Ã¡Â£o falharam')
}

// Salvar log da execuÃ¡Â§Ã¡Â£o
async function salvarLogExecucao(resultado: unknown) {
  const logEntry = {
    sistema: 'contaazul',
    tipo: 'cron_sync',
    sucesso: resultado.success,
    metodo: resultado.method || 'desconhecido',
    registros_processados: resultado.registros || 0,
    mensagem: resultado.message || resultado.error,
    executado_em: new Date().toISOString()
  }
  
  try {
    await supabase
      .from('sistema_logs')
      .insert(logEntry)
  } catch (error) {
    console.warn('Å¡Â Ã¯Â¸Â Erro ao salvar log:', error)
  }
}

// Rota do cron
export async function POST(request: NextRequest) {
  try {
    // Verificar se Ã¡Â© uma chamada autorizada
    const cronSecret = request.headers.get('x-cron-secret')
    const internalCron = request.headers.get('x-internal-cron')
    
    if (cronSecret !== process.env.CRON_SECRET_KEY && !internalCron) {
      return NextResponse.json({ 
        success: false, 
        error: 'NÃ¡Â£o autorizado' 
      }, { status: 401 })
    }
    
    console.log('Ã°Å¸â€¢Â Executando cron job - ContaAzul Sync')
    
    // 1. Verificar se Ã¡Â© um horÃ¡Â¡rio vÃ¡Â¡lido
    if (!isValidSyncTime()) {
      console.log('ÂÂ° Fora do horÃ¡Â¡rio comercial - pulando sincronizaÃ¡Â§Ã¡Â£o')
      return NextResponse.json({
        success: true,
        message: 'Fora do horÃ¡Â¡rio comercial',
        skipped: true
      })
    }
    
    // 2. Verificar se jÃ¡Â¡ foi executado recentemente
    if (await wasRecentlyExecuted()) {
      console.log('Ã°Å¸â€¢Â JÃ¡Â¡ executado recentemente - pulando sincronizaÃ¡Â§Ã¡Â£o')
      return NextResponse.json({
        success: true,
        message: 'JÃ¡Â¡ executado recentemente',
        skipped: true
      })
    }
    
    // 3. Executar sincronizaÃ¡Â§Ã¡Â£o
    const resultado = await executarSincronizacaoAutomatica()
    
    // 4. Salvar log
    await salvarLogExecucao(resultado)
    
    console.log('Å“â€¦ Cron job concluÃ¡Â­do com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'SincronizaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica concluÃ¡Â­da',
      method: resultado.method,
      registros: resultado.registros,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('ÂÅ’ Erro no cron job:', error)
    // Salvar log de erro
    await salvarLogExecucao({
      success: false,
      error: (error as unknown).message
    })
    return NextResponse.json({
      success: false,
      error: (error as unknown).message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Rota GET para verificar status
export async function GET(request: NextRequest) {
  try {
    // Buscar Ã¡Âºltimas execuÃ¡Â§Ã¡Âµes
    const { data: logs, error } = await supabase
      .from('sistema_logs')
      .select('*')
      .eq('sistema', 'contaazul')
      .eq('tipo', 'cron_sync')
      .order('executado_em', { ascending: false })
      .limit(10)
    
    if (error) {
      throw error
    }
    
    const ultimaExecucao = logs?.[0]
    const proximaExecucao = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 horas
    
    return NextResponse.json({
      success: true,
      status: {
        ultima_execucao: ultimaExecucao?.executado_em || null,
        ultimo_sucesso: ultimaExecucao?.sucesso || false,
        ultimo_metodo: ultimaExecucao?.metodo || null,
        ultimos_registros: ultimaExecucao?.registros_processados || 0,
        proxima_execucao: proximaExecucao.toISOString(),
        horario_valido: isValidSyncTime()
      },
      historico: logs
    })
    
  } catch (error) {
    console.error('ÂÅ’ Erro ao verificar status:', error)
    return NextResponse.json({
      success: false,
      error: (error as unknown).message
    }, { status: 500 })
  }
} 

