import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// úÖ MAPEAMENTO ORIGINAL ESPECIFICADO PELO USU·ÅRIO
const CATEGORIAS_ESPECIFICADAS = {
  // üìä CMO - CUSTO DE M·ÉO DE OBRA
  cmo: [
    'SALARIO FUNCIONARIOS',
    'VALE TRANSPORTE', 
    'ALIMENTA·á·ÉO',
    'ADICIONAIS',
    'FREELA ATENDIMENTO',
    'FREELA BAR',
    'FREELA COZINHA',
    'FREELA LIMPEZA',
    'FREELA SEGURAN·áA',
    'PRO LABORE',
    'PROVIS·ÉO TRABALHISTA'
  ],
  
  // üè™ CMV - CUSTO DE MERCADORIA VENDIDA
  cmv: [
    'Custo Drinks',
    'Custo Bebidas', 
    'Custo Comida',
    'Custo Outros'
  ],
  
  // üí∞ CUSTOS VARI·ÅVEIS
  custos_variaveis: [
    'IMPOSTO',
    'COMISS·ÉO 10%',
    'TAXA MAQUININHA'
  ],
  
  // üìà DESPESAS COMERCIAIS
  despesas_comerciais: [
    'Marketing',
    'Atra·ß·µes Programa·ß·£o',
    'Produ·ß·£o Eventos'
  ],
  
  // üè¢ DESPESAS ADMINISTRATIVAS
  despesas_administrativas: [
    'Administrativo Ordin·°rio',
    'Escrit·≥rio Central',
    'Recursos Humanos'
  ],
  
  // öôÔ∏è DESPESAS OPERACIONAIS
  despesas_operacionais: [
    'Materiais Opera·ß·£o',
    'Materiais de Limpeza e Descart·°veis',
    'Utens·≠lios',
    'Estorno',
    'Outros Opera·ß·£o'
  ],
  
  // üè† DESPESAS DE OCUPA·á·ÉO
  despesas_ocupacao: [
    'ALUGUEL/CONDOM·çNIO/IPTU',
    '·ÅGUA',
    'MANUTEN·á·ÉO',
    'INTERNET',
    'G·ÅS',
    'LUZ'
  ],
  
  // ùå N·ÉO OPERACIONAIS
  nao_operacionais: [
    'Contratos'
  ],
  
  // üìä INVESTIMENTOS
  investimentos: [
    'Despesas Financeiras',
    'Obras',
    'Consultoria',
    'Outros Investimentos',
    'Equipamentos'
  ],
  
  // üíµ RECEITAS
  receitas: [
    'Stone Cr·©dito',
    'Stone D·©bito',
    'Stone Pix',
    'Pix Direto na Conta',
    'Dinheiro',
    'Receita de Eventos',
    'Outras Receitas'
  ]
}

// úÖ FUN·á·ÉO PARA MAPEAR CATEGORIA PARA GRUPO DRE
function mapearCategoriaParaGrupo(nomeCategoria: string): string | null {
  for (const [grupo, categorias] of Object.entries(CATEGORIAS_ESPECIFICADAS)) {
    // Busca exata e busca parcial (case-insensitive)
    if (categorias.some(cat => 
      cat.toLowerCase() === nomeCategoria.toLowerCase() ||
      nomeCategoria.toLowerCase().includes(cat.toLowerCase()) ||
      cat.toLowerCase().includes(nomeCategoria.toLowerCase())
    )) {
      return grupo
    }
  }
  return null
}

