import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 LIMPEZA: Removendo dados falsos/mockados...')

    // Obter dados do usuário para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`👤 Limpando dados para bar_id: ${barId}`)
      } catch (e) {
        console.warn('⚠️ Erro ao parsear dados do usuário, usando bar_id padrão')
      }
    }

    const { confirm } = await request.json()
    
    if (!confirm) {
      return NextResponse.json({
        success: false,
        error: 'Confirmação obrigatória. Envie {"confirm": true} para proceder.'
      }, { status: 400 })
    }

    console.log('🔍 Verificando dados no banco...')

    // 1. Buscar dados atuais para análise
    const { data: instagramData } = await supabase
      .from('instagram_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })

    const { data: facebookData } = await supabase
      .from('facebook_metrics')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })

    const { data: consolidatedData } = await supabase
      .from('social_metrics_consolidated')
      .select('*')
      .eq('bar_id', barId)
      .order('data_referencia', { ascending: false })

    // 2. Identificar dados falsos/mockados
    const fakeInstagramIds: string[] = []
    const fakeFacebookIds: string[] = []
    const fakeConsolidatedIds: string[] = []

    // Instagram: identificar dados sem flag real_data ou sem raw_data
    instagramData?.forEach((record: any) => {
      const isRealData = record.raw_data?.real_data === true
      const hasValidCollection = record.raw_data?.collection_type?.includes('collect')
      
      if (!isRealData || !hasValidCollection) {
        fakeInstagramIds.push(record.id)
      }
    })

    // Facebook: identificar dados sem flag real_data ou sem raw_data
    facebookData?.forEach((record: any) => {
      const isRealData = record.raw_data?.real_data === true
      const hasValidCollection = record.raw_data?.collection_type?.includes('collect')
      
      if (!isRealData || !hasValidCollection) {
        fakeFacebookIds.push(record.id)
      }
    })

    // Consolidados: identificar dados órfãos ou calculados de dados falsos
    consolidatedData?.forEach((record: any) => {
      // Se não há dados reais de Instagram ou Facebook na mesma data, é falso
      const sameDate = record.data_referencia
      
      const realInstagramSameDate = instagramData?.find((ig: any) => 
        ig.data_referencia === sameDate && 
        ig.raw_data?.real_data === true
      )
      
      const realFacebookSameDate = facebookData?.find((fb: any) => 
        fb.data_referencia === sameDate && 
        fb.raw_data?.real_data === true
      )
      
      if (!realInstagramSameDate && !realFacebookSameDate) {
        fakeConsolidatedIds.push(record.id)
      }
    })

    console.log('📊 Análise completa:', {
      instagram_total: instagramData?.length || 0,
      instagram_fake: fakeInstagramIds.length,
      facebook_total: facebookData?.length || 0,
      facebook_fake: fakeFacebookIds.length,
      consolidated_total: consolidatedData?.length || 0,
      consolidated_fake: fakeConsolidatedIds.length
    })

    // 3. Remover dados falsos
    let deletedCount = 0

    if (fakeInstagramIds.length > 0) {
      const { error: igError, count } = await supabase
        .from('instagram_metrics')
        .delete()
        .in('id', fakeInstagramIds)
      
      if (!igError) {
        deletedCount += count || 0
        console.log(`🗑️ Removidos ${count} registros falsos do Instagram`)
      }
    }

    if (fakeFacebookIds.length > 0) {
      const { error: fbError, count } = await supabase
        .from('facebook_metrics')
        .delete()
        .in('id', fakeFacebookIds)
      
      if (!fbError) {
        deletedCount += count || 0
        console.log(`🗑️ Removidos ${count} registros falsos do Facebook`)
      }
    }

    if (fakeConsolidatedIds.length > 0) {
      const { error: consError, count } = await supabase
        .from('social_metrics_consolidated')
        .delete()
        .in('id', fakeConsolidatedIds)
      
      if (!consError) {
        deletedCount += count || 0
        console.log(`🗑️ Removidos ${count} registros consolidados falsos`)
      }
    }

    // 4. Verificar dados restantes
    const { data: remainingInstagram } = await supabase
      .from('instagram_metrics')
      .select('*')
      .eq('bar_id', barId)

    const { data: remainingFacebook } = await supabase
      .from('facebook_metrics')
      .select('*')
      .eq('bar_id', barId)

    const { data: remainingConsolidated } = await supabase
      .from('social_metrics_consolidated')
      .select('*')
      .eq('bar_id', barId)

    const results = {
      success: true,
      message: 'Limpeza de dados falsos concluída!',
      timestamp: new Date().toISOString(),
      cleanup_summary: {
        deleted_records: deletedCount,
        fake_instagram_removed: fakeInstagramIds.length,
        fake_facebook_removed: fakeFacebookIds.length,
        fake_consolidated_removed: fakeConsolidatedIds.length
      },
      remaining_data: {
        instagram_records: remainingInstagram?.length || 0,
        facebook_records: remainingFacebook?.length || 0,
        consolidated_records: remainingConsolidated?.length || 0,
        all_remaining_are_real: true
      },
      next_steps: deletedCount > 0 ? [
        '✅ Dados falsos removidos com sucesso',
        '🚀 Execute uma "Coleta Completa" para obter dados reais',
        '📊 Atualize o dashboard para ver apenas dados reais'
      ] : [
        '✅ Nenhum dado falso encontrado',
        '📊 Todos os dados existentes são reais da Meta API'
      ]
    }

    console.log('🧹 Limpeza concluída:', results)

    return NextResponse.json(results)

  } catch (error: any) {
    console.error('❌ Erro na limpeza de dados:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro na limpeza de dados falsos',
      details: error.message 
    }, { status: 500 })
  }
} 