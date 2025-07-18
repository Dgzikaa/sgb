import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
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

// Å“â€¦ MAPEAMENTO ORIGINAL ESPECIFICADO PELO USUÃ¡ÂRIO
const CATEGORIAS_ESPECIFICADAS = {
  // Ã°Å¸â€œÅ  CMO - CUSTO DE MÃ¡Æ’O DE OBRA
  cmo: [
    'SALARIO FUNCIONARIOS',
    'VALE TRANSPORTE', 
    'ALIMENTAÃ¡â€¡Ã¡Æ’O',
    'ADICIONAIS',
    'FREELA ATENDIMENTO',
    'FREELA BAR',
    'FREELA COZINHA',
    'FREELA LIMPEZA',
    'FREELA SEGURANÃ¡â€¡A',
    'PRO LABORE',
    'PROVISÃ¡Æ’O TRABALHISTA'
  ],
  
  // Ã°Å¸ÂÂª CMV - CUSTO DE MERCADORIA VENDIDA
  cmv: [
    'Custo Drinks',
    'Custo Bebidas', 
    'Custo Comida',
    'Custo Outros'
  ],
  
  // Ã°Å¸â€™Â° CUSTOS VARIÃ¡ÂVEIS
  custos_variaveis: [
    'IMPOSTO',
    'COMISSÃ¡Æ’O 10%',
    'TAXA MAQUININHA'
  ],
  
  // Ã°Å¸â€œË† DESPESAS COMERCIAIS
  despesas_comerciais: [
    'Marketing',
    'AtraÃ¡Â§Ã¡Âµes ProgramaÃ¡Â§Ã¡Â£o',
    'ProduÃ¡Â§Ã¡Â£o Eventos'
  ],
  
  // Ã°Å¸ÂÂ¢ DESPESAS ADMINISTRATIVAS
  despesas_administrativas: [
    'Administrativo OrdinÃ¡Â¡rio',
    'EscritÃ¡Â³rio Central',
    'Recursos Humanos'
  ],
  
  // Å¡â„¢Ã¯Â¸Â DESPESAS OPERACIONAIS
  despesas_operacionais: [
    'Materiais OperaÃ¡Â§Ã¡Â£o',
    'Materiais de Limpeza e DescartÃ¡Â¡veis',
    'UtensÃ¡Â­lios',
    'Estorno',
    'Outros OperaÃ¡Â§Ã¡Â£o'
  ],
  
  // Ã°Å¸ÂÂ  DESPESAS DE OCUPAÃ¡â€¡Ã¡Æ’O
  despesas_ocupacao: [
    'ALUGUEL/CONDOMÃ¡ÂNIO/IPTU',
    'Ã¡ÂGUA',
    'MANUTENÃ¡â€¡Ã¡Æ’O',
    'INTERNET',
    'GÃ¡ÂS',
    'LUZ'
  ],
  
  // ÂÅ’ NÃ¡Æ’O OPERACIONAIS
  nao_operacionais: [
    'Contratos'
  ],
  
  // Ã°Å¸â€œÅ  INVESTIMENTOS
  investimentos: [
    'Despesas Financeiras',
    'Obras',
    'Consultoria',
    'Outros Investimentos',
    'Equipamentos'
  ],
  
  // Ã°Å¸â€™Âµ RECEITAS
  receitas: [
    'Stone CrÃ¡Â©dito',
    'Stone DÃ¡Â©bito',
    'Stone Pix',
    'Pix Direto na Conta',
    'Dinheiro',
    'Receita de Eventos',
    'Outras Receitas'
  ]
}

// Å“â€¦ FUNÃ¡â€¡Ã¡Æ’O PARA MAPEAR CATEGORIA PARA GRUPO DRE
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

