'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { getSupabaseClient } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface DadosMensal {
  mes: string
  ano: number
  faturamento: number
  clientes: number
  ticketMedio: number
  reservas: number
  tempoCozinha: number
  tempoBar: number
}

interface MetasConfig {
  metaMensalFaturamento: number
  metaMensalClientes: number
  ticketMedioTarget: number
  reservasMensais: number
  tempoSaidaCozinha: number
  tempoSaidaBar: number
}

interface PagamentoData {
  dt_gerencial: string
  liquido: string | number
}

interface PessoasData {
  dt_gerencial: string
  total_pessoas_bruto: string | number
  pessoas_pagantes: string | number
}

interface TempoData {
  dia: number
  t0_t2?: number
  t0_t3?: number
}

export default function MetricasBarrasPage() {
  const { selectedBar } = useBar()
  
  const [anoSelecionado, setAnoSelecionado] = useState(2025)
  const [dadosMensais, setDadosMensais] = useState<DadosMensal[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<{metrica: string, index: number} | null>(null)
  const [metas, setMetas] = useState<MetasConfig>({
    metaMensalFaturamento: 150000,
    metaMensalClientes: 2400,
    ticketMedioTarget: 93,
    reservasMensais: 4000,
    tempoSaidaCozinha: 12,
    tempoSaidaBar: 4
  })

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const metricas = [
    { key: 'faturamento', label: 'Faturamento', icon: '💰', unit: 'R$', color: 'blue', metaKey: 'metaMensalFaturamento' },
    { key: 'clientes', label: 'Clientes', icon: '👥', unit: '', color: 'green', metaKey: 'metaMensalClientes' },
    { key: 'ticketMedio', label: 'Ticket Médio', icon: '🎯', unit: 'R$', color: 'purple', metaKey: 'ticketMedioTarget' },
    { key: 'reservas', label: 'Reservas', icon: '📅', unit: 'pessoas', color: 'orange', metaKey: 'reservasMensais' },
    { key: 'tempoCozinha', label: 'Tempo Cozinha', icon: '👨‍🍳', unit: 'min', color: 'red', metaKey: 'tempoSaidaCozinha' },
    { key: 'tempoBar', label: 'Tempo Bar', icon: '🍹', unit: 'min', color: 'cyan', metaKey: 'tempoSaidaBar' }
  ]

  // Carregar metas
  useEffect(() => {
    const metasConfig = localStorage.getItem('metas-config')
    if (metasConfig) {
      const config = JSON.parse(metasConfig)
      setMetas(config)
    }
  }, [])

  const buscarDadosMensais = async () => {
    if (!selectedBar) {
      alert('Por favor, selecione um bar primeiro!')
      return
    }

    setLoading(true)
    
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('❌ Erro ao conectar com banco');
      setLoading(false);
      return;
    }
    
    try {
      console.log('📊 Buscando dados mensais CORRETOS para', anoSelecionado, '(Sympla + Yuzer + Contahub)')
      
      const dadosCompletos: DadosMensal[] = []
      
      for (let mes = 1; mes <= 12; mes++) {
        console.log(`📅 Processando ${meses[mes - 1]} (${mes}/12)...`)
        
        const dataInicio = `${anoSelecionado}-${mes.toString().padStart(2, '0')}-01`
        const ultimoDiaMes = new Date(anoSelecionado, mes, 0).getDate()
        const dataFim = `${anoSelecionado}-${mes.toString().padStart(2, '0')}-${ultimoDiaMes}`
        
        // BUSCAR FATURAMENTO CORRETO: Usar chunking na tabela pagamentos (Sympla + Yuzer + Contahub)
        console.log(`💰 Buscando faturamento CORRETO para ${meses[mes - 1]}: ${dataInicio} até ${dataFim}`)
        
        const CHUNK_SIZE = 1000
        let allFaturamentoData: PagamentoData[] = []
        let offset = 0
        let hasMore = true
        
        while (hasMore) {
          const { data: chunk, error } = await supabase
            .from('pagamentos')
            .select('dt_gerencial, liquido')
            .eq('bar_id', selectedBar.id)
            .gte('dt_gerencial', dataInicio)
            .lte('dt_gerencial', dataFim)
            .not('liquido', 'is', null)  // Excluir Conta Assinada
            .order('dt_gerencial')
            .range(offset, offset + CHUNK_SIZE - 1)

          if (error || !chunk || chunk.length === 0) {
            hasMore = false
            break
          }

          allFaturamentoData = allFaturamentoData.concat(chunk)
          
          if (chunk.length < CHUNK_SIZE) {
            hasMore = false
          } else {
            offset += CHUNK_SIZE
          }
        }
        
        const faturamento = allFaturamentoData.reduce((sum: number, item: PagamentoData) => sum + parseFloat(String(item.liquido) || '0'), 0)
        console.log(`💰 ${meses[mes - 1]}: R$ ${faturamento.toLocaleString('pt-BR')} (${allFaturamentoData.length} registros)`)

        // BUSCAR CLIENTES CORRETOS: Usar dados agregados (Sympla + Yuzer)
        console.log(`👥 Buscando clientes CORRETOS para ${meses[mes - 1]}`)
        
        const { data: clientesData, error: clientesError } = await supabase
          .from('pessoas_diario_corrigido')
          .select('dt_gerencial, total_pessoas_bruto, pessoas_pagantes')
          .gte('dt_gerencial', dataInicio)
          .lte('dt_gerencial', dataFim)
          .order('dt_gerencial')

        let clientes = 0
        let clientesPagantes = 0
        
        if (!clientesError && clientesData) {
          clientes = clientesData.reduce((sum: number, item: PessoasData) => sum + parseInt(String(item.total_pessoas_bruto) || '0'), 0)
          clientesPagantes = clientesData.reduce((sum: number, item: PessoasData) => sum + parseInt(String(item.pessoas_pagantes) || '0'), 0)
          console.log(`👥 ${meses[mes - 1]}: ${clientes} pessoas totais, ${clientesPagantes} pagantes`)
        }
        
        // TICKET MÉDIO CORRETO: Faturamento / Pessoas Pagantes
        const ticketMedio = clientesPagantes > 0 ? faturamento / clientesPagantes : 0

        // BUSCAR RESERVAS CORRETAS: GetIn API com dados agregados por período
        console.log(`📅 Buscando reservas GetIn para ${meses[mes - 1]}`)
        
        let reservas = 0
        try {
          const response = await fetch(`/api/dashboard/reservas-getin?data_inicio=${dataInicio}&data_fim=${dataFim}&tipo=periodo`)
          const result = await response.json()
          
          if (result.success && result.data?.estatisticas) {
            reservas = result.data.estatisticas.total_pessoas || 0
            console.log(`📅 ${meses[mes - 1]}: ${reservas} pessoas reservadas (${result.data.estatisticas.total_reservas || 0} reservas)`)
          } else {
            console.log(`📅 ${meses[mes - 1]}: Nenhuma reserva encontrada`)
          }
        } catch (error) {
          console.error(`❌ Erro ao buscar reservas para ${meses[mes - 1]}:`, error)
        }

        // BUSCAR TEMPOS CORRETOS: Usar chunking + filtros inteligentes
        console.log(`⏱️ Buscando tempos CORRETOS para ${meses[mes - 1]}`)
        
        const dataInicioInt = parseInt(dataInicio.replace(/-/g, ''))
        const dataFimInt = parseInt(dataFim.replace(/-/g, ''))

        // TEMPO COZINHA com chunking
        let allTempoCozinhaData: TempoData[] = []
        offset = 0
        hasMore = true
        
        while (hasMore) {
          const { data: chunk, error } = await supabase
            .from('tempo')
            .select('dia, t0_t2')
            .eq('bar_id', selectedBar.id)
            .gte('dia', dataInicioInt)
            .lte('dia', dataFimInt)
            .not('t0_t2', 'is', null)
            .gt('t0_t2', 60)      // Mínimo 1 minuto
            .lt('t0_t2', 2700)    // Máximo 45 minutos
            .order('dia')
            .range(offset, offset + CHUNK_SIZE - 1)

          if (error || !chunk || chunk.length === 0) {
            hasMore = false
            break
          }

          allTempoCozinhaData = allTempoCozinhaData.concat(chunk)
          
          if (chunk.length < CHUNK_SIZE) {
            hasMore = false
          } else {
            offset += CHUNK_SIZE
          }
        }

        // TEMPO BAR com chunking
        let allTempoBarData: TempoData[] = []
        offset = 0
        hasMore = true
        
        while (hasMore) {
          const { data: chunk, error } = await supabase
            .from('tempo')
            .select('dia, t0_t3')
            .eq('bar_id', selectedBar.id)
            .gte('dia', dataInicioInt)
            .lte('dia', dataFimInt)
            .not('t0_t3', 'is', null)
            .gt('t0_t3', 30)      // Mínimo 0.5 minutos
            .lt('t0_t3', 1200)    // Máximo 20 minutos
            .order('dia')
            .range(offset, offset + CHUNK_SIZE - 1)

          if (error || !chunk || chunk.length === 0) {
            hasMore = false
            break
          }

          allTempoBarData = allTempoBarData.concat(chunk)
          
          if (chunk.length < CHUNK_SIZE) {
            hasMore = false
          } else {
            offset += CHUNK_SIZE
          }
        }

        // Processar tempos com filtros adicionais e remoção de outliers
        let tempoCozinha = 0
        if (allTempoCozinhaData.length >= 3) {
          const temposValidosCozinha = allTempoCozinhaData
            .map((item: TempoData) => parseInt(String(item.t0_t2)) / 60) // Converter para minutos
            .filter(tempo => tempo >= 1 && tempo <= 45) // Filtro adicional
            .sort((a, b) => a - b)
          
          if (temposValidosCozinha.length >= 3) {
            // Remover 10% inferior e superior (outliers)
            const inicio = Math.floor(temposValidosCozinha.length * 0.1)
            const fim = Math.ceil(temposValidosCozinha.length * 0.9)
            const temposFiltrados = temposValidosCozinha.slice(inicio, fim)
            
            tempoCozinha = temposFiltrados.reduce((sum, tempo) => sum + tempo, 0) / temposFiltrados.length
          }
        }

        let tempoBar = 0
        if (allTempoBarData.length >= 3) {
          const temposValidosBar = allTempoBarData
            .map((item: TempoData) => parseInt(String(item.t0_t3)) / 60) // Converter para minutos
            .filter(tempo => tempo >= 0.5 && tempo <= 20) // Filtro adicional
            .sort((a, b) => a - b)
          
          if (temposValidosBar.length >= 3) {
            // Remover 10% inferior e superior (outliers)
            const inicio = Math.floor(temposValidosBar.length * 0.1)
            const fim = Math.ceil(temposValidosBar.length * 0.9)
            const temposFiltrados = temposValidosBar.slice(inicio, fim)
            
            tempoBar = temposFiltrados.reduce((sum, tempo) => sum + tempo, 0) / temposFiltrados.length
          }
        }

        console.log(`⏱️ ${meses[mes - 1]}: Cozinha ${tempoCozinha.toFixed(1)}min (${allTempoCozinhaData.length} registros), Bar ${tempoBar.toFixed(1)}min (${allTempoBarData.length} registros)`)

        dadosCompletos.push({
          mes: meses[mes - 1],
          ano: anoSelecionado,
          faturamento,
          clientes,
          ticketMedio,
          reservas,
          tempoCozinha,
          tempoBar
        })
      }

      console.log('✅ DADOS MENSAIS CORRETOS processados com sucesso!')
      console.log('📊 Resumo do processamento:')
      dadosCompletos.forEach(mes => {
        console.log(`   ${mes.mes}: Fat R$ ${mes.faturamento.toLocaleString('pt-BR')}, ${mes.clientes} clientes, TM R$ ${mes.ticketMedio.toFixed(2)}, ${mes.reservas} reservas`)
      })
      
      setDadosMensais(dadosCompletos)
      
    } catch (error) {
      console.error('❌ Erro ao buscar dados mensais:', error)
      setDadosMensais([])
    } finally {
      setLoading(false)
    }
  }

  const getCorMetrica = (metrica: string) => {
    const cores: { [key: string]: string } = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f59e0b',
      red: '#ef4444',
      cyan: '#06b6d4'
    }
    const info = metricas.find(m => m.key === metrica)
    return cores[info?.color || 'blue']
  }

      return (
      <ProtectedRoute requiredModule="dashboard_metricas_barras">
        <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">📊 Dashboard - Métricas Mensais Comparativas</h1>
          <p className="text-slate-600">Comparação lado a lado das métricas mensais do {selectedBar?.nome}</p>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">🎯 Configurações da Análise</h3>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ano</label>
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              >
                <option value={2025} className="text-gray-900 bg-white">2025</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={buscarDadosMensais}
                disabled={loading || !selectedBar}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Carregando...' : '🔍 Analisar'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : dadosMensais.length > 0 ? (
          <>
            {/* Resumo Anual */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">📈 Resumo Anual {anoSelecionado}</h3>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {metricas.map(metrica => {
                  const total = dadosMensais.reduce((sum, mes) => sum + (mes[metrica.key as keyof DadosMensal] as number), 0)
                  const media = total / dadosMensais.filter(mes => (mes[metrica.key as keyof DadosMensal] as number) > 0).length
                  const metaAnual = (metas[metrica.metaKey as keyof MetasConfig] as number) * (metrica.key === 'faturamento' || metrica.key === 'clientes' || metrica.key === 'reservas' ? 12 : 1)
                  const percentual = metaAnual > 0 ? (total / metaAnual) * 100 : 0
                  
                  return (
                    <div key={metrica.key} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl mb-2">{metrica.icon}</div>
                      <h4 className="text-xs font-medium text-slate-600 mb-1">{metrica.label}</h4>
                      <p className="text-lg font-bold text-slate-800">
                        {metrica.unit === 'R$' ? 'R$ ' : ''}{(metrica.key === 'tempoCozinha' || metrica.key === 'tempoBar' || metrica.key === 'ticketMedio' ? media : total).toLocaleString('pt-BR', { 
                          minimumFractionDigits: metrica.unit === 'R$' ? 0 : metrica.unit === 'min' ? 1 : 0 
                        })} {metrica.unit !== 'R$' ? metrica.unit : ''}
                      </p>
                      <p className={`text-xs font-medium ${percentual >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {percentual.toFixed(1)}% da meta
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Gráficos de Barras por Métrica */}
            {metricas.map(metrica => {
              const maxValor = Math.max(...dadosMensais.map(mes => mes[metrica.key as keyof DadosMensal] as number), metas[metrica.metaKey as keyof MetasConfig] as number)
              
              return (
                <div key={metrica.key} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <span className="text-2xl mr-3">{metrica.icon}</span>
                    {metrica.label} - Comparação Mensal {anoSelecionado}
                  </h3>
                  
                  <div className="space-y-4">
                    {dadosMensais.map((dados: { mes: string; valor: number }, index: number) => {
                      const valor = dados.valor
                      const meta = metas[metrica.metaKey as keyof MetasConfig] as number
                      const largura = maxValor > 0 ? (valor / maxValor) * 100 : 0
                      // Para tempos (cozinha e bar), menor é melhor - inverter lógica
                      const acimaMeta = (metrica.key === 'tempoCozinha' || metrica.key === 'tempoBar') 
                        ? valor <= meta 
                        : valor >= meta
                      
                      return (
                        <div key={index} className="flex items-center space-x-4">
                          <div className="w-24 text-sm font-medium text-slate-700">
                            {dados.mes}
                          </div>
                          <div 
                            className="flex-1 relative cursor-pointer"
                            onMouseEnter={() => setHoveredItem({metrica: metrica.key, index})}
                            onMouseLeave={() => setHoveredItem(null)}
                          >
                            <div className="w-full bg-gray-200 rounded-full h-8 relative">
                              <div 
                                className={`h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                                  hoveredItem?.metrica === metrica.key && hoveredItem?.index === index ? 'opacity-80' : ''
                                }`}
                                style={{ 
                                  width: `${largura}%`,
                                  backgroundColor: getCorMetrica(metrica.color),
                                  opacity: acimaMeta ? (hoveredItem?.metrica === metrica.key && hoveredItem?.index === index ? 0.8 : 1) : (hoveredItem?.metrica === metrica.key && hoveredItem?.index === index ? 0.6 : 0.7)
                                }}
                              >
                                {largura > 15 && (
                                  <span className="text-white text-xs font-medium">
                                    {metrica.unit === 'R$' ? 'R$ ' : ''}{valor.toLocaleString('pt-BR', { 
                                      minimumFractionDigits: metrica.unit === 'R$' ? 0 : metrica.unit === 'min' ? 1 : 0 
                                    })} {metrica.unit !== 'R$' ? metrica.unit : ''}
                                  </span>
                                )}
                              </div>
                              {/* Linha da meta */}
                              {meta > 0 && (
                                <div 
                                  className="absolute top-0 h-8 w-0.5 bg-red-600 z-10"
                                  style={{ left: `${(meta / maxValor) * 100}%` }}
                                  title={`Meta: ${meta.toLocaleString('pt-BR')}`}
                                ></div>
                              )}
                            </div>
                            
                            {/* Tooltip */}
                            {hoveredItem?.metrica === metrica.key && hoveredItem?.index === index && (
                              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-20 whitespace-nowrap">
                                <div className="text-xs">
                                  <div className="font-semibold">
                                    {dados.mes} {anoSelecionado}
                                  </div>
                                  <div className="mt-1">
                                    <span className="text-blue-300">Realizado:</span> 
                                    <span className="font-semibold ml-1">
                                      {metrica.unit === 'R$' ? 'R$ ' : ''}{valor.toLocaleString('pt-BR', { 
                                        minimumFractionDigits: metrica.unit === 'R$' ? 2 : metrica.unit === 'min' ? 1 : 0 
                                      })} {metrica.unit !== 'R$' ? metrica.unit : ''}
                                    </span>
                                  </div>
                                  {meta > 0 && (
                                    <div>
                                      <span className="text-red-300">Meta:</span> 
                                      <span className="font-semibold ml-1">
                                        {metrica.unit === 'R$' ? 'R$ ' : ''}{meta.toLocaleString('pt-BR', { 
                                          minimumFractionDigits: metrica.unit === 'R$' ? 2 : metrica.unit === 'min' ? 1 : 0 
                                        })} {metrica.unit !== 'R$' ? metrica.unit : ''}
                                      </span>
                                    </div>
                                  )}
                                  <div className="mt-1 pt-1 border-t border-gray-600">
                                    <span className={`font-semibold ${acimaMeta ? 'text-green-300' : 'text-red-300'}`}>
                                      {(metrica.key === 'tempoCozinha' || metrica.key === 'tempoBar') 
                                        ? (acimaMeta ? '✅ Dentro da meta' : '❌ Fora da meta')
                                        : (acimaMeta ? '✅ Acima da meta' : '❌ Abaixo da meta')
                                      }
                                      {meta > 0 && (
                                        <span className="ml-1">
                                          ({((valor / meta) * 100).toFixed(1)}%)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                                {/* Seta do tooltip */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                              </div>
                            )}
                          </div>
                          <div className="w-32 text-right">
                            <div className="text-sm font-medium text-slate-700">
                              {metrica.unit === 'R$' ? 'R$ ' : ''}{valor.toLocaleString('pt-BR', { 
                                minimumFractionDigits: metrica.unit === 'R$' ? 0 : metrica.unit === 'min' ? 1 : 0 
                              })} {metrica.unit !== 'R$' ? metrica.unit : ''}
                            </div>
                            <div className={`text-xs ${acimaMeta ? 'text-green-600' : 'text-red-600'}`}>
                              {meta > 0 ? `${((valor / meta) * 100).toFixed(1)}% da meta` : ''}
                            </div>
                          </div>
                          <div className="w-8">
                            {valor > 0 ? (acimaMeta ? '✅' : '⚠️') : '❌'}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Legenda e estatísticas */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-0.5 bg-red-600"></div>
                          <span className="text-xs text-slate-600">Meta: {metrica.unit === 'R$' ? 'R$ ' : ''}{(metas[metrica.metaKey as keyof MetasConfig] as number).toLocaleString('pt-BR')} {metrica.unit !== 'R$' ? metrica.unit : ''}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {(() => {
                          const mesesComDados = dadosMensais.filter(mes => (mes[metrica.key as keyof DadosMensal] as number) > 0)
                          const mesesAcimaMeta = mesesComDados.filter(mes => (mes[metrica.key as keyof DadosMensal] as number) >= (metas[metrica.metaKey as keyof MetasConfig] as number))
                          return `${mesesAcimaMeta.length}/${mesesComDados.length} meses acima da meta`
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Insights Comparativos */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">🔍 Insights Comparativos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700">🏆 Melhores Meses</h4>
                  {metricas.slice(0, 3).map(metrica => {
                    const melhorMes = dadosMensais.reduce((max, mes) => 
                      (mes[metrica.key as keyof DadosMensal] as number) > (max[metrica.key as keyof DadosMensal] as number) ? mes : max
                    )
                    return (
                      <div key={metrica.key} className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">{metrica.icon} {metrica.label}:</span>
                        <span className="text-sm font-medium text-slate-800">{melhorMes.mes}</span>
                      </div>
                    )
                  })}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700">📊 Performance Geral</h4>
                  {(() => {
                    const totalMetas = metricas.length
                    const metasAtingidas = metricas.filter(metrica => {
                      const total = dadosMensais.reduce((sum, mes) => sum + (mes[metrica.key as keyof DadosMensal] as number), 0)
                      const metaAnual = (metas[metrica.metaKey as keyof MetasConfig] as number) * (metrica.key === 'faturamento' || metrica.key === 'clientes' || metrica.key === 'reservas' ? 12 : 1)
                      return total >= metaAnual
                    }).length
                    
                    return (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">
                          <span className="font-medium">{metasAtingidas}/{totalMetas}</span> metas anuais atingidas
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(metasAtingidas / totalMetas) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Selecione um ano para análise</h3>
            <p className="text-slate-500">
              Escolha o ano que deseja analisar e clique em &quot;Analisar&quot; para visualizar a comparação mensal.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 
