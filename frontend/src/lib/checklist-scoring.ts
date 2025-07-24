// =====================================================
// 🏆 SISTEMA DE SCORING INTELIGENTE - CHECKLISTS
// =====================================================
// Implementa o sistema de notas conforme documento Word:
// - "ter a 'nota' do checklist"  
// - "se alguma era pra marcar sim e marcaram não, ficar claro"

interface ItemResposta {
  item_id: string
  titulo: string
  tipo: 'texto' | 'numero' | 'sim_nao' | 'data' | 'assinatura' | 'foto_camera' | 'foto_upload' | 'avaliacao'
  obrigatorio: boolean
  valor: unknown
  anexos: {
    url: string
    nome: string
    tipo: string
    tamanho?: number
  }[]
  respondido: boolean
  respondido_em?: string
}

interface SecaoResposta {
  secao_id: string
  titulo: string
  itens: ItemResposta[]
  score_parcial?: number
  peso?: number
}

interface RespostasExecucao {
  secoes: SecaoResposta[]
  score_total?: number
  tempo_total_minutos?: number
  observacoes?: string
}

interface ProgressoExecucao {
  total_itens: number
  itens_respondidos: number
  percentual_concluido: number
  secoes_concluidas: string[]
  tempo_estimado_restante?: number
}

interface ExecucaoData {
  id: string
  checklist_id: string
  funcionario_id: string
  status: 'em_andamento' | 'pausado' | 'completado' | 'cancelado'
  iniciado_em: string
  finalizado_em?: string
  observacoes?: string
  observacoes_finais?: string
  score_final?: number
  tempo_total_minutos?: number
  versao_checklist: number
  estrutura_checklist: Record<string, unknown>
  respostas: RespostasExecucao
  progresso: ProgressoExecucao
  checklist: {
    id: string
    nome: string
    setor: string
    tipo: string
    tempo_estimado: number
  }
  funcionario: {
    id: string
    nome: string
    email: string
  }
}

// Função para calcular score de uma seção
export function calcularScoreSecao(secao: SecaoResposta): { score: number; maxScore: number; percentual: number } {
  let score = 0
  let maxScore = 0
  
  secao.itens.forEach((item: ItemResposta) => {
    const itemScore = calcularScoreItem(item)
    score += itemScore.score
    maxScore += itemScore.maxScore
  })
  
  const percentual = maxScore > 0 ? (score / maxScore) * 100 : 0
  
  return { score, maxScore, percentual }
}

// Função para calcular score de um item específico
export function calcularScoreItem(item: ItemResposta): { score: number; maxScore: number; percentual: number } {
  const maxScore = item.obrigatorio ? 10 : 5
  
  if (!item.respondido) {
    return { score: 0, maxScore, percentual: 0 }
  }
  
  let score = 0
  
  switch (item.tipo) {
    case 'sim_nao':
      score = item.valor === true ? maxScore : 0
      break
    case 'avaliacao': {
      const avaliacao = item.valor as number
      score = avaliacao ? (avaliacao / 5) * maxScore : 0
      break
    }
    case 'texto':
    case 'numero':
    case 'data':
      score = item.valor ? maxScore : 0
      break
    case 'assinatura':
    case 'foto_camera':
    case 'foto_upload':
      score = item.anexos && item.anexos.length > 0 ? maxScore : 0
      break
    default:
      score = 0
  }
  
  const percentual = maxScore > 0 ? (score / maxScore) * 100 : 0
  
  return { score, maxScore, percentual }
}

// Função para calcular score total da execução
export function calcularScoreTotal(execucao: ExecucaoData): { score: number; maxScore: number; percentual: number } {
  let scoreTotal = 0
  let maxScoreTotal = 0
  
  execucao.respostas.secoes.forEach((secao: SecaoResposta) => {
    const secaoScore = calcularScoreSecao(secao)
    const peso = secao.peso || 1
    
    scoreTotal += secaoScore.score * peso
    maxScoreTotal += secaoScore.maxScore * peso
  })
  
  const percentual = maxScoreTotal > 0 ? (scoreTotal / maxScoreTotal) * 100 : 0
  
  return { score: scoreTotal, maxScore: maxScoreTotal, percentual }
}

