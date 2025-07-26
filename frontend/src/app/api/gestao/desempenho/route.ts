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
    "descricao": "Indicador de Faturamento Total",
    "unidade": "R$",
    "meta": 930000,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 33.377,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 59.605,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 31.7,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 32,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 46.406,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 23.43,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 36.9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 24.84,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 8.805,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 15.25,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 32.77,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 25.99,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 11.615,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 20.31,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 86,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 27.999,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 66,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 41.59,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "faturamento-couvert",
    "categoria": "guardrail",
    "nome": "Faturamento Couvert",
    "descricao": "Indicador de Faturamento Couvert",
    "unidade": "R$",
    "meta": 160000,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 136.398,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 58,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 223.173,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 14,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 139.37,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 39,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 196.471,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 38,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 105.161,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 44,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 201.909,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 99,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 114.377,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 95,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 232.605,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 73,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 314.324,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 45,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 147.319,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 125.236,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 54,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 63.699,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 54,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 75.314,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 36,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 127.102,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 33,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 131.472,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 33,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 179.825,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "faturamento-bar",
    "categoria": "guardrail",
    "nome": "Faturamento Bar",
    "descricao": "Indicador de Faturamento Bar",
    "unidade": "R$",
    "meta": 690000,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 127.212,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 77,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 210.325,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 6,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 126.891,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 65,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 182.705,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 93,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 95.674,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 189.163,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 59,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 104.025,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 81,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 228.863,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 70,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 305.791,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 72,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 133.811,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 14,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 113.797,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 58,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 57.449,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 88,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 74.329,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 139.241,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 81,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 117.295,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 122.472,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 37,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "faturamento-cmovel",
    "categoria": "guardrail",
    "nome": "Faturamento CMvível",
    "descricao": "Indicador de Faturamento CMvível",
    "unidade": "R$",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 59,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": -15.311,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": -7.513,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 46,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 10.889,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 60,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 21.774,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 59,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": -11.415,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 53,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 29.49,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 17,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 5.998,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 64,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 15.097,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 99,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": -8.257,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 28,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": -4.802,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 72,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": -25.623,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 16,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 12.191,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 96,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": -17.237,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": -5.118,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 32,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": -3.43,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 98,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": -2.724,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 75,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "cmv-rs",
    "categoria": "guardrail",
    "nome": "CMV R$",
    "descricao": "Indicador de CMV R$",
    "unidade": "R$",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 90,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 92,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 91,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 58,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 89,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 45,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 92,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 48,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 86,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 32,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 88,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 48,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 88,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 77,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 84,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 8,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 93,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 67,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 91,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 31,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 95,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 70,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 89,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 11,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 99,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 88,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 102,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 36,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 88,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 21,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 93,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "ticket-medio-contahub",
    "categoria": "guardrail",
    "nome": "Ticket Médio ContaHub",
    "descricao": "Indicador de Ticket Médio ContaHub",
    "unidade": "R$",
    "meta": 93,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 18,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 56,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 16,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 85,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 16,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 72,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 34,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 18,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 73,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 75,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 14,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 96,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 12,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 41,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 16,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 16,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 68,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 13,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 50,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 68,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 15,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 68,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 16,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 92,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 17,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "tm-entrada",
    "categoria": "guardrail",
    "nome": "TM Entrada",
    "descricao": "Indicador de TM Entrada",
    "unidade": "R$",
    "meta": 15.5,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 73,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 91,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 73,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 73,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 59,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 98,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 69,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 72,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 12,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 80,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 26,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 31,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 79,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 76,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 11,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 99,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 50,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 20,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 87,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 68,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 71,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 29,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 75,
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
    "descricao": "Indicador de TM Bar",
    "unidade": "R$",
    "meta": 77.5,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": -1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": -12,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 6,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": -3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 34,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 46,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 7,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": -48,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 79,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 24,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 171,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": -54,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 7,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": -14,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 6,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": -98,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 105,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 7,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": -3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": -2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": -2,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "cmv-limpo-percent",
    "categoria": "guardrail",
    "nome": "CMV Limpo %",
    "descricao": "Indicador de CMV Limpo %",
    "unidade": "%",
    "meta": 31,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": -1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": -9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 7,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": -2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 8,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 7,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 11,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": -10,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 6,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 14,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 6,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 6,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": -2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": -3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": -20,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 19,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": -2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": -2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 7,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": -1,
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
    "descricao": "Indicador de CMV Global Real",
    "unidade": "%",
    "meta": 27,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 31,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 32,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 8,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 29,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 7,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 27,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 26,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 27,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 25,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 8,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 29,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "cmv-teorico",
    "categoria": "guardrail",
    "nome": "CMV Teórico",
    "descricao": "Indicador de CMV Teórico",
    "unidade": "%",
    "meta": 27,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 18,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 26,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 14,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 19,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 31,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 18,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 16,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 16,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 24,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 26,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 51,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 21,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 9,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 26,
          "status": "proximo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "cmo-percent",
    "categoria": "guardrail",
    "nome": "CMO%",
    "descricao": "Indicador de CMO%",
    "unidade": "%",
    "meta": 23,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de Atração/Faturamento",
    "unidade": "%",
    "meta": 17,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "retencao",
    "categoria": "guardrail",
    "nome": "Retenção",
    "descricao": "Indicador de Retenção",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 3.077,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 2.949,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 2.718,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 2.245,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 2.294,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 2.2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 2.489,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 2.036,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 1.668,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 1.459,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 1.794,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 2.401,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 1.96,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 2.788,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 1.914,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 2.54,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 1.49,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 2.012,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 1.579,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 597,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 1.177,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 1.997,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 1.624,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 849,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 133,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 10135,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 7789,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 10.025,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 9794,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 5747,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "clientes-atendidos",
    "categoria": "guardrail",
    "nome": "Clientes Atendidos",
    "descricao": "Indicador de Clientes Atendidos",
    "unidade": "",
    "meta": 10000,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "clientes-ativos",
    "categoria": "ovt",
    "nome": "Clientes Ativos",
    "descricao": "Indicador de Clientes Ativos",
    "unidade": "",
    "meta": 3000,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 946,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 839,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 978,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 808,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 1.044,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 837,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 771,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 806,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 870,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 760,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 644,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 571,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 521,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 638,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 580,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 788,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 3.524,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 3.486,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 2.692,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 1.586,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de Reservas Totais",
    "unidade": "",
    "meta": 800,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 747,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 703,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 801,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 622,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 650,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 578,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 608,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 2.478,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 2.738,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "reservas-presentes",
    "categoria": "ovt",
    "nome": "Reservas Presentes",
    "descricao": "Indicador de Reservas Presentes",
    "unidade": "",
    "meta": 650,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "avaliacoes-5-google-trip",
    "categoria": "qualidade",
    "nome": "Avaliações 5 Google/Trip",
    "descricao": "Indicador de Avaliações 5 Google/Trip",
    "unidade": "",
    "meta": 300,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 86,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 88,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 86,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 88,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de Média Avaliações Google",
    "unidade": "",
    "meta": 4.8,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 80,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 88,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 85,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 94,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-geral",
    "categoria": "qualidade",
    "nome": "NPS Geral",
    "descricao": "Indicador de NPS Geral",
    "unidade": "",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 82,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 81,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 78,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 68,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de NPS Ambiente",
    "unidade": "",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 86,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 93,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 85,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 94,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de NPS Atendimento",
    "unidade": "",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 86,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 71,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 68,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de NPS Limpeza",
    "unidade": "",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 77,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 85,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 79,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 72,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de NPS Música",
    "unidade": "",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 51,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 65,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 44,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 79,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de NPS Comida",
    "unidade": "",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 82,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 63,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 95,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 92,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 92,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 23,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 97,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 29,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 92,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 4,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 5,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 100,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 100,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 83,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 75,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de NPS Drink",
    "unidade": "",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 76,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 81,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 70,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 87,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 76,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 12,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 64,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 63,
          "status": "proximo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 77,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 86,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 50,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 7833,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 944,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 60,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 84,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 79,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 72,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 72,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "nps-preco",
    "categoria": "qualidade",
    "nome": "NPS Preço",
    "descricao": "Indicador de NPS Preço",
    "unidade": "",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de NPS Reservas",
    "unidade": "",
    "meta": 70,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de NPS Felicidade Equipe",
    "unidade": "",
    "meta": 60,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 6,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 8,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 7,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 3,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 6,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de StockOut Comidas",
    "unidade": "%",
    "meta": 3,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 12,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 4,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 9,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 4,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 9,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 4,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 4,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 9,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "stockout-drinks",
    "categoria": "produtos",
    "nome": "StockOut Drinks",
    "descricao": "Indicador de StockOut Drinks",
    "unidade": "%",
    "meta": 3,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 48,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 71,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 9,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 47,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 9,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 46,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 49,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 46,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 40,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 50,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 7,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 46,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 8,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 46,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 37,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 21,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 49,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 49,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 46,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "stockout-bar",
    "categoria": "produtos",
    "nome": "Stockout Bar",
    "descricao": "Indicador de Stockout Bar",
    "unidade": "%",
    "meta": 1,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 8,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 30,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 27,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 7,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 33,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 1,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 29,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 8,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 29,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 30,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 34,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 9,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 27,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 2,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 31,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 30,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 9,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 32,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 48,
          "status": "acima",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 30,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 4,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 28,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 3,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 30,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 1,
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
    "descricao": "Indicador de % BEBIDAS",
    "unidade": "%",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 6,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 20,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 9,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 28,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 24,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 66,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 24,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 21,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 9,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 22,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 9,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 24,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 22,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 22,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 9,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 22,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 29,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 30,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 20,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 22,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 23,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "percent-drinks",
    "categoria": "produtos",
    "nome": "% DRINKS",
    "descricao": "Indicador de % DRINKS",
    "unidade": "%",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 28,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 22,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 12,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 16,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 7,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 18,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 7,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 21,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 22,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 26,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 24,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 11,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 23,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 22,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 28,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "percent-comida",
    "categoria": "produtos",
    "nome": "% COMIDA",
    "descricao": "Indicador de % COMIDA",
    "unidade": "%",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 1.49,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 1.725,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 1.721,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 1.056,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 1.449,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 1.357,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 1.501,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 1.122,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 1.191,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 1.216,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 1.181,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 1.367,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 1.245,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 1.359,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 1.121,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 1.437,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 1.215,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 572,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 885,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 1.622,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 1.531,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 673,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 5.532,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 5.644,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 3.024,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 4.35,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 4.872,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "percent-happyhour",
    "categoria": "produtos",
    "nome": "% HappyHour",
    "descricao": "Indicador de % HappyHour",
    "unidade": "%",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 8,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 8,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 7,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "qtde-itens-bar",
    "categoria": "produtos",
    "nome": "Qtde Itens Bar",
    "descricao": "Indicador de Qtde Itens Bar",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 784,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 706,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 910,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 601,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 714,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 642,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 687,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 551,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 593,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 657,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 589,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 696,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 577,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 787,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 45,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 736,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 840,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 676,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 542,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 720,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 934,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 945,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 630,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 2.83,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 2.743,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 1.692,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 2.992,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 3.134,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "tempo-saida-bar",
    "categoria": "produtos",
    "nome": "Tempo Saída Bar",
    "descricao": "Indicador de Tempo Saída Bar",
    "unidade": "",
    "meta": 4,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 7,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 10,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 1,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 7,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 7,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 4,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 4,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 7,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 9,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 5,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 7,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 4,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 7,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 6,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 7,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 2,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 7,
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
    "descricao": "Indicador de Qtde Itens Cozinha",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "tempo-saida-cozinha",
    "categoria": "produtos",
    "nome": "Tempo Saída Cozinha",
    "descricao": "Indicador de Tempo Saída Cozinha",
    "unidade": "",
    "meta": 12,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "percent-faturamento-ate-19h",
    "categoria": "vendas",
    "nome": "% Faturamento até 19h",
    "descricao": "Indicador de % Faturamento até 19h",
    "unidade": "%",
    "meta": 15,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 1490,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 1430,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 1694,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 2454,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 2232,
          "status": "acima",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de Venda Balcão",
    "unidade": "R$",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 36,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 59.139,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 62,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 74.846,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 73,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 114.606,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 29,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 96.95,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 64,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 227.193,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 67,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 69.639,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 16,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 132.266,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 15,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 45.875,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 24,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 126.452,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 54.241,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 113.701,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 18,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 126.814,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 38,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 99.69,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 52,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "couvert-atracoes",
    "categoria": "vendas",
    "nome": "Couvert / Atrações",
    "descricao": "Indicador de Couvert / Atrações",
    "unidade": "%",
    "meta": 112,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
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
    "descricao": "Indicador de QUI+SÁB+DOM",
    "unidade": "R$",
    "meta": 141000,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "abaixo",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-num-posts",
    "categoria": "marketing",
    "nome": "[O] Nº de Posts",
    "descricao": "Indicador de [O] Nº de Posts",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 650,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 341,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 1.32,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 1.697,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 787,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 2.206,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 958,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 1.404,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 1.171,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 918,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 2.124,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 1.083,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 5.455,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 6.302,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 8.187,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 5.345,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 10.157,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-alcance",
    "categoria": "marketing",
    "nome": "[O] Alcance",
    "descricao": "Indicador de [O] Alcance",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 202,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 118,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 256,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 416,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 228,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 443,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 153,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 288,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 503,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 261,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 609,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 271,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 954,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 1.885,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 2.739,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 1.503,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 3.299,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-interacao",
    "categoria": "marketing",
    "nome": "[O] Interação",
    "descricao": "Indicador de [O] Interação",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 6,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 6,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 9,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 9,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 6,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 7,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 7,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-compartilhamento",
    "categoria": "marketing",
    "nome": "[O] Compartilhamento",
    "descricao": "Indicador de [O] Compartilhamento",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 71,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 59,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 56,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 46,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 77,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 74,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 81,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 70,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 23,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 49,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 26,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 29,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 301,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 171,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 230,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 250,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 187,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-engajamento",
    "categoria": "marketing",
    "nome": "[O] Engajamento",
    "descricao": "Indicador de [O] Engajamento",
    "unidade": "%",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 113.473,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 96.596,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 78.287,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 65.623,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 115.077,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 106.153,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 122.055,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 88.203,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 38.755,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 67.777,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 40.219,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 57.216,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 450.659,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 249.088,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 111.441,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-num-stories",
    "categoria": "marketing",
    "nome": "[O] Nº Stories",
    "descricao": "Indicador de [O] Nº Stories",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "o-visu-stories",
    "categoria": "marketing",
    "nome": "[O] Visu Stories",
    "descricao": "Indicador de [O] Visu Stories",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 3.051,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 51,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 3.017,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 48,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 2.114,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 61,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 2.075,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 54,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 3.007,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 61,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 2.373,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 49,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 2.736,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 43,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 2.329,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 76,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 3.001,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 65,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 2.044,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-valor-investido",
    "categoria": "marketing",
    "nome": "[M] Valor Investido",
    "descricao": "Indicador de [M] Valor Investido",
    "unidade": "R$",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 7,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-alcance",
    "categoria": "marketing",
    "nome": "[M] Alcance",
    "descricao": "Indicador de [M] Alcance",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 80,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 20,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 35,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 89,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 23,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 25,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 3,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 52,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 6,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 98,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 5,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 8,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 4,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-frequencia",
    "categoria": "marketing",
    "nome": "[M] Frequencia",
    "descricao": "Indicador de [M] Frequencia",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 3.068,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 2.429,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 2.49,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 1.753,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 1.383,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 2.132,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 1.996,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 1.939,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 1.833,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 1.355,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 2.103,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 2.507,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 7.667,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 9.179,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 9.771,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 17.062,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 26.202,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-cpm",
    "categoria": "marketing",
    "nome": "[M] CPM (Custo por Visu)",
    "descricao": "Indicador de [M] CPM (Custo por Visu)",
    "unidade": "R$",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 25,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 39,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 38,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 18,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 29,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 30,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 70,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 35,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 28,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-cliques",
    "categoria": "marketing",
    "nome": "[M] Cliques",
    "descricao": "Indicador de [M] Cliques",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 51,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 9,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 13,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 22,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 2,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 13,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 9,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 94,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 71,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 48,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 1,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-ctr",
    "categoria": "marketing",
    "nome": "[M] CTR (Taxa de Clique)",
    "descricao": "Indicador de [M] CTR (Taxa de Clique)",
    "unidade": "%",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 68,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 70,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 66,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 46,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 58,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 65,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 55,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 62,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 51,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 42,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 41,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 242,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 224,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 225,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 274,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 69,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-custo-clique",
    "categoria": "marketing",
    "nome": "[M] Custo por Clique",
    "descricao": "Indicador de [M] Custo por Clique",
    "unidade": "R$",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  },
  {
    "id": "m-conversas-iniciadas",
    "categoria": "marketing",
    "nome": "[M] Conversas Iniciadas",
    "descricao": "Indicador de [M] Conversas Iniciadas",
    "unidade": "",
    "meta": null,
    "dados": {
      "semanais": [
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 29",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 28",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 27",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 26",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 25",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 24",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 23",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 22",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 21",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 20",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 19",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 18",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 17",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 16",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 15",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 14",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 13",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 12",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 11",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 10",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 09",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 08",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 07",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 06",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Semana 05",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ],
      "mensais": [
        {
          "periodo": "Junho",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Maio",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Abril",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Março",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "Fevereiro",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        },
        {
          "periodo": "",
          "valor": 0,
          "status": "neutro",
          "tendencia": "estavel"
        }
      ]
    }
  }
];
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
