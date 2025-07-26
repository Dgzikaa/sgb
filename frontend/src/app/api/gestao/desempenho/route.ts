import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

// Interfaces baseadas na planilha CSV
interface IndicadorDesempenho {
  id: string
  categoria: 'guardrail' | 'ovt' | 'qualidade' | 'produtos' | 'vendas' | 'marketing'
  nome: string
  descricao: string
  unidade: string
  meta?: number
  dados: {
    semanais: DadoSemanal[]
    mensais: DadoMensal[]
  }
}

interface DadoSemanal {
  semana: string
  valor: number
  meta?: number
  status: 'acima' | 'abaixo' | 'dentro'
  tendencia: 'crescendo' | 'decrescendo' | 'estavel'
}

interface DadoMensal {
  mes: string
  valor: number
  meta?: number
  status: 'acima' | 'abaixo' | 'dentro'
  tendencia: 'crescendo' | 'decrescendo' | 'estavel'
}

interface RespostaDesempenho {
  indicadores: IndicadorDesempenho[]
  resumo: {
    totalIndicadores: number
    acimaMeta: number
    abaixoMeta: number
    dentroMeta: number
  }
}

// Função para calcular status baseado na meta
function calcularStatus(valor: number, meta?: number): 'acima' | 'abaixo' | 'dentro' {
  if (!meta) return 'dentro'
  
  const tolerancia = meta * 0.05 // 5% de tolerância
  
  if (valor >= meta - tolerancia && valor <= meta + tolerancia) {
    return 'dentro'
  } else if (valor > meta + tolerancia) {
    return 'acima'
  } else {
    return 'abaixo'
  }
}

// Função para calcular tendência
function calcularTendencia(valores: number[]): 'crescendo' | 'decrescendo' | 'estavel' {
  if (valores.length < 2) return 'estavel'
  
  const ultimoValor = valores[valores.length - 1]
  const penultimoValor = valores[valores.length - 2]
  
  const diferenca = ultimoValor - penultimoValor
  const percentualDiferenca = Math.abs(diferenca) / penultimoValor
  
  if (percentualDiferenca < 0.05) return 'estavel' // menos de 5% de diferença
  
  return diferenca > 0 ? 'crescendo' : 'decrescendo'
}

