import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// Datas de início da entrada obrigatória
const DATAS_ENTRADA = {
  quarta: '2025-11-19', // Quarta-feira
  sexta: '2025-11-14'   // Sexta-feira (primeira sexta após 13/11)
}

export const dynamic = 'force-dynamic'

// Função para buscar todos os dados com paginação
async function buscarTodosOsDados(
  supabase: any, 
  barId: number, 
  dataInicio: string, 
  dataFim?: string
) {
  const PAGE_SIZE = 1000
  let offset = 0
  let allData: any[] = []
  let iterations = 0
  const MAX_ITERATIONS = 200

  console.log(`📥 Buscando dados: bar_id=${barId}, inicio=${dataInicio}, fim=${dataFim || 'atual'}`)

  while (iterations < MAX_ITERATIONS) {
    iterations++
    
    let query = supabase
      .from('contahub_vendas')
      .select('vd_cpf, vd_vrcheio, vd_vrdescontos, dt_gerencial')
      .eq('bar_id', barId)
      .gte('dt_gerencial', dataInicio)
    
    if (dataFim) {
      query = query.lt('dt_gerencial', dataFim)
    }
    
    query = query.range(offset, offset + PAGE_SIZE - 1)
    
    const { data, error } = await query
    
    if (error) {
      console.error(`❌ Erro na página ${iterations}:`, error)
      break
    }
    
    if (!data || data.length === 0) {
      console.log(`✅ Busca completa após ${iterations} páginas (${allData.length} registros)`)
      break
    }
    
    allData = allData.concat(data)
    
    if (data.length < PAGE_SIZE) {
      console.log(`✅ Última página: ${data.length} registros (total: ${allData.length})`)
      break
    }
    
    offset += PAGE_SIZE
    
    // Log de progresso a cada 10 páginas
    if (iterations % 10 === 0) {
      console.log(`📊 Página ${iterations}: ${allData.length} registros...`)
    }
  }

  return allData
}

