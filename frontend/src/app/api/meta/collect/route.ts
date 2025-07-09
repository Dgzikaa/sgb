import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createMetaSocialService } from '@/lib/meta-social-service'
import { notifyMarketingUpdate } from '@/lib/discord-marketing-service'
import { z } from 'zod'

// Schema de validação para parâmetros
const CollectMetricsSchema = z.object({
  types: z.array(z.enum(['facebook', 'instagram', 'posts', 'all'])).optional().default(['all']),
  period: z.enum(['day', 'week', 'month']).optional().default('day'),
  limit: z.number().int().min(1).max(100).optional().default(25),
  since: z.string().optional(),
  until: z.string().optional()
})

// ========================================
// 🚀 POST /api/meta/collect
// Coletar métricas da Meta
// ========================================
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Solicitação de coleta manual via Marketing 360°...')

    const body = await request.json()
    const { types, period, limit } = body

    console.log('📊 Parâmetros da coleta:', { types, period, limit })

    // Chamar o endpoint de coleta automática que já funciona
    const autoCollectResponse = await fetch('http://localhost:3001/api/meta/auto-collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sgb-meta-cron-2025'
      },
      body: JSON.stringify({
        automatic: false,
        source: 'marketing360_manual',
        types: types || ['all'],
        period: period || 'day'
      })
    })

    if (autoCollectResponse.ok) {
      const autoCollectResult = await autoCollectResponse.json()
      
      console.log('✅ Coleta manual bem-sucedida')
      
      return NextResponse.json({
        success: true,
        message: 'Coleta manual executada com sucesso!',
        data: autoCollectResult,
        platforms_collected: autoCollectResult.results?.plataformas_coletadas || 0,
        api_calls_made: autoCollectResult.results?.api_calls_total || 0,
        duration_seconds: autoCollectResult.results?.duracao_segundos || 0,
        timestamp: new Date().toISOString()
      })
    } else {
      const errorText = await autoCollectResponse.text()
      console.log('❌ Erro na coleta:', errorText)
      
      return NextResponse.json({
        success: false,
        message: 'Erro na coleta de dados',
        error: errorText
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('💥 Erro crítico na coleta manual:', error)
    
    return NextResponse.json({ 
      success: false,
      message: 'Erro crítico na execução da coleta',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// ========================================
// 🔍 GET /api/meta/collect/status
// Verificar status da última coleta
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { bar_id } = JSON.parse(userData)

    // Buscar últimas coletas
    const supabase = await import('@supabase/supabase-js').then(m => 
      m.createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    )

    const { data: coletas, error } = await supabase
      .from('meta_coletas_log')
      .select('*')
      .eq('bar_id', bar_id)
      .order('iniciada_em', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Erro ao buscar status das coletas:', error)
      return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
    }

    // Agrupar por tipo
    const statusByType = coletas?.reduce((acc: any, coleta: any) => {
      if (!acc[coleta.tipo_coleta]) {
        acc[coleta.tipo_coleta] = []
      }
      acc[coleta.tipo_coleta].push(coleta)
      return acc
    }, {})

    // Resumo geral
    const ultimaColeta = coletas?.[0]
    const resumo = {
      ultima_coleta: ultimaColeta ? {
        data: ultimaColeta.iniciada_em,
        status: ultimaColeta.status,
        tipo: ultimaColeta.tipo_coleta,
        registros: ultimaColeta.registros_processados
      } : null,
      total_coletas_hoje: coletas?.filter(c => 
        new Date(c.iniciada_em).toDateString() === new Date().toDateString()
      ).length || 0,
      por_tipo: statusByType,
      configuracao_ativa: true // TODO: verificar se config está ativa
    }

    return NextResponse.json(resumo)

  } catch (error: any) {
    console.error('❌ Erro ao buscar status das coletas:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 