// Dados corrigidos baseados no CSV
function gerarDadosCorrigidos(): IndicadorDesempenho[] {
  return [
    {
      id: "faturamento-total",
      categoria: "guardrail",
      nome: "Faturamento Total",
      descricao: "Faturamento total semanal e mensal",
      unidade: "R$",
      meta: 222000, // Meta semanal corrigida
      dados: {
        semanais: [
          { semana: "Semana 05", valor: 75314.54, status: "abaixo", tendencia: "estavel" },
          { semana: "Semana 06", valor: 75314.54, status: "abaixo", tendencia: "estavel" },
          { semana: "Semana 07", valor: 151226.00, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 08", valor: 180089.45, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 09", valor: 329574.73, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 10", valor: 241410.95, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 11", valor: 139217.99, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 12", valor: 238809.44, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 13", valor: 128591.38, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 14", valor: 242877.71, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 15", valor: 171070.14, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 16", valor: 282778.87, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 17", valor: 169775.55, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 18", valor: 221415.99, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 19", valor: 159472.19, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 20", valor: 147412.36, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 21", valor: 178423.96, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 22", valor: 188457.06, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 23", valor: 245583.76, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 24", valor: 210820.40, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 25", valor: 250704.99, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 26", valor: 219416.91, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 27", valor: 274440.95, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 28", valor: 306345.54, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 29", valor: 291813.33, status: "acima", tendencia: "decrescendo" }
        ],
        mensais: [
          { mes: "Fevereiro", valor: 525761.14, status: "abaixo", tendencia: "estavel" },
          { mes: "Março", valor: 968716.05, status: "acima", tendencia: "crescendo" },
          { mes: "Abril", valor: 940171.17, status: "acima", tendencia: "decrescendo" },
          { mes: "Maio", valor: 758225.94, status: "abaixo", tendencia: "decrescendo" },
          { mes: "Junho", valor: 1004578.16, status: "acima", tendencia: "crescendo" },
          { mes: "Julho", valor: 941632.44, status: "acima", tendencia: "decrescendo" }
        ]
      }
    },
    {
      id: "faturamento-couvert",
      categoria: "guardrail",
      nome: "Faturamento Couvert",
      descricao: "Faturamento de couvert semanal e mensal",
      unidade: "R$",
      meta: 38000, // Meta semanal corrigida
      dados: {
        semanais: [
          { semana: "Semana 05", valor: 0.00, status: "abaixo", tendencia: "estavel" },
          { semana: "Semana 06", valor: 11615.00, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 07", valor: 25990.00, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 08", valor: 32770.00, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 09", valor: 15250.00, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 10", valor: 8805.00, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 11", valor: 24840.00, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 12", valor: 36900.00, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 13", valor: 23430.00, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 14", valor: 46406.32, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 15", valor: 31700.00, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 16", valor: 59605.29, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 17", valor: 33377.12, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 18", valor: 41590.66, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 19", valor: 27999.86, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 20", valor: 20310.00, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 21", valor: 29949.43, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 22", valor: 28576.50, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 23", valor: 44084.00, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 24", valor: 40017.00, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 25", valor: 48681.00, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 26", valor: 45891.00, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 27", valor: 52780.00, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 28", valor: 52168.00, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 29", valor: 59289.00, status: "acima", tendencia: "crescendo" }
        ],
        mensais: [
          { mes: "Fevereiro", valor: 85625.00, status: "acima", tendencia: "estavel" },
          { mes: "Março", valor: 173291.32, status: "acima", tendencia: "crescendo" },
          { mes: "Abril", valor: 175931.53, status: "acima", tendencia: "crescendo" },
          { mes: "Maio", valor: 127429.95, status: "acima", tendencia: "decrescendo" },
          { mes: "Junho", valor: 173723.50, status: "acima", tendencia: "crescendo" },
          { mes: "Julho", valor: 162737.00, status: "acima", tendencia: "decrescendo" }
        ]
      }
    },
    {
      id: "faturamento-bar",
      categoria: "guardrail",
      nome: "Faturamento Bar",
      descricao: "Faturamento do bar semanal e mensal",
      unidade: "R$",
      meta: 184000, // Meta semanal corrigida
      dados: {
        semanais: [
          { semana: "Semana 05", valor: 75314.54, status: "abaixo", tendencia: "estavel" },
          { semana: "Semana 06", valor: 63699.54, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 07", valor: 125236.00, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 08", valor: 147319.45, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 09", valor: 314324.73, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 10", valor: 232605.95, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 11", valor: 114377.99, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 12", valor: 201909.44, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 13", valor: 105161.38, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 14", valor: 196471.39, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 15", valor: 139370.14, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 16", valor: 223173.58, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 17", valor: 136398.43, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 18", valor: 179825.33, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 19", valor: 131472.33, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 20", valor: 127102.36, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 21", valor: 148474.53, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 22", valor: 159880.56, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 23", valor: 201499.76, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 24", valor: 170803.40, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 25", valor: 202023.99, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 26", valor: 173525.91, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 27", valor: 221660.95, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 28", valor: 254177.54, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 29", valor: 232524.33, status: "acima", tendencia: "decrescendo" }
        ],
        mensais: [
          { mes: "Fevereiro", valor: 440136.14, status: "abaixo", tendencia: "estavel" },
          { mes: "Março", valor: 795424.73, status: "acima", tendencia: "crescendo" },
          { mes: "Abril", valor: 764239.64, status: "acima", tendencia: "decrescendo" },
          { mes: "Maio", valor: 630795.99, status: "abaixo", tendencia: "decrescendo" },
          { mes: "Junho", valor: 830854.66, status: "acima", tendencia: "crescendo" },
          { mes: "Julho", valor: 778895.44, status: "acima", tendencia: "decrescendo" }
        ]
      }
    },
    {
      id: "ticket-medio-contahub",
      categoria: "guardrail",
      nome: "Ticket Médio ContaHub",
      descricao: "Ticket médio do ContaHub",
      unidade: "R$",
      meta: 93.00,
      dados: {
        semanais: [
          { semana: "Semana 05", valor: 99.11, status: "acima", tendencia: "estavel" },
          { semana: "Semana 06", valor: 89.70, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 07", valor: 95.31, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 08", valor: 91.67, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 09", valor: 93.08, status: "dentro", tendencia: "crescendo" },
          { semana: "Semana 10", valor: 84.77, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 11", valor: 88.48, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 12", valor: 88.32, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 13", valor: 86.48, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 14", valor: 92.45, status: "dentro", tendencia: "crescendo" },
          { semana: "Semana 15", valor: 89.58, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 16", valor: 91.92, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 17", valor: 90.81, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 18", valor: 93.21, status: "dentro", tendencia: "crescendo" },
          { semana: "Semana 19", valor: 88.36, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 20", valor: 102.88, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 21", valor: 106.43, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 22", valor: 98.92, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 23", valor: 97.56, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 24", valor: 102.45, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 25", valor: 106.49, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 26", valor: 98.36, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 27", valor: 103.47, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 28", valor: 103.71, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 29", valor: 99.21, status: "acima", tendencia: "decrescendo" }
        ],
        mensais: [
          { mes: "Fevereiro", valor: 93.03, status: "dentro", tendencia: "estavel" },
          { mes: "Março", valor: 87.50, status: "abaixo", tendencia: "decrescendo" },
          { mes: "Abril", valor: 91.32, status: "abaixo", tendencia: "crescendo" },
          { mes: "Maio", valor: 97.88, status: "acima", tendencia: "crescendo" },
          { mes: "Junho", valor: 101.66, status: "acima", tendencia: "crescendo" },
          { mes: "Julho", valor: 101.95, status: "acima", tendencia: "crescendo" }
        ]
      }
    },
    {
      id: "tm-entrada",
      categoria: "guardrail",
      nome: "TM Entrada",
      descricao: "Ticket médio de entrada",
      unidade: "R$",
      meta: 15.50,
      dados: {
        semanais: [
          { semana: "Semana 05", valor: 0.00, status: "abaixo", tendencia: "estavel" },
          { semana: "Semana 06", valor: 13.68, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 07", valor: 16.00, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 08", valor: 16.41, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 09", valor: 12.96, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 10", valor: 14.75, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 11", valor: 15.73, status: "dentro", tendencia: "crescendo" },
          { semana: "Semana 12", valor: 18.34, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 13", valor: 15.72, status: "dentro", tendencia: "decrescendo" },
          { semana: "Semana 14", valor: 16.85, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 15", valor: 16.56, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 16", valor: 18.01, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 17", valor: 17.46, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 18", valor: 17.92, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 19", valor: 16.68, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 20", valor: 15.68, status: "dentro", tendencia: "decrescendo" },
          { semana: "Semana 21", valor: 17.61, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 22", valor: 17.57, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 23", valor: 19.61, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 24", valor: 19.45, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 25", valor: 21.94, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 26", valor: 21.85, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 27", valor: 21.41, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 28", valor: 19.03, status: "acima", tendencia: "decrescendo" },
          { semana: "Semana 29", valor: 21.96, status: "acima", tendencia: "crescendo" }
        ],
        mensais: [
          { mes: "Fevereiro", valor: 14.90, status: "abaixo", tendencia: "estavel" },
          { mes: "Março", valor: 16.55, status: "acima", tendencia: "crescendo" },
          { mes: "Abril", valor: 17.32, status: "acima", tendencia: "crescendo" },
          { mes: "Maio", valor: 16.99, status: "acima", tendencia: "decrescendo" },
          { mes: "Junho", valor: 20.73, status: "acima", tendencia: "crescendo" },
          { mes: "Julho", valor: 20.82, status: "acima", tendencia: "crescendo" }
        ]
      }
    },
    {
      id: "clientes-atendidos",
      categoria: "ovt",
      nome: "Clientes Atendidos",
      descricao: "Número de clientes atendidos",
      unidade: "",
      meta: 2645,
      dados: {
        semanais: [
          { semana: "Semana 05", valor: 133, status: "abaixo", tendencia: "estavel" },
          { semana: "Semana 06", valor: 849, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 07", valor: 1624, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 08", valor: 1997, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 09", valor: 1177, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 10", valor: 597, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 11", valor: 1579, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 12", valor: 2012, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 13", valor: 1490, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 14", valor: 2540, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 15", valor: 1914, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 16", valor: 2788, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 17", valor: 1960, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 18", valor: 2401, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 19", valor: 1794, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 20", valor: 1459, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 21", valor: 1668, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 22", valor: 2036, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 23", valor: 2489, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 24", valor: 2200, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 25", valor: 2294, status: "abaixo", tendencia: "crescendo" },
          { semana: "Semana 26", valor: 2245, status: "abaixo", tendencia: "decrescendo" },
          { semana: "Semana 27", valor: 2718, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 28", valor: 2949, status: "acima", tendencia: "crescendo" },
          { semana: "Semana 29", valor: 3077, status: "acima", tendencia: "crescendo" }
        ],
        mensais: [
          { mes: "Fevereiro", valor: 5747, status: "acima", tendencia: "estavel" },
          { mes: "Março", valor: 9794, status: "acima", tendencia: "crescendo" },
          { mes: "Abril", valor: 10025, status: "acima", tendencia: "crescendo" },
          { mes: "Maio", valor: 7789, status: "acima", tendencia: "decrescendo" },
          { mes: "Junho", valor: 10135, status: "acima", tendencia: "crescendo" },
          { mes: "Julho", valor: 8663, status: "acima", tendencia: "decrescendo" }
        ]
      }
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    // Autenticação
    const authResult = await authenticateUser(request)
    if (!authResult) {
      return authErrorResponse('Não autenticado')
    }

    // Gerar dados corrigidos
    const indicadores = gerarDadosCorrigidos()

    // Calcular resumo
    let acimaMeta = 0
    let abaixoMeta = 0
    let dentroMeta = 0

    indicadores.forEach(indicador => {
      if (indicador.meta) {
        const ultimoSemanal = indicador.dados.semanais[indicador.dados.semanais.length - 1]
        if (ultimoSemanal) {
          switch (ultimoSemanal.status) {
            case 'acima':
              acimaMeta++
              break
            case 'abaixo':
              abaixoMeta++
              break
            case 'dentro':
              dentroMeta++
              break
          }
        }
      }
    })

    const resposta: RespostaDesempenho = {
      indicadores,
      resumo: {
        totalIndicadores: indicadores.length,
        acimaMeta,
        abaixoMeta,
        dentroMeta
      }
    }

    return NextResponse.json(resposta)

  } catch (error) {
    console.error('Erro na API de desempenho:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 