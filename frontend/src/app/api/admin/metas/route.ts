import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Buscar metas do bar
    const { data: metasData, error } = await supabase
      .from('metas_bar')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar metas:', error)
      return NextResponse.json({ error: 'Erro ao buscar metas' }, { status: 500 })
    }

    if (!metasData) {
      return NextResponse.json({ metas: null }, { status: 200 })
    }

    // Converter formato do banco para formato da interface
    const metas = {
      // Metas Financeiras Diárias
      faturamentoDiario: metasData.faturamento_diario || 37000,
      clientesDiario: metasData.clientes_diario || 500,
      ticketMedioTarget: metasData.ticket_medio_target || 93,
      
      // Metas Financeiras Mensais
      metaMensalFaturamento: metasData.meta_mensal_faturamento || 1000000,
      metaMensalClientes: metasData.meta_mensal_clientes || 10000,
      
      // Metas de Reservas
      reservasDiarias: metasData.reservas_diarias || 133,
      reservasSemanais: metasData.reservas_semanais || 800,
      reservasMensais: metasData.reservas_mensais || 3200,
      
      // Metas de Tempo de Produção
      tempoSaidaCozinha: metasData.tempo_cozinha || 12,
      tempoSaidaBar: metasData.tempo_bar || 4,
      tempoMedioAtendimento: metasData.tempo_medio_atendimento || 15,
      
      // Metas de Eficiência
      metaEficienciaProducao: metasData.meta_eficiencia_producao || 85
    }

    return NextResponse.json({ metas })
  } catch (error) {
    console.error('Erro geral na API de metas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      bar_id,
      faturamentoDiario,
      clientesDiario,
      ticketMedioTarget,
      metaMensalFaturamento,
      metaMensalClientes,
      reservasDiarias,
      reservasSemanais,
      reservasMensais,
      tempoSaidaCozinha,
      tempoSaidaBar,
      tempoMedioAtendimento,
      metaEficienciaProducao
    } = body

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Verificar se já existe registro para este bar
    const { data: existente } = await supabase
      .from('metas_bar')
      .select('id')
      .eq('bar_id', parseInt(bar_id))
      .maybeSingle()

    // Converter formato da interface para formato do banco
    const metasParaBanco: any = {
      bar_id: parseInt(bar_id),
      faturamento_diario: faturamentoDiario,
      clientes_diario: clientesDiario,
      ticket_medio_target: ticketMedioTarget,
      meta_mensal_faturamento: metaMensalFaturamento,
      meta_mensal_clientes: metaMensalClientes,
      reservas_diarias: reservasDiarias,
      reservas_semanais: reservasSemanais,
      reservas_mensais: reservasMensais,
      tempo_cozinha: tempoSaidaCozinha,
      tempo_bar: tempoSaidaBar,
      tempo_medio_atendimento: tempoMedioAtendimento,
      meta_eficiencia_producao: metaEficienciaProducao,
      atualizado_em: new Date().toISOString()
    }

    let result
    if (existente) {
      // Atualizar registro existente
      result = await supabase
        .from('metas_bar')
        .update(metasParaBanco)
        .eq('bar_id', parseInt(bar_id))
        .select()
    } else {
      // Criar novo registro
      metasParaBanco.criado_em = new Date().toISOString()
      result = await supabase
        .from('metas_bar')
        .insert([metasParaBanco])
        .select()
    }

    if (result.error) {
      console.error('Erro ao salvar metas:', result.error)
      return NextResponse.json({ error: 'Erro ao salvar metas' }, { status: 500 })
    }

    console.log('✅ Metas salvas com sucesso para bar_id:', bar_id)
    return NextResponse.json({ 
      success: true, 
      message: 'Metas salvas com sucesso',
      data: result.data 
    })

  } catch (error) {
    console.error('Erro geral ao salvar metas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 