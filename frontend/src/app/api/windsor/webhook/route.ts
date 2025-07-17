import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook para receber dados do Windsor.ai em tempo real
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 Windsor.ai Webhook - Dados recebidos:', {
      event_type: body.event_type,
      connector: body.connector,
      data_count: body.data?.length || 0,
      timestamp: new Date().toISOString()
    })

    // Validar payload
    if (!body.connector || !body.data || !Array.isArray(body.data)) {
      return NextResponse.json(
        { success: false, error: 'Payload inválido' },
        { status: 400 }
      )
    }

    // Processar dados recebidos
    const processedData = await processWindsorWebhookData(body)
    
    // Salvar no banco
    const { data: savedData, error: saveError } = await supabase
      .from('windsor_webhook_data')
      .insert({
        connector: body.connector,
        event_type: body.event_type || 'data_update',
        raw_payload: body,
        processed_data: processedData,
        received_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Erro ao salvar webhook data:', saveError)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar dados' },
        { status: 500 }
      )
    }

    console.log('✅ Webhook Windsor.ai processado com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Dados recebidos e processados',
      data: {
        id: savedData.id,
        connector: body.connector,
        records_processed: processedData.length,
        received_at: savedData.received_at
      }
    })

  } catch (error) {
    console.error('❌ Erro no webhook Windsor.ai:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Processar dados do webhook Windsor.ai
async function processWindsorWebhookData(webhookData: any) {
  const processed: Array<{
    bar_id?: number
    platform: string
    date: string
    campaign_name: string
    adset_name: string
    impressions: number
    reach: number
    clicks: number
    spend: number
    conversions: number
    ctr: number
    cpc: number
    cpm: number
    raw_row: any
  }> = []

  for (const row of webhookData.data) {
    // Tentar identificar bar_id baseado no campaign_name ou account_id
    const barId = await identifyBarFromData(row)
    
    const processedRow = {
      bar_id: barId,
      platform: webhookData.connector,
      date: row.date || row.date_start || new Date().toISOString().split('T')[0],
      campaign_name: row.campaign_name || 'N/A',
      adset_name: row.adset_name || 'N/A',
      impressions: parseInt(row.impressions) || 0,
      reach: parseInt(row.reach) || 0,
      clicks: parseInt(row.clicks) || 0,
      spend: parseFloat(row.spend) || 0,
      conversions: parseInt(row.conversions) || 0,
      ctr: parseFloat(row.ctr) || 0,
      cpc: parseFloat(row.cpc) || 0,
      cpm: parseFloat(row.cpm) || 0,
      raw_row: row
    }
    
    processed.push(processedRow)
  }

  return processed
}

// Identificar bar_id baseado nos dados recebidos
async function identifyBarFromData(row: any): Promise<number | undefined> {
  try {
    // Buscar por campaign_name que contenha identificadores do bar
    if (row.campaign_name) {
      const { data: barData } = await supabase
        .from('bars')
        .select('id, nome')
        .ilike('nome', `%${row.campaign_name}%`)
        .limit(1)
        .single()
      
      if (barData) {
        return barData.id
      }
    }

    // Buscar por account_id se disponível
    if (row.account_id) {
      const { data: barConfig } = await supabase
        .from('api_credentials')
        .select('bar_id')
        .eq('client_id', row.account_id)
        .limit(1)
        .single()
      
      if (barConfig) {
        return barConfig.bar_id
      }
    }

    return undefined
  } catch (error) {
    console.warn('⚠️ Não foi possível identificar bar_id para dados:', row)
    return undefined
  }
} 