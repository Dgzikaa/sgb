// =====================================================
// ðŸ”„ SISTEMA DE Lá“GICA CONDICIONAL PARA CHECKLISTS
// =====================================================
// Implementa conforme documento Word:
// "se clicar ná£o, aparece" - lá³gica condicional baseada em respostas

interface CondicaoItem {
  // Item que vai aparecer/desaparecer
  itemId: string
  
  // Condiá§áµes para mostrar o item
  condicoes: {
    // ID do item que controla a condiá§á£o
    itemDependencia: string
    
    // Operador de comparaá§á£o
    operador: 'igual' | 'diferente' | 'maior_que' | 'menor_que' | 'contem' | 'nao_contem'
    
    // Valor para comparaá§á£o
    valor: any
    
    // Tipo de aá§á£o
    acao: 'mostrar' | 'ocultar' | 'obrigar' | 'opcional'
  }[]
  
  // Operador lá³gico entre condiá§áµes (se máºltiplas)
  operadorLogico: 'E' | 'OU'
}

interface ItemCondicional {
  id: string
  titulo: string
  tipo: string
  obrigatorio: boolean
  valor?: any
  visivel: boolean
  obrigatorioCondicional?: boolean
  condicoes?: CondicaoItem['condicoes']
  operadorLogico?: 'E' | 'OU'
  motivoOculto?: string
}

// =====================================================
// ðŸŽ¯ FUNá‡áƒO PRINCIPAL DE AVALIAá‡áƒO
// =====================================================

export function avaliarCondicoes(
  itens: ItemCondicional[],
  itensCondicionais: CondicaoItem[]
): ItemCondicional[] {
  
  // Criar mapa de valores atuais para rá¡pido acesso
  const valoresItens = new Map<string, any>()
  itens.forEach(item => {
    valoresItens.set(item.id, item.valor)
  })

  // Processar cada item condicional
  const itensAtualizados = itens.map((item: any) => {
    // Encontrar regras condicionais para este item
    const regraCondicional = itensCondicionais.find((regra: any) => regra.itemId === item.id)
    
    if (!regraCondicional) {
      // Item sem condiá§áµes, manter estado atual
      return { ...item, visivel: true }
    }

    // Avaliar condiá§áµes
    const resultadoCondicoes = avaliarCondicoesItem(
      regraCondicional.condicoes,
      regraCondicional.operadorLogico || 'E',
      valoresItens
    )

    // Aplicar resultado
    let novoItem = { ...item }
    
    regraCondicional.condicoes.forEach(condicao => {
      switch (condicao.acao) {
        case 'mostrar':
          novoItem.visivel = resultadoCondicoes.resultado
          if (!resultadoCondicoes.resultado) {
            novoItem.motivoOculto = `Depende de: ${resultadoCondicoes.condicoesFalharam.join(', ')}`
          }
          break
        
        case 'ocultar':
          novoItem.visivel = !resultadoCondicoes.resultado
          if (resultadoCondicoes.resultado) {
            novoItem.motivoOculto = `Oculto porque: ${resultadoCondicoes.condicoesPassaram.join(', ')}`
          }
          break
        
        case 'obrigar':
          novoItem.obrigatorioCondicional = resultadoCondicoes.resultado
          break
        
        case 'opcional':
          novoItem.obrigatorioCondicional = !resultadoCondicoes.resultado
          break
      }
    })

    return novoItem
  })

  return itensAtualizados
}

// =====================================================
// ðŸ” AVALIAá‡áƒO DE CONDIá‡á•ES INDIVIDUAIS
// =====================================================

function avaliarCondicoesItem(
  condicoes: CondicaoItem['condicoes'],
  operadorLogico: 'E' | 'OU',
  valoresItens: Map<string, any>
): {
  resultado: boolean
  condicoesPassaram: string[]
  condicoesFalharam: string[]
  detalhes: string[]
} {
  
  const resultados: boolean[] = []
  const condicoesPassaram: string[] = []
  const condicoesFalharam: string[] = []
  const detalhes: string[] = []

  condicoes.forEach(condicao => {
    const valorDependencia = valoresItens.get(condicao.itemDependencia)
    const resultadoCondicao = avaliarCondicaoSimples(
      valorDependencia,
      condicao.operador,
      condicao.valor
    )

    resultados.push(resultadoCondicao)

    const descricaoCondicao = `${condicao.itemDependencia} ${condicao.operador} ${condicao.valor}`
    
    if (resultadoCondicao) {
      condicoesPassaram.push(descricaoCondicao)
    } else {
      condicoesFalharam.push(descricaoCondicao)
    }

    detalhes.push(`${descricaoCondicao}: ${resultadoCondicao ? 'œ…' : 'Œ'}`)
  })

  // Aplicar operador lá³gico
  const resultado = operadorLogico === 'E' 
    ? resultados.every(r => r)
    : resultados.some(r => r)

  return {
    resultado,
    condicoesPassaram,
    condicoesFalharam,
    detalhes
  }
}

