// =====================================================
// ðŸ† SISTEMA DE SCORING INTELIGENTE - CHECKLISTS
// =====================================================
// Implementa o sistema de notas conforme documento Word:
// - "ter a 'nota' do checklist"  
// - "se alguma era pra marcar sim e marcaram ná£o, ficar claro"

interface ItemResposta {
  item_id: string
  titulo: string
  tipo: 'texto' | 'numero' | 'sim_nao' | 'data' | 'assinatura' | 'foto_camera' | 'foto_upload' | 'avaliacao'
  obrigatorio: boolean
  valor: any
  observacoes?: string
  respondido: boolean
  esperado_positivo?: boolean // Para identificar problemas
}

interface ScoreResult {
  score_total: number
  categoria: 'excelente' | 'bom' | 'atencao' | 'critico'
  total_itens: number
  total_respondidos: number
  itens_ok: number
  itens_problema: number
  itens_na: number
  problemas_identificados: ProblemIdenticado[]
  detalhes_por_secao: ScoreSecao[]
  recomendacoes: string[]
}

interface ProblemIdenticado {
  item_id: string
  titulo: string
  secao: string
  tipo_problema: 'esperado_sim_marcado_nao' | 'obrigatorio_nao_preenchido' | 'valor_critico'
  descricao: string
  impacto: 'alto' | 'medio' | 'baixo'
  requer_acao: boolean
}

interface ScoreSecao {
  secao_nome: string
  score_secao: number
  total_itens: number
  itens_respondidos: number
  problemas: number
  categoria: 'excelente' | 'bom' | 'atencao' | 'critico'
}

// =====================================================
// ðŸŽ¯ FUNá‡áƒO PRINCIPAL DE CáLCULO
// =====================================================

export function calcularScoreFinal(execucao: any): ScoreResult {
  const respostas = execucao.respostas || {}
  const estrutura = execucao.estrutura_checklist || execucao.checklist?.estrutura

  if (!estrutura?.secoes || !Array.isArray(estrutura.secoes)) {
    return criarScoreVazio()
  }

  const problemas: ProblemIdenticado[] = []
  const detalhesSecoes: ScoreSecao[] = []
  
  let totalItens = 0
  let totalRespondidos = 0
  let itensOk = 0
  let itensProblema = 0
  let itensNa = 0
  let somaScores = 0

  // Calcular score por seá§á£o
  estrutura.secoes.forEach((secao: any, secaoIndex: number) => {
    if (!secao.itens || !Array.isArray(secao.itens)) return

    const scoreSecao = calcularScoreSecao(secao, respostas, problemas)
    detalhesSecoes.push(scoreSecao)
    
    totalItens += scoreSecao.total_itens
    totalRespondidos += scoreSecao.itens_respondidos
    itensOk += scoreSecao.itens_respondidos - scoreSecao.problemas
    itensProblema += scoreSecao.problemas
    somaScores += scoreSecao.score_secao
  })

  // Calcular score total (má©dia ponderada)
  const scoreTotal = detalhesSecoes.length > 0 
    ? Math.round((somaScores / detalhesSecoes.length) * 10) / 10
    : 0

  // Determinar categoria
  const categoria = determinarCategoria(scoreTotal, problemas)

  // Gerar recomendaá§áµes
  const recomendacoes = gerarRecomendacoes(problemas, scoreTotal)

  return {
    score_total: scoreTotal,
    categoria,
    total_itens: totalItens,
    total_respondidos: totalRespondidos,
    itens_ok: itensOk,
    itens_problema: itensProblema,
    itens_na: itensNa,
    problemas_identificados: problemas,
    detalhes_por_secao: detalhesSecoes,
    recomendacoes
  }
}

// =====================================================
// ðŸ“Š CáLCULO POR SEá‡áƒO
// =====================================================

function calcularScoreSecao(
  secao: any, 
  respostas: any, 
  problemas: ProblemIdenticado[]
): ScoreSecao {
  const nomeSecao = secao.nome || 'Seá§á£o sem nome'
  const itens = secao.itens || []
  
  let totalItens = itens.length
  let itensRespondidos = 0
  let problemasSecao = 0
  let somaScoreItens = 0

  itens.forEach((item: any) => {
    const resposta = encontrarResposta(item, respostas)
    const scoreItem = calcularScoreItem(item, resposta, nomeSecao, problemas)
    
    if (resposta?.respondido) {
      itensRespondidos++
      somaScoreItens += scoreItem.score
      
      if (scoreItem.tem_problema) {
        problemasSecao++
      }
    }
  })

  // Score da seá§á£o (0-100)
  const scoreSecao = totalItens > 0 
    ? Math.round((somaScoreItens / totalItens) * 10) / 10
    : 0

  return {
    secao_nome: nomeSecao,
    score_secao: scoreSecao,
    total_itens: totalItens,
    itens_respondidos: itensRespondidos,
    problemas: problemasSecao,
    categoria: determinarCategoriaSecao(scoreSecao, problemasSecao)
  }
}

