import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bar_id, start_date, end_date, data_types, delay_ms = 2000, process_after = true } = body

    if (!bar_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'bar_id, start_date e end_date são obrigatórios' },
        { status: 400 }
      )
    }

    console.log(`🎯 Iniciando sync retroativo: ${start_date} até ${end_date}`)

    // Chamar a Edge Function com service role
    const response = await fetch(
      `${supabaseUrl}/functions/v1/contahub-sync-retroativo`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          bar_id,
          start_date,
          end_date,
          data_types: data_types || ['vendas'], // Por padrão, só sync de vendas
          delay_ms,
          process_after
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na Edge Function:', errorText)
      return NextResponse.json(
        { error: `Erro na Edge Function: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('✅ Sync retroativo concluído:', result.summary)

    return NextResponse.json(result)
  } catch (error) {
    console.error('❌ Erro no sync retroativo:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

// GET para verificar status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id') || '3'

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar dados existentes por tipo
    const { data: rawDataStats, error: rawError } = await supabase
      .from('contahub_raw_data')
      .select('data_type, data_date, processed')
      .eq('bar_id', parseInt(bar_id))
      .order('data_date', { ascending: false })

    if (rawError) {
      throw rawError
    }

    // Agrupar por tipo
    const statsByType: { [key: string]: { total: number; processed: number; dates_range: string } } = {}
    
    for (const record of rawDataStats || []) {
      if (!statsByType[record.data_type]) {
        statsByType[record.data_type] = { total: 0, processed: 0, dates_range: '' }
      }
      statsByType[record.data_type].total++
      if (record.processed) {
        statsByType[record.data_type].processed++
      }
    }

    // Verificar vendas processadas
    const { data: vendasStats, error: vendasError } = await supabase
      .from('contahub_vendas')
      .select('dt_gerencial')
      .eq('bar_id', parseInt(bar_id))
    
    const vendasDates = vendasStats?.map(v => v.dt_gerencial) || []
    const uniqueVendasDates = [...new Set(vendasDates)]

    return NextResponse.json({
      success: true,
      stats: {
        raw_data: statsByType,
        vendas_processadas: {
          total_dias: uniqueVendasDates.length,
          total_registros: vendasStats?.length || 0,
          data_mais_antiga: uniqueVendasDates.sort()[0] || null,
          data_mais_recente: uniqueVendasDates.sort().reverse()[0] || null
        }
      }
    })
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    )
  }
}