// Função para calcular progresso da execução
export function calcularProgresso(execucao: ExecucaoData): ProgressoExecucao {
  let totalItens = 0
  let itensRespondidos = 0
  const secoesConcluidas: string[] = []
  
  execucao.respostas.secoes.forEach((secao: SecaoResposta) => {
    const itensSecao = secao.itens.length
    const respondidosSecao = secao.itens.filter((item: ItemResposta) => item.respondido).length
    
    totalItens += itensSecao
    itensRespondidos += respondidosSecao
    
    if (respondidosSecao === itensSecao) {
      secoesConcluidas.push(secao.secao_id)
    }
  })
  
  const percentualConcluido = totalItens > 0 ? (itensRespondidos / totalItens) * 100 : 0
  
  // Calcular tempo estimado restante
  const tempoDecorrido = Date.now() - new Date(execucao.iniciado_em).getTime()
  const tempoEstimadoRestante = percentualConcluido > 0 
    ? (tempoDecorrido / percentualConcluido) * (100 - percentualConcluido)
    : undefined
  
  return {
    total_itens: totalItens,
    itens_respondidos: itensRespondidos,
    percentual_concluido: percentualConcluido,
    secoes_concluidas: secoesConcluidas,
    tempo_estimado_restante: tempoEstimadoRestante
  }
}

// Função para validar respostas obrigatórias
export function validarRespostasObrigatorias(execucao: ExecucaoData): { valido: boolean; erros: string[] } {
  const erros: string[] = []
  
  execucao.respostas.secoes.forEach((secao: SecaoResposta) => {
    secao.itens.forEach((item: ItemResposta) => {
      if (item.obrigatorio && !item.respondido) {
        erros.push(`Item obrigatório não respondido: ${item.titulo}`)
      }
    })
  })
  
  return {
    valido: erros.length === 0,
    erros
  }
}

// Função para gerar relatório de execução
export function gerarRelatorioExecucao(execucao: ExecucaoData): Record<string, unknown> {
  const scoreTotal = calcularScoreTotal(execucao)
  const progresso = calcularProgresso(execucao)
  const validacao = validarRespostasObrigatorias(execucao)
  
  const relatorioSecoes = execucao.respostas.secoes.map((secao: SecaoResposta) => {
    const scoreSecao = calcularScoreSecao(secao)
    return {
      secao_id: secao.secao_id,
      titulo: secao.titulo,
      score: scoreSecao.score,
      maxScore: scoreSecao.maxScore,
      percentual: scoreSecao.percentual,
      peso: secao.peso || 1,
      itens: secao.itens.map((item: ItemResposta) => {
        const scoreItem = calcularScoreItem(item)
        return {
          item_id: item.item_id,
          titulo: item.titulo,
          tipo: item.tipo,
          obrigatorio: item.obrigatorio,
          respondido: item.respondido,
          score: scoreItem.score,
          maxScore: scoreItem.maxScore,
          percentual: scoreItem.percentual
        }
      })
    }
  })
  
  return {
    execucao_id: execucao.id,
    checklist_id: execucao.checklist_id,
    funcionario_id: execucao.funcionario_id,
    status: execucao.status,
    iniciado_em: execucao.iniciado_em,
    finalizado_em: execucao.finalizado_em,
    score_total: scoreTotal.score,
    score_maximo: scoreTotal.maxScore,
    percentual_total: scoreTotal.percentual,
    progresso: progresso,
    validacao: validacao,
    secoes: relatorioSecoes,
    tempo_total_minutos: execucao.tempo_total_minutos,
    observacoes: execucao.observacoes,
    observacoes_finais: execucao.observacoes_finais
  }
} 
