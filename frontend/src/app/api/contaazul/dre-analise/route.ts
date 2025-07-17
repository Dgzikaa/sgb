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
  'Stone Crédito': 'receitas',
  'Stone CrÃ©dito': 'receitas',
  'Stone Débito': 'receitas', 
  'Stone DÃ©bito': 'receitas',
  'Stone Pix': 'receitas',
  'Receita de Eventos': 'receitas',
  'Receita à Vista': 'receitas',
  'Receitas de serviços': 'receitas',
  'Outras Receitas': 'receitas',
  'Pix Direto na Conta': 'receitas',
  'Dinheiro': 'receitas',

  // === CUSTOS VARIÁVEIS ===
  'Custo Fixo': 'custos_variaveis',
  'MC': 'custos_variaveis', 
  'Breakeven': 'custos_variaveis',
  'TAXA MAQUININHA': 'custos_variaveis',
  'Stone Taxa Entrega': 'custos_variaveis',
  'TaxaContaAzul': 'custos_variaveis',
  'IMPOSTO': 'custos_variaveis',
  'COMISSÃO 10%': 'custos_variaveis',
  // NOMES EXATOS DA PLANILHA:
  'Custos Variáveis': 'custos_variaveis',
  'CUSTOS VARIÁVEIS': 'custos_variaveis',

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

  // === CMO - MÃO DE OBRA ===
  'Mão-deObra': 'cmo',
  'MÃO-DEOBRA': 'cmo',
  'Mão de Obra': 'cmo',
  'MÃO DE OBRA': 'cmo',
  'SALARIO FUNCIONARIOS': 'cmo',
  'VALE TRANSPORTE': 'cmo',
  'UNIFORMES': 'cmo', 
  'VR e VA': 'cmo',
  'FGTS': 'cmo',
  'SAL?RIOS': 'cmo',
  'Salarios': 'cmo',
  'Salário': 'cmo',
  'SALARIOS': 'cmo',
  'INSS': 'cmo',
  'DECIMO TERCEIRO': 'cmo',
  'VR E VA': 'cmo',
  'Plano de saude': 'cmo',
  'Recursos Humanos': 'cmo',
  'ALIMENTAÇÃO': 'cmo',
  'ADICIONAIS': 'cmo',
  'FREELA ATENDIMENTO': 'cmo',
  'FREELA BAR': 'cmo',
  'FREELA COZINHA': 'cmo',
  'FREELA LIMPEZA': 'cmo',
  'FREELA SEGURANÇA': 'cmo',
  'PRO LABORE': 'cmo',
  'PROVISÃO TRABALHISTA': 'cmo',

  // === DESPESAS COMERCIAIS ===
  'Despesas Comerciais': 'despesas_comerciais',
  'Marketing': 'despesas_comerciais',
  'MARKETING': 'despesas_comerciais',
  'Publicidade': 'despesas_comerciais',
  'Atrações Programação': 'despesas_comerciais',
  'Produção Eventos': 'despesas_comerciais',

  // === DESPESAS ADMINISTRATIVAS ===
  'Despesas Administrativas': 'despesas_administrativas',
  'Administrativo': 'despesas_administrativas',
  'ADMNISTRATIVO': 'despesas_administrativas',
  'ESCRITORIO': 'despesas_administrativas',
  'Administrativo Ordinário': 'despesas_administrativas',
  'Escritório Central': 'despesas_administrativas',

  // === DESPESAS OPERACIONAIS ===
  'Despesas Operacionais': 'despesas_operacionais',
  'Equipamentos': 'despesas_operacionais',
  'Utensílios': 'despesas_operacionais',
  'Limpeza': 'despesas_operacionais',
  'Tarifas': 'despesas_operacionais',
  'iFoodGuru': 'despesas_operacionais',
  'Outros OperaÃ§Ã£o': 'despesas_operacionais',
  'Materiais Operação': 'despesas_operacionais',
  'Materiais de Limpeza e Descartáveis': 'despesas_operacionais',
  'Estorno': 'despesas_operacionais',
  'Outros Operação': 'despesas_operacionais',

  // === DESPESAS DE OCUPAÇÃO ===
  'Despesas de Ocupação (Contas)': 'despesas_ocupacao',
  'Aluguel': 'despesas_ocupacao',
  'Energia': 'despesas_ocupacao',
  'Internet': 'despesas_ocupacao',
  'ENERGIA ELETRICA': 'despesas_ocupacao',
  'Telefone': 'despesas_ocupacao',
  'Condomínio': 'despesas_ocupacao',
  'ÃGUA': 'despesas_ocupacao',
  'ALUGUEL/CONDOMÍNIO/IPTU': 'despesas_ocupacao',
  'ÁGUA': 'despesas_ocupacao',
  'MANUTENÇÃO': 'despesas_ocupacao',
  'GÁS': 'despesas_ocupacao',
  'LUZ': 'despesas_ocupacao',

  // === NÃO OPERACIONAIS ===
  'Não Operacionais': 'nao_operacionais',
  'Taxas Bancárias': 'nao_operacionais',
  'Empréstimos de Sócios': 'nao_operacionais',
  'Outros Sócios': 'nao_operacionais',
  'Contratos': 'nao_operacionais',

  // === INVESTIMENTOS ===
  'Investimentos': 'investimentos',
  'Construção': 'investimentos',
  'Reformas': 'investimentos',
  'Mobília': 'investimentos',
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

  // === SÓCIOS (tratado como não operacional) ===
  'Sócios': 'nao_operacionais',
}

