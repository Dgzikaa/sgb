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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 930000,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 525761.14,
          "meta": 930000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 968716.05,
          "meta": 930000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 940171.17,
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
          "mes": "Junho",
          "valor": 1004578.16,
          "meta": 930000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 941632.44,
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 160000,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 85625,
          "meta": 160000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 173291.32,
          "meta": 160000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 175931.53,
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
          "mes": "Junho",
          "valor": 173723.5,
          "meta": 160000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 162737,
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 690000,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 440136.14,
          "meta": 690000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 795424.73,
          "meta": 690000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 764239.64,
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
          "mes": "Junho",
          "valor": 830854.66,
          "meta": 690000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 778895.44,
          "meta": 690000,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "faturamento-cmovel",
    "categoria": "guardrail",
    "nome": "Faturamento CMvível",
    "descricao": "Faturamento CMvível - guardrail",
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
          "valor": 440136.14,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 795424.73,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 764239.64,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 630795.99,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 830854.66,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 778895.44,
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
          "valor": -18185.56,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 46350.1,
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
        },
        {
          "mes": "Maio",
          "valor": -46382.35,
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
          "mes": "Julho",
          "valor": 16517.9,
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 93.03,
          "meta": 93,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 87.5,
          "meta": 93,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 91.32,
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
          "mes": "Junho",
          "valor": 101.66,
          "meta": 93,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 101.95,
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 15.5,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 14.9,
          "meta": 15.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 16.55,
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
        },
        {
          "mes": "Maio",
          "valor": 16.99,
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
          "mes": "Julho",
          "valor": 20.82,
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 78.13,
          "meta": 77.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 70.95,
          "meta": 77.5,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 74,
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
          "mes": "Junho",
          "valor": 80.93,
          "meta": 77.5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 81.14,
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 31,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": -4.1,
          "meta": 31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 5.8,
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
        },
        {
          "mes": "Maio",
          "valor": -7.4,
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
          "mes": "Julho",
          "valor": 2.1,
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": -3.5,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 4.8,
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
        },
        {
          "mes": "Maio",
          "valor": -6.1,
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
          "mes": "Julho",
          "valor": 1.8,
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 27,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 27,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 28,
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
        },
        {
          "mes": "Maio",
          "valor": 28.8,
          "meta": 27,
          "status": "acima",
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
    "id": "cmo-percent",
    "categoria": "guardrail",
    "nome": "CMO%",
    "descricao": "CMO% - guardrail",
    "unidade": "%",
    "meta": 23,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 23,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
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
        },
        {
          "mes": "Maio",
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
          "mes": "Julho",
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 17,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 1.1,
          "meta": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 1.3,
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
        },
        {
          "mes": "Maio",
          "valor": 1.9,
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
          "mes": "Julho",
          "valor": 0,
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
          "semana": "Semana 05",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 10000,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 5747,
          "meta": 10000,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 9794,
          "meta": 10000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 10025,
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
          "mes": "Junho",
          "valor": 10135,
          "meta": 10000,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 8663,
          "meta": 10000,
          "status": "dentro",
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
          "valor": 1586,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 2692,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 3486,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 3524,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 2712,
          "meta": null,
          "status": "dentro",
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
          "valor": 2738,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 2478,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 2236,
          "meta": null,
          "status": "dentro",
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
    "unidade": "unidade",
    "meta": 300,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 300,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 193,
          "meta": 300,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 417,
          "meta": 300,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 142,
          "meta": 300,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 528,
          "meta": 300,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 369,
          "meta": 300,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 300,
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
    "meta": 4.8,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 4.8,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 4.83,
          "meta": 4.8,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 4.9,
          "meta": 4.8,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 4.81,
          "meta": 4.8,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 4.91,
          "meta": 4.8,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 4.91,
          "meta": 4.8,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 0,
          "meta": 4.8,
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
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 70,
          "status": "dentro",
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
          "valor": 80,
          "meta": 70,
          "status": "acima",
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
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 60,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 0,
          "meta": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 2582,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 68,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 78,
          "meta": 60,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 76,
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
    "unidade": "%",
    "meta": 3,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
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
          "valor": 4.4,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0.9,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0.2,
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
    "unidade": "%",
    "meta": 3,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 3,
          "status": "dentro",
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
          "valor": 1.4,
          "meta": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 3.5,
          "meta": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0.2,
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
    "id": "stockout-bar",
    "categoria": "produtos",
    "nome": "Stockout Bar",
    "descricao": "Stockout Bar - produtos",
    "unidade": "%",
    "meta": 1,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 1,
          "status": "dentro",
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
          "valor": 4.5,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 7.8,
          "meta": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 3.4,
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
          "valor": 0,
          "meta": 1,
          "status": "abaixo",
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
    "unidade": "%",
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
          "valor": 45.6,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 46.9,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 50,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 50,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 53,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 57,
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
    "unidade": "%",
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
          "valor": 30.9,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 30.3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 28,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 29,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 28,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 26,
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
    "unidade": "%",
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
          "valor": 23.5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 22.8,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 23,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 21,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 19,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 17,
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
    "unidade": "%",
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
          "valor": 22.1,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 16.5,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 24,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 25,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 18,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 11,
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
    "meta": 4,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 4,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 4.1,
          "meta": 4,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 2.9,
          "meta": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 2.3,
          "meta": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 2.3,
          "meta": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 2.2,
          "meta": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 5.4,
          "meta": 4,
          "status": "acima",
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
    "meta": 12,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 12,
          "status": "dentro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "mes": "Fevereiro",
          "valor": 6.7,
          "meta": 12,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 6.9,
          "meta": 12,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 7.1,
          "meta": 12,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 7.4,
          "meta": 12,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 7.3,
          "meta": 12,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 10.5,
          "meta": 12,
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
    "unidade": "%",
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
          "valor": 10,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 11,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 10,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 12,
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
          "valor": 12,
          "meta": null,
          "status": "dentro",
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
          "valor": 1333.46,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 102.7,
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
          "valor": 8342.75,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 13359.7,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Julho",
          "valor": 882.05,
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
    "unidade": "%",
    "meta": 112,
    "dados": {
      "semanais": [
        {
          "semana": "Semana 05",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 06",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 07",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 08",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 09",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 10",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 11",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 12",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 13",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 14",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 15",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 16",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 17",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 18",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 19",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 20",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 21",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 22",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 23",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 24",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 25",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 26",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 27",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 28",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "semana": "Semana 29",
          "valor": 0,
          "meta": 112,
          "status": "dentro",
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
    "unidade": "%",
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
          "valor": 7.2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 3.8,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 5.9,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 5.6,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 4.9,
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
          "valor": 10613,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 10629.01,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 12376.7,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 11322.99,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 11460.7,
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
          "valor": 3.2,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 3.8,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 5.9,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 4.7,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 4.3,
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
          "valor": 6.42,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 4.58,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 3.19,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 3.74,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 4.36,
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
    "unidade": "%",
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
          "valor": 1.59,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0.74,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 0.25,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 0.3,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 0.29,
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
          "valor": 0.41,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Março",
          "valor": 0.62,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Abril",
          "valor": 1.27,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Maio",
          "valor": 1.23,
          "meta": null,
          "status": "dentro",
          "tendencia": "estavel"
        },
        {
          "mes": "Junho",
          "valor": 1.49,
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
