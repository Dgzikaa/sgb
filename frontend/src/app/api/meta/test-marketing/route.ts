import { NextRequest, NextResponse } from 'next/server'
import { sgbMarketingBot, notifyMarketingUpdate } from '@/lib/discord-marketing-service'

// ========================================
// 🧪 GET /api/meta/test-marketing
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando webhook Discord Marketing...')
    
    const success = await sgbMarketingBot.testarConexao()
    
    return NextResponse.json({
      success,
      message: success ? 'Webhook Marketing funcionando!' : 'Falha no webhook Marketing',
      webhook_status: success ? 'Ativo' : 'Inativo',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no teste Marketing:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// ========================================
// 🚀 POST /api/meta/test-marketing
// ========================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, dados } = body

    console.log(`🧪 Testando notificação Marketing: ${tipo}`)

    let success = false

    switch (tipo) {
      case 'relatorio_diario':
        // Teste do relatório diário com dados mock
        const metricasMock = {
          facebook: {
            followers: 2543,
            reach: 8924,
            engagement: 456,
            posts_today: 3,
            growth_rate: 2.4
          },
          instagram: {
            followers: 3821,
            reach: 12453,
            engagement: 678,
            posts_today: 5,
            growth_rate: 3.1
          },
          overall: {
            total_followers: 6364,
            total_reach: 21377,
            total_engagement: 1134,
            engagement_rate: 5.3,
            best_performing_platform: 'instagram' as const
          }
        }
        success = await notifyMarketingUpdate('relatorio', { metrics: metricasMock })
        break

      case 'coleta_iniciada':
        success = await notifyMarketingUpdate('coleta', { 
          iniciando: true, 
          tipo: dados?.tipo || 'manual' 
        })
        break

      case 'coleta_concluida':
        const resultadoMock = {
          facebook_metricas: true,
          instagram_metricas: true,
          facebook_posts: 12,
          instagram_posts: 18,
          tempo_execucao: 34,
          registros_novos: 30
        }
        success = await notifyMarketingUpdate('coleta', { 
          iniciando: false, 
          resultado: dados?.resultado || resultadoMock 
        })
        break

      case 'marco_atingido':
        success = await notifyMarketingUpdate('marco', {
          tipo: dados?.metrica || 'seguidores',
          plataforma: dados?.plataforma || 'instagram',
          valor_atual: dados?.valor_atual || 4000,
          marco_atingido: dados?.marco_atingido || 4000,
          crescimento: dados?.crescimento || 5.2
        })
        break

      case 'erro':
        success = await notifyMarketingUpdate('erro', {
          tipo: dados?.tipo || 'API Meta',
          mensagem: dados?.mensagem || 'Token de acesso expirado',
          detalhes: dados?.detalhes || 'O token de acesso da Meta API precisa ser renovado',
          acao_sugerida: dados?.acao_sugerida || 'Acesse Meta for Developers e gere um novo token'
        })
        break

      default:
        return NextResponse.json({
          success: false,
          message: 'Tipo de teste inválido',
          tipos_disponiveis: ['relatorio_diario', 'coleta_iniciada', 'coleta_concluida', 'marco_atingido', 'erro']
        }, { status: 400 })
    }

    return NextResponse.json({
      success,
      message: success ? `Teste ${tipo} enviado com sucesso` : `Falha no teste ${tipo}`,
      tipo_testado: tipo,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no teste POST Marketing:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 