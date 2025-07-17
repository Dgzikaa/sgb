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

// MAPEAMENTO DE CATEGORIAS PARA GRUPOS DRE - BASEADO NA PLANILHA REAL
const mapeamentoCategoriaDRE: { [key: string]: string } = {
  
  // === RECEITAS ===
  'Stone Cr·©dito': 'receitas',
  'Stone Cr·É©dito': 'receitas',
  'Stone D·©bito': 'receitas', 
  'Stone D·É©bito': 'receitas',
  'Stone Pix': 'receitas',
  'Receita de Eventos': 'receitas',
  'Receita ·† Vista': 'receitas',
  'Receitas de servi·ßos': 'receitas',
  'Outras Receitas': 'receitas',
  'Pix Direto na Conta': 'receitas',
  'Dinheiro': 'receitas',

  // === CUSTOS VARI·ÅVEIS ===
  'Custo Fixo': 'custos_variaveis',
  'MC': 'custos_variaveis', 
  'Breakeven': 'custos_variaveis',
  'TAXA MAQUININHA': 'custos_variaveis',
  'Stone Taxa Entrega': 'custos_variaveis',
  'TaxaContaAzul': 'custos_variaveis',
  'IMPOSTO': 'custos_variaveis',
  'COMISS·ÉO 10%': 'custos_variaveis',
  // NOMES EXATOS DA PLANILHA:
  'Custos Vari·°veis': 'custos_variaveis',
  'CUSTOS VARI·ÅVEIS': 'custos_variaveis',

  // === CMV - CUSTO MERCADORIA VENDIDA ===
  'Custo insumos (CMV)': 'cmv',
  'Bebidas': 'cmv',
  'Pratos': 'cmv',
  'FORNECEDORES': 'cmv',
  'Materiais para revenda': 'cmv',
  'Custo Comida': 'cmv',
  'Custo Drinks': 'cmv',
  'Custo Outros': 'cmv',
  // NOMES EXATOS DA PLANILHA:
  'Custo insumos': 'cmv',
  'CUSTO INSUMOS': 'cmv',
  'CUSTO INSUMOS (CMV)': 'cmv',

  // === CMO - M·ÉO DE OBRA ===
  'M·£o-deObra': 'cmo',
  'M·ÉO-DEOBRA': 'cmo',
  'M·£o de Obra': 'cmo',
  'M·ÉO DE OBRA': 'cmo',
  'SALARIO FUNCIONARIOS': 'cmo',
  'VALE TRANSPORTE': 'cmo',
  'UNIFORMES': 'cmo', 
  'VR e VA': 'cmo',
  'FGTS': 'cmo',
  'SAL?RIOS': 'cmo',
  'Salarios': 'cmo',
  'Sal·°rio': 'cmo',
  'SALARIOS': 'cmo',
  'INSS': 'cmo',
  'DECIMO TERCEIRO': 'cmo',
  'VR E VA': 'cmo',
  'Plano de saude': 'cmo',
  'Recursos Humanos': 'cmo',
  'ALIMENTA·á·ÉO': 'cmo',
  'ADICIONAIS': 'cmo',
  'FREELA ATENDIMENTO': 'cmo',
  'FREELA BAR': 'cmo',
  'FREELA COZINHA': 'cmo',
  'FREELA LIMPEZA': 'cmo',
  'FREELA SEGURAN·áA': 'cmo',
  'PRO LABORE': 'cmo',
  'PROVIS·ÉO TRABALHISTA': 'cmo',

  // === DESPESAS COMERCIAIS ===
  'Despesas Comerciais': 'despesas_comerciais',
  'Marketing': 'despesas_comerciais',
  'MARKETING': 'despesas_comerciais',
  'Publicidade': 'despesas_comerciais',
  'Atra·ß·µes Programa·ß·£o': 'despesas_comerciais',
  'Produ·ß·£o Eventos': 'despesas_comerciais',

  // === DESPESAS ADMINISTRATIVAS ===
  'Despesas Administrativas': 'despesas_administrativas',
  'Administrativo': 'despesas_administrativas',
  'ADMNISTRATIVO': 'despesas_administrativas',
  'ESCRITORIO': 'despesas_administrativas',
  'Administrativo Ordin·°rio': 'despesas_administrativas',
  'Escrit·≥rio Central': 'despesas_administrativas',

  // === DESPESAS OPERACIONAIS ===
  'Despesas Operacionais': 'despesas_operacionais',
  'Equipamentos': 'despesas_operacionais',
  'Utens·≠lios': 'despesas_operacionais',
  'Limpeza': 'despesas_operacionais',
  'Tarifas': 'despesas_operacionais',
  'iFoodGuru': 'despesas_operacionais',
  'Outros Opera·Éß·É£o': 'despesas_operacionais',
  'Materiais Opera·ß·£o': 'despesas_operacionais',
  'Materiais de Limpeza e Descart·°veis': 'despesas_operacionais',
  'Estorno': 'despesas_operacionais',
  'Outros Opera·ß·£o': 'despesas_operacionais',

  // === DESPESAS DE OCUPA·á·ÉO ===
  'Despesas de Ocupa·ß·£o (Contas)': 'despesas_ocupacao',
  'Aluguel': 'despesas_ocupacao',
  'Energia': 'despesas_ocupacao',
  'Internet': 'despesas_ocupacao',
  'ENERGIA ELETRICA': 'despesas_ocupacao',
  'Telefone': 'despesas_ocupacao',
  'Condom·≠nio': 'despesas_ocupacao',
  '·ÉGUA': 'despesas_ocupacao',
  'ALUGUEL/CONDOM·çNIO/IPTU': 'despesas_ocupacao',
  '·ÅGUA': 'despesas_ocupacao',
  'MANUTEN·á·ÉO': 'despesas_ocupacao',
  'G·ÅS': 'despesas_ocupacao',
  'LUZ': 'despesas_ocupacao',

  // === N·ÉO OPERACIONAIS ===
  'N·£o Operacionais': 'nao_operacionais',
  'Taxas Banc·°rias': 'nao_operacionais',
  'Empr·©stimos de S·≥cios': 'nao_operacionais',
  'Outros S·≥cios': 'nao_operacionais',
  'Contratos': 'nao_operacionais',

  // === INVESTIMENTOS ===
  'Investimentos': 'investimentos',
  'Constru·ß·£o': 'investimentos',
  'Reformas': 'investimentos',
  'Mob·≠lia': 'investimentos',
  'MOBILIARIO': 'investimentos',
  'Softwares': 'investimentos',
  'Dividendos': 'investimentos',
  'Juros': 'investimentos',
  'Descontos financeiros': 'investimentos',
  'Consultoria': 'investimentos',
  'Outros Investimentos': 'investimentos',
  'Despesas Financeiras': 'investimentos',
  'Obras': 'investimentos',

  // === EBITDA (tratado como operacional) ===
  'EBITDA': 'despesas_operacionais',

  // === S·ìCIOS (tratado como n·£o operacional) ===
  'S·≥cios': 'nao_operacionais',
}

