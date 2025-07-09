import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificar se é um horário válido para sincronização
function isValidSyncTime(): boolean {
  const now = new Date()
  const hour = now.getHours()
  
  // Executar apenas durante horário comercial (8h às 22h)
  return hour >= 8 && hour <= 22
}

// Verificar se já foi executado recentemente
async function wasRecentlyExecuted(): Promise<boolean> {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
  
  const { data, error } = await supabase
    .from('contaazul')
    .select('sincronizado_em')
    .gte('sincronizado_em', twoHoursAgo.toISOString())
    .limit(1)
  
  return !error && data && data.length > 0
}

// Executar sincronização automática
async function executarSincronizacaoAutomatica() {
  console.log('🤖 Iniciando sincronização automática do ContaAzul...')
  
  // Buscar o bar_id padrão (ou configurar como necessário)
  const { data: barsData, error: barsError } = await supabase
    .from('bars')
    .select('id')
    .eq('ativo', true)
    .limit(1)
  
  if (barsError || !barsData || barsData.length === 0) {
    throw new Error('Nenhum bar ativo encontrado')
  }
  
  const barId = barsData[0].id
  
  // Tentar método 1: Selenium V5 (mais estável)
  console.log('🔄 Tentando método 1: Selenium V5...')
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
      console.log('✅ Selenium V5 executado com sucesso')
      return {
        success: true,
        method: 'selenium_v5',
        registros: result.registros,
        message: result.message
      }
    } else {
      console.warn('⚠️ Selenium V5 falhou:', result.error)
    }
  } catch (error) {
    console.warn('⚠️ Erro no Selenium V5:', error)
  }
  
  // Tentar método 2: Node.js API
  console.log('🔄 Tentando método 2: Node.js API...')
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
      console.log('✅ Node.js API executado com sucesso')
      return {
        success: true,
        method: 'nodejs_api',
        registros: result.registros_processados,
        message: result.message
      }
    } else {
      console.warn('⚠️ Node.js API falhou:', result.error)
    }
  } catch (error) {
    console.warn('⚠️ Erro no Node.js API:', error)
  }
  
  // Tentar método 3: Playwright V1 (backup)
  console.log('🔄 Tentando método 3: Playwright V1...')
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
      console.log('✅ Playwright V1 executado com sucesso')
      return {
        success: true,
        method: 'playwright_v1',
        registros: result.registros_processados,
        message: result.message
      }
    } else {
      console.warn('⚠️ Playwright V1 falhou:', result.error)
    }
  } catch (error) {
    console.warn('⚠️ Erro no Playwright V1:', error)
  }
  
  // Se todos os métodos falharam
  throw new Error('Todos os métodos de sincronização falharam')
}

// Salvar log da execução
async function salvarLogExecucao(resultado: any) {
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
    console.warn('⚠️ Erro ao salvar log:', error)
  }
}

// Rota do cron
export async function POST(request: NextRequest) {
  try {
    // Verificar se é uma chamada autorizada
    const cronSecret = request.headers.get('x-cron-secret')
    const internalCron = request.headers.get('x-internal-cron')
    
    if (cronSecret !== process.env.CRON_SECRET_KEY && !internalCron) {
      return NextResponse.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 })
    }
    
    console.log('🕐 Executando cron job - ContaAzul Sync')
    
    // 1. Verificar se é um horário válido
    if (!isValidSyncTime()) {
      console.log('⏰ Fora do horário comercial - pulando sincronização')
      return NextResponse.json({
        success: true,
        message: 'Fora do horário comercial',
        skipped: true
      })
    }
    
    // 2. Verificar se já foi executado recentemente
    if (await wasRecentlyExecuted()) {
      console.log('🕐 Já executado recentemente - pulando sincronização')
      return NextResponse.json({
        success: true,
        message: 'Já executado recentemente',
        skipped: true
      })
    }
    
    // 3. Executar sincronização
    const resultado = await executarSincronizacaoAutomatica()
    
    // 4. Salvar log
    await salvarLogExecucao(resultado)
    
    console.log('✅ Cron job concluído com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Sincronização automática concluída',
      method: resultado.method,
      registros: resultado.registros,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Erro no cron job:', error)
    
    // Salvar log de erro
    await salvarLogExecucao({
      success: false,
      error: error.message
    })
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Rota GET para verificar status
export async function GET(request: NextRequest) {
  try {
    // Buscar últimas execuções
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
    
  } catch (error: any) {
    console.error('❌ Erro ao verificar status:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 