// =====================================================
// ðŸ” CáLCULO POR ITEM
// =====================================================

function calcularScoreItem(
  item: any,
  resposta: any,
  nomeSecao: string,
  problemas: ProblemIdenticado[]
): { score: number, tem_problema: boolean } {
  
  if (!resposta?.respondido) {
    // Item ná£o respondido
    if (item.obrigatorio) {
      problemas.push({
        item_id: item.id || item.titulo,
        titulo: item.titulo,
        secao: nomeSecao,
        tipo_problema: 'obrigatorio_nao_preenchido',
        descricao: `Item obrigatá³rio ná£o foi preenchido: ${item.titulo}`,
        impacto: 'alto',
        requer_acao: true
      })
      return { score: 0, tem_problema: true }
    }
    return { score: 50, tem_problema: false } // Item opcional ná£o respondido
  }

  // Item respondido - calcular score baseado no tipo e valor
  return calcularScorePorTipo(item, resposta, nomeSecao, problemas)
}

function calcularScorePorTipo(
  item: any,
  resposta: any,
  nomeSecao: string,
  problemas: ProblemIdenticado[]
): { score: number, tem_problema: boolean } {
  
  const valor = resposta.valor

  switch (item.tipo) {
    case 'sim_nao':
      return calcularScoreSimNao(item, valor, nomeSecao, problemas)
    
    case 'avaliacao':
      return calcularScoreAvaliacao(item, valor, nomeSecao, problemas)
    
    case 'numero':
      return calcularScoreNumero(item, valor, nomeSecao, problemas)
    
    case 'texto':
      return calcularScoreTexto(item, valor, nomeSecao, problemas)
    
    case 'data':
      return calcularScoreData(item, valor, nomeSecao, problemas)
    
    case 'foto_camera':
    case 'foto_upload':
      return calcularScoreFoto(item, valor, nomeSecao, problemas)
    
    case 'assinatura':
      return calcularScoreAssinatura(item, valor, nomeSecao, problemas)
    
    default:
      return { score: 100, tem_problema: false }
  }
}

// =====================================================
// ðŸŽ¯ CáLCULOS ESPECáFICOS POR TIPO
// =====================================================

function calcularScoreSimNao(
  item: any,
  valor: any,
  nomeSecao: string,
  problemas: ProblemIdenticado[]
): { score: number, tem_problema: boolean } {
  
  const titulo = item.titulo?.toLowerCase() || ''
  const valorBoolean = valor === true || valor === 'sim' || valor === 'yes'
  
  // Identificar se á© um item que deveria ser "sim" (positivo)
  const esperaPositivo = identificarItemPositivo(titulo)
  
  if (esperaPositivo && !valorBoolean) {
    // Era pra ser SIM mas foi marcado NáƒO - PROBLEMA!
    problemas.push({
      item_id: item.id || item.titulo,
      titulo: item.titulo,
      secao: nomeSecao,
      tipo_problema: 'esperado_sim_marcado_nao',
      descricao: `Item crá­tico marcado como "NáƒO": ${item.titulo}`,
      impacto: 'alto',
      requer_acao: true
    })
    return { score: 20, tem_problema: true }
  }
  
  if (!esperaPositivo && valorBoolean) {
    // Era pra ser NáƒO mas foi marcado SIM (pode indicar problema)
    const ehProblemaSerio = identificarItemNegativo(titulo)
    if (ehProblemaSerio) {
      problemas.push({
        item_id: item.id || item.titulo,
        titulo: item.titulo,
        secao: nomeSecao,
        tipo_problema: 'valor_critico',
        descricao: `Possá­vel problema identificado: ${item.titulo}`,
        impacto: 'medio',
        requer_acao: true
      })
      return { score: 60, tem_problema: true }
    }
  }

  return { score: 100, tem_problema: false }
}

