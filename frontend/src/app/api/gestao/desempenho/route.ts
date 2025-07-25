import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

// Interfaces baseadas na planilha CSV
interface IndicadorDesempenho {
  id: string
  categoria: 'guardrail' | 'ovt' | 'qualidade' | 'produtos'
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
  const semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4']
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril']

  return [
    // GUARDRAIL - Indicadores Estratégicos
    {
      id: 'faturamento-total',
      categoria: 'guardrail',
      nome: 'Faturamento Total',
      descricao: 'Faturamento total do período',
      unidade: 'R$',
      meta: 50000,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 12000 + (i * 2000) + Math.random() * 3000,
          meta: 12500,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 48000 + (i * 5000) + Math.random() * 10000,
          meta: 50000,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'ticket-medio',
      categoria: 'guardrail',
      nome: 'Ticket Médio',
      descricao: 'Valor médio por cliente',
      unidade: 'R$',
      meta: 85,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 80 + (i * 2) + Math.random() * 10,
          meta: 85,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 82 + (i * 1.5) + Math.random() * 8,
          meta: 85,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'cmv-limpo',
      categoria: 'guardrail',
      nome: 'CMV Limpo %',
      descricao: 'Custo das Mercadorias Vendidas',
      unidade: '%',
      meta: 35,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 32 + (i * 0.5) + Math.random() * 6,
          meta: 35,
          status: Math.random() > 0.5 ? 'abaixo' : 'acima', // Quanto menor, melhor
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 33 + (i * 0.3) + Math.random() * 5,
          meta: 35,
          status: Math.random() > 0.5 ? 'abaixo' : 'acima',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'cmo',
      categoria: 'guardrail',
      nome: 'CMO%',
      descricao: 'Custo de Mão de Obra',
      unidade: '%',
      meta: 25,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 23 + (i * 0.3) + Math.random() * 4,
          meta: 25,
          status: Math.random() > 0.5 ? 'abaixo' : 'acima',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 24 + (i * 0.2) + Math.random() * 3,
          meta: 25,
          status: Math.random() > 0.5 ? 'abaixo' : 'acima',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'atracao-faturamento',
      categoria: 'guardrail',
      nome: 'Atração/Faturamento',
      descricao: 'Relação entre atração e faturamento',
      unidade: 'R$',
      meta: 120,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 115 + (i * 2) + Math.random() * 10,
          meta: 120,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 118 + (i * 1.5) + Math.random() * 8,
          meta: 120,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },

    // OVT - Outros Valores de Transformação
    {
      id: 'clientes-atendidos',
      categoria: 'ovt',
      nome: 'Clientes Atendidos',
      descricao: 'Total de clientes atendidos',
      unidade: 'clientes',
      meta: 600,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 140 + (i * 10) + Math.random() * 30,
          meta: 150,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 580 + (i * 50) + Math.random() * 100,
          meta: 600,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
      }
    },
    {
      id: 'clientes-ativos',
      categoria: 'ovt',
      nome: 'Clientes Ativos',
      descricao: 'Clientes que retornaram',
      unidade: 'clientes',
      meta: 180,
      dados: {
        semanais: semanas.map((semana, i) => ({
          semana,
          valor: 35 + (i * 3) + Math.random() * 10,
          meta: 37.5,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        })),
        mensais: meses.map((mes, i) => ({
          mes,
          valor: 175 + (i * 15) + Math.random() * 30,
          meta: 180,
          status: Math.random() > 0.5 ? 'acima' : 'abaixo',
          tendencia: ['crescendo', 'decrescendo', 'estavel'][Math.floor(Math.random() * 3)] as any
        }))
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
