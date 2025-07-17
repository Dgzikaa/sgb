import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('??? Populando meta_daily_summary com dados existentes...')

    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    const daysBack = parseInt(searchParams.get('days_back') || '30')
    const force = searchParams.get('force') === 'true'

    console.log(`?? Parmetros: bar_id=${barId}, days_back=${daysBack}, force=${force}`)

    // Calcular periodo
    const hoje = new Date();
    const inicioPeriodo = new Date(hoje.getTime() - daysBack * 24 * 60 * 60 * 1000);

    console.log(`?? Periodo: ${inicioPeriodo.toISOString().split('T')[0]} até ${hoje.toISOString().split('T')[0]}`);

    // 1. Buscar dados existentes do Facebook por dia
    const { data: facebookData, error: fbError } = await supabase
      .from('facebook_metrics')
      .select('*')
      .eq('bar_id', barId)
      .gte('data_referencia', inicioPeriodo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: false })

    if (fbError) {
      console.error('? Erro ao buscar facebook_metrics:', fbError)
      throw new Error(`Erro Facebook: ${fbError.message}`)
    }

    // 2. Buscar dados existentes do Instagram por dia
    const { data: instagramData, error: igError } = await supabase
      .from('instagram_metrics')
      .select('*')
      .eq('bar_id', barId)
      .gte('data_referencia', inicioPeriodo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: false })

    if (igError) {
      console.error('? Erro ao buscar instagram_metrics:', igError)
      throw new Error(`Erro Instagram: ${igError.message}`)
    }

    // 3. Buscar campanhas existentes
    const { data: campaignsData, error: campaignsError } = await supabase
      .from('meta_campaigns_history')
      .select('*')
      .eq('bar_id', barId)
      .gte('data_coleta', inicioPeriodo.toISOString().split('T')[0])
      .order('data_coleta', { ascending: false })

    console.log(`?? Dados encontrados: Facebook=${facebookData?.length || 0}, Instagram=${instagramData?.length || 0}, Campanhas=${campaignsData?.length || 0}`)

    // 4. Criar map por data para facilitar processamento
    const fbByDate = new Map()
    facebookData?.forEach((row: any) => {
      fbByDate.set(row.data_referencia, row)
    })

    const igByDate = new Map()
    instagramData?.forEach((row: any) => {
      igByDate.set(row.data_referencia, row)
    })

    const campaignsByDate = new Map()
    campaignsData?.forEach((row: any) => {
      if (!campaignsByDate.has(row.data_coleta)) {
        campaignsByDate.set(row.data_coleta, [])
      }
      campaignsByDate.get(row.data_coleta).push(row)
    })

    // 5. Obter todas as datas únicas
    const allDates = new Set([
      ...Array.from(fbByDate.keys()),
      ...Array.from(igByDate.keys()),
      ...Array.from(campaignsByDate.keys())
    ])

    console.log(`?? Datas únicas encontradas: ${allDates.size}`)

    // 6. Preparar dados para inserçáo
    const dailySummaryRecords = []
    let processedDates = 0
    let skippedDates = 0

    for (const date of Array.from(allDates).sort().reverse()) {
      try {
        // Verificar se já existe registro para esta data (se náo forçar)
        if (!force) {
          const { data: existingRecord } = await supabase
            .from('meta_daily_summary')
            .select('id')
            .eq('bar_id', barId)
            .eq('data_referencia', date)
            .single()

          if (existingRecord) {
            console.log(`?? Pulando ${date} - já existe`)
            skippedDates++
            continue
          }
        }

        const fbDay = fbByDate.get(date)
        const igDay = igByDate.get(date)
        const campaignsDay = campaignsByDate.get(date) || []

        // Agregar dados de campanhas do dia
        const campaignsActive = campaignsDay.filter((c: any) => c.effective_status === 'ACTIVE').length
        const campaignsTotalSpend = campaignsDay.reduce((sum: number, c: any) => sum + (c.spend || 0), 0)
        const campaignsTotalImpressions = campaignsDay.reduce((sum: number, c: any) => sum + (c.impressions || 0), 0)
        const campaignsTotalClicks = campaignsDay.reduce((sum: number, c: any) => sum + (c.clicks || 0), 0)
        const campaignsTotalConversions = campaignsDay.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0)

        const record = {
          bar_id: barId,
          data_referencia: date,
          
          // Facebook
          facebook_followers: fbDay?.page_fans || 0,
          facebook_posts_count: 0, // Náo temos na tabela atual
          facebook_total_reactions: fbDay?.post_likes || 0,
          facebook_total_comments: fbDay?.post_comments || 0,
          facebook_total_shares: fbDay?.post_shares || 0,
          facebook_reach: fbDay?.page_reach || 0,
          facebook_impressions: fbDay?.page_impressions || 0,
          
          // Instagram
          instagram_followers: igDay?.follower_count || 0,
          instagram_following: igDay?.following_count || 0,
          instagram_posts_count: 0, // Náo temos na tabela atual
          instagram_total_likes: igDay?.posts_likes || 0,
          instagram_total_comments: igDay?.posts_comments || 0,
          instagram_total_shares: 0, // Náo temos na tabela atual
          instagram_reach: igDay?.reach || 0,
          instagram_impressions: igDay?.impressions || 0,
          instagram_saves: 0, // Náo temos na tabela atual
          instagram_profile_visits: 0, // Náo temos na tabela atual
          instagram_website_clicks: 0, // Náo temos na tabela atual
          
          // Campanhas
          campaigns_active: campaignsActive,
          campaigns_total_spend: campaignsTotalSpend,
          campaigns_total_impressions: campaignsTotalImpressions,
          campaigns_total_clicks: campaignsTotalClicks,
          campaigns_total_conversions: campaignsTotalConversions,
          
          // Timestamps
          coletado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        }

        dailySummaryRecords.push(record)
        processedDates++

        console.log(`? Processado ${date}: FB=${record.facebook_followers}, IG=${record.instagram_followers}, Campanhas=${record.campaigns_active}`)

      } catch (dateError) {
        console.error(`? Erro ao processar data ${date}:`, dateError)
      }
    }

    console.log(`?? Registros preparados: ${dailySummaryRecords.length}`)

    // 7. Inserir dados na meta_daily_summary
    let insertedCount = 0
    let errorCount = 0

    if (dailySummaryRecords.length > 0) {
      // Se force=true, fazer upsert (delete + insert)
      if (force) {
        console.log('??? Modo FORCE: removendo registros existentes...')
        await supabase
          .from('meta_daily_summary')
          .delete()
          .eq('bar_id', barId)
          .gte('data_referencia', inicioPeriodo.toISOString().split('T')[0])
      }

      // Inserir em lotes de 50 para evitar timeout
      const batchSize = 50
      for (let i = 0; i < dailySummaryRecords.length; i += batchSize) {
        const batch = dailySummaryRecords.slice(i: any, i + batchSize)
        
        try {
          const { data: insertedData, error: insertError } = await supabase
            .from('meta_daily_summary')
            .insert(batch)
            .select('data_referencia')

          if (insertError) {
            console.error(`? Erro ao inserir lote ${i}-${i + batch.length}:`, insertError)
            errorCount += batch.length
          } else {
            insertedCount += insertedData?.length || batch.length
            console.log(`? Lote ${i}-${i + batch.length} inserido com sucesso`)
          }
        } catch (batchError) {
          console.error(`? Erro no lote ${i}:`, batchError)
          errorCount += batch.length
        }
      }
    }

    // 8. Verificar resultado final
    const { data: finalCount } = await supabase
      .from('meta_daily_summary')
      .select('id', { count: 'exact' })
      .eq('bar_id', barId)

    const responseData = {
      success: true,
      message: 'Populaçáo da meta_daily_summary concluída',
      stats: {
        bar_id: barId,
        period: {
          start: inicioPeriodo.toISOString().split('T')[0],
          end: hoje.toISOString().split('T')[0],
          days_back: daysBack
        },
        source_data: {
          facebook_records: facebookData?.length || 0,
          instagram_records: instagramData?.length || 0,
          campaigns_records: campaignsData?.length || 0,
          unique_dates: allDates.size
        },
        processing: {
          processed_dates: processedDates,
          skipped_dates: skippedDates,
          records_prepared: dailySummaryRecords.length,
          records_inserted: insertedCount,
          records_errors: errorCount,
          force_mode: force
        },
        final_count: finalCount?.length || 0
      }
    }

    console.log('? Populaçáo concluída:', {
      inserted: insertedCount,
      errors: errorCount,
      total_records: finalCount?.length || 0
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('? Erro na populaçáo da meta_daily_summary:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