function calcularScoreAvaliacao(
  item: any,
  valor: any,
  nomeSecao: string,
  problemas: ProblemIdenticado[]
): { score: number, tem_problema: boolean } {
  
  const nota = parseFloat(valor) || 0
  
  if (nota <= 2) {
    problemas.push({
      item_id: item.id || item.titulo,
      titulo: item.titulo,
      secao: nomeSecao,
      tipo_problema: 'valor_critico',
      descricao: `Avaliaá§á£o baixa (${nota}/5): ${item.titulo}`,
      impacto: 'alto',
      requer_acao: true
    })
    return { score: nota * 20, tem_problema: true }
  }
  
  if (nota <= 3) {
    return { score: nota * 20, tem_problema: true }
  }
  
  return { score: nota * 20, tem_problema: false }
}

function calcularScoreNumero(
  item: any,
  valor: any,
  nomeSecao: string,
  problemas: ProblemIdenticado[]
): { score: number, tem_problema: boolean } {
  
  const numero = parseFloat(valor) || 0
  const opcoes = item.opcoes || {}
  
  if (opcoes.min !== undefined && numero < opcoes.min) {
    problemas.push({
      item_id: item.id || item.titulo,
      titulo: item.titulo,
      secao: nomeSecao,
      tipo_problema: 'valor_critico',
      descricao: `Valor abaixo do má­nimo (${numero} < ${opcoes.min}): ${item.titulo}`,
      impacto: 'alto',
      requer_acao: true
    })
    return { score: 30, tem_problema: true }
  }
  
  if (opcoes.max !== undefined && numero > opcoes.max) {
    problemas.push({
      item_id: item.id || item.titulo,
      titulo: item.titulo,
      secao: nomeSecao,
      tipo_problema: 'valor_critico',
      descricao: `Valor acima do má¡ximo (${numero} > ${opcoes.max}): ${item.titulo}`,
      impacto: 'alto',
      requer_acao: true
    })
    return { score: 30, tem_problema: true }
  }
  
  return { score: 100, tem_problema: false }
}

function calcularScoreTexto(
  item: any,
  valor: any,
  nomeSecao: string,
  problemas: ProblemIdenticado[]
): { score: number, tem_problema: boolean } {
  
  const texto = (valor || '').toString().trim()
  
  if (texto.length === 0) {
    return { score: 0, tem_problema: true }
  }
  
  if (texto.length < 3) {
    return { score: 50, tem_problema: true }
  }
  
  return { score: 100, tem_problema: false }
}

function calcularScoreData(
  item: any,
  valor: any,
  nomeSecao: string,
  problemas: ProblemIdenticado[]
): { score: number, tem_problema: boolean } {
  
  if (!valor) {
    return { score: 0, tem_problema: true }
  }
  
  const data = new Date(valor)
  if (isNaN(data.getTime())) {
    return { score: 0, tem_problema: true }
  }
  
  return { score: 100, tem_problema: false }
}

function calcularScoreFoto(
  item: any,
  valor: any,
  nomeSecao: string,
  problemas: ProblemIdenticado[]
): { score: number, tem_problema: boolean } {
  
  if (!valor || (Array.isArray(valor) && valor.length === 0)) {
    if (item.obrigatorio) {
      return { score: 0, tem_problema: true }
    }
    return { score: 70, tem_problema: false }
  }
  
  return { score: 100, tem_problema: false }
}

function calcularScoreAssinatura(
  item: any,
  valor: any,
  nomeSecao: string,
  problemas: ProblemIdenticado[]
): { score: number, tem_problema: boolean } {
  
  if (!valor || valor.length < 10) {
    if (item.obrigatorio) {
      return { score: 0, tem_problema: true }
    }
    return { score: 70, tem_problema: false }
  }
  
  return { score: 100, tem_problema: false }
}

// =====================================================
// ðŸ” FUNá‡á•ES DE IDENTIFICAá‡áƒO
// =====================================================

function identificarItemPositivo(titulo: string): boolean {
  const palavrasPositivas = [
    'limpo', 'funcionando', 'organizado', 'adequado', 'suficiente',
    'disponá­vel', 'operante', 'em bom estado', 'verificado', 'conferido',
    'abastecido', 'higienizado', 'calibrado', 'teste ok', 'normal',
    'dentro do prazo', 'em ordem', 'completo', 'atualizado'
  ]
  
  return palavrasPositivas.some(palavra => titulo.includes(palavra))
}

function identificarItemNegativo(titulo: string): boolean {
  const palavrasNegativas = [
    'vazamento', 'quebrado', 'sujo', 'vencido', 'defeito', 'problema',
    'ruá­do', 'odor', 'mancha', 'rachadura', 'ferimento', 'acidente',
    'contaminaá§á£o', 'pragas', 'roedores', 'insetos'
  ]
  
  return palavrasNegativas.some(palavra => titulo.includes(palavra))
}

