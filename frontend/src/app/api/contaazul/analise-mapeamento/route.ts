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

// âœ… MAPEAMENTO ORIGINAL ESPECIFICADO PELO USUÃRIO
const CATEGORIAS_ESPECIFICADAS = {
  // ðŸ“Š CMO - CUSTO DE MÃƒO DE OBRA
  cmo: [
    'SALARIO FUNCIONARIOS',
    'VALE TRANSPORTE', 
    'ALIMENTAÃ‡ÃƒO',
    'ADICIONAIS',
    'FREELA ATENDIMENTO',
    'FREELA BAR',
    'FREELA COZINHA',
    'FREELA LIMPEZA',
    'FREELA SEGURANÃ‡A',
    'PRO LABORE',
    'PROVISÃƒO TRABALHISTA'
  ],
  
  // ðŸª CMV - CUSTO DE MERCADORIA VENDIDA
  cmv: [
    'Custo Drinks',
    'Custo Bebidas', 
    'Custo Comida',
    'Custo Outros'
  ],
  
  // ðŸ’° CUSTOS VARIÃVEIS
  custos_variaveis: [
    'IMPOSTO',
    'COMISSÃƒO 10%',
    'TAXA MAQUININHA'
  ],
  
  // ðŸ“ˆ DESPESAS COMERCIAIS
  despesas_comerciais: [
    'Marketing',
    'AtraÃ§Ãµes ProgramaÃ§Ã£o',
    'ProduÃ§Ã£o Eventos'
  ],
  
  // ðŸ¢ DESPESAS ADMINISTRATIVAS
  despesas_administrativas: [
    'Administrativo OrdinÃ¡rio',
    'EscritÃ³rio Central',
    'Recursos Humanos'
  ],
  
  // âš™ï¸ DESPESAS OPERACIONAIS
  despesas_operacionais: [
    'Materiais OperaÃ§Ã£o',
    'Materiais de Limpeza e DescartÃ¡veis',
    'UtensÃ­lios',
    'Estorno',
    'Outros OperaÃ§Ã£o'
  ],
  
  // ðŸ  DESPESAS DE OCUPAÃ‡ÃƒO
  despesas_ocupacao: [
    'ALUGUEL/CONDOMÃNIO/IPTU',
    'ÃGUA',
    'MANUTENÃ‡ÃƒO',
    'INTERNET',
    'GÃS',
    'LUZ'
  ],
  
  // âŒ NÃƒO OPERACIONAIS
  nao_operacionais: [
    'Contratos'
  ],
  
  // ðŸ“Š INVESTIMENTOS
  investimentos: [
    'Despesas Financeiras',
    'Obras',
    'Consultoria',
    'Outros Investimentos',
    'Equipamentos'
  ],
  
  // ðŸ’µ RECEITAS
  receitas: [
    'Stone CrÃ©dito',
    'Stone DÃ©bito',
    'Stone Pix',
    'Pix Direto na Conta',
    'Dinheiro',
    'Receita de Eventos',
    'Outras Receitas'
  ]
}

// âœ… FUNÃ‡ÃƒO PARA MAPEAR CATEGORIA PARA GRUPO DRE
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

