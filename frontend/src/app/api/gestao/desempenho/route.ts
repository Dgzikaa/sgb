import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

// Interfaces baseadas na estrutura da tabela
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

// Função para mapear período para número da semana
function extrairNumeroSemana(periodo: string): number {
  const match = periodo.match(/Semana (\d+)/)
  return match ? parseInt(match[1]) : 0
}

// Função para mapear mês para número
function extrairNumeroMes(mes: string): number {
  const meses = {
    'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
    'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
    'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
  }
  return meses[mes as keyof typeof meses] || 0
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateUser(request)
  if (!authResult) {
    return authErrorResponse('Não autorizado')
  }

  try {
    const supabase = await getAdminClient()
    
    // Buscar todos os dados da tabela_desempenho
    const { data: dadosDesempenho, error } = await supabase
      .from('tabela_desempenho')
      .select('*')
      .eq('ativo', true)
      .order('ordem_exibicao')
      .order('tipo_periodo')
      .order('periodo')

    if (error) {
      console.error('Erro ao buscar dados de desempenho:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar dados de desempenho' },
        { status: 500 }
      )
    }

    if (!dadosDesempenho || dadosDesempenho.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado de desempenho encontrado' },
        { status: 404 }
      )
    }

    // Agrupar dados por indicador
    const indicadoresMap = new Map<string, any>()
    
    dadosDesempenho.forEach(registro => {
      const key = registro.indicador_id
      
      if (!indicadoresMap.has(key)) {
        indicadoresMap.set(key, {
          id: registro.indicador_id,
          categoria: registro.categoria,
          nome: registro.nome,
          descricao: registro.descricao,
          unidade: registro.unidade,
          meta: registro.meta,
          dados: {
            semanais: [],
            mensais: []
          }
        })
      }
      
      const indicador = indicadoresMap.get(key)
      
      if (registro.tipo_periodo === 'semanal') {
        indicador.dados.semanais.push({
          semana: registro.periodo,
          valor: parseFloat(registro.valor),
          meta: parseFloat(registro.meta), // Garantir que é número
          status: registro.status,
          tendencia: registro.tendencia
        })
      } else if (registro.tipo_periodo === 'mensal') {
        indicador.dados.mensais.push({
          mes: registro.periodo,
          valor: parseFloat(registro.valor),
          meta: parseFloat(registro.meta), // Garantir que é número
          status: registro.status,
          tendencia: registro.tendencia
        })
      }
    })

    // Converter para array e ordenar dados
    const indicadores: IndicadorDesempenho[] = Array.from(indicadoresMap.values()).map(indicador => ({
      ...indicador,
      dados: {
        // Ordenar semanais por número da semana (decrescente - da mais recente para mais antiga)
        semanais: indicador.dados.semanais.sort((a: DadoSemanal, b: DadoSemanal) => 
          extrairNumeroSemana(b.semana) - extrairNumeroSemana(a.semana)
        ),
        // Ordenar mensais por mês (decrescente - do mais recente para mais antigo)
        mensais: indicador.dados.mensais.sort((a: DadoMensal, b: DadoMensal) => 
          extrairNumeroMes(b.mes) - extrairNumeroMes(a.mes)
        )
      }
    }))

    // Calcular resumo
    const totalIndicadores = indicadores.length
    let acimaMeta = 0
    let abaixoMeta = 0
    let dentroMeta = 0

    indicadores.forEach(indicador => {
      // Pegar o dado mais recente (semanal ou mensal) para calcular o resumo
      const dadoMaisRecente = indicador.dados.semanais.length > 0 
        ? indicador.dados.semanais[0] 
        : indicador.dados.mensais[0]
      
      if (dadoMaisRecente) {
        switch (dadoMaisRecente.status) {
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
    })

    const resposta: RespostaDesempenho = {
      indicadores,
      resumo: {
        totalIndicadores,
        acimaMeta,
        abaixoMeta,
        dentroMeta
      }
    }

    return NextResponse.json(resposta)
    
  } catch (error) {
    console.error('Erro interno do servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 