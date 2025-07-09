import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth, isAdmin } from '@/lib/auth-helper'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAuth(request)

    if (!user || !isAdmin(user)) {
      return NextResponse.json({ 
        error: 'Apenas administradores podem sincronizar dados' 
      }, { status: 403 })
    }

    const { bar_id } = user
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📊 INSERINDO DADOS FIXOS CORRETOS para teste...')

    // Dados corretos baseados na sua planilha
    const dadosCorretos = [
      {
        bar_id,
        ano: 2025,
        numero_semana: 5,
        data_inicio: '2025-01-27',
        data_fim: '2025-02-02',
        faturamento_total: 75314.54,
        faturamento_entrada: 0,
        faturamento_bar: 75314.54,
        faturamento_cmovivel: 74329.88,
        clientes_atendidos: 133, // CORRETO!
        reservas_totais: 0,
        reservas_presentes: 0,
        ticket_medio: 99.11,
        tm_entrada: 0,
        tm_bar: 99.11,
        cmv_teorico: 0,
        cmv_limpo: 324.6,
        cmv_rs: 8318.11,
        cmv_global_real: 59.2,
        meta_semanal: 200000,
        atingimento: 37.66,
        observacoes: 'Dados corrigidos - teste',
        
        // Campos extras
        lucro_rs: 0,
        imposto: 0,
        comissao: 0,
        o_num_posts: 0,
        o_alcance: 0,
        m_valor_investido: 0,
        m_alcance: 0,
        m_cliques: 0,
        avaliacoes_5_google_trip: 43,
        media_avaliacoes_google: 5.0,
        nps_reservas: 0,
        stockout_comidas: 0,
        stockout_drinks: 0,
        perc_bebidas: 0,
        perc_drinks: 0,
        perc_comida: 0,
        retencao_1m: 0,
        retencao_2m: 0
      },
      {
        bar_id,
        ano: 2025,
        numero_semana: 6,
        data_inicio: '2025-02-03',
        data_fim: '2025-02-09',
        faturamento_total: 75314.54,
        faturamento_entrada: 11615,
        faturamento_bar: 63699.54,
        faturamento_cmovivel: 57449.58,
        clientes_atendidos: 849, // CORRETO!
        reservas_totais: 0,
        reservas_presentes: 0,
        ticket_medio: 89.7,
        tm_entrada: 13.68,
        tm_bar: 76.02,
        cmv_teorico: 25.4,
        cmv_limpo: 324.6,
        cmv_rs: 37701.25,
        cmv_global_real: 59.2,
        meta_semanal: 200000,
        atingimento: 37.66,
        observacoes: 'Dados corrigidos - teste',
        
        // Campos extras
        lucro_rs: 0,
        imposto: 0,
        comissao: 0,
        o_num_posts: 0,
        o_alcance: 0,
        m_valor_investido: 0,
        m_alcance: 0,
        m_cliques: 0,
        avaliacoes_5_google_trip: 43,
        media_avaliacoes_google: 5.0,
        nps_reservas: 0,
        stockout_comidas: 0,
        stockout_drinks: 0,
        perc_bebidas: 0,
        perc_drinks: 0,
        perc_comida: 0,
        retencao_1m: 0,
        retencao_2m: 0
      },
      {
        bar_id,
        ano: 2025,
        numero_semana: 7,
        data_inicio: '2025-02-10',
        data_fim: '2025-02-16',
        faturamento_total: 151226,
        faturamento_entrada: 25990,
        faturamento_bar: 125236,
        faturamento_cmovivel: 113797.14,
        clientes_atendidos: 1624, // CORRETO!
        reservas_totais: 0,
        reservas_presentes: 0,
        ticket_medio: 95.31,
        tm_entrada: 16.0,
        tm_bar: 79.31,
        cmv_teorico: 0,
        cmv_limpo: 134.1,
        cmv_rs: 34854.36,
        cmv_global_real: 27.8,
        meta_semanal: 200000,
        atingimento: 75.61,
        observacoes: 'Dados corrigidos - teste',
        
        // Campos extras
        lucro_rs: 0,
        imposto: 0,
        comissao: 0,
        o_num_posts: 0,
        o_alcance: 0,
        m_valor_investido: 0,
        m_alcance: 0,
        m_cliques: 0,
        avaliacoes_5_google_trip: 74,
        media_avaliacoes_google: 4.92,
        nps_reservas: 0,
        stockout_comidas: 0,
        stockout_drinks: 0,
        perc_bebidas: 0,
        perc_drinks: 0,
        perc_comida: 0,
        retencao_1m: 0,
        retencao_2m: 0
      }
    ]

    let dadosImportados = 0
    let dadosAtualizados = 0
    const erros: string[] = []

    console.log(`📊 Inserindo ${dadosCorretos.length} registros corretos...`)

    for (const semana of dadosCorretos) {
      try {
        // Verificar se já existe
        const { data: existente } = await supabase
          .from('desempenho_semanal')
          .select('id')
          .eq('bar_id', bar_id)
          .eq('ano', semana.ano)
          .eq('numero_semana', semana.numero_semana)
          .single()

        // Inserir ou atualizar
        const { error } = await supabase
          .from('desempenho_semanal')
          .upsert(semana, {
            onConflict: 'bar_id,ano,numero_semana'
          })

        if (error) {
          console.error(`❌ Erro semana ${semana.numero_semana}:`, error)
          erros.push(`Semana ${semana.numero_semana}: ${error.message}`)
          continue
        }

        if (existente) {
          dadosAtualizados++
          console.log(`✅ Semana ${semana.numero_semana} atualizada: ${semana.clientes_atendidos} clientes`)
        } else {
          dadosImportados++
          console.log(`✅ Semana ${semana.numero_semana} inserida: ${semana.clientes_atendidos} clientes`)
        }

      } catch (error: any) {
        erros.push(`Semana ${semana.numero_semana}: ${error.message}`)
        console.error(`❌ Erro semana ${semana.numero_semana}:`, error)
      }
    }

    console.log(`✅ SINCRONIZAÇÃO DE TESTE CONCLUÍDA:`)
    console.log(`   - Dados importados: ${dadosImportados}`)
    console.log(`   - Dados atualizados: ${dadosAtualizados}`)
    console.log(`   - Erros: ${erros.length}`)

    return NextResponse.json({
      success: true,
      message: 'Sincronização de teste concluída com dados corretos',
      resultados: {
        dados_importados: dadosImportados,
        dados_atualizados: dadosAtualizados,
        total_processados: dadosImportados + dadosAtualizados,
        erros: erros.length,
        detalhes_erros: erros,
        dados_inseridos: dadosCorretos.map(d => ({
          semana: d.numero_semana,
          clientes: d.clientes_atendidos,
          faturamento: d.faturamento_total
        }))
      }
    })

  } catch (error: any) {
    console.error('❌ Erro na sincronização de teste:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 