function avaliarCondicaoSimples(
  valorAtual: any,
  operador: CondicaoItem['condicoes'][0]['operador'],
  valorComparacao: any
): boolean {
  
  // Tratar valores undefined/null
  if (valorAtual === undefined || valorAtual === null) {
    valorAtual = ''
  }

  switch (operador) {
    case 'igual':
      return valorAtual === valorComparacao

    case 'diferente':
      return valorAtual !== valorComparacao

    case 'maior_que':
      return Number(valorAtual) > Number(valorComparacao)

    case 'menor_que':
      return Number(valorAtual) < Number(valorComparacao)

    case 'contem':
      return String(valorAtual).toLowerCase().includes(String(valorComparacao).toLowerCase())

    case 'nao_contem':
      return !String(valorAtual).toLowerCase().includes(String(valorComparacao).toLowerCase())

    default:
      return false
  }
}

// =====================================================
// ðŸ› ï¸ FUNá‡á•ES UTILITáRIAS
// =====================================================

export function criarRegraCondicional(
  itemId: string,
  itemDependencia: string,
  operador: CondicaoItem['condicoes'][0]['operador'],
  valor: any,
  acao: CondicaoItem['condicoes'][0]['acao'] = 'mostrar'
): CondicaoItem {
  return {
    itemId,
    condicoes: [{
      itemDependencia,
      operador,
      valor,
      acao
    }],
    operadorLogico: 'E'
  }
}

export function criarRegraCondicionalMultipla(
  itemId: string,
  condicoes: Array<{
    itemDependencia: string
    operador: CondicaoItem['condicoes'][0]['operador']
    valor: any
    acao?: CondicaoItem['condicoes'][0]['acao']
  }>,
  operadorLogico: 'E' | 'OU' = 'E'
): CondicaoItem {
  return {
    itemId,
    condicoes: condicoes.map((c: any) => ({
      ...c,
      acao: c.acao || 'mostrar'
    })),
    operadorLogico
  }
}

// =====================================================
// ðŸ“‹ EXEMPLOS DE USO COMUNS
// =====================================================

export const ExemplosCondicionais = {
  // Se clicar "NáƒO" em limpeza, aparece campo de observaá§á£o
  seNaoApareceObservacao: (itemPrincipal: string, itemObservacao: string) =>
    criarRegraCondicional(itemObservacao, itemPrincipal, 'igual', false, 'mostrar'),

  // Se temperatura fora do range, obrigar foto
  seTemperaturaForaObrigarFoto: (itemTemperatura: string, itemFoto: string, minTemp: number, maxTemp: number) =>
    criarRegraCondicionalMultipla(itemFoto, [
      { itemDependencia: itemTemperatura, operador: 'menor_que', valor: minTemp, acao: 'obrigar' },
      { itemDependencia: itemTemperatura, operador: 'maior_que', valor: maxTemp, acao: 'obrigar' }
    ], 'OU'),

  // Se avaliaá§á£o baixa (‰¤2), obrigar justificativa
  seAvaliacaoBaixaObrigarJustificativa: (itemAvaliacao: string, itemJustificativa: string) =>
    criarRegraCondicional(itemJustificativa, itemAvaliacao, 'menor_que', 3, 'obrigar'),

  // Se equipamento ná£o funcionando, mostrar campos de manutená§á£o
  seEquipamentoNaoFuncionandoMostrarManutencao: (itemEquipamento: string, itensManutencao: string[]) =>
    itensManutencao.map((itemManutencao: any) =>
      criarRegraCondicional(itemManutencao, itemEquipamento, 'igual', false, 'mostrar')
    ),

  // Se tipo de problema selecionado, mostrar campos especá­ficos
  seTipoProblemaShowCampos: (itemTipoProblema: string, valor: string, itensEspecificos: string[]) =>
    itensEspecificos.map((item: any) =>
      criarRegraCondicional(item, itemTipoProblema, 'igual', valor, 'mostrar')
    )
}

// =====================================================
// ðŸŽ® HOOK PARA COMPONENTES REACT
// =====================================================

export function useConditionalLogic(
  itensOriginais: ItemCondicional[],
  regrasCondicionais: CondicaoItem[]
) {
  
  const processarItens = (itens: ItemCondicional[]): ItemCondicional[] => {
    return avaliarCondicoes(itens, regrasCondicionais)
  }

  const atualizarItemValor = (
    itens: ItemCondicional[],
    itemId: string,
    novoValor: any
  ): ItemCondicional[] => {
    const itensAtualizados = itens.map((item: any) =>
      item.id === itemId ? { ...item, valor: novoValor } : item
    )
    
    // Reavaliar condiá§áµes apá³s mudaná§a
    return processarItens(itensAtualizados)
  }

  const obterItensVisiveis = (itens: ItemCondicional[]): ItemCondicional[] => {
    return itens.filter((item: any) => item.visivel)
  }

  const obterItensObrigatorios = (itens: ItemCondicional[]): ItemCondicional[] => {
    return itens.filter((item: any) => 
      item.visivel && (item.obrigatorio || item.obrigatorioCondicional)
    )
  }

  const validarItensObrigatorios = (itens: ItemCondicional[]): {
    valido: boolean
    itensVazios: string[]
  } => {
    const obrigatorios = obterItensObrigatorios(itens)
    const vazios = obrigatorios
      .filter((item: any) => !item.valor || item.valor === '')
      .map((item: any) => item.titulo)

    return {
      valido: vazios.length === 0,
      itensVazios: vazios
    }
  }

  return {
    processarItens,
    atualizarItemValor,
    obterItensVisiveis,
    obterItensObrigatorios,
    validarItensObrigatorios
  }
} 