// Å“â€¦ FUNÃ¡â€¡Ã¡Æ’O PARA ENCONTRAR MELHOR MATCH
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
      // Match parcial - categoria banco contÃ¡Â©m especificada
      else if (nomeCategoriaBanco.toLowerCase().includes(catEspecificada.toLowerCase())) {
        similaridade = 80
      }
      // Match parcial - categoria especificada contÃ¡Â©m banco
      else if (catEspecificada.toLowerCase().includes(nomeCategoriaBanco.toLowerCase())) {
        similaridade = 70
      }
      // Match de palavras-chave
      else {
        const palavrasBanco = nomeCategoriaBanco.toLowerCase().split(/[\s\/\-_]+/)
        const palavrasEspec = catEspecificada.toLowerCase().split(/[\s\/\-_]+/)
        const palavrasComuns = palavrasBanco.filter((p) => palavrasEspec.includes(p))
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

    console.log(`Ã°Å¸â€Â ANÃ¡ÂLISE COMPLETA DE MAPEAMENTO PARA BAR ${barId}`)

    // 1. Buscar todas as categorias
    const { data: categorias, error: errorCategorias } = await supabase
      .from('contaazul_categorias')
      .select('id, nome, tipo')
      .eq('bar_id', parseInt(barId))
      .order('nome')

    if (errorCategorias) {
      console.error('ÂÅ’ Erro ao buscar categorias:', errorCategorias)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    // 2. Buscar eventos financeiros (TODO o perÃ¡Â­odo disponÃ¡Â­vel) - COM PAGINAÃ¡â€¡Ã¡Æ’O
    console.log('Ã°Å¸â€â€ž Buscando TODOS os eventos financeiros com paginaÃ¡Â§Ã¡Â£o...')
    
    let todosEventos: unknown[] = []
    let pagina = 0
    const limite = 1000 // Limite do Supabase
    let temMaisDados = true
    
    while (temMaisDados) {
      const offset = pagina * limite
      
      console.log(`Ã°Å¸â€œâ€ž Buscando pÃ¡Â¡gina ${pagina + 1} (offset: ${offset})...`)
      
      const { data: eventosPagina, error: errorEventos } = await supabase
        .from('contaazul_eventos_financeiros')
        .select('tipo, categoria_id, valor, data_competencia')
        .eq('bar_id', parseInt(barId))
        .not('categoria_id', 'is', null)
        .range(offset, offset + limite - 1)
        .order('data_competencia', { ascending: false })

      if (errorEventos) {
        console.error('ÂÅ’ Erro ao buscar eventos:', errorEventos)
        return NextResponse.json({ error: 'Erro ao buscar eventos financeiros' }, { status: 500 })
      }

      if (eventosPagina && eventosPagina.length > 0) {
        todosEventos = [...todosEventos, ...eventosPagina]
        console.log(`Å“â€¦ PÃ¡Â¡gina ${pagina + 1}: ${eventosPagina.length} eventos | Total acumulado: ${todosEventos.length}`)
        
        // Se retornou menos que o limite, Ã¡Â© a Ã¡Âºltima pÃ¡Â¡gina
        if (eventosPagina.length < limite) {
          temMaisDados = false
        } else {
          pagina++
        }
      } else {
        temMaisDados = false
      }
    }
    
    console.log(`Ã°Å¸Å½â€° BUSCA COMPLETA: ${todosEventos.length} eventos encontrados em ${pagina + 1} pÃ¡Â¡ginas`)
    const eventos = todosEventos

    // 3. AnÃ¡Â¡lise detalhada por categoria
    const analiseDetalhada = categorias?.map((categoria: unknown) => {
      const melhorMatch = encontrarMelhorMatch(categoria.nome)
      const grupoMapeado = mapearCategoriaParaGrupo(categoria.nome)
      
      // Contar eventos desta categoria
      const eventosCategoria = eventos?.filter((e: unknown) => e.categoria_id === categoria.id) || []
      const totalEventos = eventosCategoria.length
      const valorTotal = eventosCategoria.reduce((sum: unknown, e: unknown) => sum + parseFloat(e.valor || '0'), 0)
      const eventosPorTipo = eventosCategoria.reduce((acc: Record<string, unknown>, e: unknown) => {
        acc[String(e.tipo)] = (acc[String(e.tipo)] || 0) + 1
        return acc
      }, {} as Record<string, unknown>)
      
      // PerÃ¡Â­odo dos dados
      const datasEventos = eventosCategoria.map((e: unknown) => e.data_competencia).filter(Boolean).sort()
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

    // 4. EstatÃ¡Â­sticas gerais
    const estatisticasGerais = {
      total_categorias: categorias?.length || 0,
      categorias_mapeadas: analiseDetalhada.filter((c: unknown) => c.mapeamento.esta_mapeado).length,
      categorias_nao_mapeadas: analiseDetalhada.filter((c: unknown) => !c.mapeamento.esta_mapeado).length,
      categorias_com_dados: analiseDetalhada.filter((c: unknown) => c.estatisticas.tem_dados).length,
      categorias_sem_dados: analiseDetalhada.filter((c: unknown) => !c.estatisticas.tem_dados).length,
      total_eventos: eventos?.length || 0,
      periodo_geral: {
        inicio: eventos?.map((e: unknown) => e.data_competencia).filter(Boolean).sort()[0] || null,
        fim: eventos?.map((e: unknown) => e.data_competencia).filter(Boolean).sort().reverse()[0] || null
      }
    }

    // 5. Mapeamento por grupo
    const mapeamentoPorGrupo = {}
    Object.keys(CATEGORIAS_ESPECIFICADAS).forEach((grupo: unknown) => {
      (mapeamentoPorGrupo as unknown)[grupo] = {
        categorias_especificadas: CATEGORIAS_ESPECIFICADAS[grupo as keyof typeof CATEGORIAS_ESPECIFICADAS],
        categorias_encontradas: analiseDetalhada.filter((c: unknown) => c.mapeamento.grupo_mapeado === grupo),
        total_especificadas: CATEGORIAS_ESPECIFICADAS[grupo as keyof typeof CATEGORIAS_ESPECIFICADAS].length,
        total_encontradas: analiseDetalhada.filter((c: unknown) => c.mapeamento.grupo_mapeado === grupo).length
      }
    })

    // 6. Categorias nÃ¡Â£o mapeadas com sugestÃ¡Âµes
    const categoriasNaoMapeadas = analiseDetalhada
      .filter((c: unknown) => !c.mapeamento.esta_mapeado)
      .sort((a: unknown, b: unknown) => b.estatisticas.valor_total - a.estatisticas.valor_total)

    // 7. Problemas identificados
    const problemasIdentificados = []
    
    // Categorias de despesa marcadas como receita
    const despesasComoReceita = analiseDetalhada.filter((c: unknown) => 
      c.tipo_banco === 'RECEITA' && 
      c.mapeamento.grupo_mapeado && 
      !['receitas'].includes(c.mapeamento.grupo_mapeado)
    )
    
    if (despesasComoReceita.length > 0) {
      problemasIdentificados.push({
        tipo: 'ClassificaÃ¡Â§Ã¡Â£o incorreta',
        descricao: 'Categorias de despesa marcadas como RECEITA no banco',
        categorias: despesasComoReceita.map((c: unknown) => ({ nome: c.nome_banco, deveria_ser: 'DESPESA' }))
      })
    }

    // 8. Listar TODAS as categorias nÃ¡Â£o mapeadas de forma clara
    const todasCategoriasNaoMapeadas = analiseDetalhada
      .filter((c: unknown) => !c.mapeamento.esta_mapeado)
      .map((c: unknown) => ({
        nome: c.nome_banco,
        tipo: c.tipo_banco,
        tem_dados: c.estatisticas.tem_dados,
        valor_total: c.estatisticas.valor_total,
        total_eventos: c.estatisticas.total_eventos,
        periodo: c.estatisticas.tem_dados ? `${c.estatisticas.periodo_inicio} a ${c.estatisticas.periodo_fim}` : 'Sem dados',
        sugestao: c.mapeamento.categoria_especificada_mais_proxima || 'Nenhuma sugestÃ£o',
        similaridade: c.mapeamento.similaridade
      }))
      .sort((a: unknown, b: unknown) => b.valor_total - a.valor_total) // Ordenar por valor (mais importantes primeiro)

    console.log(`Ã°Å¸â€œÅ  RESUMO FINAL:`)
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
          'ALUGUEL/CONDOMÃ¡ÂNIO/IPTU': encontrarMelhorMatch('ALUGUEL/CONDOMÃ¡ÂNIO/IPTU'),
          'Stone CrÃ¡Â©dito': encontrarMelhorMatch('Stone CrÃ¡Æ’Â©dito'),
          'Marketing': encontrarMelhorMatch('Marketing')
        },
        total_eventos_processados: eventos.length,
        paginas_processadas: Math.ceil(eventos.length / 1000)
      }
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno na API AnÃ¡Â¡lise:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 