// ✅ FUNÇÃO PARA MAPEAR CATEGORIA PARA GRUPO DRE - VERSÃO MELHORADA
function mapearCategoriaParaGrupo(nomeCategoria: string): string | null {
  if (!nomeCategoria) return null
  
  // Busca exata primeiro
  if (mapeamentoCategoriaDRE[nomeCategoria]) {
    return mapeamentoCategoriaDRE[nomeCategoria]
  }

  // Normalizar nome para busca (remover acentos, espaços extras, etc)
  const normalizar = (texto: string) => texto
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[-_]/g, ' ')

  const nomeNormalizado = normalizar(nomeCategoria)

  // Busca por palavras-chave específicas para categorias importantes
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
  
  return null // Categoria não mapeada
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId')
    const mes = searchParams.get('mes') // formato: '2024-01' ou null para todos
    const ano = searchParams.get('ano') // formato: '2024' ou null
    
    if (!barId) {
      return NextResponse.json({ error: 'Bar ID é obrigatório' }, { status: 400 })
    }

    console.log(`📊 CALCULANDO DRE PARA BAR ${barId} - Mês: ${mes || 'TODOS'} - Ano: ${ano || 'TODOS'}`)

    const supabase = createSupabaseClient()

    // 🔍 BUSCAR CATEGORIAS COM MAPEAMENTO
    const { data: categorias, error: errorCategorias } = await supabase
      .from('contaazul_categorias')
      .select('id, nome')
      .eq('bar_id', parseInt(barId))

    if (errorCategorias) {
      console.error('❌ Erro ao buscar categorias:', errorCategorias)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }

    // 📋 CRIAR MAPA DE CATEGORIAS ID -> NOME E GRUPO
    const mapaCategorias: Record<string, { nome: string, grupo: string | null }> = {}
    categorias?.forEach((cat: { id: string, nome: string }) => {
      mapaCategorias[cat.id] = {
        nome: cat.nome,
        grupo: mapearCategoriaParaGrupo(cat.nome)
      }
    })

    console.log(`📋 Categorias carregadas: ${Object.keys(mapaCategorias).length}`)

    // 🔍 FUNÇÃO PARA BUSCAR TODOS OS EVENTOS FINANCEIROS COM PAGINAÇÃO
    async function buscarTodosEventosFinanceiros() {
      const allEventos: any[] = []
      let offset = 0
      const limit = 1000
      let hasMore = true

      while (hasMore) {
        let query = supabase
          .from('contaazul_eventos_financeiros')
          .select('valor, tipo, categoria_id, data_competencia, data_vencimento')
          .eq('bar_id', parseInt(barId!))
          .not('categoria_id', 'is', null)
          .range(offset, offset + limit - 1)

        // 📅 APLICAR FILTROS DE DATA
        if (mes) {
          // Filtro por mês específico (ex: 2025-01)
          const [ano, mesNum] = mes.split('-')
          const startDate = `${mes}-01`
          // Calcular último dia do mês corretamente
          const ultimoDia = new Date(parseInt(ano), parseInt(mesNum), 0).getDate()
          const endDate = `${mes}-${ultimoDia.toString().padStart(2, '0')}`
          console.log(`📅 Filtro de data: ${startDate} até ${endDate}`)
          query = query.gte('data_competencia', startDate).lte('data_competencia', endDate)
        } else if (ano) {
          // Filtro por ano (ex: 2025)
          query = query.gte('data_competencia', `${ano}-01-01`).lte('data_competencia', `${ano}-12-31`)
        } else {
          // ✅ PADRÃO: Dados de 2025 se não especificado
          query = query.gte('data_competencia', '2025-01-01').lte('data_competencia', '2025-12-31')
        }

        const { data, error } = await query

        if (error) {
          console.error('❌ Erro ao buscar eventos na página:', offset, error)
          throw error
        }

        if (data && data.length > 0) {
          allEventos.push(...data)
          console.log(`📄 Página ${Math.floor(offset/limit) + 1}: ${data.length} eventos | Total: ${allEventos.length}`)
          
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

    // 🔍 BUSCAR TODOS OS EVENTOS FINANCEIROS COM PAGINAÇÃO
    const eventos = await buscarTodosEventosFinanceiros()

    console.log(`💰 Eventos encontrados: ${eventos?.length || 0}`)

    // 📊 CALCULAR DRE
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

    // 📈 PROCESSAR CADA EVENTO
    eventos?.forEach((evento: { valor: string, categoria_id: string, tipo: string, data_competencia: string }) => {
      const valor = parseFloat(evento.valor || '0')
      const categoriaInfo = mapaCategorias[evento.categoria_id]
      
      dre.estatisticas.total_eventos++

      if (!categoriaInfo) {
        // Categoria não encontrada
        dre.estatisticas.eventos_nao_mapeados++
        return
      }

      const nomeCategoria = categoriaInfo.nome
      const grupo = categoriaInfo.grupo

      if (!grupo) {
        // Categoria não mapeada para DRE
        dre.categorias_nao_mapeadas[nomeCategoria] = (dre.categorias_nao_mapeadas[nomeCategoria] || 0) + valor
        dre.estatisticas.eventos_nao_mapeados++
        return
      }

      dre.estatisticas.eventos_mapeados++

      // ✅ MAPEAR PARA ESTRUTURA DRE
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

    // 📊 CÁLCULOS DRE CORRETOS
    const receitaTotal = dre.receitas.total
    
    // CUSTOS: CMV + CMO + Custos Variáveis
    const custosTotal = dre.custos.cmv.total + dre.custos.cmo.total + dre.custos.custos_variaveis.total
    
    // DESPESAS OPERACIONAIS: Comerciais + Administrativas + Operacionais + Ocupação + Não Operacionais
    const despesasOperacionais = dre.despesas.despesas_comerciais.total + 
                                dre.despesas.despesas_administrativas.total + 
                                dre.despesas.despesas_operacionais.total + 
                                dre.despesas.despesas_ocupacao.total + 
                                dre.despesas.nao_operacionais.total
    
    // TOTAL DE DESPESAS: Operacionais + Investimentos
    const despesasTotal = despesasOperacionais + dre.despesas.investimentos.total
    
    // CÁLCULOS DRE:
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
        
        // 📈 PERCENTUAIS SOBRE RECEITA
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

    console.log(`✅ DRE calculada - Receitas: R$ ${receitaTotal.toFixed(2)} - Eventos mapeados: ${dre.estatisticas.eventos_mapeados}/${dre.estatisticas.total_eventos}`)

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('❌ Erro interno na API DRE:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
