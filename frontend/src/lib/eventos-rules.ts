// Regras de negócio para eventos
export const EVENTOS_RULES = {
  // Médias M1 por dia da semana (segunda = 0, domingo = 6)
  MEDIA_M1_POR_DIA: {
    0: 4742.88,  // Segunda
    1: 0.00,     // Terça
    2: 33200.17, // Quarta
    3: 18971.53, // Quinta
    4: 58811.74, // Sexta
    5: 47428.82, // Sábado
    6: 58811.74  // Domingo
  },

  // Ticket médio planejado por dia da semana
  TE_PLAN_POR_DIA: {
    0: 18.00,    // Segunda
    1: 21.00,    // Terça
    2: 21.00,    // Quarta
    3: 21.00,    // Quinta
    4: 21.00,    // Sexta
    5: 21.00,    // Sábado
    6: 21.00     // Domingo
  },

  // Ticket bebida planejado por dia da semana
  TB_PLAN_POR_DIA: {
    0: 82.50,    // Segunda
    1: 75.00,    // Terça
    2: 75.00,    // Quarta
    3: 75.00,    // Quinta
    4: 82.50,    // Sexta
    5: 82.50,    // Sábado
    6: 87.50     // Domingo
  },

  // Categorias Nibo para custos
  NIBO_CATEGORIAS: {
    PRODUCAO_EVENTOS: 'Produção Eventos',
    ATRACOES_PROGRAMACAO: 'Atrações Programação'
  },

  // Padrões de data para busca na descrição
  DATA_PATTERNS: [
    /(\d{1,2})\/(\d{1,2})/,  // 13/07
    /(\d{1,2})\.(\d{1,2})/   // 13.07
  ]
}

// Função para obter dia da semana (0 = segunda, 6 = domingo)
export function getDiaSemana(data: Date): number {
  const dia = data.getDay()
  return dia === 0 ? 6 : dia - 1 // Converte domingo de 0 para 6
}

// Função para obter média M1 baseada na data
export function getMediaM1(data: Date): number {
  const diaSemana = getDiaSemana(data)
  return EVENTOS_RULES.MEDIA_M1_POR_DIA[diaSemana] || 0
}

// Função para obter ticket médio planejado baseado na data
export function getTePlan(data: Date): number {
  const diaSemana = getDiaSemana(data)
  return EVENTOS_RULES.TE_PLAN_POR_DIA[diaSemana] || 21.00
}

// Função para obter ticket bebida planejado baseado na data
export function getTbPlan(data: Date): number {
  const diaSemana = getDiaSemana(data)
  return EVENTOS_RULES.TB_PLAN_POR_DIA[diaSemana] || 75.00
}

// Função para extrair data da descrição
export function extrairDataDaDescricao(descricao: string): Date | null {
  for (const pattern of EVENTOS_RULES.DATA_PATTERNS) {
    const match = descricao.match(pattern)
    if (match) {
      const dia = parseInt(match[1])
      const mes = parseInt(match[2])
      
      // Assumindo ano atual
      const ano = new Date().getFullYear()
      const data = new Date(ano, mes - 1, dia)
      
      // Se a data já passou, assume próximo ano
      if (data < new Date()) {
        data.setFullYear(ano + 1)
      }
      
      return data
    }
  }
  return null
}

// Função para calcular percentual artista sobre faturamento
export function calcularPercentArtFat(custoArtistico: number, custoProducao: number, faturamentoReal: number): number {
  if (faturamentoReal <= 0) return 0
  
  // CORREÇÃO: Considerar apenas custo artístico (não produção) para o percentual
  // A produção faz parte dos custos operacionais, não do custo do artista sobre faturamento
  return (custoArtistico / faturamentoReal) * 100
}

// Interface para dados de custos do Nibo
export interface CustosNibo {
  custoArtistico: number
  custoProducao: number
}

// Função para buscar custos no Nibo
export async function buscarCustosNibo(dataEvento: Date, barId: number): Promise<CustosNibo> {
  // CORREÇÃO: Usar data_competencia em vez de buscar na descrição
  const dataCompetencia = dataEvento.toISOString().split('T')[0] // YYYY-MM-DD
  
  // Buscar custos de produção
  const custoProducao = await buscarCustosPorDataCompetencia(
    EVENTOS_RULES.NIBO_CATEGORIAS.PRODUCAO_EVENTOS,
    dataCompetencia,
    barId
  )
  
  // Buscar custos artísticos
  const custoArtistico = await buscarCustosPorDataCompetencia(
    EVENTOS_RULES.NIBO_CATEGORIAS.ATRACOES_PROGRAMACAO,
    dataCompetencia,
    barId
  )
  
  return {
    custoArtistico,
    custoProducao
  }
}

// Função auxiliar para buscar custos por data de competência
async function buscarCustosPorDataCompetencia(categoria: string, dataCompetencia: string, barId: number): Promise<number> {
  // Esta função será implementada na Edge Function
  // Por enquanto retorna 0
  return 0
} 