export async function GET() {
  try {
    const supabase = await getAdminClient()
    const barId = 3 // Bar principal
    
    console.log('🚀 Iniciando análise de couvert...')
    const startTime = Date.now()

    // ========== BUSCAR TODOS OS DADOS COM PAGINAÇÃO ==========
    
    // Buscar dados desde setembro 2025
    const todosDados = await buscarTodosOsDados(supabase, barId, '2025-09-01')
    
    console.log(`📊 Total de registros: ${todosDados.length}`)

    // ========== FILTRAR POR DIA DA SEMANA ==========
    
    // Quartas (DOW = 3) - ANTES da entrada
    const quartasAntes = todosDados.filter(r => {
      const data = new Date(r.dt_gerencial + 'T12:00:00Z')
      return data.getUTCDay() === 3 && r.dt_gerencial < DATAS_ENTRADA.quarta
    })

    // Quartas (DOW = 3) - DEPOIS da entrada
    const quartasDepois = todosDados.filter(r => {
      const data = new Date(r.dt_gerencial + 'T12:00:00Z')
      return data.getUTCDay() === 3 && r.dt_gerencial >= DATAS_ENTRADA.quarta
    })

    // Sextas (DOW = 5) - ANTES da entrada
    const sextasAntes = todosDados.filter(r => {
      const data = new Date(r.dt_gerencial + 'T12:00:00Z')
      return data.getUTCDay() === 5 && r.dt_gerencial < DATAS_ENTRADA.sexta
    })

    // Sextas (DOW = 5) - DEPOIS da entrada
    const sextasDepois = todosDados.filter(r => {
      const data = new Date(r.dt_gerencial + 'T12:00:00Z')
      return data.getUTCDay() === 5 && r.dt_gerencial >= DATAS_ENTRADA.sexta
    })

    console.log(`📊 Quartas: ${quartasAntes.length} antes, ${quartasDepois.length} depois`)
    console.log(`📊 Sextas: ${sextasAntes.length} antes, ${sextasDepois.length} depois`)

    // ========== CALCULAR MÉTRICAS ==========
    
    const calcularMetricas = (dados: any[]) => {
      if (!dados || dados.length === 0) {
        return {
          total_comandas: 0,
          total_dias: 0,
          comandas_por_dia: 0,
          clientes_unicos_total: 0,
          clientes_unicos_por_dia: 0,
          ticket_medio: 0,
          desconto_medio: 0,
          ticket_liquido: 0,
          faturamento_bruto_total: 0,
          faturamento_bruto_por_dia: 0,
          faturamento_liquido_total: 0,
          faturamento_liquido_por_dia: 0
        }
      }

      // Agrupar por data para calcular médias por dia
      const porData = new Map<string, any[]>()
      dados.forEach(d => {
        if (!porData.has(d.dt_gerencial)) {
          porData.set(d.dt_gerencial, [])
        }
        porData.get(d.dt_gerencial)!.push(d)
      })

      const totalDias = porData.size
      const cpfsUnicos = new Set(dados.filter(d => d.vd_cpf).map(d => d.vd_cpf))
      const totalVrCheio = dados.reduce((sum, d) => sum + (parseFloat(d.vd_vrcheio) || 0), 0)
      const totalDescontos = dados.reduce((sum, d) => sum + (parseFloat(d.vd_vrdescontos) || 0), 0)

      // Calcular clientes únicos por dia (média)
      let totalClientesPorDia = 0
      porData.forEach((registros) => {
        const clientesDia = new Set(registros.filter(r => r.vd_cpf).map(r => r.vd_cpf))
        totalClientesPorDia += clientesDia.size
      })

      return {
        total_comandas: dados.length,
        total_dias: totalDias,
        comandas_por_dia: Math.round((dados.length / totalDias) * 100) / 100,
        clientes_unicos_total: cpfsUnicos.size,
        clientes_unicos_por_dia: Math.round((totalClientesPorDia / totalDias) * 100) / 100,
        ticket_medio: Math.round((totalVrCheio / dados.length) * 100) / 100,
        desconto_medio: Math.round((totalDescontos / dados.length) * 100) / 100,
        ticket_liquido: Math.round(((totalVrCheio - totalDescontos) / dados.length) * 100) / 100,
        faturamento_bruto_total: Math.round(totalVrCheio * 100) / 100,
        faturamento_bruto_por_dia: Math.round((totalVrCheio / totalDias) * 100) / 100,
        faturamento_liquido_total: Math.round((totalVrCheio - totalDescontos) * 100) / 100,
        faturamento_liquido_por_dia: Math.round(((totalVrCheio - totalDescontos) / totalDias) * 100) / 100
      }
    }

    const calcularRecorrencia = (dadosAntes: any[], dadosDepois: any[]) => {
      const cpfsAntes = new Set(dadosAntes.filter(d => d.vd_cpf).map(d => d.vd_cpf))
      const cpfsDepois = new Set(dadosDepois.filter(d => d.vd_cpf).map(d => d.vd_cpf))
      
      let retornaram = 0
      let deixaramDeIr = 0
      let novosClientes = 0

      cpfsAntes.forEach(cpf => {
        if (cpfsDepois.has(cpf)) {
          retornaram++
        } else {
          deixaramDeIr++
        }
      })

      cpfsDepois.forEach(cpf => {
        if (!cpfsAntes.has(cpf)) {
          novosClientes++
        }
      })

      return {
        clientes_antes: cpfsAntes.size,
        clientes_depois: cpfsDepois.size,
        retornaram,
        deixaram_de_ir: deixaramDeIr,
        novos_clientes: novosClientes
      }
    }

    const calcularEvolucao = (dados: any[], dataLimite: string) => {
      const porData = new Map<string, any[]>()
      
      dados.forEach(d => {
        const data = d.dt_gerencial
        if (!porData.has(data)) {
          porData.set(data, [])
        }
        porData.get(data)!.push(d)
      })

      return Array.from(porData.entries())
        .map(([data, registros]) => ({
          data,
          periodo: data < dataLimite ? 'antes' : 'depois',
          comandas: registros.length,
          clientes: new Set(registros.filter(r => r.vd_cpf).map(r => r.vd_cpf)).size,
          ticket_medio: Math.round((registros.reduce((sum, r) => sum + (parseFloat(r.vd_vrcheio) || 0), 0) / registros.length) * 100) / 100,
          faturamento: Math.round(registros.reduce((sum, r) => sum + (parseFloat(r.vd_vrcheio) || 0), 0) * 100) / 100
        }))
        .sort((a, b) => a.data.localeCompare(b.data))
    }

    // Calcular baseline (set -> out)
    const calcularBaseline = (dados: any[], mes1Inicio: string, mes1Fim: string, mes2Inicio: string, mes2Fim: string) => {
      const dadosMes1 = dados.filter(d => d.dt_gerencial >= mes1Inicio && d.dt_gerencial < mes1Fim)
      const dadosMes2 = dados.filter(d => d.dt_gerencial >= mes2Inicio && d.dt_gerencial < mes2Fim)
      
      const cpfsMes1 = new Set(dadosMes1.filter(d => d.vd_cpf).map(d => d.vd_cpf))
      const cpfsMes2 = new Set(dadosMes2.filter(d => d.vd_cpf).map(d => d.vd_cpf))
      
      let retornaram = 0
      cpfsMes1.forEach(cpf => {
        if (cpfsMes2.has(cpf)) retornaram++
      })

      return {
        clientes_setembro: cpfsMes1.size,
        retornaram_outubro: retornaram
      }
    }

    // Todos os dados filtrados por dia
    const todasQuartas = [...quartasAntes, ...quartasDepois]
    const todasSextas = [...sextasAntes, ...sextasDepois]

    const tempoMs = Date.now() - startTime
    console.log(`✅ Análise completa em ${tempoMs}ms`)

    return NextResponse.json({
      success: true,
      datasEntrada: DATAS_ENTRADA,
      quartas: {
        ticket: [
          { periodo: 'antes', ...calcularMetricas(quartasAntes) },
          { periodo: 'depois', ...calcularMetricas(quartasDepois) }
        ],
        recorrencia: calcularRecorrencia(quartasAntes, quartasDepois),
        evolucao: calcularEvolucao(todasQuartas, DATAS_ENTRADA.quarta),
        baseline: calcularBaseline(todasQuartas, '2025-09-01', '2025-10-01', '2025-10-01', '2025-11-01')
      },
      sextas: {
        ticket: [
          { periodo: 'antes', ...calcularMetricas(sextasAntes) },
          { periodo: 'depois', ...calcularMetricas(sextasDepois) }
        ],
        recorrencia: calcularRecorrencia(sextasAntes, sextasDepois),
        evolucao: calcularEvolucao(todasSextas, DATAS_ENTRADA.sexta),
        baseline: calcularBaseline(todasSextas, '2025-09-01', '2025-10-01', '2025-10-01', '2025-11-01')
      },
      tempo_processamento_ms: tempoMs
    })

  } catch (error) {
    console.error('Erro na análise de couvert:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar dados de análise' 
    }, { status: 500 })
  }
}

