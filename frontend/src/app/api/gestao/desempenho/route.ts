import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

// Interfaces baseadas na estrutura da tabela
interface IndicadorDesempenho {
  id: string
  categoria: 'guardrail' | 'ovt' | 'qualidade' | 'produtos' | 'vendas' | 'marketing'
  nome: string
  descricao?: string
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
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') // 'semanal' ou 'mensal'
    
    const supabase = await getAdminClient()
    
    if (tipo === 'mensal') {
      // Buscar apenas dados mensais
      const { data: dadosMensais, error: errorMensais } = await supabase
        .from('tabela_desempenho_mensal')
        .select('*')
        .eq('ativo', true)
        .order('ordem_exibicao')
        .order('mes')

      if (errorMensais) {
        console.error('Erro ao buscar dados mensais:', errorMensais)
        return NextResponse.json(
          { error: 'Erro ao buscar dados mensais' },
          { status: 500 }
        )
      }

      // Agrupar dados mensais por indicador
      const indicadoresMap = new Map<string, any>()
      
      // Primeiro, criar todos os indicadores únicos
      dadosMensais?.forEach(registro => {
        const key = registro.indicador_id
        if (!indicadoresMap.has(key)) {
          indicadoresMap.set(key, {
            id: registro.indicador_id,
            categoria: registro.categoria,
            nome: registro.nome,
            descricao: registro.descricao || '',
            unidade: registro.unidade,
            meta: registro.meta,
            dados: {
              semanais: [],
              mensais: []
            }
          })
        }
      })
      
      // Depois, adicionar os dados mensais
      dadosMensais?.forEach(registro => {
        const indicador = indicadoresMap.get(registro.indicador_id)
        if (indicador) {
          indicador.dados.mensais.push({
            mes: registro.mes,
            valor: parseFloat(registro.valor),
            meta: parseFloat(registro.meta),
            status: registro.status,
            tendencia: registro.tendencia
          })
        }
      })

      // Converter para array e ordenar dados
      const indicadores: IndicadorDesempenho[] = Array.from(indicadoresMap.values()).map(indicador => ({
        ...indicador,
        dados: {
          semanais: [],
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
        const dadoMaisRecente = indicador.dados.mensais[0]
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

    } else {
      // Buscar apenas dados semanais (padrão)
      const { data: dadosSemanais, error: errorSemanais } = await supabase
        .from('tabela_desempenho')
        .select('*')
        .eq('ativo', true)
        .eq('tipo_periodo', 'semanal')
        .order('ordem_exibicao')
        .order('periodo')

      if (errorSemanais) {
        console.error('Erro ao buscar dados semanais:', errorSemanais)
        return NextResponse.json(
          { error: 'Erro ao buscar dados semanais' },
          { status: 500 }
        )
      }

      // Agrupar dados semanais por indicador
      const indicadoresMap = new Map<string, any>()
      
      dadosSemanais?.forEach(registro => {
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
        indicador.dados.semanais.push({
          semana: registro.periodo,
          valor: parseFloat(registro.valor),
          meta: parseFloat(registro.meta),
          status: registro.status,
          tendencia: registro.tendencia
        })
      })

      // Converter para array e ordenar dados
      const indicadores: IndicadorDesempenho[] = Array.from(indicadoresMap.values()).map(indicador => ({
        ...indicador,
        dados: {
          semanais: indicador.dados.semanais.sort((a: DadoSemanal, b: DadoSemanal) => 
            extrairNumeroSemana(b.semana) - extrairNumeroSemana(a.semana)
          ),
          mensais: []
        }
      }))

      // Calcular resumo
      const totalIndicadores = indicadores.length
      let acimaMeta = 0
      let abaixoMeta = 0
      let dentroMeta = 0

      indicadores.forEach(indicador => {
        const dadoMaisRecente = indicador.dados.semanais[0]
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
    }
    
  } catch (error) {
    console.error('Erro interno do servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 