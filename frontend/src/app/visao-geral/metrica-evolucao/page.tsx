'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { getSupabaseClient } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/ProtectedRoute'

interface DadosMetrica {
  data: string
  valor: number
  meta?: number
}

interface MetasConfig {
  faturamentoDiario: number
  clientesDiario: number
  ticketMedioTarget: number
  reservasDiarias: number
  tempoSaidaCozinha: number
  tempoSaidaBar: number
}

export default function MetricaEvolucaoPage() {
  const { selectedBar } = useBar()
  
  const [metricaSelecionada, setMetricaSelecionada] = useState('faturamento')
  const [periodoInicio, setPeriodoInicio] = useState(() => {
    // PerÃ­odo padrÃ£o baseado na mÃ©trica com dados mais recentes
    return '2025-02-01'  // Faturamento sempre comeÃ§a em 01/02
  })
  const [periodoFim, setPeriodoFim] = useState(() => {
    // Data fim sempre hoje - 1 dia
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    return ontem.toISOString().split('T')[0]
  })
  
  const [dadosEvolucao, setDadosEvolucao] = useState<DadosMetrica[]>([])
  const [loading, setLoading] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [metas, setMetas] = useState<MetasConfig>({
    faturamentoDiario: 37000, // Meta mais realista
    clientesDiario: 500,
    ticketMedioTarget: 93,
    reservasDiarias: 133,
    tempoSaidaCozinha: 12,
    tempoSaidaBar: 4
  })

  const metricas = [
    { value: 'faturamento', label: 'Faturamento', icon: 'ðŸ’°', unit: 'R$', color: 'blue', dataInicio: '2025-02-01' },
    { value: 'clientes', label: 'Clientes', icon: 'ðŸ‘¥', unit: '', color: 'green', dataInicio: '2025-01-31' },
    { value: 'ticket_medio', label: 'Ticket MÃ©dio', icon: 'ðŸŽ¯', unit: 'R$', color: 'purple', dataInicio: '2025-02-01' },
    { value: 'reservas', label: 'Reservas', icon: 'ðŸ“…', unit: 'pessoas', color: 'orange', dataInicio: '2025-02-06' },
    { value: 'tempo_cozinha', label: 'Tempo Cozinha', icon: 'ðŸ‘¨â€ðŸ³', unit: 'min', color: 'red', dataInicio: '2025-02-01' },
    { value: 'tempo_bar', label: 'Tempo Bar', icon: 'ðŸ¹', unit: 'min', color: 'cyan', dataInicio: '2025-02-01' }
  ]

  // Carregar metas do Supabase quando o bar mudar
  useEffect(() => {
    if (selectedBar) {
      carregarMetasDoSupabase()
    }
  }, [selectedBar])

  // **CORREÃ‡ÃƒO: Ajustar perÃ­odo APENAS na primeira seleÃ§Ã£o da mÃ©trica**
  const [jaAjustouPeriodo, setJaAjustouPeriodo] = useState(false)
  
  useEffect(() => {
    // SÃ³ ajustar automaticamente se ainda nÃ£o foi feito para esta mÃ©trica
    if (!jaAjustouPeriodo) {
      const metricaInfo = metricas.find((m: any) => m.value === metricaSelecionada)
      if (metricaInfo?.dataInicio) {
        console.log(`ðŸ“… Ajustando perÃ­odo inicial para mÃ©trica ${metricaSelecionada}: inÃ­cio em ${metricaInfo.dataInicio}`)
        setPeriodoInicio(metricaInfo.dataInicio)
        
        // CORREÃ‡ÃƒO ESPECIAL: Faturamento e Ticket MÃ©dio SEMPRE comeÃ§am em 01/02 (dados da tabela pagamentos)
        if (metricaSelecionada === 'faturamento' || metricaSelecionada === 'ticket_medio') {
          console.log('ðŸ’° ForÃ§ando data inicial para 01/02/2025 (dados de pagamentos) para', metricaSelecionada)
          setPeriodoInicio('2025-02-01')
        }
        
        setJaAjustouPeriodo(true) // Marcar que jÃ¡ ajustou
      }
    }
  }, [metricaSelecionada, metricas, jaAjustouPeriodo])

  const carregarMetasDoSupabase = async () => {
    if (!selectedBar) return

    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('âŒ Erro ao conectar com banco');
      return;
    }

    try {
      // Buscar metas do Supabase
      const { data: metasData, error: metasError } = await supabase
        .from('metas_negocio')
        .select('*')
        .eq('bar_id', selectedBar.id)

      if (metasError) {
        console.error('Erro ao buscar metas do Supabase:', metasError)
        return
      }

      if (metasData) {
        // Usar metas do banco de dados
        setMetas(prev => ({
          ...prev,
          faturamentoDiario: metasData.faturamento_diario || 37000,
          clientesDiario: metasData.clientes_diario || 500,
          ticketMedioTarget: metasData.ticket_medio_target || 93,
          reservasDiarias: metasData.reservas_diarias || 133,
          tempoSaidaCozinha: metasData.tempo_cozinha || 12,
          tempoSaidaBar: metasData.tempo_bar || 4
        }))
        console.log('âœ… Metas carregadas do Supabase para EvoluÃ§Ã£o:', metasData)
      } else {
        console.log('âš ï¸ Nenhuma meta encontrada no Supabase, usando padrÃµes')
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    }
  }

  const buscarDadosMetrica = async () => {
    if (!selectedBar) {
      alert('Por favor, selecione um bar primeiro!')
      return
    }

    setLoading(true)
    // Limpar dados anteriores imediatamente
    setDadosEvolucao([])

    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('âŒ Erro ao conectar com banco');
      setLoading(false);
      return;
    }
    
    try {
      console.log('ðŸ“Š Buscando evoluÃ§Ã£o da mÃ©trica:', metricaSelecionada)
      console.log('ðŸ“… PerÃ­odo solicitado:', periodoInicio, 'atÃ©', periodoFim)
      console.log('ðŸ¢ Bar ID:', selectedBar.id, '- Nome:', selectedBar.nome)
      
      // CORREÃ‡ÃƒO FORÃ‡ADA: Se for faturamento e data for antes de 01/02, corrigir
      let dataInicioCorrigida = periodoInicio
      if (metricaSelecionada === 'faturamento' && periodoInicio < '2025-02-01') {
        dataInicioCorrigida = '2025-02-01'
        console.log('ðŸ”§ CORRIGINDO data inicial de', periodoInicio, 'para', dataInicioCorrigida)
        setPeriodoInicio('2025-02-01')  // Atualizar o estado tambÃ©m
      }
      
      let dados: DadosMetrica[] = []
      
      if (metricaSelecionada === 'faturamento') {
        // ESTRATÃ‰GIA FINAL: Query SQL agregada para contornar limites do Supabase
        console.log('ðŸ” Buscando faturamento COMPLETO (ContaHub + Yuzer + Sympla) de', dataInicioCorrigida, 'atÃ©', periodoFim)
        
        try {
          // CORREÃ‡ÃƒO: Buscar dados de TODAS as fontes (ContaHub + Yuzer + Sympla)
          console.log('ðŸ’° Buscando faturamento de mÃºltiplas fontes...')
          
          // 1. FATURAMENTO CONTAHUB (tabela pagamentos)
          const { data: pagamentosData, error: pagamentosError } = await supabase
            .from('pagamentos')
            .select('dt_gerencial, liquido')
            .eq('bar_id', selectedBar.id)
            .gte('dt_gerencial', dataInicioCorrigida)
            .lte('dt_gerencial', periodoFim)
            .not('liquido', 'is', null)
            .order('dt_gerencial')

          console.log('ðŸ’° ContaHub:', pagamentosData?.length || 0, 'registros')

          // 2. FATURAMENTO YUZER (tabela yuzer_analitico)
          const { data: yuzerData, error: yuzerError } = await supabase
            .from('yuzer_analitico')
            .select('data_pedido, valor_total')
            .eq('bar_id', selectedBar.id)
            .gte('data_pedido', dataInicioCorrigida)
            .lte('data_pedido', periodoFim)
            .order('data_pedido')

          console.log('ðŸŽª Yuzer:', yuzerData?.length || 0, 'registros')

          // 3. FATURAMENTO SYMPLA (estimativa baseada em check-ins)
          const { data: symplaData, error: symplaError } = await supabase
            .from('cliente_visitas')
            .select('data_visita, pessoas_na_mesa')
            .eq('bar_id', selectedBar.id)
            .eq('tipo_visita', 'evento_sympla')
            .gte('data_visita', dataInicioCorrigida)
            .lte('data_visita', periodoFim)
            .order('data_visita')

          console.log('ðŸŽ« Sympla:', symplaData?.length || 0, 'registros')

          // PROCESSAR FATURAMENTO CONSOLIDADO
          const faturamentoPorDia: {[key: string]: number} = {}

          // ContaHub
          pagamentosData?.forEach((item: any) => {
            const data = item.dt_gerencial
            if (!faturamentoPorDia[data]) faturamentoPorDia[data] = 0
            faturamentoPorDia[data] += parseFloat(item.liquido || '0')
          })

          // Yuzer
          yuzerData?.forEach((item: any) => {
            const data = item.data_pedido
            if (!faturamentoPorDia[data]) faturamentoPorDia[data] = 0
            faturamentoPorDia[data] += parseFloat(item.valor_total || '0')
          })

          // Sympla (estimativa: R$ 50 por pessoa)
          symplaData?.forEach((item: any) => {
            const data = item.data_visita.split('T')[0] // Converter para YYYY-MM-DD
            if (!faturamentoPorDia[data]) faturamentoPorDia[data] = 0
            const pessoas = parseInt(item.pessoas_na_mesa || '1')
            faturamentoPorDia[data] += pessoas * 50 // Estimativa R$ 50 por pessoa
          })

          dados = Object.entries(faturamentoPorDia)
            .map(([data, valor]) => ({
              data,
              valor,
              meta: metas.faturamentoDiario
            }))
            .sort((a, b) => a.data.localeCompare(b.data))

          console.log('âœ… Faturamento COMPLETO (ContaHub + Yuzer + Sympla):', dados.length, 'dias')
          console.log('ðŸ“… PerÃ­odo:', dados[0]?.data, 'atÃ©', dados[dados.length - 1]?.data)
          console.log('ðŸ’° Amostra valores:', dados.slice(0, 5).map((d: any) => ({ 
            data: d.data, 
            valor: `R$ ${d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
          })))

        } catch (error) {
          console.error('âŒ Erro ao buscar faturamento completo:', error)
          dados = []
        }
      } 
      else if (metricaSelecionada === 'clientes') {
        // NOVA ESTRATÃ‰GIA: Buscar clientes de TODAS as fontes (ContaHub + Sympla + Yuzer)
        console.log('ðŸ” Buscando clientes COMPLETOS (ContaHub + Sympla + Yuzer) de', periodoInicio, 'atÃ©', periodoFim)
        
        try {
          console.log('ðŸ‘¥ Buscando clientes de mÃºltiplas fontes...')
          
          // 1. CLIENTES CONTAHUB (tabela periodo)
          const { data: periodoData, error: periodoError } = await supabase
            .from('periodo')
            .select('dt_gerencial, pessoas')
            .eq('bar_id', selectedBar.id)
            .gte('dt_gerencial', periodoInicio)
            .lte('dt_gerencial', periodoFim)
            .order('dt_gerencial')

          console.log('ðŸ¢ ContaHub:', periodoData?.length || 0, 'registros')

          // 2. CLIENTES YUZER (tabela yuzer_analitico - ingressos)
          const { data: yuzerData, error: yuzerError } = await supabase
            .from('yuzer_analitico')
            .select('data_pedido, quantidade')
            .eq('bar_id', selectedBar.id)
            .gte('data_pedido', periodoInicio)
            .lte('data_pedido', periodoFim)
            .ilike('produto_nome', '%ingresso%')
            .order('data_pedido')

          console.log('ðŸŽª Yuzer ingressos:', yuzerData?.length || 0, 'registros')

          // 3. CLIENTES SYMPLA (tabela cliente_visitas)
          const { data: symplaData, error: symplaError } = await supabase
            .from('cliente_visitas')
            .select('data_visita, pessoas_na_mesa')
            .eq('bar_id', selectedBar.id)
            .eq('tipo_visita', 'evento_sympla')
            .gte('data_visita', periodoInicio)
            .lte('data_visita', periodoFim)
            .order('data_visita')

          console.log('ðŸŽ« Sympla:', symplaData?.length || 0, 'registros')

          // PROCESSAR CLIENTES CONSOLIDADOS
          const clientesPorDia: {[key: string]: number} = {}

          // ContaHub
          periodoData?.forEach((item: any) => {
            const data = item.dt_gerencial
            if (!clientesPorDia[data]) clientesPorDia[data] = 0
            clientesPorDia[data] += parseInt(item.pessoas || '0')
          })

          // Yuzer (quantidade de ingressos)
          yuzerData?.forEach((item: any) => {
            const data = item.data_pedido
            if (!clientesPorDia[data]) clientesPorDia[data] = 0
            clientesPorDia[data] += parseInt(item.quantidade || '0')
          })

          // Sympla (pessoas que fizeram check-in)
          symplaData?.forEach((item: any) => {
            const data = item.data_visita.split('T')[0] // Converter para YYYY-MM-DD
            if (!clientesPorDia[data]) clientesPorDia[data] = 0
            clientesPorDia[data] += parseInt(item.pessoas_na_mesa || '1')
          })

          dados = Object.entries(clientesPorDia)
            .map(([data, valor]) => ({
              data,
              valor,
              meta: metas.clientesDiario
            }))
            .sort((a, b) => a.data.localeCompare(b.data))

          console.log('âœ… Clientes COMPLETOS (ContaHub + Sympla + Yuzer):', dados.length, 'dias')
          console.log('ðŸ“… PerÃ­odo:', dados[0]?.data, 'atÃ©', dados[dados.length - 1]?.data)
          console.log('ðŸ‘¥ Amostra valores:', dados.slice(0, 5).map((d: any) => ({ 
            data: d.data, 
            valor: `${d.valor} clientes` 
          })))

        } catch (error) {
          console.error('âŒ Erro ao buscar clientes completos:', error)
          dados = []
        }
      }
      else if (metricaSelecionada === 'ticket_medio') {
        // ESTRATÃ‰GIA APRIMORADA: Usar chunking para faturamento + dados agregados para clientes
        console.log('ðŸ” Buscando dados para ticket mÃ©dio de', periodoInicio, 'atÃ©', periodoFim)
        
        // CORREÃ‡ÃƒO FORÃ‡ADA: Ticket mÃ©dio segue faturamento - sÃ³ tem dados a partir de 01/02
        let dataInicioCorrigida = periodoInicio
        if (periodoInicio < '2025-02-01') {
          dataInicioCorrigida = '2025-02-01'
          console.log('ðŸ”§ CORRIGINDO ticket mÃ©dio data inicial de', periodoInicio, 'para', dataInicioCorrigida)
          setPeriodoInicio('2025-02-01')  // Atualizar o estado tambÃ©m
        }
        
        try {
          // ESTRATÃ‰GIA FINAL: Usar RPC SQL agregada para ticket mÃ©dio
          console.log('ðŸ” Buscando ticket mÃ©dio com RPC SQL agregada de', dataInicioCorrigida, 'atÃ©', periodoFim)
          
          try {
            // Usar RPC para fazer query SQL direta agregada COMPLETA (Yuzer + ContaHub + Sympla)
            const { data, error } = await supabase.rpc('get_ticket_medio_completo_por_dia', {
              p_bar_id: selectedBar.id,
              p_data_inicio: dataInicioCorrigida,
              p_data_fim: periodoFim
            })

            if (!error && data) {
              console.log('ðŸ“Š Dados de ticket mÃ©dio COMPLETO SQL agregados:', data.length, 'dias Ãºnicos')
              console.log('ðŸ“‹ Amostra:', data.slice(0, 3))
              console.log('ðŸ“‹ Ãšltimos:', data.slice(-3))
              
              dados = data.map((item: any) => ({
                data: item.dt_gerencial,
                valor: parseFloat(item.ticket_medio || '0'),
                meta: metas.ticketMedioTarget
              }))
              
              console.log('âœ… Ticket mÃ©dio COMPLETO via RPC (Yuzer + ContaHub + Sympla):', dados.length, 'dias')
              console.log('ðŸ“… PerÃ­odo:', dados[0]?.data, 'atÃ©', dados[dados.length - 1]?.data)
              console.log('ðŸŽ¯ Amostra valores:', dados.slice(0, 5).map((d: any) => ({ 
                data: d.data, 
                valor: `R$ ${Math.round(d.valor * 100) / 100}` 
              })))
            } else {
              console.error('âŒ RPC COMPLETO de ticket mÃ©dio falhou, usando fallback:', error)
              throw new Error('RPC nÃ£o disponÃ­vel')
            }
          } catch (rpcError) {
            console.log('ðŸ”„ Fallback: Processamento JavaScript para ticket mÃ©dio')
            
            // Fallback: Usar chunking para faturamento + dados agregados para clientes
            console.log('ðŸ’° Buscando faturamento com chunking para ticket mÃ©dio...')
            const CHUNK_SIZE = 1000
            let allFaturamentoData: any[] = []
            let offset = 0
            let hasMore = true
            
            while (hasMore) {
              console.log(`ðŸ“Š Buscando chunk ${offset/CHUNK_SIZE + 1} de faturamento (offset: ${offset})`)
              
              const { data: chunk, error } = await supabase
                .from('pagamentos')
                .select('dt_gerencial, liquido')
                .eq('bar_id', selectedBar.id)
                .gte('dt_gerencial', dataInicioCorrigida)
                .lte('dt_gerencial', periodoFim)
                .not('liquido', 'is', null)
                .order('dt_gerencial')
                .range(offset, offset + CHUNK_SIZE - 1)

              if (error) {
                console.error('âŒ Erro no chunk de faturamento:', error)
                break
              }

              if (chunk && chunk.length > 0) {
                allFaturamentoData = allFaturamentoData.concat(chunk)
                console.log(`âœ… Chunk ${offset/CHUNK_SIZE + 1}: ${chunk.length} registros (total: ${allFaturamentoData.length})`)
                
                if (chunk.length < CHUNK_SIZE) {
                  hasMore = false // Ãšltimo chunk
                } else {
                  offset += CHUNK_SIZE
                }
              } else {
                hasMore = false
              }
            }
            
            console.log('ðŸ’° TOTAL de registros de faturamento coletados:', allFaturamentoData.length)
            
            // 2. BUSCAR CLIENTES DOS DADOS DA TABELA PERIODO (que tem correlaÃ§Ã£o com faturamento)
            console.log('ðŸ‘¥ Buscando clientes da tabela periodo (fonte principal)...')
            const { data: clientesData, error: clientesError } = await supabase
              .from('periodo')
              .select('dt_gerencial, pessoas, vr_pagamentos')
              .eq('bar_id', selectedBar.id)
              .gte('dt_gerencial', dataInicioCorrigida)
              .lte('dt_gerencial', periodoFim)
              .order('dt_gerencial')

            if (clientesError) {
              console.error('âŒ Erro ao buscar clientes da tabela periodo:', clientesError)
              throw clientesError
            }
            
            console.log('ðŸ‘¥ Clientes da tabela periodo encontrados:', clientesData?.length || 0, 'registros')
            
            if (allFaturamentoData.length > 0 && clientesData && clientesData.length > 0) {
              // 3. PROCESSAR FATURAMENTO POR DIA
              const faturamentoPorDia = allFaturamentoData.reduce((acc: {[key: string]: number}, item) => {
                const data_str = item.dt_gerencial
                if (!acc[data_str]) acc[data_str] = 0
                acc[data_str] += parseFloat(item.liquido || '0')
                return acc
              }, {})
              
              console.log('ðŸ’° Dias Ãºnicos de faturamento processados:', Object.keys(faturamentoPorDia).length)
              
              // 4. PROCESSAR CLIENTES POR DIA (agrupar pessoas da tabela periodo)
              const clientesPorDia = clientesData.reduce((acc: {[key: string]: number}, item: any) => {
                const data = item.dt_gerencial
                
                if (!acc[data]) acc[data] = 0
                acc[data] += parseInt(item.pessoas || '0')
                
                return acc
              }, {})
              
              console.log('ðŸ‘¥ Dias Ãºnicos de clientes processados:', Object.keys(clientesPorDia).length)
              console.log('ðŸ‘¥ DEBUG - Clientes por dia:', clientesPorDia)
              
              // 5. CALCULAR TICKET MÃ‰DIO POR DIA
              console.log('ðŸ’° DEBUG - Faturamento por dia:', faturamentoPorDia)
              console.log('ðŸ‘¥ DEBUG - Clientes por dia antes do filtro:', clientesPorDia)
              
              // Verificar se hÃ¡ dados para o perÃ­odo especÃ­fico de marÃ§o
              const diasComDados = Object.keys(faturamentoPorDia).filter((data: any) => data >= '2025-03-01' && data <= '2025-03-04')
              console.log('ðŸ“… DEBUG - Dias com dados em marÃ§o (01-04):', diasComDados)
              
              dados = Object.keys(faturamentoPorDia)
                .filter((data: any) => {
                  const temClientes = clientesPorDia[data] > 0
                  const temFaturamento = faturamentoPorDia[data] > 0
                  
                  console.log(`ðŸ“Š DEBUG - ${data}: faturamento R$ ${faturamentoPorDia[data]?.toFixed(2) || '0.00'}, clientes ${clientesPorDia[data] || 0}, incluir: ${temClientes && temFaturamento}`)
                  
                  return temClientes && temFaturamento // SÃ³ dias com clientes E faturamento
                })
                .map((data: any) => {
                  const faturamento = faturamentoPorDia[data]
                  const clientes = clientesPorDia[data]
                  const ticketCalculado = faturamento / clientes
                  
                  console.log(`ðŸŽ¯ TICKET MÃ‰DIO ${data}: R$ ${faturamento.toFixed(2)} Ã· ${clientes} = R$ ${ticketCalculado.toFixed(2)}`)
                  
                  return {
                    data,
                    valor: ticketCalculado,
                    meta: metas.ticketMedioTarget
                  }
                })
                .sort((a, b) => a.data.localeCompare(b.data))
              
              console.log('ðŸŽ¯ Ticket mÃ©dio FINAL processado (fallback):', dados.length, 'dias com clientes pagantes')
              console.log('ðŸ“… PerÃ­odo:', dados[0]?.data, 'atÃ©', dados[dados.length - 1]?.data)
              console.log('ðŸ“Š Amostra valores:', dados.slice(0, 5).map((d: any) => ({ 
                data: d.data, 
                valor: Math.round(d.valor * 100) / 100 
              })))
            } else {
              console.warn('âš ï¸ Dados insuficientes para calcular ticket mÃ©dio')
              console.warn('   - Faturamento:', allFaturamentoData.length, 'registros')
              console.warn('   - Clientes:', clientesData?.length || 0, 'dias')
            }
          }
        } catch (error) {
          console.error('âŒ Erro ao processar ticket mÃ©dio:', error)
          dados = []
        }
      }
      else if (metricaSelecionada === 'reservas') {
        // Buscar reservas do Getin por dia
        console.log('ðŸ” Buscando reservas do Getin de', periodoInicio, 'atÃ©', periodoFim)
        
        const diasArray = []
        const dataAtual = new Date(periodoInicio + 'T00:00:00.000Z')
        const dataFinal = new Date(periodoFim + 'T00:00:00.000Z')
        
        while (dataAtual <= dataFinal) {
          diasArray.push(dataAtual.toISOString().split('T')[0])
          dataAtual.setDate(dataAtual.getDate() + 1)
        }

        console.log('ðŸ“… PerÃ­odo de reservas:', periodoInicio, 'atÃ©', periodoFim)
        console.log('ðŸ“… Dias a consultar:', diasArray.length)
        console.log('ðŸ“… Primeiro dia:', diasArray[0])
        console.log('ðŸ“… Ãšltimo dia:', diasArray[diasArray.length - 1])

        const reservasPorDia = await Promise.all(
          diasArray.map(async (data) => {
            try {
              const response = await fetch(`/api/dashboard/reservas-getin?data_inicio=${data}&data_fim=${data}&tipo=periodo`)
              const result = await response.json()
              const pessoas = result.success ? (result.data?.estatisticas?.total_pessoas || 0) : 0
              
              if (pessoas > 0) {
                console.log(`ðŸ“… ${data}: ${pessoas} pessoas reservadas (${result.data?.estatisticas?.total_reservas || 0} reservas)`)
              }
              
              return {
                data,
                valor: pessoas,
                meta: metas.reservasDiarias
              }
            } catch (error) {
              console.error(`âŒ Erro ao buscar reservas para ${data}:`, error)
              return { data, valor: 0, meta: metas.reservasDiarias }
            }
          })
        )

        dados = reservasPorDia.filter((item: any) => item.valor > 0)
        console.log('ðŸŽ¯ Dias com reservas:', dados.length)
      }
      else if (metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') {
        // ESTRATÃ‰GIA APRIMORADA: Chunking para tempos com melhor tratamento
        const campoTempo = metricaSelecionada === 'tempo_cozinha' ? 't0_t2' : 't0_t3'
        const metaTempo = metricaSelecionada === 'tempo_cozinha' ? metas.tempoSaidaCozinha : metas.tempoSaidaBar
        
        // Converter datas para formato inteiro (YYYYMMDD)
        const dataInicioInt = parseInt(periodoInicio.replace(/-/g, ''))
        const dataFimInt = parseInt(periodoFim.replace(/-/g, ''))

        console.log('ðŸ” Buscando tempos', metricaSelecionada, 'de', dataInicioInt, 'atÃ©', dataFimInt)
        console.log('ðŸ“Š Campo tempo:', campoTempo, '- Meta:', metaTempo, 'minutos')

        try {
          // ESTRATÃ‰GIA FINAL: Usar RPC SQL agregada para tempos
          console.log('ðŸ” Buscando tempos com RPC SQL agregada de', periodoInicio, 'atÃ©', periodoFim)
          
          try {
            // Usar RPC para fazer query SQL direta agregada
            const { data, error } = await supabase.rpc('get_tempos_por_dia', {
              p_bar_id: selectedBar.id,
              p_data_inicio: periodoInicio,
              p_data_fim: periodoFim,
              p_campo_tempo: campoTempo
            })

            if (!error && data) {
              console.log('ðŸ“Š Dados de tempos SQL agregados:', data.length, 'dias Ãºnicos')
              console.log('ðŸ“‹ Amostra:', data.slice(0, 3))
              console.log('ðŸ“‹ Ãšltimos:', data.slice(-3))
              
              dados = data.map((item: any) => ({
                data: item.dt_gerencial,
                valor: parseFloat(item.tempo_medio_minutos || '0'),
                meta: metaTempo
              }))
              
              console.log('âœ… Tempos via RPC:', dados.length, 'dias')
              console.log('ðŸ“… PerÃ­odo:', dados[0]?.data, 'atÃ©', dados[dados.length - 1]?.data)
              console.log('ðŸ“Š Amostra valores:', dados.slice(0, 5).map((d: any) => ({ 
                data: d.data, 
                valor: d.valor + ' min'
              })))
            } else {
              console.error('âŒ RPC de tempos falhou, usando fallback:', error)
              throw new Error('RPC nÃ£o disponÃ­vel')
            }
          } catch (rpcError) {
            console.log('ðŸ”„ Fallback: Processamento JavaScript para tempos')
            
            // Fallback: CHUNKING PARA TEMPOS
            const CHUNK_SIZE = 1000
            let allTempoData: any[] = []
            let offset = 0
            let hasMore = true
            
            while (hasMore) {
              console.log(`â±ï¸ Buscando chunk ${offset/CHUNK_SIZE + 1} de tempos (offset: ${offset})`)
              
              const { data: chunk, error } = await supabase
                .from('tempo')
                .select(`dia, ${campoTempo}`)
                .eq('bar_id', selectedBar.id)
                .gte('dia', dataInicioInt)
                .lte('dia', dataFimInt)
                .not(campoTempo, 'is', null)
                .gt(campoTempo, 0)
                .lt(campoTempo, 14400) // Filtrar outliers extremos (4 horas = 14400 segundos)
                .order('dia')
                .range(offset, offset + CHUNK_SIZE - 1)

              if (error) {
                console.error('âŒ Erro no chunk de tempos:', error)
                break
              }

              if (chunk && chunk.length > 0) {
                allTempoData = allTempoData.concat(chunk)
                console.log(`âœ… Chunk ${offset/CHUNK_SIZE + 1}: ${chunk.length} registros (total: ${allTempoData.length})`)
                
                if (chunk.length < CHUNK_SIZE) {
                  hasMore = false // Ãšltimo chunk
                } else {
                  offset += CHUNK_SIZE
                }
              } else {
                hasMore = false
              }
            }

            console.log('â±ï¸ TOTAL de registros de tempo coletados:', allTempoData.length)

            if (allTempoData.length > 0) {
              // Processar todos os dados no JavaScript
              const temposPorDia = allTempoData.reduce((acc: {[key: string]: number[]}, item) => {
                const diaStr = item.dia.toString()
                const dataFormatada = `${diaStr.substring(0,4)}-${diaStr.substring(4,6)}-${diaStr.substring(6,8)}`
                
                if (!acc[dataFormatada]) acc[dataFormatada] = []
                
                // Converter segundos para minutos e filtrar outliers adicionais
                const tempoMinutos = parseInt((item as any)[campoTempo]) / 60
                
                // Filtros adicionais baseados na mÃ©trica
                let tempoValido = false
                if (metricaSelecionada === 'tempo_cozinha') {
                  // Tempo cozinha: entre 1 e 45 minutos
                  tempoValido = tempoMinutos >= 1 && tempoMinutos <= 45
                } else {
                  // Tempo bar: entre 0.5 e 20 minutos
                  tempoValido = tempoMinutos >= 0.5 && tempoMinutos <= 20
                }
                
                if (tempoValido) {
                  acc[dataFormatada].push(tempoMinutos)
                }
                
                return acc
              }, {})

              console.log('ðŸ“… Dias Ãºnicos de tempo processados:', Object.keys(temposPorDia).length)
              console.log('ðŸ“… Primeira data:', Object.keys(temposPorDia).sort()[0])
              console.log('ðŸ“… Ãšltima data:', Object.keys(temposPorDia).sort().slice(-1)[0])

              // Calcular mÃ©dias por dia (filtrar dias com poucos registros)
              dados = Object.entries(temposPorDia)
                .filter(([data, tempos]) => tempos.length >= 3) // MÃ­nimo 3 registros por dia
                .map(([data, tempos]) => {
                  // Calcular mÃ©dia removendo outliers extremos
                  const temposOrdenados = tempos.sort((a, b) => a - b)
                  const q1Index = Math.floor(temposOrdenados.length * 0.25)
                  const q3Index = Math.floor(temposOrdenados.length * 0.75)
                  const temposFiltrados = temposOrdenados.slice(q1Index, q3Index + 1)
                  
                  const media = temposFiltrados.reduce((sum, tempo) => sum + tempo, 0) / temposFiltrados.length
                  
                  return {
                    data,
                    valor: Math.round(media * 100) / 100, // Arredondar para 2 casas decimais
                    meta: metaTempo
                  }
                })
                .sort((a, b) => a.data.localeCompare(b.data))
              
              console.log('â±ï¸ Tempos FINAL processados (fallback):', dados.length, 'dias com dados vÃ¡lidos')
              console.log('ðŸ“… PerÃ­odo:', dados[0]?.data, 'atÃ©', dados[dados.length - 1]?.data)
              console.log('ðŸ“Š Amostra valores:', dados.slice(0, 5).map((d: any) => ({ 
                data: d.data, 
                valor: d.valor + ' min'
              })))
            } else {
              console.warn('âš ï¸ Nenhum registro de tempo encontrado no perÃ­odo')
              dados = []
            }
          }
        } catch (error) {
          console.error('âŒ Erro ao processar tempos:', error)
          
          // Verificar se hÃ¡ dados disponÃ­veis em perÃ­odo mais amplo
          try {
            const { data: verificacao, error: verError } = await supabase
              .from('tempo')
              .select('dia')
              .eq('bar_id', selectedBar.id)
              .order('dia')
              .limit(10)
            
            if (!verError && verificacao && verificacao.length > 0) {
              console.log('ðŸ” VerificaÃ§Ã£o: Dados disponÃ­veis na tabela tempo:', verificacao.map((d: any) => d.dia))
              console.log('ðŸ’¡ SugestÃ£o: PerÃ­odo disponÃ­vel aproximadamente de', verificacao[0].dia, 'atÃ©', verificacao[verificacao.length - 1].dia)
            } else {
              console.log('âŒ Tabela tempo parece estar vazia ou inacessÃ­vel')
            }
          } catch (verError) {
            console.error('âŒ Erro na verificaÃ§Ã£o:', verError)
          }
          
          dados = []
        }
      }

      console.log('âœ… Resultado bruto:', dados.length, 'dias encontrados')
      console.log('ðŸ“Š PerÃ­odo exato solicitado:', periodoInicio, 'atÃ©', periodoFim)
      
      if (dados.length === 0) {
        console.warn('âš ï¸ ATENÃ‡ÃƒO: Nenhum dado encontrado para o perÃ­odo solicitado!')
        console.warn('ðŸ’¡ PerÃ­odo EXATO solicitado:', periodoInicio, 'atÃ©', periodoFim)
        console.warn('ðŸ’¡ MÃ©trica:', metricaSelecionada)
        console.warn('ðŸ’¡ SugestÃ£o: Tente um perÃ­odo anterior ou verifique se hÃ¡ dados disponÃ­veis')
        
        // Mostrar perÃ­odos com dados disponÃ­veis
        if (metricaSelecionada === 'faturamento') {
          console.warn('ðŸ’¡ Faturamento disponÃ­vel: 2025-02-01 atÃ© 2025-06-12')
        } else if (metricaSelecionada === 'clientes') {
          console.warn('ðŸ’¡ Clientes disponÃ­vel: 2025-01-31 atÃ© 2025-06-12')
        } else if (metricaSelecionada === 'reservas') {
          console.warn('ðŸ’¡ Reservas disponÃ­vel: 2025-02-06 atÃ© 2025-07-18')
        } else if (metricaSelecionada.includes('tempo')) {
          console.warn('ðŸ’¡ Tempos disponÃ­vel: 2025-02-01 atÃ© 2025-06-12')
        }
      }

      // Ordenar dados (jÃ¡ foram filtrados nas consultas especÃ­ficas)
      dados.sort((a, b) => a.data.localeCompare(b.data))
      
      console.log('ðŸ“… Dados finais:', dados.length, 'dias')
      console.log('ðŸ“… Primeiro dia final:', dados[0]?.data)
      console.log('ðŸ“… Ãšltimo dia final:', dados[dados.length - 1]?.data)
      
      setDadosEvolucao(dados)
      
    } catch (error) {
      console.error('âŒ Erro ao buscar dados da mÃ©trica:', error)
      setDadosEvolucao([])
    } finally {
      setLoading(false)
    }
  }

  const metricaInfo = metricas.find((m: any) => m.value === metricaSelecionada)
  const valorTotal = dadosEvolucao.reduce((sum: number, item: any) => sum + item.valor, 0)
  const valorMedio = dadosEvolucao.length > 0 ? valorTotal / dadosEvolucao.length : 0
  const metaMedia = dadosEvolucao.length > 0 ? dadosEvolucao[0].meta || 0 : 0
  const percentualMeta = metaMedia > 0 ? (valorMedio / metaMedia) * 100 : 0

  const maxValor = Math.max(...dadosEvolucao.map((d: any) => d.valor), metaMedia || 0)

      return (
      <ProtectedRoute requiredModule="dashboard_metrica_evolucao">
        <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">ðŸ“ˆ Dashboard - EvoluÃ§Ã£o por MÃ©trica</h1>
          <p className="text-slate-600">AnÃ¡lise temporal detalhada de mÃ©tricas especÃ­ficas do {selectedBar?.nome}</p>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">ðŸŽ¯ ConfiguraÃ§Ãµes da AnÃ¡lise</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">MÃ©trica</label>
              <select
                value={metricaSelecionada}
                onChange={(e) => {
                  setMetricaSelecionada(e.target.value)
                  
                  // **CORREÃ‡ÃƒO: Permitir novo ajuste quando trocar mÃ©trica manualmente**
                  setJaAjustouPeriodo(false)
                  
                  // Ajustar perÃ­odo baseado na mÃ©trica selecionada
                  const metricaSelecionadaInfo = metricas.find((m: any) => m.value === e.target.value)
                  if (metricaSelecionadaInfo?.dataInicio) {
                    console.log(`ðŸ”§ UsuÃ¡rio selecionou ${e.target.value} - ajustando data para ${metricaSelecionadaInfo.dataInicio}`)
                    setPeriodoInicio(metricaSelecionadaInfo.dataInicio)
                    
                    // FORÃ‡A IMEDIATA: Se for faturamento ou ticket mÃ©dio, ajustar data
                    if (e.target.value === 'faturamento' || e.target.value === 'ticket_medio') {
                      console.log('ðŸ’° ForÃ§ando data inicial para 01/02/2025 (dados de pagamentos)')
                      setPeriodoInicio('2025-02-01')
                    }
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              >
                {metricas.map((metrica: any) => (
                  <option key={metrica.value} value={metrica.value} className="text-gray-900 bg-white">
                    {metrica.icon} {metrica.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data InÃ­cio</label>
              <input
                type="date"
                value={periodoInicio}
                onChange={(e) => {
                  setPeriodoInicio(e.target.value)
                  console.log('ðŸ“… UsuÃ¡rio alterou data de inÃ­cio manualmente para:', e.target.value)
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Data Fim</label>
              <input
                type="date"
                value={periodoFim}
                onChange={(e) => {
                  setPeriodoFim(e.target.value)
                  console.log('ðŸ“… UsuÃ¡rio alterou data de fim manualmente para:', e.target.value)
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={buscarDadosMetrica}
                disabled={loading || !selectedBar}
                className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Carregando...' : 'ðŸ” Analisar'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : dadosEvolucao.length > 0 ? (
          <>
            {/* Resumo da MÃ©trica */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`bg-gradient-to-br from-${metricaInfo?.color}-50 to-${metricaInfo?.color}-100 rounded-xl p-6 border border-${metricaInfo?.color}-200`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{metricaInfo?.icon}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${percentualMeta >= 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {percentualMeta.toFixed(1)}%
                  </span>
                </div>
                <h4 className={`text-sm font-medium text-${metricaInfo?.color}-700 mb-1`}>MÃ©dia do PerÃ­odo</h4>
                <p className={`text-2xl font-bold text-${metricaInfo?.color}-800`}>
                  {metricaInfo?.unit === 'R$' ? 'R$ ' : ''}{valorMedio.toLocaleString('pt-BR', { minimumFractionDigits: metricaInfo?.unit === 'R$' ? 2 : 1 })} {metricaInfo?.unit !== 'R$' ? metricaInfo?.unit : ''}
                </p>
                <p className={`text-xs text-${metricaInfo?.color}-600 mt-1`}>
                  Meta: {metricaInfo?.unit === 'R$' ? 'R$ ' : ''}{metaMedia.toLocaleString('pt-BR', { minimumFractionDigits: metricaInfo?.unit === 'R$' ? 2 : 1 })} {metricaInfo?.unit !== 'R$' ? metricaInfo?.unit : ''}
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-sm font-medium text-slate-600 mb-1">Valor Total</h4>
                <p className="text-2xl font-bold text-slate-800">
                  {metricaInfo?.unit === 'R$' ? 'R$ ' : ''}{valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: metricaInfo?.unit === 'R$' ? 2 : 1 })} {metricaInfo?.unit !== 'R$' ? metricaInfo?.unit : ''}
                </p>
                <p className="text-xs text-slate-500 mt-1">{dadosEvolucao.length} dias analisados</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-sm font-medium text-slate-600 mb-1">Melhor Dia</h4>
                {(() => {
                  // CORREÃ‡ÃƒO: Para tempos (cozinha/bar), menor Ã© melhor. Para outras mÃ©tricas, maior Ã© melhor.
                  const melhorDia = (metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') 
                    ? dadosEvolucao.reduce((min, item) => item.valor < min.valor ? item : min, dadosEvolucao[0])
                    : dadosEvolucao.reduce((max, item) => item.valor > max.valor ? item : max, dadosEvolucao[0])
                  
                  return (
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {metricaInfo?.unit === 'R$' ? 'R$ ' : ''}{melhorDia.valor.toLocaleString('pt-BR', { minimumFractionDigits: metricaInfo?.unit === 'R$' ? 2 : 1 })} {metricaInfo?.unit !== 'R$' ? metricaInfo?.unit : ''}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(melhorDia.data).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') 
                          ? '(menor tempo)' 
                          : '(maior valor)'
                        }
                      </p>
                    </div>
                  )
                })()}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h4 className="text-sm font-medium text-slate-600 mb-1">
                  {(metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') 
                    ? 'Dias Dentro da Meta' 
                    : 'Dias Acima da Meta'
                  }
                </h4>
                {(() => {
                  const diasAcimaMeta = dadosEvolucao.filter((item: any) => 
                    item.meta && (
                      (metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') 
                        ? item.valor <= item.meta 
                        : item.valor >= item.meta
                    )
                  ).length
                  const percentualDias = (diasAcimaMeta / dadosEvolucao.length) * 100
                  return (
                    <div>
                      <p className="text-2xl font-bold text-slate-800">{diasAcimaMeta}</p>
                      <p className="text-xs text-slate-500 mt-1">{percentualDias.toFixed(1)}% dos dias</p>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* GrÃ¡fico Simples de Barras */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" key={`grafico-${metricaSelecionada}-${periodoInicio}-${periodoFim}`}>
              <h3 className="text-lg font-bold text-slate-800 mb-6">ðŸ“Š EvoluÃ§Ã£o Temporal - {metricaInfo?.label}</h3>
              
              <div className="space-y-3">
                {dadosEvolucao.map((item: any, index: any) => {
                  // DEBUG: Log para verificar quais dados estÃ£o sendo renderizados
                  if (index === 0) {
                    console.log('ðŸŽ¨ RENDERIZANDO GRÃFICO:', {
                      metrica: metricaSelecionada,
                      periodo: `${periodoInicio} atÃ© ${periodoFim}`,
                      primeiroItem: item,
                      totalItens: dadosEvolucao.length,
                      todasAsDatas: dadosEvolucao.map((d: any) => d.data),
                      dadosCompletos: dadosEvolucao.map((d: any) => ({ data: d.data, valor: d.valor }))
                    })
                  }
                  
                  const maxValor = Math.max(...dadosEvolucao.map((d: any) => d.valor), metaMedia || 0)
                  const largura = (item.valor / maxValor) * 100
                  // Para tempos (cozinha e bar), menor Ã© melhor - inverter lÃ³gica
                  const acimaMeta = item.meta && (
                    (metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') 
                      ? item.valor <= item.meta 
                      : item.valor >= item.meta
                  )
                  
                  return (
                    <div key={`${metricaSelecionada}-${item.data}-${index}`} className="flex items-center space-x-3 relative">
                      <div className="w-20 text-xs text-slate-600 font-medium">
                        {(() => {
                          // FormataÃ§Ã£o manual para evitar problemas de timezone
                          const [ano, mes, dia] = item.data.split('T')[0].split('-')
                          return `${dia}/${mes}`
                        })()}
                      </div>
                      <div 
                        className="flex-1 relative cursor-pointer"
                        onMouseEnter={() => setHoveredItem(index)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div className="w-full bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className={`h-6 rounded-full transition-all duration-300 ${
                              acimaMeta ? 'bg-green-500' : 'bg-red-500'
                            } ${hoveredItem === index ? 'opacity-80' : ''}`}
                            style={{ width: `${largura}%` }}
                          ></div>
                          {/* Linha da meta */}
                          {item.meta && (
                            <div 
                              className="absolute top-0 h-6 w-0.5 bg-red-600 z-10"
                              style={{ left: `${(item.meta / maxValor) * 100}%` }}
                            ></div>
                          )}
                        </div>
                        
                        {/* Tooltip */}
                        {hoveredItem === index && (
                          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg z-20 whitespace-nowrap">
                            <div className="text-xs">
                              <div className="font-semibold">
                                {(() => {
                                  // FormataÃ§Ã£o manual para evitar problemas de timezone
                                  const [ano, mes, dia] = item.data.split('T')[0].split('-')
                                  const dataFormatada = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
                                  return dataFormatada.toLocaleDateString('pt-BR', { 
                                    weekday: 'long', 
                                    day: '2-digit', 
                                    month: '2-digit',
                                    year: 'numeric' 
                                  })
                                })()}
                              </div>
                              <div className="mt-1">
                                <span className="text-blue-300">Realizado:</span> 
                                <span className="font-semibold ml-1">
                                  {metricaInfo?.unit === 'R$' ? 'R$ ' : ''}{item.valor.toLocaleString('pt-BR', { 
                                    minimumFractionDigits: metricaInfo?.unit === 'R$' ? 2 : metricaInfo?.unit === 'min' ? 1 : 0 
                                  })} {metricaInfo?.unit !== 'R$' ? metricaInfo?.unit : ''}
                                </span>
                              </div>
                              {item.meta && (
                                <div>
                                  <span className="text-red-300">Meta:</span> 
                                  <span className="font-semibold ml-1">
                                    {metricaInfo?.unit === 'R$' ? 'R$ ' : ''}{item.meta.toLocaleString('pt-BR', { 
                                      minimumFractionDigits: metricaInfo?.unit === 'R$' ? 2 : metricaInfo?.unit === 'min' ? 1 : 0 
                                    })} {metricaInfo?.unit !== 'R$' ? metricaInfo?.unit : ''}
                                  </span>
                                </div>
                              )}
                              <div className="mt-1 pt-1 border-t border-gray-600">
                                <span className={`font-semibold ${acimaMeta ? 'text-green-300' : 'text-red-300'}`}>
                                  {(metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') 
                                    ? (acimaMeta ? 'âœ… Dentro da meta' : 'âŒ Fora da meta')
                                    : (acimaMeta ? 'âœ… Acima da meta' : 'âŒ Abaixo da meta')
                                  }
                                  {item.meta && (
                                    <span className="ml-1">
                                      ({((item.valor / item.meta) * 100).toFixed(1)}%)
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
                      <div className="w-24 text-right text-xs text-slate-600 font-medium">
                        {metricaInfo?.unit === 'R$' ? 'R$ ' : ''}{item.valor.toLocaleString('pt-BR', { 
                          minimumFractionDigits: metricaInfo?.unit === 'R$' ? 2 : metricaInfo?.unit === 'min' ? 1 : 0 
                        })} {metricaInfo?.unit !== 'R$' ? metricaInfo?.unit : ''}
                      </div>
                      <div className="w-8">
                        {acimaMeta ? 'âœ…' : 'âŒ'}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legenda */}
              <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-slate-600">
                    {(metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') 
                      ? 'Dentro da meta' 
                      : 'Acima da meta'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-slate-600">
                    {(metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') 
                      ? 'Fora da meta' 
                      : 'Abaixo da meta'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-red-600"></div>
                  <span className="text-sm text-slate-600">Meta</span>
                </div>
              </div>
            </div>

            {/* Insights e AnÃ¡lises */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">ðŸ” Insights e AnÃ¡lises</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700">ðŸ“ˆ TendÃªncia</h4>
                  {(() => {
                    if (dadosEvolucao.length < 2) return <p className="text-sm text-slate-600">Dados insuficientes para anÃ¡lise de tendÃªncia</p>
                    
                    const primeirosValores = dadosEvolucao.slice(0, Math.ceil(dadosEvolucao.length / 3))
                    const ultimosValores = dadosEvolucao.slice(-Math.ceil(dadosEvolucao.length / 3))
                    
                    const mediaPrimeiros = primeirosValores.reduce((sum: number, item: any) => sum + item.valor, 0) / primeirosValores.length
                    const mediaUltimos = ultimosValores.reduce((sum: number, item: any) => sum + item.valor, 0) / ultimosValores.length
                    
                    const crescimento = ((mediaUltimos - mediaPrimeiros) / mediaPrimeiros) * 100
                    
                    return (
                      <div className="space-y-2">
                        <p className={`text-sm font-medium ${crescimento > 0 ? 'text-green-600' : crescimento < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          {crescimento > 0 ? 'ðŸ“ˆ TendÃªncia de crescimento' : crescimento < 0 ? 'ðŸ“‰ TendÃªncia de queda' : 'âž¡ï¸ TendÃªncia estÃ¡vel'}
                        </p>
                        <p className="text-sm text-slate-600">
                          VariaÃ§Ã£o de {crescimento.toFixed(1)}% entre o inÃ­cio e fim do perÃ­odo
                        </p>
                      </div>
                    )
                  })()}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-700">ðŸŽ¯ Performance vs Meta</h4>
                  {(() => {
                    const diasAcimaMeta = dadosEvolucao.filter((item: any) => 
                      item.meta && (
                        (metricaSelecionada === 'tempo_cozinha' || metricaSelecionada === 'tempo_bar') 
                          ? item.valor <= item.meta 
                          : item.valor >= item.meta
                      )
                    ).length
                    const percentualDias = (diasAcimaMeta / dadosEvolucao.length) * 100
                    
                    return (
                      <div className="space-y-2">
                        <p className={`text-sm font-medium ${percentualDias >= 70 ? 'text-green-600' : percentualDias >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {percentualDias >= 70 ? 'âœ… Excelente performance' : percentualDias >= 50 ? 'âš ï¸ Performance moderada' : 'âŒ Performance abaixo do esperado'}
                        </p>
                        <p className="text-sm text-slate-600">
                          Meta atingida em {diasAcimaMeta} de {dadosEvolucao.length} dias ({percentualDias.toFixed(1)}%)
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-6xl mb-4">ðŸ“Š</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {dadosEvolucao.length === 0 && (metricaSelecionada && periodoInicio && periodoFim) ? 
                'Nenhum dado encontrado para o perÃ­odo' : 
                'Selecione uma mÃ©trica e perÃ­odo'
              }
            </h3>
            <div className="text-slate-500 space-y-2">
              {dadosEvolucao.length === 0 && (metricaSelecionada && periodoInicio && periodoFim) ? (
                <>
                  <p>
                    NÃ£o foram encontrados dados para <strong>{metricas.find((m: any) => m.value === metricaSelecionada)?.label}</strong> 
                    no perÃ­odo de <strong>{new Date(periodoInicio).toLocaleDateString('pt-BR')}</strong> atÃ© <strong>{new Date(periodoFim).toLocaleDateString('pt-BR')}</strong>.
                  </p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg text-left">
                    <h4 className="font-semibold text-blue-800 mb-2">ðŸ’¡ SugestÃµes:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>â€¢ Tente um perÃ­odo anterior (dados disponÃ­veis atÃ© aproximadamente 11/06/2025)</li>
                      <li>â€¢ Verifique se o bar selecionado estÃ¡ correto</li>
                      <li>â€¢ Para reservas, verifique se hÃ¡ reservas cadastradas no GetIN para o perÃ­odo</li>
                      <li>â€¢ Consulte os logs do console (F12) para mais detalhes sobre a busca</li>
                    </ul>
                  </div>
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                    <h4 className="font-semibold text-gray-800 mb-2">ðŸ” PerÃ­odos com dados disponÃ­veis:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>â€¢ <strong>Faturamento:</strong> 01/02/2025 a 11/06/2025 (dados corrigidos - sem Conta Assinada)</li>
                      <li>â€¢ <strong>Clientes:</strong> 31/01/2025 a 11/06/2025</li>
                      <li>â€¢ <strong>Reservas:</strong> 31/01/2025 a 18/07/2025</li>
                      <li>â€¢ <strong>Tempos:</strong> Dados desde sempre atÃ© 11/06/2025</li>
                    </ul>
                  </div>
                </>
              ) : (
                <p>
                  Escolha a mÃ©trica que deseja analisar e clique em "Analisar" para visualizar a evoluÃ§Ã£o temporal.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
} 
