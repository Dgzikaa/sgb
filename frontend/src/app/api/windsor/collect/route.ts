import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Windsor.ai API Configuration
const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY
const WINDSOR_BASE_URL = 'https://api.windsor.ai/v1'

// Mapeamento de plataformas Windsor.ai
const WINDSOR_CONNECTORS = {
  facebook: 'facebook_ads',
  instagram: 'instagram',
  google: 'google_ads',
  tiktok: 'tiktok_ads',
  linkedin: 'linkedin_ads'
} as const

export async function POST(request: NextRequest) {
  try {
    const { bar_id, platform, date_from, date_to, metrics } = await request.json()
    
    console.log('🔄 Windsor.ai Collect - Iniciando coleta:', {
      bar_id,
      platform,
      date_from,
      date_to,
      metrics_count: metrics?.length
    })

    if (!bar_id || !platform || !WINDSOR_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Buscar configurações do bar
    const { data: barConfig, error: configError } = await supabase
      .from('bars')
      .select('windsor_config')
      .eq('id', bar_id)
      .single()

    if (configError || !barConfig?.windsor_config) {
      return NextResponse.json(
        { success: false, error: 'Configuração Windsor.ai não encontrada para este bar' },
        { status: 404 }
      )
    }

    const connector = WINDSOR_CONNECTORS[platform as keyof typeof WINDSOR_CONNECTORS]
    if (!connector) {
      return NextResponse.json(
        { success: false, error: `Plataforma ${platform} não suportada` },
        { status: 400 }
      )
    }

    // Preparar query Windsor.ai
    const queryData = {
      connector,
      date_from: date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
      date_to: date_to || new Date().toISOString().split('T')[0],
      metrics: metrics || [
        'impressions',
        'reach', 
        'clicks',
        'spend',
        'conversions',
        'ctr',
        'cpc',
        'cpm'
      ],
      dimensions: ['date', 'campaign_name', 'adset_name'],
      filters: barConfig.windsor_config.filters || {}
    }

    console.log('📊 Query Windsor.ai:', queryData)

    // Fazer chamada para Windsor.ai
    const windsorResponse = await fetch(`${WINDSOR_BASE_URL}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WINDSOR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryData)
    })

    if (!windsorResponse.ok) {
      const errorData = await windsorResponse.text()
      console.error('❌ Erro Windsor.ai:', errorData)
      return NextResponse.json(
        { success: false, error: `Erro Windsor.ai: ${windsorResponse.status} - ${errorData}` },
        { status: windsorResponse.status }
      )
    }

    const windsorData = await windsorResponse.json()
    console.log('✅ Dados Windsor.ai recebidos:', {
      rows: windsorData.data?.length || 0,
      columns: windsorData.columns?.length || 0
    })

    // Processar e salvar dados
    const processedData = await processWindsorData(windsorData, bar_id, platform)
    
    // Salvar no banco
    const { data: savedData, error: saveError } = await supabase
      .from('windsor_data')
      .insert({
        bar_id,
        platform,
        date_from: queryData.date_from,
        date_to: queryData.date_to,
        connector,
        raw_data: windsorData,
        processed_data: processedData,
        metrics_collected: metrics,
        collected_at: new Date().toISOString()
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Erro ao salvar dados:', saveError)
      return NextResponse.json(
        { success: false, error: 'Erro ao salvar dados no banco' },
        { status: 500 }
      )
    }

    console.log('✅ Coleta Windsor.ai concluída com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Dados coletados com sucesso via Windsor.ai',
      data: {
        id: savedData.id,
        platform,
        rows_processed: processedData.length,
        date_range: `${queryData.date_from} a ${queryData.date_to}`,
        collected_at: savedData.collected_at
      }
    })

  } catch (error) {
    console.error('❌ Erro na coleta Windsor.ai:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Processar dados do Windsor.ai para formato padronizado
async function processWindsorData(windsorData: any, barId: number, platform: string) {
  const processed: Array<{
    bar_id: number
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
  
  if (!windsorData.data || !Array.isArray(windsorData.data)) {
    return processed
  }

  for (const row of windsorData.data) {
    const processedRow = {
      bar_id: barId,
      platform,
      date: row.date || row.date_start,
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