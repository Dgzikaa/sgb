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

// Usar service role para bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.dGNZvl9_7-RZhFqD8GKIvSsqeAh0_GnWQdpNGQCfQ8g'
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('bar_id')
    
    console.log('Ã°Å¸â€Â GET /api/configuracoes/webhooks - Bar ID:', barId)
    
    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar ID Ã¡Â© obrigatÃ¡Â³rio' },
        { status: 400 }
      )
    }

    // Converter para integer para garantir compatibilidade
    const barIdInt = parseInt(barId, 10)
    console.log('Ã°Å¸â€Â Bar ID convertido para int:', barIdInt)

    // Buscar cada webhook no seu sistema especÃ¡Â­fico
    console.log('Ã°Å¸â€Â Buscando webhooks nos sistemas especÃ¡Â­ficos...')
    
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
        console.log(`Å“â€¦ Webhook ${webhookKey} encontrado no sistema ${sistema}`)
      } else {
        finalConfiguracoes[webhookKey] = ''
        console.log(`Å¡Â Ã¯Â¸Â Webhook ${webhookKey} nÃ¡Â£o encontrado no sistema ${sistema}`)
      }
    }

    console.log('Å“â€¦ ConfiguraÃ¡Â§Ã¡Âµes finais:', finalConfiguracoes)
    
    return NextResponse.json({
      success: true,
      configuracoes: finalConfiguracoes
    })

  } catch (error) {
    console.error('ÂÅ’ Erro na API de configuraÃ¡Â§Ã¡Âµes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { bar_id, configuracoes } = await request.json()
    
    console.log('Ã°Å¸â€™Â¾ POST /api/configuracoes/webhooks - Dados recebidos:', { bar_id, configuracoes })
    
    if (!bar_id || !configuracoes) {
      console.log('ÂÅ’ Dados insuficientes:', { bar_id, configuracoes })
      return NextResponse.json(
        { success: false, error: 'Bar ID e configuraÃ¡Â§Ã¡Âµes sÃ¡Â£o obrigatÃ¡Â³rios' },
        { status: 400 }
      )
    }

    // Salvar cada webhook no seu sistema especÃ¡Â­fico
    console.log('Ã°Å¸â€™Â¾ Tentando salvar configuraÃ¡Â§Ã¡Âµes...')
    
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
    
    // Salvar cada webhook no seu sistema especÃ¡Â­fico
    for (const [webhookKey, sistema] of Object.entries(webhookMapping)) {
      const webhookUrl = configuracoes[webhookKey]
      
      if (webhookUrl && webhookUrl.trim()) {
        console.log(`Ã°Å¸â€™Â¾ Salvando webhook ${webhookKey} no sistema ${sistema}`)
        
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
          console.error(`ÂÅ’ Erro ao salvar webhook ${webhookKey}:`, specificError)
          return NextResponse.json(
            { success: false, error: `Erro ao salvar webhook ${webhookKey}`, details: specificError },
            { status: 500 }
          )
        }

        results.push({ webhook: webhookKey, sistema, saved: true })
      } else {
        console.log(`Å¡Â Ã¯Â¸Â Webhook ${webhookKey} estÃ¡Â¡ vazio, pulando...`)
      }
    }

    console.log('Å“â€¦ ConfiguraÃ¡Â§Ã¡Âµes salvas com sucesso!')
    console.log('Å“â€¦ Resultados:', results)
    
    return NextResponse.json({
      success: true,
      message: 'ConfiguraÃ¡Â§Ã¡Âµes salvas com sucesso',
      results
    })

  } catch (error) {
    console.error('ÂÅ’ Erro na API de configuraÃ¡Â§Ã¡Âµes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

