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
    
    console.log('ðŸ” GET /api/configuracoes/webhooks - Bar ID:', barId)
    
    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar ID á© obrigatá³rio' },
        { status: 400 }
      )
    }

    // Converter para integer para garantir compatibilidade
    const barIdInt = parseInt(barId, 10)
    console.log('ðŸ” Bar ID convertido para int:', barIdInt)

    // Buscar cada webhook no seu sistema especá­fico
    console.log('ðŸ” Buscando webhooks nos sistemas especá­ficos...')
    
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
        console.log(`œ… Webhook ${webhookKey} encontrado no sistema ${sistema}`)
      } else {
        finalConfiguracoes[webhookKey] = ''
        console.log(`š ï¸ Webhook ${webhookKey} ná£o encontrado no sistema ${sistema}`)
      }
    }

    console.log('œ… Configuraá§áµes finais:', finalConfiguracoes)
    
    return NextResponse.json({
      success: true,
      configuracoes: finalConfiguracoes
    })

  } catch (error) {
    console.error('Œ Erro na API de configuraá§áµes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bar_id, configuracoes } = await request.json()
    
    console.log('ðŸ’¾ POST /api/configuracoes/webhooks - Dados recebidos:', { bar_id, configuracoes })
    
    if (!bar_id || !configuracoes) {
      console.log('Œ Dados insuficientes:', { bar_id, configuracoes })
      return NextResponse.json(
        { success: false, error: 'Bar ID e configuraá§áµes sá£o obrigatá³rios' },
        { status: 400 }
      )
    }

    // Salvar cada webhook no seu sistema especá­fico
    console.log('ðŸ’¾ Tentando salvar configuraá§áµes...')
    
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
    
    // Salvar cada webhook no seu sistema especá­fico
    for (const [webhookKey, sistema] of Object.entries(webhookMapping)) {
      const webhookUrl = configuracoes[webhookKey]
      
      if (webhookUrl && webhookUrl.trim()) {
        console.log(`ðŸ’¾ Salvando webhook ${webhookKey} no sistema ${sistema}`)
        
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
          console.error(`Œ Erro ao salvar webhook ${webhookKey}:`, specificError)
          return NextResponse.json(
            { success: false, error: `Erro ao salvar webhook ${webhookKey}`, details: specificError },
            { status: 500 }
          )
        }

        results.push({ webhook: webhookKey, sistema, saved: true })
      } else {
        console.log(`š ï¸ Webhook ${webhookKey} está¡ vazio, pulando...`)
      }
    }

    console.log('œ… Configuraá§áµes salvas com sucesso!')
    console.log('œ… Resultados:', results)
    
    return NextResponse.json({
      success: true,
      message: 'Configuraá§áµes salvas com sucesso',
      results
    })

  } catch (error) {
    console.error('Œ Erro na API de configuraá§áµes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
