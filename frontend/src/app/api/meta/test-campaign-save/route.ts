import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 TESTANDO SALVAMENTO DE CAMPANHAS NO BANCO...')

    const hoje = new Date().toISOString().split('T')[0]
    const BAR_ID = 3

    // 1. Buscar dados de campanhas primeiro
    const campaignsResponse = await fetch('http://localhost:3001/api/meta/debug-coletarcampanhas')
    const campaignsResult = await campaignsResponse.json()

    if (!campaignsResult.success || !campaignsResult.final_result.campaigns) {
      return NextResponse.json({
        success: false,
        error: 'Não foi possível obter dados de campanhas para teste'
      })
    }

    const campaigns = campaignsResult.final_result.campaigns
    console.log(`📊 Preparando para salvar ${campaigns.length} campanhas...`)

    // 2. Preparar dados exatamente como o robô faz
    const campaignsToInsert = campaigns.map((campaign: any) => {
      const insights = campaign.insights?.data?.[0] || {}
      
      return {
        bar_id: BAR_ID,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        ad_account_id: 'act_943600147532423', // Conta Deboche
        status: campaign.status,
        effective_status: campaign.effective_status,
        objective: campaign.objective,
        start_time: campaign.start_time || null,
        stop_time: campaign.stop_time || null,
        daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) : null,
        lifetime_budget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) : null,
        impressions: insights.impressions ? parseInt(insights.impressions) : 0,
        reach: insights.reach ? parseInt(insights.reach) : 0,
        clicks: insights.clicks ? parseInt(insights.clicks) : 0,
        ctr: insights.ctr ? parseFloat(insights.ctr) : null,
        cpc: insights.cpc ? parseFloat(insights.cpc) : null,
        spend: insights.spend ? parseFloat(insights.spend) : 0,
        actions_count: insights.actions?.length || 0,
        conversions: insights.conversions ? parseInt(insights.conversions) : 0,
        data_coleta: hoje,
        coletado_em: new Date().toISOString(),
        platform: 'META',
        raw_data: campaign
      }
    })

    console.log(`💾 Preparados ${campaignsToInsert.length} registros para inserção`)
    console.log('📋 Primeiro registro:', JSON.stringify(campaignsToInsert[0], null, 2))

    // 3. Deletar dados existentes de hoje
    console.log('🗑️ Removendo dados existentes de hoje...')
    const { error: deleteError } = await supabase
      .from('meta_campaigns_history')
      .delete()
      .eq('bar_id', BAR_ID)
      .eq('data_coleta', hoje)

    if (deleteError) {
      console.log('⚠️ Erro ao deletar (pode ser normal se não havia dados):', deleteError)
    }

    // 4. Inserir novos dados
    console.log('💾 Inserindo novos dados...')
    const { data: insertedData, error: insertError } = await supabase
      .from('meta_campaigns_history')
      .insert(campaignsToInsert)
      .select()

    if (insertError) {
      console.error('❌ Erro ao inserir campanhas:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir no banco',
        details: insertError,
        prepared_records: campaignsToInsert.length,
        sample_record: campaignsToInsert[0]
      })
    }

    console.log('✅ Campanhas inseridas com sucesso!')
    
    // 5. Verificar se foram salvas
    const { data: savedData, error: checkError } = await supabase
      .from('meta_campaigns_history')
      .select('campaign_id, campaign_name, spend, impressions, data_coleta')
      .eq('bar_id', BAR_ID)
      .eq('data_coleta', hoje)
      .order('coletado_em', { ascending: false })

    return NextResponse.json({
      success: true,
      message: `${insertedData?.length || 0} campanhas salvas com sucesso`,
      inserted_count: insertedData?.length || 0,
      verified_count: savedData?.length || 0,
      sample_saved: savedData?.slice(0, 3) || [],
      total_spend: campaignsToInsert.reduce((sum, c) => sum + (c.spend || 0), 0),
      total_impressions: campaignsToInsert.reduce((sum, c) => sum + (c.impressions || 0), 0)
    })

  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
} 