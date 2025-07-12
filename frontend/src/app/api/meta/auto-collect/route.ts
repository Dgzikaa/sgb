import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Token de autenticação para pgcron
const CRON_TOKEN = 'sgb-meta-cron-2025'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Iniciando coleta automática Meta via pgcron...')

    // Verificar autenticação do pgcron
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.includes(CRON_TOKEN)) {
      return NextResponse.json({ 
        error: 'Token de autorização inválido para coleta automática' 
      }, { status: 401 })
    }

    const startTime = new Date()
    const results = {
      success: true,
      message: 'Coleta automática Meta executada com sucesso!',
      timestamp: startTime.toISOString(),
      collections: {} as any,
      summary: {
        instagram_success: false,
        facebook_success: false,
        total_api_calls: 0,
        total_duration_ms: 0,
        errors: [] as string[]
      }
    }

    console.log('📱 1. Coletando dados do Instagram...')
    
    // 1. COLETA INSTAGRAM
    try {
      const instagramResponse = await fetch('http://localhost:3001/api/meta/collect-instagram-posts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (instagramResponse.ok) {
        const instagramData = await instagramResponse.json()
        results.collections.instagram = {
          success: true,
          data: instagramData.data,
          api_calls: 2 // Account + Posts
        }
        results.summary.instagram_success = true
        results.summary.total_api_calls += 2
        console.log('✅ Instagram: Sucesso')
      } else {
        const error = await instagramResponse.text()
        results.collections.instagram = {
          success: false,
          error: error,
          status: instagramResponse.status
        }
        results.summary.errors.push(`Instagram: ${error}`)
        console.log('❌ Instagram: Erro')
      }
    } catch (error: any) {
      results.collections.instagram = {
        success: false,
        error: error.message
      }
      results.summary.errors.push(`Instagram: ${error.message}`)
      console.log('❌ Instagram: Erro crítico')
    }

    console.log('📘 2. Coletando dados do Facebook...')
    
    // 2. COLETA FACEBOOK
    try {
      const facebookResponse = await fetch('http://localhost:3001/api/meta/collect-facebook-full', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (facebookResponse.ok) {
        const facebookData = await facebookResponse.json()
        results.collections.facebook = {
          success: true,
          data: facebookData.data,
          api_calls: 3 // Page + Posts + Insights
        }
        results.summary.facebook_success = true
        results.summary.total_api_calls += 3
        console.log('✅ Facebook: Sucesso')
      } else {
        const error = await facebookResponse.text()
        results.collections.facebook = {
          success: false,
          error: error,
          status: facebookResponse.status
        }
        results.summary.errors.push(`Facebook: ${error}`)
        console.log('❌ Facebook: Erro')
      }
    } catch (error: any) {
      results.collections.facebook = {
        success: false,
        error: error.message
      }
      results.summary.errors.push(`Facebook: ${error.message}`)
      console.log('❌ Facebook: Erro crítico')
    }

    const endTime = new Date()
    results.summary.total_duration_ms = endTime.getTime() - startTime.getTime()

    console.log('💾 3. Registrando execução da coleta automática...')

    // 3. LOG DA EXECUÇÃO AUTOMÁTICA
    const logStatus = results.summary.instagram_success || results.summary.facebook_success ? 'sucesso' : 'erro'
    const registrosProcessados = (results.summary.instagram_success ? 1 : 0) + (results.summary.facebook_success ? 1 : 0)

    await supabase
      .from('meta_coletas_log')
      .insert({
        bar_id: 3,
        tipo_coleta: 'cron_automatico',
        iniciada_em: startTime.toISOString(),
        finalizada_em: endTime.toISOString(),
        status: logStatus,
        tempo_execucao_ms: results.summary.total_duration_ms,
        registros_processados: registrosProcessados,
        parametros_coleta: {
          automatic: true,
          source: 'pgcron',
          collections_attempted: ['instagram', 'facebook'],
          total_api_calls: results.summary.total_api_calls
        },
        observacoes: results.summary.errors.length > 0 ? 
          `Execução automática com ${results.summary.errors.length} erro(s)` : 
          'Execução automática bem-sucedida',
        erro_detalhes: results.summary.errors.length > 0 ? results.summary.errors.join('; ') : null
      })

    // 4. DEFINIR STATUS FINAL
    if (results.summary.errors.length > 0) {
      results.success = results.summary.instagram_success || results.summary.facebook_success
      results.message = `Coleta parcialmente bem-sucedida: ${registrosProcessados}/2 plataformas`
    }

    console.log(`🎉 Coleta automática concluída: ${registrosProcessados}/2 plataformas`)

    return NextResponse.json({
      ...results,
      results: {
        registros_novos: registrosProcessados,
        plataformas_coletadas: registrosProcessados,
        api_calls_total: results.summary.total_api_calls,
        duracao_segundos: Math.round(results.summary.total_duration_ms / 1000)
      }
    })

  } catch (error: any) {
    console.error('💥 Erro crítico na coleta automática:', error)
    
    // Log de erro crítico
    await supabase
      .from('meta_coletas_log')
      .insert({
        bar_id: 3,
        tipo_coleta: 'cron_automatico',
        iniciada_em: new Date().toISOString(),
        finalizada_em: new Date().toISOString(),
        status: 'erro_critico',
        erro_detalhes: error.message,
        observacoes: 'Erro crítico na execução automática'
      })

    return NextResponse.json({ 
      success: false,
      error: 'Erro crítico na coleta automática Meta',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// ========================================
// 📅 GET /api/meta/auto-collect/schedule
// Verificar próxima coleta agendada
// ========================================
export async function GET(request: NextRequest) {
  try {
    const { data: config } = await supabase
      .from('api_credentials')
      .select('ultima_coleta, proxima_coleta, frequencia_coleta_horas')
      .eq('bar_id', 3)
      .eq('ativo', true)
      .single()

    const schedule = {
      enabled: !!config,
      frequency: 12, // 2x por dia = a cada 12 horas (otimizado)
      frequency_note: 'Otimizado para 2x/dia: manhã (8h) e noite (20h)',
      last_collection: config?.ultima_coleta,
      next_collection: config?.proxima_coleta || getNextCollectionTime(),
      schedule_hours: [8, 20], // Horários otimizados
      current_time: new Date().toISOString(),
      next_in_minutes: config?.proxima_coleta 
        ? Math.max(0, Math.round((new Date(config.proxima_coleta).getTime() - Date.now()) / 60000))
        : null,
      optimization_info: {
        api_calls_per_day: 10, // 2 coletas × 5 calls cada
        rate_limit_usage: 'Muito baixo (~0.02% do limite)',
        benefits: ['Economia de recursos', 'Dados frescos 2x/dia', 'Relatórios manhã/noite']
      }
    }

    return NextResponse.json(schedule)

  } catch (error: any) {
    console.error('Erro ao buscar schedule:', error)
    return NextResponse.json({
      enabled: false,
      error: error.message
    }, { status: 500 })
  }
}

// ========================================
// 🔧 FUNÇÕES AUXILIARES
// ========================================

function getNextCollectionTime(): string {
  const agora = new Date()
  const horariosColeta = [8, 20] // 08:00 e 20:00 - Frequência otimizada
  
  // Encontrar próximo horário hoje
  for (let hora of horariosColeta) {
    const proxima = new Date(agora)
    proxima.setHours(hora, 0, 0, 0)
    
    if (proxima > agora) {
      return proxima.toISOString()
    }
  }
  
  // Se nenhum horário hoje, próximo é 08:00 de amanhã
  const amanha = new Date(agora)
  amanha.setDate(amanha.getDate() + 1)
  amanha.setHours(8, 0, 0, 0) // Próxima coleta sempre às 8h da manhã
  return amanha.toISOString()
} 