// âœ… FUNÃ‡ÃƒO PARA ENCONTRAR MELHOR MATCH
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
      // Match parcial - categoria banco contÃ©m especificada
      else if (nomeCategoriaBanco.toLowerCase().includes(catEspecificada.toLowerCase())) {
        similaridade = 80
      }
      // Match parcial - categoria especificada contÃ©m banco
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

    console.log(`ðŸ” ANÃLISE COMPLETA DE MAPEAMENTO PARA BAR ${barId}`)

    // 1. Buscar todas as categorias
    const { data: categorias, error: errorCategorias } = await supabase
      .from('contaazul_categorias')
      .select('id, nome, tipo')
      .eq('bar_id', parseInt(barId))
      .order('nome')

    if (errorCategorias) {
      console.error('âŒ Erro ao buscar categorias:', errorCategorias)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    // 2. Buscar eventos financeiros (TODO o perÃ­odo disponÃ­vel) - COM PAGINAÃ‡ÃƒO
    console.log('ðŸ”„ Buscando TODOS os eventos financeiros com paginaÃ§Ã£o...')
    
    let todosEventos: any[] = []
    let pagina = 0
    const limite = 1000 // Limite do Supabase
    let temMaisDados = true
    
    while (temMaisDados) {
      const offset = pagina * limite
      
      console.log(`ðŸ“„ Buscando pÃ¡gina ${pagina + 1} (offset: ${offset})...`)
      
      const { data: eventosPagina, error: errorEventos } = await supabase
        .from('contaazul_eventos_financeiros')
        .select('tipo, categoria_id, valor, data_competencia')
        .eq('bar_id', parseInt(barId))
        .not('categoria_id', 'is', null)
        .range(offset, offset + limite - 1)
        .order('data_competencia', { ascending: false })

      if (errorEventos) {
        console.error('âŒ Erro ao buscar eventos:', errorEventos)
        return NextResponse.json({ error: 'Erro ao buscar eventos financeiros' }, { status: 500 })
      }

      if (eventosPagina && eventosPagina.length > 0) {
        todosEventos = [...todosEventos, ...eventosPagina]
        console.log(`âœ… PÃ¡gina ${pagina + 1}: ${eventosPagina.length} eventos | Total acumulado: ${todosEventos.length}`)
        
        // Se retornou menos que o limite, Ã© a Ãºltima pÃ¡gina
        if (eventosPagina.length < limite) {
          temMaisDados = false
        } else {
          pagina++
        }
      } else {
        temMaisDados = false
      }
    }
    
    console.log(`ðŸŽ‰ BUSCA COMPLETA: ${todosEventos.length} eventos encontrados em ${pagina + 1} pÃ¡ginas`)
    const eventos = todosEventos

    // 3. AnÃ¡lise detalhada por categoria
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
      
      // PerÃ­odo dos dados
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

    // 4. EstatÃ­sticas gerais
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

    // 6. Categorias nÃ£o mapeadas com sugestÃµes
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
        tipo: 'ClassificaÃ§Ã£o incorreta',
        descricao: 'Categorias de despesa marcadas como RECEITA no banco',
        categorias: despesasComoReceita.map((c: any) => ({ nome: c.nome_banco, deveria_ser: 'DESPESA' }))
      })
    }

    // 8. Listar TODAS as categorias nÃ£o mapeadas de forma clara
    const todasCategoriasNaoMapeadas = analiseDetalhada
      .filter((c: any) => !c.mapeamento.esta_mapeado)
      .map((c: any) => ({
        nome: c.nome_banco,
        tipo: c.tipo_banco,
        tem_dados: c.estatisticas.tem_dados,
        valor_total: c.estatisticas.valor_total,
        total_eventos: c.estatisticas.total_eventos,
        periodo: c.estatisticas.tem_dados ? `${c.estatisticas.periodo_inicio} a ${c.estatisticas.periodo_fim}` : 'Sem dados',
        sugestao: c.mapeamento.categoria_especificada_mais_proxima || 'Nenhuma sugestÃ£o',
        similaridade: c.mapeamento.similaridade
      }))
      .sort((a, b) => b.valor_total - a.valor_total) // Ordenar por valor (mais importantes primeiro)

    console.log(`ðŸ“Š RESUMO FINAL:`)
    console.log(`   Total de eventos processados: ${eventos.length}`)
    console.log(`   Categorias mapeadas: ${estatisticasGerais.categorias_mapeadas}/${estatisticasGerais.total_categorias}`)
    console.log(`   Categorias com dados: ${estatisticasGerais.categorias_com_dados}`)
    console.log(`   Categorias nÃ£o mapeadas: ${todasCategoriasNaoMapeadas.length}`)

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
          'ALUGUEL/CONDOMÃNIO/IPTU': encontrarMelhorMatch('ALUGUEL/CONDOMÃNIO/IPTU'),
          'Stone CrÃ©dito': encontrarMelhorMatch('Stone CrÃƒÂ©dito'),
          'Marketing': encontrarMelhorMatch('Marketing')
        },
        total_eventos_processados: eventos.length,
        paginas_processadas: Math.ceil(eventos.length / 1000)
      }
    })

  } catch (error) {
    console.error('âŒ Erro interno na API AnÃ¡lise:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