// úÖ FUN·á·ÉO PARA MAPEAR CATEGORIA PARA GRUPO DRE - VERS·ÉO MELHORADA
function mapearCategoriaParaGrupo(nomeCategoria: string): string | null {
  if (!nomeCategoria) return null
  
  // Busca exata primeiro
  if (mapeamentoCategoriaDRE[nomeCategoria]) {
    return mapeamentoCategoriaDRE[nomeCategoria]
  }

  // Normalizar nome para busca (remover acentos, espa·ßos extras, etc)
  const normalizar = (texto: string) => texto
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[·†·°·¢·£·§·•]/g, 'a')
    .replace(/[·®·©·™·´]/g, 'e')
    .replace(/[·¨·≠·Æ·Ø]/g, 'i')
    .replace(/[·≤·≥·¥·µ·∂]/g, 'o')
    .replace(/[·π·∫·ª·º]/g, 'u')
    .replace(/[·ß]/g, 'c')
    .replace(/[-_]/g, ' ')

  const nomeNormalizado = normalizar(nomeCategoria)

  // Busca por palavras-chave espec·≠ficas para categorias importantes
  if (nomeNormalizado.includes('custo') && (nomeNormalizado.includes('variav') || nomeNormalizado.includes('fixo'))) {
    return 'custos_variaveis'
  }
  if (nomeNormalizado.includes('mao') && nomeNormalizado.includes('obra')) {
    return 'cmo'
  }
  if (nomeNormalizado.includes('custo') && (nomeNormalizado.includes('insumo') || nomeNormalizado.includes('cmv'))) {
    return 'cmv'
  }
  if (nomeNormalizado.includes('despesas') && nomeNormalizado.includes('comerciais')) {
    return 'despesas_comerciais'
  }
  if (nomeNormalizado.includes('despesas') && nomeNormalizado.includes('administrativ')) {
    return 'despesas_administrativas'
  }
  if (nomeNormalizado.includes('despesas') && nomeNormalizado.includes('operacion')) {
    return 'despesas_operacionais'
  }
  if (nomeNormalizado.includes('despesas') && (nomeNormalizado.includes('ocupacao') || nomeNormalizado.includes('contas'))) {
    return 'despesas_ocupacao'
  }

  // Busca parcial original (case-insensitive)
  for (const [categoria, grupo] of Object.entries(mapeamentoCategoriaDRE)) {
    const categoriaNormalizada = normalizar(categoria)
    if (categoriaNormalizada === nomeNormalizado ||
        nomeNormalizado.includes(categoriaNormalizada) ||
        categoriaNormalizada.includes(nomeNormalizado)) {
      return grupo
    }
  }
  
  return null // Categoria n·£o mapeada
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId')
    const mes = searchParams.get('mes') // formato: '2024-01' ou null para todos
    const ano = searchParams.get('ano') // formato: '2024' ou null
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID ·© obrigat·≥rio' }, { status: 400 })
    }

    console.log(`üìä CALCULANDO DRE PARA BAR ${barId} - M·™s: ${mes || 'TODOS'} - Ano: ${ano || 'TODOS'}`)

    const supabase = createSupabaseClient()

    // üîç BUSCAR CATEGORIAS COM MAPEAMENTO
    const { data: categorias, error: errorCategorias } = await supabase
      .from('contaazul_categorias')
      .select('id, nome')
      .eq('bar_id', parseInt(barId))

    if (errorCategorias) {
      console.error('ùå Erro ao buscar categorias:', errorCategorias)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    // üìã CRIAR MAPA DE CATEGORIAS ID -> NOME E GRUPO
    const mapaCategorias: Record<string, { nome: string, grupo: string | null }> = {}
    categorias?.forEach((cat: { id: string, nome: string }) => {
      mapaCategorias[cat.id] = {
        nome: cat.nome,
        grupo: mapearCategoriaParaGrupo(cat.nome)
      }
    })

    console.log(`üìã Categorias carregadas: ${Object.keys(mapaCategorias).length}`)

    // üîç FUN·á·ÉO PARA BUSCAR TODOS OS EVENTOS FINANCEIROS COM PAGINA·á·ÉO
    async function buscarTodosEventosFinanceiros() {
      const allEventos: any[] = []
      let offset = 0
      const limit = 1000
      let hasMore = true

      while (hasMore) {
        let query = supabase
          .from('contaazul_eventos_financeiros')
          .select('valor, tipo: any, categoria_id, data_competencia: any, data_vencimento')
          .eq('bar_id', parseInt(barId!))
          .not('categoria_id', 'is', null)
          .range(offset: any, offset + limit - 1)

        // üìÖ APLICAR FILTROS DE DATA
        if (mes) {
          // Filtro por m·™s espec·≠fico (ex: 2025-01)
          const [ano, mesNum] = mes.split('-')
          const startDate = `${mes}-01`
          // Calcular ·∫ltimo dia do m·™s corretamente
          const ultimoDia = new Date(parseInt(ano), parseInt(mesNum), 0).getDate()
          const endDate = `${mes}-${ultimoDia.toString().padStart(2: any, '0')}`
          console.log(`üìÖ Filtro de data: ${startDate} at·© ${endDate}`)
          query = query.gte('data_competencia', startDate).lte('data_competencia', endDate)
        } else if (ano) {
          // Filtro por ano (ex: 2025)
          query = query.gte('data_competencia', `${ano}-01-01`).lte('data_competencia', `${ano}-12-31`)
        } else {
          // úÖ PADR·ÉO: Dados de 2025 se n·£o especificado
          query = query.gte('data_competencia', '2025-01-01').lte('data_competencia', '2025-12-31')
        }

        const { data, error } = await query

        if (error) {
          console.error('ùå Erro ao buscar eventos na p·°gina:', offset: any, error)
          throw error
        }

        if (data && data.length > 0) {
          allEventos.push(...data)
          console.log(`üìÑ P·°gina ${Math.floor(offset/limit) + 1}: ${data.length} eventos | Total: ${allEventos.length}`)
          
          if (data.length < limit) {
            hasMore = false
          } else {
            offset += limit
          }
        } else {
          hasMore = false
        }
      }

      return allEventos
    }

    // üîç BUSCAR TODOS OS EVENTOS FINANCEIROS COM PAGINA·á·ÉO
    const eventos = await buscarTodosEventosFinanceiros()

    console.log(`üí∞ Eventos encontrados: ${eventos?.length || 0}`)

    // üìä CALCULAR DRE
    const dre = {
      receitas: {
        total: 0,
        detalhes: {} as Record<string, number>
      },
      custos: {
        cmo: { total: 0, detalhes: {} as Record<string, number> },
        cmv: { total: 0, detalhes: {} as Record<string, number> },
        custos_variaveis: { total: 0, detalhes: {} as Record<string, number> }
      },
      despesas: {
        despesas_comerciais: { total: 0, detalhes: {} as Record<string, number> },
        despesas_administrativas: { total: 0, detalhes: {} as Record<string, number> },
        despesas_operacionais: { total: 0, detalhes: {} as Record<string, number> },
        despesas_ocupacao: { total: 0, detalhes: {} as Record<string, number> },
        nao_operacionais: { total: 0, detalhes: {} as Record<string, number> },
        investimentos: { total: 0, detalhes: {} as Record<string, number> }
      },
      categorias_nao_mapeadas: {} as Record<string, number>,
      estatisticas: {
        total_eventos: 0,
        eventos_mapeados: 0,
        eventos_nao_mapeados: 0
      }
    }

    // üìà PROCESSAR CADA EVENTO
    eventos?.forEach((evento: { valor: string, categoria_id: string, tipo: string, data_competencia: string }) => {
      const valor = parseFloat(evento.valor || '0')
      const categoriaInfo = mapaCategorias[evento.categoria_id]
      
      dre.estatisticas.total_eventos++

      if (!categoriaInfo) {
        // Categoria n·£o encontrada
        dre.estatisticas.eventos_nao_mapeados++
        return
      }

      const nomeCategoria = categoriaInfo.nome
      const grupo = categoriaInfo.grupo

      if (!grupo) {
        // Categoria n·£o mapeada para DRE
        dre.categorias_nao_mapeadas[nomeCategoria] = (dre.categorias_nao_mapeadas[nomeCategoria] || 0) + valor
        dre.estatisticas.eventos_nao_mapeados++
        return
      }

      dre.estatisticas.eventos_mapeados++

      // úÖ MAPEAR PARA ESTRUTURA DRE
      if (grupo === 'receitas') {
        dre.receitas.total += valor
        dre.receitas.detalhes[nomeCategoria] = (dre.receitas.detalhes[nomeCategoria] || 0) + valor
      } else if (grupo === 'cmo') {
        dre.custos.cmo.total += valor
        dre.custos.cmo.detalhes[nomeCategoria] = (dre.custos.cmo.detalhes[nomeCategoria] || 0) + valor
      } else if (grupo === 'cmv') {
        dre.custos.cmv.total += valor
        dre.custos.cmv.detalhes[nomeCategoria] = (dre.custos.cmv.detalhes[nomeCategoria] || 0) + valor
      } else if (grupo === 'custos_variaveis') {
        dre.custos.custos_variaveis.total += valor
        dre.custos.custos_variaveis.detalhes[nomeCategoria] = (dre.custos.custos_variaveis.detalhes[nomeCategoria] || 0) + valor
      } else if (grupo === 'despesas_comerciais') {
        dre.despesas.despesas_comerciais.total += valor
        dre.despesas.despesas_comerciais.detalhes[nomeCategoria] = (dre.despesas.despesas_comerciais.detalhes[nomeCategoria] || 0) + valor
      } else if (grupo === 'despesas_administrativas') {
        dre.despesas.despesas_administrativas.total += valor
        dre.despesas.despesas_administrativas.detalhes[nomeCategoria] = (dre.despesas.despesas_administrativas.detalhes[nomeCategoria] || 0) + valor
      } else if (grupo === 'despesas_operacionais') {
        dre.despesas.despesas_operacionais.total += valor
        dre.despesas.despesas_operacionais.detalhes[nomeCategoria] = (dre.despesas.despesas_operacionais.detalhes[nomeCategoria] || 0) + valor
      } else if (grupo === 'despesas_ocupacao') {
        dre.despesas.despesas_ocupacao.total += valor
        dre.despesas.despesas_ocupacao.detalhes[nomeCategoria] = (dre.despesas.despesas_ocupacao.detalhes[nomeCategoria] || 0) + valor
      } else if (grupo === 'nao_operacionais') {
        dre.despesas.nao_operacionais.total += valor
        dre.despesas.nao_operacionais.detalhes[nomeCategoria] = (dre.despesas.nao_operacionais.detalhes[nomeCategoria] || 0) + valor
      } else if (grupo === 'investimentos') {
        dre.despesas.investimentos.total += valor
        dre.despesas.investimentos.detalhes[nomeCategoria] = (dre.despesas.investimentos.detalhes[nomeCategoria] || 0) + valor
      }
    })

    // üìä C·ÅLCULOS DRE CORRETOS
    const receitaTotal = dre.receitas.total
    
    // CUSTOS: CMV + CMO + Custos Vari·°veis
    const custosTotal = dre.custos.cmv.total + dre.custos.cmo.total + dre.custos.custos_variaveis.total
    
    // DESPESAS OPERACIONAIS: Comerciais + Administrativas + Operacionais + Ocupa·ß·£o + N·£o Operacionais
    const despesasOperacionais = dre.despesas.despesas_comerciais.total + 
                                dre.despesas.despesas_administrativas.total + 
                                dre.despesas.despesas_operacionais.total + 
                                dre.despesas.despesas_ocupacao.total + 
                                dre.despesas.nao_operacionais.total
    
    // TOTAL DE DESPESAS: Operacionais + Investimentos
    const despesasTotal = despesasOperacionais + dre.despesas.investimentos.total
    
    // C·ÅLCULOS DRE:
    const lucroBruto = receitaTotal - dre.custos.cmv.total
    const lucroOperacional = lucroBruto - dre.custos.cmo.total - dre.custos.custos_variaveis.total - despesasOperacionais
    const lucroLiquido = lucroOperacional - dre.despesas.investimentos.total

    const resultado = {
      periodo: mes || ano || 'TODOS',
      dre,
      metricas: {
        receita_total: receitaTotal,
        custos_total: custosTotal,
        despesas_total: despesasTotal,
        lucro_bruto: lucroBruto,
        lucro_operacional: lucroOperacional,
        lucro_liquido: lucroLiquido,
        
        // üìà PERCENTUAIS SOBRE RECEITA
        percentuais: {
          cmo_percent: receitaTotal > 0 ? (dre.custos.cmo.total / receitaTotal) * 100 : 0,
          cmv_percent: receitaTotal > 0 ? (dre.custos.cmv.total / receitaTotal) * 100 : 0,
          custos_variaveis_percent: receitaTotal > 0 ? (dre.custos.custos_variaveis.total / receitaTotal) * 100 : 0,
          despesas_comerciais_percent: receitaTotal > 0 ? (dre.despesas.despesas_comerciais.total / receitaTotal) * 100 : 0,
          despesas_administrativas_percent: receitaTotal > 0 ? (dre.despesas.despesas_administrativas.total / receitaTotal) * 100 : 0,
          despesas_operacionais_percent: receitaTotal > 0 ? (dre.despesas.despesas_operacionais.total / receitaTotal) * 100 : 0,
          despesas_ocupacao_percent: receitaTotal > 0 ? (dre.despesas.despesas_ocupacao.total / receitaTotal) * 100 : 0,
          margem_bruta_percent: receitaTotal > 0 ? (lucroBruto / receitaTotal) * 100 : 0,
          margem_liquida_percent: receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0
        }
      }
    }

    console.log(`úÖ DRE calculada - Receitas: R$ ${receitaTotal.toFixed(2)} - Eventos mapeados: ${dre.estatisticas.eventos_mapeados}/${dre.estatisticas.total_eventos}`)

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('ùå Erro interno na API DRE:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
