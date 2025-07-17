import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Cliente Supabase com service role (servidor apenas)
function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY!
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('VariÃ¡Â¡veis de ambiente do Supabase nÃ¡Â£o configuradas')
  }
  
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar ID Ã¡Â© obrigatÃ¡Â³rio' },
        { status: 400 }
      )
    }

    console.log(`Ã°Å¸â€œÅ  Buscando dados do dashboard - Bar: ${barId}, PerÃ¡Â­odo: ${startDate} atÃ¡Â© ${endDate}`)

    const supabase = createServerSupabaseClient()

    // Buscar dados com paginaÃ¡Â§Ã¡Â£o
    const buscarComPaginacao = async (tabela: string, colunas: string) => {
      let todosRegistros: any[] = []
      let pagina = 0
      const tamanhoPagina = 1000
      
      while (true) {
        const inicio = pagina * tamanhoPagina
        const fim = inicio + tamanhoPagina - 1
        
        let query = supabase
          .from(tabela)
          .select(colunas)
          .eq('bar_id', barId)
          .range(inicio, fim)

        // Aplicar filtro de data se fornecido
        if (startDate && endDate) {
          if (tabela === 'periodo') {
            query = query.gte('dt_gerencial', startDate).lte('dt_gerencial', endDate)
          } else if (tabela === 'pagamentos') {
            query = query.gte('dt_gerencial', startDate).lte('dt_gerencial', endDate)
          } else if (tabela === 'sympla_bilheteria') {
            query = query.gte('data_evento', startDate).lte('data_evento', endDate)
          } else if (tabela === 'fatporhora') {
            query = query.gte('vd_dtgerencial', startDate).lte('vd_dtgerencial', endDate)
          }
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error(`Erro ao buscar ${tabela}:`, error)
          throw error
        }
        
        if (!data || data.length === 0) break
        
        todosRegistros = [...todosRegistros, ...data]
        if (data.length < tamanhoPagina) break
        pagina++
      }
      
      return todosRegistros
    }

    // Buscar dados Yuzer (sem bar_id)
    const buscarYuzer = async () => {
      let todosRegistros: any[] = []
      let pagina = 0
      const tamanhoPagina = 1000

      while (true) {
        const inicio = pagina * tamanhoPagina
        const fim = inicio + tamanhoPagina - 1
        
        let query = supabase
          .from('yuzer_estatisticas_detalhadas')
          .select('total, nome, data_evento, count')
          .range(inicio, fim)

        if (startDate && endDate) {
          query = query.gte('data_evento', startDate).lte('data_evento', endDate)
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('Erro ao buscar yuzer:', error)
          throw error
        }
        
        if (!data || data.length === 0) break
        
        todosRegistros = [...todosRegistros, ...data]
        if (data.length < tamanhoPagina) break
        pagina++
      }

      return todosRegistros
    }

    // Buscar todos os dados
    const [periodoData, pagamentosData, symplaData, yuzerData, fatporhoraData] = await Promise.all([
      buscarComPaginacao('periodo', 'pessoas, dt_gerencial, vr_pagamentos, vr_couvert'),
      buscarComPaginacao('pagamentos', 'liquido, dt_gerencial, meio'),
      buscarComPaginacao('sympla_bilheteria', 'data_evento, total_liquido, qtd_checkins_realizados'),
      buscarYuzer(),
      buscarComPaginacao('fatporhora', 'hora, valor, vd_dtgerencial')
    ])

    console.log(`Å“â€¦ Dados carregados: ${periodoData.length} perÃ¡Â­odo, ${pagamentosData.length} pagamentos, ${symplaData.length} sympla, ${yuzerData.length} yuzer, ${fatporhoraData.length} fatporhora`)

    return NextResponse.json({
      success: true,
      data: {
        periodo: periodoData || [],
        pagamentos: pagamentosData || [],
        sympla: symplaData || [],
        yuzer: yuzerData || [],
        fatporhora: fatporhoraData || []
      }
    })

  } catch (error) {
    console.error('ÂÅ’ Erro na API de stats:', error)
    return NextResponse.json(
      { success: false, error: `Erro interno: ${(error as any).message}` },
      { status: 500 }
    )
  }
} 