// úÖ FUN·á·ÉO PARA ENCONTRAR MELHOR MATCH
function encontrarMelhorMatch(nomeCategoriaBanco: string): { grupo: string | null, categoria_especificada: string | null, similaridade: number } {
  let melhorMatch = { grupo: null as string | null, categoria_especificada: null as string | null, similaridade: 0 }
  
  for (const [grupo, categorias] of Object.entries(CATEGORIAS_ESPECIFICADAS)) {
    for (const catEspecificada of categorias) {
      // Calcular similaridade
      let similaridade = 0
      
      // Match exato
      if (catEspecificada.toLowerCase() === nomeCategoriaBanco.toLowerCase()) {
        similaridade = 100
      }
      // Match parcial - categoria banco cont·©m especificada
      else if (nomeCategoriaBanco.toLowerCase().includes(catEspecificada.toLowerCase())) {
        similaridade = 80
      }
      // Match parcial - categoria especificada cont·©m banco
      else if (catEspecificada.toLowerCase().includes(nomeCategoriaBanco.toLowerCase())) {
        similaridade = 70
      }
      // Match de palavras-chave
      else {
        const palavrasBanco = nomeCategoriaBanco.toLowerCase().split(/[\s\/\-_]+/)
        const palavrasEspec = catEspecificada.toLowerCase().split(/[\s\/\-_]+/)
        const palavrasComuns = palavrasBanco.filter((p: any) => palavrasEspec.includes(p))
        if (palavrasComuns.length > 0) {
          similaridade = (palavrasComuns.length / Math.max(palavrasBanco.length, palavrasEspec.length)) * 60
        }
      }
      
      if (similaridade > melhorMatch.similaridade) {
        melhorMatch = { grupo, categoria_especificada: catEspecificada, similaridade }
      }
    }
  }
  
  return melhorMatch
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId') || '3'

    const supabase = createSupabaseClient()

    console.log(`üîç AN·ÅLISE COMPLETA DE MAPEAMENTO PARA BAR ${barId}`)

    // 1. Buscar todas as categorias
    const { data: categorias, error: errorCategorias } = await supabase
      .from('contaazul_categorias')
      .select('id, nome, tipo')
      .eq('bar_id', parseInt(barId))
      .order('nome')

    if (errorCategorias) {
      console.error('ùå Erro ao buscar categorias:', errorCategorias)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    // 2. Buscar eventos financeiros (TODO o per·≠odo dispon·≠vel) - COM PAGINA·á·ÉO
    console.log('üîÑ Buscando TODOS os eventos financeiros com pagina·ß·£o...')
    
    let todosEventos: any[] = []
    let pagina = 0
    const limite = 1000 // Limite do Supabase
    let temMaisDados = true
    
    while (temMaisDados) {
      const offset = pagina * limite
      
      console.log(`üìÑ Buscando p·°gina ${pagina + 1} (offset: ${offset})...`)
      
      const { data: eventosPagina, error: errorEventos } = await supabase
        .from('contaazul_eventos_financeiros')
        .select('tipo, categoria_id, valor, data_competencia')
        .eq('bar_id', parseInt(barId))
        .not('categoria_id', 'is', null)
        .range(offset, offset + limite - 1)
        .order('data_competencia', { ascending: false })

      if (errorEventos) {
        console.error('ùå Erro ao buscar eventos:', errorEventos)
        return NextResponse.json({ error: 'Erro ao buscar eventos financeiros' }, { status: 500 })
      }

      if (eventosPagina && eventosPagina.length > 0) {
        todosEventos = [...todosEventos, ...eventosPagina]
        console.log(`úÖ P·°gina ${pagina + 1}: ${eventosPagina.length} eventos | Total acumulado: ${todosEventos.length}`)
        
        // Se retornou menos que o limite, ·© a ·∫ltima p·°gina
        if (eventosPagina.length < limite) {
          temMaisDados = false
        } else {
          pagina++
        }
      } else {
        temMaisDados = false
      }
    }
    
    console.log(`üéâ BUSCA COMPLETA: ${todosEventos.length} eventos encontrados em ${pagina + 1} p·°ginas`)
    const eventos = todosEventos

    // 3. An·°lise detalhada por categoria
    const analiseDetalhada = categorias?.map((categoria: any) => {
      const melhorMatch = encontrarMelhorMatch(categoria.nome)
      const grupoMapeado = mapearCategoriaParaGrupo(categoria.nome)
      
      // Contar eventos desta categoria
      const eventosCategoria = eventos?.filter((e: any) => e.categoria_id === categoria.id) || []
      const totalEventos = eventosCategoria.length
      const valorTotal = eventosCategoria.reduce((sum, e) => sum + parseFloat(e.valor || '0'), 0)
      const eventosPorTipo = eventosCategoria.reduce((acc: any, e) => {
        acc[e.tipo] = (acc[e.tipo] || 0) + 1
        return acc
      }, {})
      
      // Per·≠odo dos dados
      const datasEventos = eventosCategoria.map((e: any) => e.data_competencia).filter(Boolean).sort()
      const periodoInicio = datasEventos[0] || null
      const periodoFim = datasEventos[datasEventos.length - 1] || null
      
      return {
        id: categoria.id,
        nome_banco: categoria.nome,
        tipo_banco: categoria.tipo,
        mapeamento: {
          grupo_mapeado: grupoMapeado,
          esta_mapeado: !!grupoMapeado,
          melhor_match: melhorMatch,
          categoria_especificada_mais_proxima: melhorMatch.categoria_especificada,
          similaridade: melhorMatch.similaridade
        },
        estatisticas: {
          total_eventos: totalEventos,
          valor_total: valorTotal,
          eventos_por_tipo: eventosPorTipo,
          periodo_inicio: periodoInicio,
          periodo_fim: periodoFim,
          tem_dados: totalEventos > 0
        }
      }
    }) || []

    // 4. Estat·≠sticas gerais
    const estatisticasGerais = {
      total_categorias: categorias?.length || 0,
      categorias_mapeadas: analiseDetalhada.filter((c: any) => c.mapeamento.esta_mapeado).length,
      categorias_nao_mapeadas: analiseDetalhada.filter((c: any) => !c.mapeamento.esta_mapeado).length,
      categorias_com_dados: analiseDetalhada.filter((c: any) => c.estatisticas.tem_dados).length,
      categorias_sem_dados: analiseDetalhada.filter((c: any) => !c.estatisticas.tem_dados).length,
      total_eventos: eventos?.length || 0,
      periodo_geral: {
        inicio: eventos?.map((e: any) => e.data_competencia).filter(Boolean).sort()[0] || null,
        fim: eventos?.map((e: any) => e.data_competencia).filter(Boolean).sort().reverse()[0] || null
      }
    }

    // 5. Mapeamento por grupo
    const mapeamentoPorGrupo: any = {}
    Object.keys(CATEGORIAS_ESPECIFICADAS).forEach(grupo => {
      mapeamentoPorGrupo[grupo] = {
        categorias_especificadas: CATEGORIAS_ESPECIFICADAS[grupo as keyof typeof CATEGORIAS_ESPECIFICADAS],
        categorias_encontradas: analiseDetalhada.filter((c: any) => c.mapeamento.grupo_mapeado === grupo),
        total_especificadas: CATEGORIAS_ESPECIFICADAS[grupo as keyof typeof CATEGORIAS_ESPECIFICADAS].length,
        total_encontradas: analiseDetalhada.filter((c: any) => c.mapeamento.grupo_mapeado === grupo).length
      }
    })

    // 6. Categorias n·£o mapeadas com sugest·µes
    const categoriasNaoMapeadas = analiseDetalhada
      .filter((c: any) => !c.mapeamento.esta_mapeado)
      .sort((a, b) => b.estatisticas.valor_total - a.estatisticas.valor_total)

    // 7. Problemas identificados
    const problemasIdentificados = []
    
    // Categorias de despesa marcadas como receita
    const despesasComoReceita = analiseDetalhada.filter((c: any) => 
      c.tipo_banco === 'RECEITA' && 
      c.mapeamento.grupo_mapeado && 
      !['receitas'].includes(c.mapeamento.grupo_mapeado)
    )
    
    if (despesasComoReceita.length > 0) {
      problemasIdentificados.push({
        tipo: 'Classifica·ß·£o incorreta',
        descricao: 'Categorias de despesa marcadas como RECEITA no banco',
        categorias: despesasComoReceita.map((c: any) => ({ nome: c.nome_banco, deveria_ser: 'DESPESA' }))
      })
    }

    // 8. Listar TODAS as categorias n·£o mapeadas de forma clara
    const todasCategoriasNaoMapeadas = analiseDetalhada
      .filter((c: any) => !c.mapeamento.esta_mapeado)
      .map((c: any) => ({
        nome: c.nome_banco,
        tipo: c.tipo_banco,
        tem_dados: c.estatisticas.tem_dados,
        valor_total: c.estatisticas.valor_total,
        total_eventos: c.estatisticas.total_eventos,
        periodo: c.estatisticas.tem_dados ? `${c.estatisticas.periodo_inicio} a ${c.estatisticas.periodo_fim}` : 'Sem dados',
        sugestao: c.mapeamento.categoria_especificada_mais_proxima || 'Nenhuma sugest·£o',
        similaridade: c.mapeamento.similaridade
      }))
      .sort((a, b) => b.valor_total - a.valor_total) // Ordenar por valor (mais importantes primeiro)

    console.log(`üìä RESUMO FINAL:`)
    console.log(`   Total de eventos processados: ${eventos.length}`)
    console.log(`   Categorias mapeadas: ${estatisticasGerais.categorias_mapeadas}/${estatisticasGerais.total_categorias}`)
    console.log(`   Categorias com dados: ${estatisticasGerais.categorias_com_dados}`)
    console.log(`   Categorias n·£o mapeadas: ${todasCategoriasNaoMapeadas.length}`)

    return NextResponse.json({
      estatisticas_gerais: estatisticasGerais,
      mapeamento_por_grupo: mapeamentoPorGrupo,
      analise_detalhada: analiseDetalhada,
      categorias_nao_mapeadas: categoriasNaoMapeadas,
      todas_categorias_nao_mapeadas: todasCategoriasNaoMapeadas,
      problemas_identificados: problemasIdentificados,
      debug: {
        total_categorias_especificadas: Object.values(CATEGORIAS_ESPECIFICADAS).flat().length,
        grupos_especificados: Object.keys(CATEGORIAS_ESPECIFICADAS),
        exemplo_mapeamento: {
          'ALUGUEL/CONDOM·çNIO/IPTU': encontrarMelhorMatch('ALUGUEL/CONDOM·çNIO/IPTU'),
          'Stone Cr·©dito': encontrarMelhorMatch('Stone Cr·É©dito'),
          'Marketing': encontrarMelhorMatch('Marketing')
        },
        total_eventos_processados: eventos.length,
        paginas_processadas: Math.ceil(eventos.length / 1000)
      }
    })

  } catch (error) {
    console.error('ùå Erro interno na API An·°lise:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
