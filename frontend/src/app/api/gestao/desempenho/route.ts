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

// Função para gerar dados mockados baseados na planilha
function gerarDadosMockados(): IndicadorDesempenho[] {
  return [
  {
    "id": "faturamento-total",
    "categoria": "guardrail",
    "nome": "Faturamento Total",
    "descricao": "Faturamento Total - guardrail",
    "unidade": "R$",
    "meta": 930000,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 291813.33,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 306345.54,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 274440.95,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 941632.44,
          "meta": 930000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 1004578.16,
          "meta": 930000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 758225.94,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 940171.17,
          "meta": 930000,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "faturamento-couvert",
    "categoria": "guardrail",
    "nome": "Faturamento Couvert",
    "descricao": "Faturamento Couvert - guardrail",
    "unidade": "R$",
    "meta": 160000,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 162737,
          "meta": 160000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 173723.5,
          "meta": 160000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 127429.95,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 175931.53,
          "meta": 160000,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "faturamento-bar",
    "categoria": "guardrail",
    "nome": "Faturamento Bar",
    "descricao": "Faturamento Bar - guardrail",
    "unidade": "R$",
    "meta": 690000,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 778895.44,
          "meta": 690000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 830854.66,
          "meta": 690000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 630795.99,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 764239.64,
          "meta": 690000,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "cmv-rs",
    "categoria": "guardrail",
    "nome": "CMV R$",
    "descricao": "CMV R$ - guardrail",
    "unidade": "R$",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 9657.42,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": -175.83,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": -2270.09,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 16517.9,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 37210.84,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": -46382.35,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": -151.76,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "ticket-medio-contahub",
    "categoria": "guardrail",
    "nome": "Ticket Médio ContaHub",
    "descricao": "Ticket Médio ContaHub - guardrail",
    "unidade": "R$",
    "meta": 93,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 99.21,
          "meta": 93,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 103.71,
          "meta": 93,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 103.47,
          "meta": 93,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 101.95,
          "meta": 93,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 101.66,
          "meta": 93,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 97.88,
          "meta": 93,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 91.32,
          "meta": 93,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "tm-entrada",
    "categoria": "guardrail",
    "nome": "TM Entrada",
    "descricao": "TM Entrada - guardrail",
    "unidade": "R$",
    "meta": 15.5,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 21.96,
          "meta": 15.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 19.03,
          "meta": 15.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 21.41,
          "meta": 15.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 15.5,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 20.82,
          "meta": 15.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 20.73,
          "meta": 15.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 16.99,
          "meta": 15.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 17.32,
          "meta": 15.5,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "tm-bar",
    "categoria": "guardrail",
    "nome": "TM Bar",
    "descricao": "TM Bar - guardrail",
    "unidade": "R$",
    "meta": 77.5,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 77.25,
          "meta": 77.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 84.69,
          "meta": 77.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 82.06,
          "meta": 77.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 77.5,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 81.14,
          "meta": 77.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 80.93,
          "meta": 77.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 80.89,
          "meta": 77.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 74,
          "meta": 77.5,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "cmv-limpo-percent",
    "categoria": "guardrail",
    "nome": "CMV Limpo %",
    "descricao": "CMV Limpo % - guardrail",
    "unidade": "%",
    "meta": 31,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 4.5,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": -0.1,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": -1.1,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 2.1,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 4.5,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": -7.4,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "cmv-global-real",
    "categoria": "guardrail",
    "nome": "CMV Global Real",
    "descricao": "CMV Global Real - guardrail",
    "unidade": "%",
    "meta": 27,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 3.3,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": -0.1,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": -0.8,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 1.8,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 3.7,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": -6.1,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "cmv-teorico",
    "categoria": "guardrail",
    "nome": "CMV Teórico",
    "descricao": "CMV Teórico - guardrail",
    "unidade": "%",
    "meta": 27,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 29.1,
          "meta": 27,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 28.9,
          "meta": 27,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 28.7,
          "meta": 27,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 29.1,
          "meta": 27,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 28.8,
          "meta": 27,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 30.8,
          "meta": 27,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "cmo-percent",
    "categoria": "guardrail",
    "nome": "CMO%",
    "descricao": "CMO% - guardrail",
    "unidade": "%",
    "meta": 23,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 12.2,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 12.6,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 14.6,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "atracao-faturamento",
    "categoria": "guardrail",
    "nome": "Atração/Faturamento",
    "descricao": "Atração/Faturamento - guardrail",
    "unidade": "%",
    "meta": 17,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 1.6,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 1.9,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 1.7,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "clientes-atendidos",
    "categoria": "ovt",
    "nome": "Clientes Atendidos",
    "descricao": "Clientes Atendidos - ovt",
    "unidade": "unidade",
    "meta": 10000,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 3077,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 2949,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 2718,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 8663,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 10135,
          "meta": 10000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 7789,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 10025,
          "meta": 10000,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "clientes-ativos",
    "categoria": "ovt",
    "nome": "Clientes Ativos",
    "descricao": "Clientes Ativos - ovt",
    "unidade": "unidade",
    "meta": 3000,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "reservas-totais",
    "categoria": "ovt",
    "nome": "Reservas Totais",
    "descricao": "Reservas Totais - ovt",
    "unidade": "unidade",
    "meta": 800,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 946,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 839,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 978,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 2712,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 3524,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 3486,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 2692,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "reservas-presentes",
    "categoria": "ovt",
    "nome": "Reservas Presentes",
    "descricao": "Reservas Presentes - ovt",
    "unidade": "unidade",
    "meta": 650,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 747,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 703,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 801,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 2236,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 2478,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 2738,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "qui-sab-dom",
    "categoria": "vendas",
    "nome": "QUI+SÁB+DOM",
    "descricao": "QUI+SÁB+DOM - vendas",
    "unidade": "R$",
    "meta": 141000,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 141000,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  }
]
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return authErrorResponse('Usuário não autenticado');
    }

    // Verificar se é admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Gerar dados mockados
    const indicadores = gerarDadosMockados()
    
    // Calcular resumo
    const resumo = {
      totalIndicadores: indicadores.length,
      acimaMeta: indicadores.filter(ind => 
        ind.dados.semanais.some(d => d.status === 'acima') ||
        ind.dados.mensais.some(d => d.status === 'acima')
      ).length,
      abaixoMeta: indicadores.filter(ind => 
        ind.dados.semanais.some(d => d.status === 'abaixo') ||
        ind.dados.mensais.some(d => d.status === 'abaixo')
      ).length,
      dentroMeta: indicadores.filter(ind => 
        ind.dados.semanais.some(d => d.status === 'dentro') ||
        ind.dados.mensais.some(d => d.status === 'dentro')
      ).length
    }

    const resposta: RespostaDesempenho = {
      indicadores,
      resumo
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
