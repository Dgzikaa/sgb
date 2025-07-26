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
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
          "valor": 54,
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
          "semana": "Semana 09",
          "valor": 54,
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
          "valor": 45,
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
          "semana": "Semana 15",
          "valor": 73,
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
          "semana": "Semana 17",
          "valor": 95,
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
          "semana": "Semana 19",
          "valor": 99,
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
          "semana": "Semana 21",
          "valor": 44,
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
          "semana": "Semana 23",
          "valor": 38,
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
          "semana": "Semana 25",
          "valor": 71,
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
          "semana": "Semana 27",
          "valor": 14,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 87,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 99,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 19,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 36,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
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
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
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
          "semana": "Semana 21",
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
          "semana": "Semana 23",
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
          "semana": "Semana 25",
          "valor": 32,
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
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 29,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 66,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 86,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
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
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
          "valor": 54,
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
          "semana": "Semana 09",
          "valor": 54,
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
          "valor": 45,
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
          "semana": "Semana 15",
          "valor": 73,
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
          "semana": "Semana 17",
          "valor": 95,
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
          "semana": "Semana 19",
          "valor": 99,
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
          "semana": "Semana 21",
          "valor": 44,
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
          "semana": "Semana 23",
          "valor": 38,
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
          "semana": "Semana 25",
          "valor": 39,
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
          "semana": "Semana 27",
          "valor": 14,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 58,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 33,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 33,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 36,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 96,
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
          "semana": "Semana 08",
          "valor": 16,
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
          "semana": "Semana 10",
          "valor": 72,
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
          "semana": "Semana 12",
          "valor": 28,
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
          "semana": "Semana 14",
          "valor": 99,
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
          "semana": "Semana 16",
          "valor": 64,
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
          "semana": "Semana 18",
          "valor": 17,
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
          "semana": "Semana 20",
          "valor": 53,
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
          "semana": "Semana 22",
          "valor": 59,
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
          "semana": "Semana 24",
          "valor": 60,
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
          "semana": "Semana 26",
          "valor": 46,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 1,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 98,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 32,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 60,
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
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
          "valor": 11,
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
          "semana": "Semana 09",
          "valor": 70,
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
          "semana": "Semana 11",
          "valor": 31,
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
          "semana": "Semana 13",
          "valor": 67,
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
          "semana": "Semana 15",
          "valor": 8,
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
          "semana": "Semana 17",
          "valor": 77,
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
          "semana": "Semana 19",
          "valor": 48,
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
          "semana": "Semana 21",
          "valor": 32,
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
          "semana": "Semana 23",
          "valor": 48,
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
          "semana": "Semana 25",
          "valor": 45,
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
          "semana": "Semana 27",
          "valor": 58,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 92,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 21,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 36,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 88,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
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
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 50,
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
          "valor": 68,
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
          "valor": 41,
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
          "semana": "Semana 15",
          "valor": 96,
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
          "semana": "Semana 17",
          "valor": 75,
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
          "semana": "Semana 19",
          "valor": 73,
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
          "semana": "Semana 21",
          "valor": 34,
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
          "semana": "Semana 23",
          "valor": 72,
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
          "semana": "Semana 25",
          "valor": 85,
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
          "semana": "Semana 27",
          "valor": 56,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 1,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 92,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 68,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 68,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
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
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 50,
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
          "semana": "Semana 07",
          "valor": 11,
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
          "semana": "Semana 09",
          "valor": 2,
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
          "semana": "Semana 11",
          "valor": 31,
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
          "semana": "Semana 13",
          "valor": 26,
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
          "semana": "Semana 15",
          "valor": 12,
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
          "semana": "Semana 17",
          "valor": 2,
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
          "semana": "Semana 19",
          "valor": 75,
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
          "semana": "Semana 21",
          "valor": 98,
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
          "semana": "Semana 23",
          "valor": 75,
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
          "semana": "Semana 25",
          "valor": 59,
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
          "semana": "Semana 27",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 91,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 29,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 68,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 20,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
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
    "unidade": "unidade",
    "meta": 31,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
          "valor": 6,
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
          "semana": "Semana 11",
          "valor": 7,
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
          "semana": "Semana 13",
          "valor": 2,
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
          "semana": "Semana 15",
          "valor": 5,
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
          "semana": "Semana 17",
          "valor": 1,
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
          "semana": "Semana 19",
          "valor": 9,
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
          "semana": "Semana 21",
          "valor": 7,
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
          "semana": "Semana 23",
          "valor": 9,
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
          "semana": "Semana 25",
          "valor": 4,
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
          "semana": "Semana 27",
          "valor": 6,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 2,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 9,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 7,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
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
    "unidade": "unidade",
    "meta": 27,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
          "valor": 1,
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
          "semana": "Semana 09",
          "valor": 5,
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
          "semana": "Semana 11",
          "valor": 3,
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
          "semana": "Semana 13",
          "valor": 6,
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
          "semana": "Semana 15",
          "valor": 5,
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
          "semana": "Semana 17",
          "valor": 2,
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
          "semana": "Semana 19",
          "valor": 6,
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
          "semana": "Semana 21",
          "valor": 9,
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
          "semana": "Semana 23",
          "valor": 1,
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
          "semana": "Semana 25",
          "valor": 8,
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
          "semana": "Semana 27",
          "valor": 7,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 7,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 3,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 9,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
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
    "unidade": "unidade",
    "meta": 29,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 4,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 1,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 1,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 1,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 4,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 1,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 4,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 7,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 1,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 8,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 2,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 2,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 8,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "retencao",
    "categoria": "ovt",
    "nome": "Retenção",
    "descricao": "Retenção - ovt",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
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
          "semana": "Semana 21",
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
          "semana": "Semana 23",
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
          "semana": "Semana 25",
          "valor": 0,
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
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
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
    "meta": 2645,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 133,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 849,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 1624,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 1997,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 1177,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 597,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 1579,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 2012,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 1490,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 2540,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 1914,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 2788,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 1960,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 2401,
          "meta": 2645,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 1794,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 1459,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 1668,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 2036,
          "meta": 2645,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 2489,
          "meta": 2645,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 2200,
          "meta": 2645,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 2294,
          "meta": 2645,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 2245,
          "meta": 2645,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 2718,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 2949,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 3077,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 5747,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 9794,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 10025,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 7789,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 10135,
          "meta": 2645,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 8663,
          "meta": 2645,
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
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
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
          "semana": "Semana 21",
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
          "semana": "Semana 23",
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
          "semana": "Semana 25",
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
          "semana": "Semana 27",
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
          "semana": "Semana 29",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 3000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
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
        },
        {
          "mes": "Maio",
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
          "mes": "Julho",
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
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 788,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 580,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 638,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 521,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 571,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 644,
          "meta": 800,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 760,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 870,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 806,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 771,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 837,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 1044,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 808,
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
          "semana": "Semana 28",
          "valor": 839,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 946,
          "meta": 800,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 800,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 1586,
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
        },
        {
          "mes": "Maio",
          "valor": 3486,
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
          "mes": "Julho",
          "valor": 2712,
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
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
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
          "semana": "Semana 21",
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
          "semana": "Semana 23",
          "valor": 608,
          "meta": 650,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 578,
          "meta": 650,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 650,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 622,
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
          "semana": "Semana 28",
          "valor": 703,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 747,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 650,
          "status": "abaixo",
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
          "mes": "Junho",
          "valor": 2478,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 2236,
          "meta": 650,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "avaliacoes-5-google",
    "categoria": "qualidade",
    "nome": "Avaliações 5 Google/Trip",
    "descricao": "Avaliações 5 Google/Trip - qualidade",
    "unidade": "estrelas",
    "meta": 75,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 43,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 74,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 35,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 60,
          "meta": 75,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 10,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 172,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 163,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 53,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 23,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 19,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 29,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 73,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 152,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 87,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 58,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 109,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 129,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 127,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 58,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 96,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 55,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 87,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 70,
          "meta": 75,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 226,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 193,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 417,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 142,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 528,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 369,
          "meta": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "media-avaliacoes-google",
    "categoria": "qualidade",
    "nome": "Média Avaliações Google",
    "descricao": "Média Avaliações Google - qualidade",
    "unidade": "estrelas",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 8,
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 92,
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
          "semana": "Semana 12",
          "valor": 29,
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
          "semana": "Semana 14",
          "valor": 97,
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
          "semana": "Semana 16",
          "valor": 23,
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
          "semana": "Semana 18",
          "valor": 92,
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
          "semana": "Semana 20",
          "valor": 92,
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
          "semana": "Semana 22",
          "valor": 95,
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
          "semana": "Semana 24",
          "valor": 63,
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
          "semana": "Semana 26",
          "valor": 82,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 77,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 87,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 69,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 94,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-geral",
    "categoria": "qualidade",
    "nome": "NPS Geral",
    "descricao": "NPS Geral - qualidade",
    "unidade": "estrelas",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 87,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 90,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 91,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-ambiente",
    "categoria": "qualidade",
    "nome": "NPS Ambiente",
    "descricao": "NPS Ambiente - qualidade",
    "unidade": "estrelas",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 88,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 86,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 88,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 86,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-atendimento",
    "categoria": "qualidade",
    "nome": "NPS Atendimento",
    "descricao": "NPS Atendimento - qualidade",
    "unidade": "estrelas",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 94,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 85,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 88,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 80,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-limpeza",
    "categoria": "qualidade",
    "nome": "NPS Limpeza",
    "descricao": "NPS Limpeza - qualidade",
    "unidade": "estrelas",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 68,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 78,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 81,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 82,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-musica",
    "categoria": "qualidade",
    "nome": "NPS Música",
    "descricao": "NPS Música - qualidade",
    "unidade": "estrelas",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 94,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 85,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 93,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 86,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-comida",
    "categoria": "qualidade",
    "nome": "NPS Comida",
    "descricao": "NPS Comida - qualidade",
    "unidade": "estrelas",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 68,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 71,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 86,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 75,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-drink",
    "categoria": "qualidade",
    "nome": "NPS Drink",
    "descricao": "NPS Drink - qualidade",
    "unidade": "estrelas",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 72,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 79,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 85,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 77,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-preco",
    "categoria": "qualidade",
    "nome": "NPS Preço",
    "descricao": "NPS Preço - qualidade",
    "unidade": "estrelas",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 79,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 44,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 65,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 51,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-reservas",
    "categoria": "qualidade",
    "nome": "NPS Reservas",
    "descricao": "NPS Reservas - qualidade",
    "unidade": "estrelas",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 5,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 92,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 29,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 97,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 23,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 92,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 92,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 95,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 63,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 82,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 75,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 83,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 100,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 100,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 78,
          "meta": 70,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-felicidade-equipe",
    "categoria": "qualidade",
    "nome": "NPS Felicidade Equipe",
    "descricao": "NPS Felicidade Equipe - qualidade",
    "unidade": "estrelas",
    "meta": 60,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 944,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 7833,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 86,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 3,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 2,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 12,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 76,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 87,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 70,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 81,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 72,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 79,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 84,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 60,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "stockout-comidas",
    "categoria": "produtos",
    "nome": "StockOut Comidas",
    "descricao": "StockOut Comidas - produtos",
    "unidade": "unidade",
    "meta": 3,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 6,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 2,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 7,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 3,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 8,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 6,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "stockout-drinks",
    "categoria": "produtos",
    "nome": "StockOut Drinks",
    "descricao": "StockOut Drinks - produtos",
    "unidade": "unidade",
    "meta": 3,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 2,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 2,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 2,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 7,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 7,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 5,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 1,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 6,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 4,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 7,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 7,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "stockout-bar",
    "categoria": "produtos",
    "nome": "Stockout Bar",
    "descricao": "Stockout Bar - produtos",
    "unidade": "unidade",
    "meta": 1,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 3,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 3,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 6,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 4,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 9,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 2,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 9,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 1,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 2,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 6,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 6,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 5,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 3,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 3,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "percent-bebidas",
    "categoria": "produtos",
    "nome": "% BEBIDAS",
    "descricao": "% BEBIDAS - produtos",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 2,
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
          "semana": "Semana 08",
          "valor": 6,
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
          "semana": "Semana 10",
          "valor": 8,
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
          "semana": "Semana 12",
          "valor": 7,
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
          "semana": "Semana 14",
          "valor": 2,
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
          "semana": "Semana 16",
          "valor": 6,
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
          "semana": "Semana 18",
          "valor": 6,
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
          "semana": "Semana 20",
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
          "semana": "Semana 22",
          "valor": 9,
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
          "semana": "Semana 24",
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
          "semana": "Semana 26",
          "valor": 9,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 1,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "percent-drinks",
    "categoria": "produtos",
    "nome": "% DRINKS",
    "descricao": "% DRINKS - produtos",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 5,
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
          "semana": "Semana 08",
          "valor": 9,
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
          "semana": "Semana 10",
          "valor": 3,
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
          "semana": "Semana 12",
          "valor": 2,
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
          "semana": "Semana 14",
          "valor": 9,
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
          "semana": "Semana 16",
          "valor": 5,
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
          "semana": "Semana 18",
          "valor": 5,
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
          "semana": "Semana 20",
          "valor": 8,
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
          "semana": "Semana 22",
          "valor": 1,
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
          "semana": "Semana 24",
          "valor": 7,
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
          "semana": "Semana 26",
          "valor": 6,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 4,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "percent-comida",
    "categoria": "produtos",
    "nome": "% COMIDA",
    "descricao": "% COMIDA - produtos",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 2,
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
          "semana": "Semana 08",
          "valor": 5,
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
          "semana": "Semana 10",
          "valor": 9,
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
          "semana": "Semana 12",
          "valor": 1,
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
          "semana": "Semana 14",
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
          "semana": "Semana 16",
          "valor": 9,
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
          "semana": "Semana 18",
          "valor": 9,
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
          "semana": "Semana 20",
          "valor": 3,
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
          "semana": "Semana 22",
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
          "semana": "Semana 24",
          "valor": 3,
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
          "semana": "Semana 26",
          "valor": 5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 9,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 4,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 1,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 7,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "percent-happyhour",
    "categoria": "produtos",
    "nome": "% HappyHour",
    "descricao": "% HappyHour - produtos",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 3,
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
          "semana": "Semana 08",
          "valor": 3,
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
          "semana": "Semana 10",
          "valor": 5,
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
          "semana": "Semana 12",
          "valor": 4,
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
          "semana": "Semana 14",
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
          "semana": "Semana 16",
          "valor": 7,
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
          "semana": "Semana 18",
          "valor": 7,
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
          "semana": "Semana 20",
          "valor": 2,
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
          "semana": "Semana 22",
          "valor": 5,
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
          "semana": "Semana 24",
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
          "semana": "Semana 26",
          "valor": 3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "qtde-itens-bar",
    "categoria": "produtos",
    "nome": "Qtde Itens Bar",
    "descricao": "Qtde Itens Bar - produtos",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 673,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 1531,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 1622,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 885,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 572,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 1215,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 1437,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 1121,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 1359,
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
          "semana": "Semana 17",
          "valor": 1245,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 1367,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 1181,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 1216,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 1191,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 1122,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 1501,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 1357,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 1449,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 1056,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 1721,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 1725,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 1490,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 4872,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 4350,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 3024,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 5644,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 5532,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 4785,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "tempo-saida-bar",
    "categoria": "produtos",
    "nome": "Tempo Saída Bar",
    "descricao": "Tempo Saída Bar - produtos",
    "unidade": "min",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
          "valor": 4,
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
          "semana": "Semana 11",
          "valor": 4,
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
          "semana": "Semana 13",
          "valor": 1,
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
          "semana": "Semana 15",
          "valor": 8,
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
          "semana": "Semana 17",
          "valor": 8,
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
          "semana": "Semana 19",
          "valor": 3,
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
          "semana": "Semana 21",
          "valor": 5,
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
          "semana": "Semana 23",
          "valor": 2,
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
          "semana": "Semana 25",
          "valor": 2,
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
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 1,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 1,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "qtde-itens-cozinha",
    "categoria": "produtos",
    "nome": "Qtde Itens Cozinha",
    "descricao": "Qtde Itens Cozinha - produtos",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 630,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 945,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 934,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 720,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 542,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 676,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 840,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 736,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 45,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 787,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 4,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 577,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 696,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 589,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 657,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 593,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 551,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 687,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 642,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 714,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 601,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 910,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 706,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 784,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 3134,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 2992,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 1692,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 2743,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 2830,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 2278,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "tempo-saida-cozinha",
    "categoria": "produtos",
    "nome": "Tempo Saída Cozinha",
    "descricao": "Tempo Saída Cozinha - produtos",
    "unidade": "min",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
          "valor": 7,
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
          "semana": "Semana 11",
          "valor": 5,
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
          "semana": "Semana 13",
          "valor": 9,
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
          "semana": "Semana 15",
          "valor": 4,
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
          "semana": "Semana 17",
          "valor": 4,
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
          "semana": "Semana 19",
          "valor": 6,
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
          "semana": "Semana 21",
          "valor": 6,
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
          "semana": "Semana 23",
          "valor": 5,
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
          "semana": "Semana 25",
          "valor": 1,
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
          "semana": "Semana 27",
          "valor": 1,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 6,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 4,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "percent-faturamento-19h",
    "categoria": "vendas",
    "nome": "% Faturamento até 19h",
    "descricao": "% Faturamento até 19h - vendas",
    "unidade": "unidade",
    "meta": 15,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 2,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 9,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 8,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 2,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 5,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 2,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 3,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 5,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 8,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 9,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "venda-balcao",
    "categoria": "vendas",
    "nome": "Venda Balcão",
    "descricao": "Venda Balcão - vendas",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
          "valor": 40,
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
          "semana": "Semana 11",
          "valor": 11,
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
          "semana": "Semana 13",
          "valor": 70,
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
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
          "semana": "Semana 21",
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
          "semana": "Semana 23",
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
          "semana": "Semana 25",
          "valor": 0,
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
          "semana": "Semana 27",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 77,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 90,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "couvert-atracoes",
    "categoria": "vendas",
    "nome": "Couvert / Atrações",
    "descricao": "Couvert / Atrações - vendas",
    "unidade": "unidade",
    "meta": 112,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 112,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 2232,
          "meta": 112,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 2454,
          "meta": 112,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 1694,
          "meta": 112,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 1430,
          "meta": 112,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 1490,
          "meta": 112,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 1396,
          "meta": 112,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-num-posts",
    "categoria": "marketing",
    "nome": "[O] Nº de Posts",
    "descricao": "[O] Nº de Posts - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 4,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 8,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 14,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 13,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 13,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 11,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-alcance",
    "categoria": "marketing",
    "nome": "[O] Alcance",
    "descricao": "[O] Alcance - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 20848,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 29914,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 15390,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 19958,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 35845,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 15078,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 32604,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 18492,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 38461,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 17823,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 11488,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 10956,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 140498,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 139185,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 138831,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 112049,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 111648,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-interacao",
    "categoria": "marketing",
    "nome": "[O] Interação",
    "descricao": "[O] Interação - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 1083,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 2124,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 918,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 1171,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 1404,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 958,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 2206,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 787,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 1697,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 1320,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 341,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 650,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 10157,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 5345,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 8187,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 6302,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 5455,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-compartilhamento",
    "categoria": "marketing",
    "nome": "[O] Compartilhamento",
    "descricao": "[O] Compartilhamento - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 271,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 609,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 261,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 503,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 288,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 153,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 443,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 228,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 416,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 256,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 118,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 202,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 3299,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 1503,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 2739,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 1885,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 954,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-engajamento",
    "categoria": "marketing",
    "nome": "[O] Engajamento",
    "descricao": "[O] Engajamento - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
          "valor": 2,
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
          "semana": "Semana 21",
          "valor": 1,
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
          "semana": "Semana 23",
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
          "semana": "Semana 25",
          "valor": 9,
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
          "semana": "Semana 27",
          "valor": 9,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 4,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 4,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 4,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-num-stories",
    "categoria": "marketing",
    "nome": "[O] Nº Stories",
    "descricao": "[O] Nº Stories - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 29,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 26,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 49,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 23,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 70,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 81,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 74,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 77,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 46,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 56,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 59,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 71,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 187,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 250,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 230,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 171,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 301,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-visu-stories",
    "categoria": "marketing",
    "nome": "[O] Visu Stories",
    "descricao": "[O] Visu Stories - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 57216,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 40219,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 67777,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 38755,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 88203,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 122055,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 106153,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 115077,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 65623,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 78287,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 96596,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 113473,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 111441,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 249088,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 450659,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-valor-investido",
    "categoria": "marketing",
    "nome": "[M] Valor Investido",
    "descricao": "[M] Valor Investido - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
          "valor": 49,
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
          "semana": "Semana 21",
          "valor": 61,
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
          "semana": "Semana 23",
          "valor": 54,
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
          "semana": "Semana 25",
          "valor": 61,
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
          "semana": "Semana 27",
          "valor": 48,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 51,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 65,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 76,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 43,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-alcance",
    "categoria": "marketing",
    "nome": "[M] Alcance",
    "descricao": "[M] Alcance - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 312069,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 289953,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 333013,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 216013,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 218562,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 322095,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 316758,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 232227,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 233585,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 168873,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 176549,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 167827,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 518720,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 614549,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 653886,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 647709,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 609604,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-frequencia",
    "categoria": "marketing",
    "nome": "[M] Frequencia",
    "descricao": "[M] Frequencia - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
          "valor": 7,
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
          "semana": "Semana 21",
          "valor": 5,
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
          "semana": "Semana 23",
          "valor": 3,
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
          "semana": "Semana 25",
          "valor": 2,
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
          "semana": "Semana 27",
          "valor": 3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 1,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-cpm",
    "categoria": "marketing",
    "nome": "[M] CPM (Custo por Visu)",
    "descricao": "[M] CPM (Custo por Visu) - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
          "valor": 25,
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
          "semana": "Semana 21",
          "valor": 23,
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
          "semana": "Semana 23",
          "valor": 89,
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
          "semana": "Semana 25",
          "valor": 35,
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
          "semana": "Semana 27",
          "valor": 20,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 80,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 8,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 98,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 52,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-cliques",
    "categoria": "marketing",
    "nome": "[M] Cliques",
    "descricao": "[M] Cliques - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 2507,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 2103,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 1355,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 1833,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 1939,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 1996,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 2132,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 1383,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 1753,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 2490,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 2429,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 3068,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 26202,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 17062,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 9771,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 9179,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 7667,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-ctr",
    "categoria": "marketing",
    "nome": "[M] CTR (Taxa de Clique)",
    "descricao": "[M] CTR (Taxa de Clique) - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
          "valor": 30,
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
          "semana": "Semana 21",
          "valor": 29,
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
          "semana": "Semana 23",
          "valor": 18,
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
          "semana": "Semana 25",
          "valor": 38,
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
          "semana": "Semana 27",
          "valor": 39,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 25,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 28,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 35,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 70,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-custo-clique",
    "categoria": "marketing",
    "nome": "[M] Custo por Clique",
    "descricao": "[M] Custo por Clique - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
          "valor": 9,
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
          "semana": "Semana 21",
          "valor": 13,
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
          "semana": "Semana 23",
          "valor": 22,
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
          "semana": "Semana 25",
          "valor": 13,
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
          "semana": "Semana 27",
          "valor": 9,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 51,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 48,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 71,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 94,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-conversas-iniciadas",
    "categoria": "marketing",
    "nome": "[M] Conversas Iniciadas",
    "descricao": "[M] Conversas Iniciadas - marketing",
    "unidade": "unidade",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
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
          "semana": "Semana 07",
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
          "semana": "Semana 09",
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
          "semana": "Semana 11",
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
          "semana": "Semana 13",
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
          "semana": "Semana 15",
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
          "semana": "Semana 17",
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
          "semana": "Semana 19",
          "valor": 41,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 42,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 51,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 62,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 55,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 65,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 58,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 46,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 66,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 70,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 68,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 69,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 274,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 225,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 224,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 242,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": null,
          "status": "dentro",
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
