import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar service role para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.dGNZvl9_7-RZhFqD8GKIvSsqeAh0_GnWQdpNGQCfQ8g'
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id')
    
    console.log('üîç GET /api/configuracoes/webhooks - Bar ID:', barId)
    
    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar ID ·© obrigat·≥rio' },
        { status: 400 }
      )
    }

    // Converter para integer para garantir compatibilidade
    const barIdInt = parseInt(barId: any, 10)
    console.log('üîç Bar ID convertido para int:', barIdInt)

    // Buscar cada webhook no seu sistema espec·≠fico
    console.log('üîç Buscando webhooks nos sistemas espec·≠ficos...')
    
    const webhookMapping = {
      sistema: 'sistema',
      contaazul: 'contaazul',
      meta: 'meta',
      checklists: 'checklists',
      contahub: 'contahub',
      sympla: 'sympla',
      yuzer: 'yuzer',
      reservas: 'getin'
    }

    const finalConfiguracoes: { [key: string]: string } = {}
    
    for (const [webhookKey, sistema] of Object.entries(webhookMapping)) {
      const { data: webhookData, error: webhookError } = await supabaseAdmin
        .from('api_credentials')
        .select('configuracoes')
        .eq('bar_id', barIdInt)
        .eq('sistema', sistema)
        .eq('ambiente', 'producao')
        .maybeSingle()

      if (!webhookError && webhookData && webhookData.configuracoes?.webhook_url) {
        finalConfiguracoes[webhookKey] = webhookData.configuracoes.webhook_url
        console.log(`úÖ Webhook ${webhookKey} encontrado no sistema ${sistema}`)
      } else {
        finalConfiguracoes[webhookKey] = ''
        console.log(`ö†Ô∏è Webhook ${webhookKey} n·£o encontrado no sistema ${sistema}`)
      }
    }

    console.log('úÖ Configura·ß·µes finais:', finalConfiguracoes)
    
    return NextResponse.json({
      success: true,
      configuracoes: finalConfiguracoes
    })

  } catch (error) {
    console.error('ùå Erro na API de configura·ß·µes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bar_id, configuracoes } = await request.json()
    
    console.log('üíæ POST /api/configuracoes/webhooks - Dados recebidos:', { bar_id, configuracoes })
    
    if (!bar_id || !configuracoes) {
      console.log('ùå Dados insuficientes:', { bar_id, configuracoes })
      return NextResponse.json(
        { success: false, error: 'Bar ID e configura·ß·µes s·£o obrigat·≥rios' },
        { status: 400 }
      )
    }

    // Salvar cada webhook no seu sistema espec·≠fico
    console.log('üíæ Tentando salvar configura·ß·µes...')
    
    // Mapear webhooks para seus respectivos sistemas
    const webhookMapping = {
      sistema: 'sistema',
      contaazul: 'contaazul',
      meta: 'meta',
      checklists: 'checklists',
      contahub: 'contahub',
      sympla: 'sympla',
      yuzer: 'yuzer',
      reservas: 'getin'
    }

    const results = []
    
    // Salvar cada webhook no seu sistema espec·≠fico
    for (const [webhookKey, sistema] of Object.entries(webhookMapping)) {
      const webhookUrl = configuracoes[webhookKey]
      
      if (webhookUrl && webhookUrl.trim()) {
        console.log(`üíæ Salvando webhook ${webhookKey} no sistema ${sistema}`)
        
        const { data: specificData, error: specificError } = await supabaseAdmin
          .from('api_credentials')
          .upsert({
            bar_id,
            sistema,
            ambiente: 'producao',
            configuracoes: {
              webhook_url: webhookUrl,
              tipo: 'discord_webhook',
              origem: 'configuracoes_integracoes'
            },
            ativo: true,
            atualizado_em: new Date().toISOString()
          }, {
            onConflict: 'bar_id,sistema,ambiente'
          })

        if (specificError) {
          console.error(`ùå Erro ao salvar webhook ${webhookKey}:`, specificError)
          return NextResponse.json(
            { success: false, error: `Erro ao salvar webhook ${webhookKey}`, details: specificError },
            { status: 500 }
          )
        }

        results.push({ webhook: webhookKey, sistema: any, saved: true })
      } else {
        console.log(`ö†Ô∏è Webhook ${webhookKey} est·° vazio, pulando...`)
      }
    }

    console.log('úÖ Configura·ß·µes salvas com sucesso!')
    console.log('úÖ Resultados:', results)
    
    return NextResponse.json({
      success: true,
      message: 'Configura·ß·µes salvas com sucesso',
      results
    })

  } catch (error) {
    console.error('ùå Erro na API de configura·ß·µes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