// =====================================================
// ðŸ·ï¸ CATEGORIZAá‡áƒO
// =====================================================

function determinarCategoria(score: number, problemas: ProblemIdenticado[]): 'excelente' | 'bom' | 'atencao' | 'critico' {
  const problemasAltos = problemas.filter((p: any) => p.impacto === 'alto').length
  const problemasCriticos = problemas.filter((p: any) => p.tipo_problema === 'esperado_sim_marcado_nao').length
  
  if (problemasCriticos > 0 || problemasAltos >= 3) {
    return 'critico'
  }
  
  if (score >= 90 && problemasAltos === 0) {
    return 'excelente'
  }
  
  if (score >= 75 && problemasAltos <= 1) {
    return 'bom'
  }
  
  return 'atencao'
}

function determinarCategoriaSecao(score: number, problemas: number): 'excelente' | 'bom' | 'atencao' | 'critico' {
  if (problemas >= 3) return 'critico'
  if (score >= 90 && problemas === 0) return 'excelente'
  if (score >= 75 && problemas <= 1) return 'bom'
  return 'atencao'
}

// =====================================================
// ðŸ’¡ RECOMENDAá‡á•ES
// =====================================================

function gerarRecomendacoes(problemas: ProblemIdenticado[], score: number): string[] {
  const recomendacoes: string[] = []
  
  const problemasCriticos = problemas.filter((p: any) => p.tipo_problema === 'esperado_sim_marcado_nao')
  if (problemasCriticos.length > 0) {
    recomendacoes.push(`ðŸš¨ Aá‡áƒO IMEDIATA: ${problemasCriticos.length} item(ns) crá­tico(s) identificado(s)`)
  }
  
  const itensObrigatorios = problemas.filter((p: any) => p.tipo_problema === 'obrigatorio_nao_preenchido')
  if (itensObrigatorios.length > 0) {
    recomendacoes.push(`ðŸ“ Completar ${itensObrigatorios.length} item(ns) obrigatá³rio(s) pendente(s)`)
  }
  
  if (score < 60) {
    recomendacoes.push('ðŸ“Š Score baixo - revisar procedimentos e treinamento')
  }
  
  if (score >= 90) {
    recomendacoes.push('ðŸŽ‰ Excelente execuá§á£o! Parabá©ns pela qualidade!')
  }
  
  return recomendacoes
}

// =====================================================
// ðŸ”§ FUNá‡á•ES UTILITáRIAS
// =====================================================

function encontrarResposta(item: any, respostas: any): any {
  if (!respostas?.secoes) return null
  
  for (const secao of respostas.secoes) {
    if (secao.itens) {
      const resposta = secao.itens.find((r: any) => 
        r.item_id === item.id || r.titulo === item.titulo
      )
      if (resposta) return resposta
    }
  }
  
  return null
}

function criarScoreVazio(): ScoreResult {
  return {
    score_total: 0,
    categoria: 'critico',
    total_itens: 0,
    total_respondidos: 0,
    itens_ok: 0,
    itens_problema: 0,
    itens_na: 0,
    problemas_identificados: [],
    detalhes_por_secao: [],
    recomendacoes: ['Estrutura do checklist ná£o encontrada']
  }
}

// =====================================================
// ðŸ“ˆ FUNá‡á•ES DE ANáLISE ADICIONAL
// =====================================================

export function obterCorCategoria(categoria: string): string {
  switch (categoria) {
    case 'excelente': return 'text-green-600 bg-green-50'
    case 'bom': return 'text-blue-600 bg-blue-50'
    case 'atencao': return 'text-yellow-600 bg-yellow-50'
    case 'critico': return 'text-red-600 bg-red-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

export function obterIconeCategoria(categoria: string): string {
  switch (categoria) {
    case 'excelente': return 'ðŸ†'
    case 'bom': return 'œ…'
    case 'atencao': return 'š ï¸'
    case 'critico': return 'ðŸš¨'
    default: return 'ðŸ“‹'
  }
}

export function obterResumoScore(scoreResult: ScoreResult): string {
  const { score_total, categoria, problemas_identificados } = scoreResult
  const problemasCriticos = problemas_identificados.filter((p: any) => p.impacto === 'alto').length
  
  if (categoria === 'excelente') {
    return `Score excelente: ${score_total}/100 ðŸ†`
  }
  
  if (categoria === 'critico') {
    return `Atená§á£o necessá¡ria: ${score_total}/100 (${problemasCriticos} problema(s) crá­tico(s)) ðŸš¨`
  }
  
  return `Score: ${score_total}/100 - ${categoria} ${obterIconeCategoria(categoria)}`
} 
