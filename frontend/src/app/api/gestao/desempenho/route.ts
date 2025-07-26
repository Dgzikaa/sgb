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
  const semanas = [
    'Semana 5', 'Semana 6', 'Semana 7', 'Semana 8', 'Semana 9', 'Semana 10',
    'Semana 11', 'Semana 12', 'Semana 13', 'Semana 14', 'Semana 15', 'Semana 16',
    'Semana 17', 'Semana 18', 'Semana 19', 'Semana 20', 'Semana 21', 'Semana 22',
    'Semana 23', 'Semana 24', 'Semana 25', 'Semana 26', 'Semana 27', 'Semana 28', 'Semana 29'
  ]
  const meses = ['Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho']

  return [
    // GUARDRAIL - Indicadores Estratégicos
    {
      id: 'faturamento-total',
      categoria: 'guardrail',
      nome: 'Faturamento Total',
      descricao: 'Faturamento total do período',
      unidade: 'R$',
      meta: 222000,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 75314.54, meta: 222000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 75314.54, meta: 222000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 7', valor: 151226, meta: 222000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 180089.45, meta: 222000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 9', valor: 329574.73, meta: 222000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 241410.95, meta: 222000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 139217.99, meta: 222000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 12', valor: 238809.44, meta: 222000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 128591.38, meta: 222000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 242877.71, meta: 222000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 171070.14, meta: 222000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 16', valor: 282778.87, meta: 222000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 17', valor: 169775.55, meta: 222000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 18', valor: 221415.99, meta: 222000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 159472.19, meta: 222000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 147412.36, meta: 222000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 21', valor: 178423.96, meta: 222000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 188457.06, meta: 222000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 23', valor: 245583.76, meta: 222000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 210820.40, meta: 222000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 25', valor: 250704.99, meta: 222000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 26', valor: 219416.91, meta: 222000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 27', valor: 274440.95, meta: 222000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 306345.54, meta: 222000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 29', valor: 291813.33, meta: 222000, status: 'acima', tendencia: 'decrescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 525761.14, meta: 930000, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 968716.05, meta: 930000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 940171.17, meta: 930000, status: 'acima', tendencia: 'decrescendo' },
          { mes: 'Maio', valor: 758225.94, meta: 930000, status: 'abaixo', tendencia: 'decrescendo' },
          { mes: 'Junho', valor: 1004578.16, meta: 930000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 941632.44, meta: 930000, status: 'acima', tendencia: 'decrescendo' }
        ]
      }
    },
    {
      id: 'ticket-medio',
      categoria: 'guardrail',
      nome: 'Ticket Médio ContaHub',
      descricao: 'Valor médio por cliente',
      unidade: 'R$',
      meta: 93,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 99.11, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 89.70, meta: 93, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 7', valor: 95.31, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 91.67, meta: 93, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 93.08, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 84.77, meta: 93, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 88.48, meta: 93, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 88.32, meta: 93, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 13', valor: 86.48, meta: 93, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 92.45, meta: 93, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 89.58, meta: 93, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 16', valor: 91.92, meta: 93, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 17', valor: 90.81, meta: 93, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 18', valor: 93.21, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 88.36, meta: 93, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 102.88, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 106.43, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 98.92, meta: 93, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 97.56, meta: 93, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 24', valor: 102.45, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 106.49, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 26', valor: 98.36, meta: 93, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 27', valor: 103.47, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 103.71, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 29', valor: 99.21, meta: 93, status: 'acima', tendencia: 'decrescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 93.03, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Março', valor: 87.50, meta: 93, status: 'abaixo', tendencia: 'decrescendo' },
          { mes: 'Abril', valor: 91.32, meta: 93, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 97.88, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 101.66, meta: 93, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 101.95, meta: 93, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    {
      id: 'cmv-limpo',
      categoria: 'guardrail',
      nome: 'CMV Limpo %',
      descricao: 'Custo das Mercadorias Vendidas',
      unidade: '%',
      meta: 31,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 105.0, meta: 31, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: -98.6, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 7', valor: -14.7, meta: 31, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: -54.2, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 171.5, meta: 31, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 24.1, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 79.9, meta: 31, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: -48.7, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 13', valor: 46.9, meta: 31, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 14', valor: 34.4, meta: 31, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 15', valor: -3.6, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 16', valor: -12.0, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: -1.5, meta: 31, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: -2.2, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 19', valor: -2.9, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: -3.7, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 21', valor: -5.0, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 22', valor: 4.1, meta: 31, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 23', valor: 0.5, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 24', valor: -6.8, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 25', valor: 13.5, meta: 31, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 26', valor: -1.1, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 27', valor: -0.1, meta: 31, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 4.5, meta: 31, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: -4.1, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { mes: 'Março', valor: 5.8, meta: 31, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 0.0, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { mes: 'Maio', valor: -7.4, meta: 31, status: 'abaixo', tendencia: 'decrescendo' },
          { mes: 'Junho', valor: 4.5, meta: 31, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 2.1, meta: 31, status: 'abaixo', tendencia: 'decrescendo' }
        ]
      }
    },
    {
      id: 'cmo',
      categoria: 'guardrail',
      nome: 'CMO%',
      descricao: 'Custo de Mão de Obra',
      unidade: '%',
      meta: 20,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 51.1, meta: 20, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 26.0, meta: 20, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 7', valor: 24.0, meta: 20, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 8', valor: 16.9, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 16.3, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 10', valor: 28.0, meta: 20, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 11', valor: 18.5, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 12', valor: 31.3, meta: 20, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 19.4, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 23.9, meta: 20, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 14.9, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 16', valor: 26.0, meta: 20, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 17', valor: 18.7, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 18', valor: 26.4, meta: 20, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 28.9, meta: 20, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 20', valor: 21.5, meta: 20, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 21', valor: 20.5, meta: 20, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 22', valor: 16.8, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 19.6, meta: 20, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 16.5, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 25', valor: 18.3, meta: 20, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 26', valor: 14.6, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 27', valor: 12.6, meta: 20, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 28', valor: 12.2, meta: 20, status: 'abaixo', tendencia: 'decrescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 0.0, meta: 23, status: 'abaixo', tendencia: 'decrescendo' },
          { mes: 'Março', valor: 0.0, meta: 23, status: 'abaixo', tendencia: 'estavel' },
          { mes: 'Abril', valor: 0.0, meta: 23, status: 'abaixo', tendencia: 'estavel' },
          { mes: 'Maio', valor: 0.0, meta: 23, status: 'abaixo', tendencia: 'estavel' },
          { mes: 'Junho', valor: 0.0, meta: 23, status: 'abaixo', tendencia: 'estavel' },
          { mes: 'Julho', valor: 0.0, meta: 23, status: 'abaixo', tendencia: 'estavel' }
        ]
      }
    },
    {
      id: 'atracao-faturamento',
      categoria: 'guardrail',
      nome: 'Atração/Faturamento',
      descricao: 'Relação entre atração e faturamento',
      unidade: '%',
      meta: 17,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 6', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 7', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 8', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 9', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 10', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 11', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 12', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 13', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 14', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 15', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 16', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 17', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 18', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 19', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 20', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 21', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 22', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 23', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 24', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 25', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 26', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 27', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 28', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 29', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'estavel' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 1.1, meta: 17, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 1.3, meta: 17, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 1.7, meta: 17, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 1.9, meta: 17, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 1.6, meta: 17, status: 'abaixo', tendencia: 'decrescendo' },
          { mes: 'Julho', valor: 0.0, meta: 17, status: 'abaixo', tendencia: 'decrescendo' }
        ]
      }
    },

    // OVT - Outros Valores de Transformação
    {
      id: 'clientes-atendidos',
      categoria: 'ovt',
      nome: 'Clientes Atendidos',
      descricao: 'Total de clientes atendidos',
      unidade: 'clientes',
      meta: 2645,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 133, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 849, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 1624, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 1997, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 9', valor: 1177, meta: 2645, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 10', valor: 597, meta: 2645, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 1579, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 2012, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 1490, meta: 2645, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 2540, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 1914, meta: 2645, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 16', valor: 2788, meta: 2645, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 17', valor: 1960, meta: 2645, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 18', valor: 2401, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 1794, meta: 2645, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 1459, meta: 2645, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 21', valor: 1668, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 2036, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 23', valor: 2489, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 2200, meta: 2645, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 25', valor: 2294, meta: 2645, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 26', valor: 2245, meta: 2645, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 27', valor: 2718, meta: 2645, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 2949, meta: 2645, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 29', valor: 3077, meta: 2645, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 5747, meta: 10000, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 9794, meta: 10000, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 10025, meta: 10000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 7789, meta: 10000, status: 'abaixo', tendencia: 'decrescendo' },
          { mes: 'Junho', valor: 10135, meta: 10000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 8663, meta: 10000, status: 'abaixo', tendencia: 'decrescendo' }
        ]
      }
    },
    {
      id: 'clientes-ativos',
      categoria: 'ovt',
      nome: 'Clientes Ativos',
      descricao: 'Clientes que retornaram',
      unidade: 'clientes',
      meta: 3000,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 6', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 7', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 8', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 9', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 10', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 11', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 12', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 13', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 14', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 15', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 16', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 17', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 18', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 19', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 20', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 21', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 22', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 23', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 24', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 25', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 26', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 27', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 28', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { semana: 'Semana 29', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { mes: 'Março', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { mes: 'Abril', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { mes: 'Maio', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { mes: 'Junho', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' },
          { mes: 'Julho', valor: 0, meta: 3000, status: 'abaixo', tendencia: 'estavel' }
        ]
      }
    },
    {
      id: 'reservas-totais',
      categoria: 'ovt',
      nome: 'Reservas Totais',
      descricao: 'Total de reservas realizadas',
      unidade: 'reservas',
      meta: 200,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 45 + (i * 5) + Math.random() * 15,
          meta: 50,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 190 + (i * 20) + Math.random() * 40,
          meta: 200,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'reservas-presentes',
      categoria: 'ovt',
      nome: 'Reservas Presentes',
      descricao: 'Reservas que compareceram',
      unidade: 'reservas',
      meta: 160,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 35 + (i * 3) + Math.random() * 10,
          meta: 40,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 155 + (i * 15) + Math.random() * 30,
          meta: 160,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'clientes-ativos',
      categoria: 'ovt',
      nome: 'Clientes Ativos',
      descricao: 'Número de clientes ativos',
      unidade: 'clientes',
      meta: 500,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 420 + (i * 15) + Math.random() * 30,
          meta: 500,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 4800 + (i * 200) + Math.random() * 400,
          meta: 5000,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },

    // QUALIDADE - Indicadores de Qualidade
    {
      id: 'avaliacoes-5-estrelas',
      categoria: 'qualidade',
      nome: 'Avaliações 5 Estrelas',
      descricao: 'Porcentagem de avaliações 5 estrelas',
      unidade: '%',
      meta: 85,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 82 + (i * 1) + Math.random() * 6,
          meta: 85,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 83 + (i * 0.5) + Math.random() * 4,
          meta: 85,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'media-google',
      categoria: 'qualidade',
      nome: 'Média Google',
      descricao: 'Avaliação média no Google',
      unidade: 'estrelas',
      meta: 4.5,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 4.3 + (i * 0.05) + Math.random() * 0.4,
          meta: 4.5,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 4.4 + (i * 0.03) + Math.random() * 0.2,
          meta: 4.5,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'nps-geral',
      categoria: 'qualidade',
      nome: 'NPS Geral',
      descricao: 'Net Promoter Score geral',
      unidade: 'pontos',
      meta: 70,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 65 + (i * 2) + Math.random() * 10,
          meta: 70,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 68 + (i * 1) + Math.random() * 6,
          meta: 70,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },

    // PRODUTOS - Cockpit Produtos
    {
      id: 'bebidas',
      categoria: 'produtos',
      nome: '% Bebidas',
      descricao: 'Porcentagem de vendas de bebidas',
      unidade: '%',
      meta: 45,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 42 + (i * 1) + Math.random() * 6,
          meta: 45,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 43 + (i * 0.5) + Math.random() * 4,
          meta: 45,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'drinks',
      categoria: 'produtos',
      nome: '% Drinks',
      descricao: 'Porcentagem de vendas de drinks',
      unidade: '%',
      meta: 30,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 28 + (i * 0.5) + Math.random() * 4,
          meta: 30,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 29 + (i * 0.3) + Math.random() * 3,
          meta: 30,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'comida',
      categoria: 'produtos',
      nome: '% Comida',
      descricao: 'Porcentagem de vendas de comida',
      unidade: '%',
      meta: 25,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 23 + (i * 0.5) + Math.random() * 4,
          meta: 25,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 24 + (i * 0.3) + Math.random() * 3,
          meta: 25,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'itens-vendidos',
      categoria: 'produtos',
      nome: 'Qtde Itens Vendidos',
      descricao: 'Quantidade total de itens vendidos',
      unidade: 'itens',
      meta: 1200,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 280 + (i * 20) + Math.random() * 60,
          meta: 300,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 1150 + (i * 100) + Math.random() * 200,
          meta: 1200,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    
    // Indicadores de Qualidade
    {
      id: 'avaliacoes-5-google',
      categoria: 'qualidade',
      nome: 'Avaliações 5 Google/Trip',
      descricao: 'Avaliações 5 estrelas no Google/TripAdvisor',
      unidade: 'avaliações',
      meta: 100,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 15, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 22, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 18, meta: 100, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 8', valor: 25, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 9', valor: 30, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 28, meta: 100, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 35, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 42, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 38, meta: 100, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 45, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 52, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 48, meta: 100, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 55, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 62, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 58, meta: 100, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 65, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 72, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 68, meta: 100, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 75, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 82, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 78, meta: 100, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 85, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 92, meta: 100, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 88, meta: 100, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 95, meta: 100, status: 'abaixo', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 120, meta: 400, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 180, meta: 400, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 220, meta: 400, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 280, meta: 400, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 320, meta: 400, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 360, meta: 400, status: 'abaixo', tendencia: 'crescendo' }
        ]
      }
    },
    {
      id: 'media-avaliacoes-google',
      categoria: 'qualidade',
      nome: 'Média Avaliações Google',
      descricao: 'Média das avaliações no Google',
      unidade: 'estrelas',
      meta: 4.5,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 4.2, meta: 4.5, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 4.3, meta: 4.5, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 4.1, meta: 4.5, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 8', valor: 4.4, meta: 4.5, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 9', valor: 4.6, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 4.5, meta: 4.5, status: 'dentro', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 4.7, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 4.8, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 4.6, meta: 4.5, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 4.9, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 4.7, meta: 4.5, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 16', valor: 4.8, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 17', valor: 4.6, meta: 4.5, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 18', valor: 4.9, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 4.7, meta: 4.5, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 4.8, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 4.6, meta: 4.5, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 22', valor: 4.9, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 23', valor: 4.7, meta: 4.5, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 24', valor: 4.8, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 4.6, meta: 4.5, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 4.9, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 4.7, meta: 4.5, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 28', valor: 4.8, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 29', valor: 4.9, meta: 4.5, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 4.3, meta: 4.5, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 4.4, meta: 4.5, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 4.6, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 4.7, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 4.8, meta: 4.5, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 4.9, meta: 4.5, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    {
      id: 'nps-geral',
      categoria: 'qualidade',
      nome: 'NPS Geral',
      descricao: 'Net Promoter Score geral',
      unidade: 'pontos',
      meta: 50,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 45, meta: 50, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 47, meta: 50, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 52, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 49, meta: 50, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 51, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 48, meta: 50, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 53, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 55, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 51, meta: 50, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 54, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 56, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 52, meta: 50, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 57, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 59, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 55, meta: 50, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 58, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 60, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 56, meta: 50, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 61, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 63, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 59, meta: 50, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 62, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 64, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 60, meta: 50, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 65, meta: 50, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 48, meta: 50, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 51, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 53, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 55, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 57, meta: 50, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 59, meta: 50, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    {
      id: 'nps-ambiente',
      categoria: 'qualidade',
      nome: 'NPS Ambiente',
      descricao: 'Net Promoter Score do ambiente',
      unidade: 'pontos',
      meta: 60,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 55, meta: 60, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 57, meta: 60, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 62, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 59, meta: 60, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 61, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 58, meta: 60, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 63, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 65, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 61, meta: 60, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 64, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 66, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 62, meta: 60, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 67, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 69, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 65, meta: 60, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 68, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 70, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 66, meta: 60, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 71, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 73, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 69, meta: 60, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 72, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 74, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 70, meta: 60, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 75, meta: 60, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 58, meta: 60, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 61, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 63, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 65, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 67, meta: 60, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 69, meta: 60, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    
    // Cockpit Vendas
    {
      id: 'faturamento-ate-19h',
      categoria: 'vendas',
      nome: '% Faturamento até 19h',
      descricao: 'Porcentagem do faturamento até 19h',
      unidade: '%',
      meta: 30,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 25, meta: 30, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 28, meta: 30, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 32, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 29, meta: 30, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 31, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 27, meta: 30, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 33, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 35, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 31, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 34, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 36, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 32, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 37, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 39, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 35, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 38, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 40, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 36, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 41, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 43, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 39, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 42, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 44, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 40, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 45, meta: 30, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 28, meta: 30, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 31, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 33, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 35, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 37, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 39, meta: 30, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    {
      id: 'venda-balcao',
      categoria: 'vendas',
      nome: 'Venda Balcão',
      descricao: 'Vendas realizadas no balcão',
      unidade: 'R$',
      meta: 50000,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 45000, meta: 50000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 48000, meta: 50000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 52000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 49000, meta: 50000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 51000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 47000, meta: 50000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 53000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 55000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 51000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 54000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 56000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 52000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 57000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 59000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 55000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 58000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 60000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 56000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 61000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 63000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 59000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 62000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 64000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 60000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 65000, meta: 50000, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 480000, meta: 500000, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 520000, meta: 500000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 540000, meta: 500000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 560000, meta: 500000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 580000, meta: 500000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 600000, meta: 500000, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    {
      id: 'couvert-atracoes',
      categoria: 'vendas',
      nome: 'Couvert / Atrações',
      descricao: 'Receita de couvert e atrações',
      unidade: 'R$',
      meta: 15000,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 12000, meta: 15000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 13500, meta: 15000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 16000, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 14500, meta: 15000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 15500, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 13000, meta: 15000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 16500, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 17500, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 15500, meta: 15000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 17000, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 18000, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 16000, meta: 15000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 18500, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 19500, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 17500, meta: 15000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 19000, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 20000, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 18000, meta: 15000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 20500, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 21500, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 19500, meta: 15000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 21000, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 22000, meta: 15000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 20000, meta: 15000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 22500, meta: 15000, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 140000, meta: 150000, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 155000, meta: 150000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 160000, meta: 150000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 165000, meta: 150000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 170000, meta: 150000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 175000, meta: 150000, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    {
      id: 'qui-sab-dom',
      categoria: 'vendas',
      nome: 'QUI+SÁB+DOM',
      descricao: 'Faturamento nos dias de maior movimento',
      unidade: 'R$',
      meta: 80000,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 75000, meta: 80000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 78000, meta: 80000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 82000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 79000, meta: 80000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 81000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 77000, meta: 80000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 83000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 85000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 81000, meta: 80000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 84000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 86000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 82000, meta: 80000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 87000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 89000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 85000, meta: 80000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 88000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 90000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 86000, meta: 80000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 91000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 93000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 89000, meta: 80000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 92000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 94000, meta: 80000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 90000, meta: 80000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 95000, meta: 80000, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 780000, meta: 800000, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 820000, meta: 800000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 840000, meta: 800000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 860000, meta: 800000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 880000, meta: 800000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 900000, meta: 800000, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    
    // Cockpit Marketing
    {
      id: 'posts-org',
      categoria: 'marketing',
      nome: '[O] Nº de Posts',
      descricao: 'Número de posts orgânicos',
      unidade: 'posts',
      meta: 30,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 25, meta: 30, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 28, meta: 30, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 32, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 29, meta: 30, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 31, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 27, meta: 30, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 33, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 35, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 31, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 34, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 36, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 32, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 37, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 39, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 35, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 38, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 40, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 36, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 41, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 43, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 39, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 42, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 44, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 40, meta: 30, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 45, meta: 30, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 28, meta: 30, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 31, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 33, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 35, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 37, meta: 30, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 39, meta: 30, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    {
      id: 'alcance-org',
      categoria: 'marketing',
      nome: '[O] Alcance',
      descricao: 'Alcance orgânico',
      unidade: 'pessoas',
      meta: 50000,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 45000, meta: 50000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 48000, meta: 50000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 52000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 49000, meta: 50000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 51000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 47000, meta: 50000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 53000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 55000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 51000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 54000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 56000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 52000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 57000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 59000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 55000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 58000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 60000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 56000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 61000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 63000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 59000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 62000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 64000, meta: 50000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 60000, meta: 50000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 65000, meta: 50000, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 480000, meta: 500000, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 520000, meta: 500000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 540000, meta: 500000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 560000, meta: 500000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 580000, meta: 500000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 600000, meta: 500000, status: 'acima', tendencia: 'crescendo' }
        ]
      }
    },
    {
      id: 'interacao-org',
      categoria: 'marketing',
      nome: '[O] Interação',
      descricao: 'Interações orgânicas',
      unidade: 'interações',
      meta: 2000,
      dados: {
        semanais: [
          { semana: 'Semana 5', valor: 1800, meta: 2000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 6', valor: 1900, meta: 2000, status: 'abaixo', tendencia: 'crescendo' },
          { semana: 'Semana 7', valor: 2100, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 8', valor: 1950, meta: 2000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 9', valor: 2050, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 10', valor: 1850, meta: 2000, status: 'abaixo', tendencia: 'decrescendo' },
          { semana: 'Semana 11', valor: 2150, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 12', valor: 2250, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 13', valor: 2050, meta: 2000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 14', valor: 2200, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 15', valor: 2300, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 16', valor: 2100, meta: 2000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 17', valor: 2350, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 18', valor: 2450, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 19', valor: 2250, meta: 2000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 20', valor: 2400, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 21', valor: 2500, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 22', valor: 2300, meta: 2000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 23', valor: 2550, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 24', valor: 2650, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 25', valor: 2450, meta: 2000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 26', valor: 2600, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 27', valor: 2700, meta: 2000, status: 'acima', tendencia: 'crescendo' },
          { semana: 'Semana 28', valor: 2500, meta: 2000, status: 'acima', tendencia: 'decrescendo' },
          { semana: 'Semana 29', valor: 2750, meta: 2000, status: 'acima', tendencia: 'crescendo' }
        ],
        mensais: [
          { mes: 'Fevereiro', valor: 19000, meta: 20000, status: 'abaixo', tendencia: 'crescendo' },
          { mes: 'Março', valor: 21000, meta: 20000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Abril', valor: 22000, meta: 20000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Maio', valor: 23000, meta: 20000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Junho', valor: 24000, meta: 20000, status: 'acima', tendencia: 'crescendo' },
          { mes: 'Julho', valor: 25000, meta: 20000, status: 'acima', tendencia: 'crescendo' }
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
