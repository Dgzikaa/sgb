import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { getSupabaseClient } from '@/lib/supabase'
import BarSelector from '@/components/BarSelector'
import { useRouter } from 'next/navigation'

interface DadosComparacao {
  data: string
  faturamento: number
  faturamentoYuzer: number
  faturamentoContaHub: number
  faturamentoSympla: number
  clientes: number
  ticketMedio: number
  reservas: number
  tempoCozinha: number
  tempoBar: number
  pratos: { nome: string; quantidade: number }[]
  artista?: string
  // Dados por horÃ¡Â¡rio
  faturamento_horas: Array<{
    hora: string
    faturamento: number
    vendas: number
    faturamento_acumulado?: number
    clientes_acumulados?: number
  }>
}

interface ArtistaStats {
  nome: string
  // TOTAIS (somados de todos os eventos)
  faturamentoTotal: number
  faturamentoYuzerTotal: number
  faturamentoContaHubTotal: number
  faturamentoSymplaTotal: number
  clientesTotal: number
  reservasTotal: number
  // MÃ¡â€°DIAS (total dividido pelo nÃ¡Âºmero de eventos)
  faturamentoMedio: number
  faturamentoYuzerMedio: number
  faturamentoContaHubMedio: number
  faturamentoSymplaMedio: number
  clientesMedio: number
  reservasMedio: number
  // TICKET MÃ¡â€°DIO (faturamento total / clientes total)
  ticketMedio: number
  tempoMedioCozinha: number
  tempoMedioBar: number
  totalEventos: number
  eventosComDados: number
  recorrenciaMedia: number
  fidelizacaoClientes: number
  crescimentoClientes: number
  eficienciaAtendimento: number
}

type TipoComparacao = 'datas-especificas' | 'artistas'

export default function ComparativoPage() {
  const { selectedBar } = useBar()
  const router = useRouter()
  
  const [tipoComparacao, setTipoComparacao] = useState<TipoComparacao>('datas-especificas')
  
  // Para comparaÃ¡Â§Ã¡Â£o de datas especÃ¡Â­ficas
  const [data1, setData1] = useState('')
  const [data2, setData2] = useState('')
  const [dadosComparativos, setDadosComparativos] = useState<DadosComparacao[]>([])
  const [insights, setInsights] = useState<string[]>([])
  const [recorrenciaClientes, setRecorrenciaClientes] = useState<any>(null)
  
  // Para comparaÃ¡Â§Ã¡Â£o de artistas
  const [artistaSelecionado1, setArtistaSelecionado1] = useState('')
  const [artistaSelecionado2, setArtistaSelecionado2] = useState('')
  const [listaArtistas, setListaArtistas] = useState<string[]>([])
  const [dadosArtistas, setDadosArtistas] = useState<{artista1: ArtistaStats | null, artista2: ArtistaStats | null}>({
    artista1: null,
    artista2: null
  })
  
  const [loading, setLoading] = useState(false)

  // Buscar lista de artistas Ã¡Âºnicos
  useEffect(() => {
    if (selectedBar && tipoComparacao === 'artistas') {
      buscarArtistas()
    }
  }, [selectedBar, tipoComparacao])

  const padronizarArtistas = async () => {
    if (!selectedBar) return
    
    try {
      console.log('Ã°Å¸Å½Â¤ Padronizando artistas...')
      const response = await fetch('/api/padronizar-artistas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id: selectedBar.id })
      })
      
      const result = await response.json()
      if (result.success) {
        console.log('Å"â€¦ Artistas padronizados:', result.message)
      }
    } catch (error) {
      console.log('Å¡Â Ã¯Â¸Â Erro na padronizaÃ¡Â§Ã¡Â£o (continuando):', error)
    }
  }

  const buscarArtistas = async () => {
    try {
      // Inicializar cliente Supabase
      const supabase = await getSupabaseClient();
      if (!supabase) {
        console.error('Erro ao conectar com banco');
        return;
      }

      const { data, error } = await supabase
        .from('eventos')
        .select('nome_artista')
        .eq('bar_id', selectedBar?.id)
        .not('nome_artista', 'is', null)
        .neq('nome_artista', '')

      if (!error && data) {
        const artistasUnicos = [...new Set(data.map((item: unknown) => item.nome_artista))] as string[]
        setListaArtistas(artistasUnicos.sort())
        console.log('Ã°Å¸Å½Â¤ Artistas encontrados:', artistasUnicos)
      } else {
        console.error('Erro ao buscar artistas:', error)
      }
    } catch (error) {
      console.error('Erro ao buscar artistas:', error)
    }
  }

  // FunÃ¡Â§Ã¡Â£o para converter data sem problemas de timezone
  const parseDataSemTimezone = (dataString: string) => {
    const [ano, mes, dia] = dataString.split('-').map(Number)
    return new Date(ano, mes - 1, dia) // mes - 1 porque Date usa 0-11 para meses
  }

  // FunÃ¡Â§Ã¡Â£o para buscar TODOS os registros com paginaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica
  const buscarTodosRegistros = async (query: unknown, chunkSize = 1000) => {
    let todosRegistros: unknown[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const { data: chunk, error } = await query
        .range(offset, offset + chunkSize - 1)

      if (error) {
        console.error('Erro na paginaÃ¡Â§Ã¡Â£o:', error)
        break
      }

      if (!chunk || chunk.length === 0) {
        hasMore = false
        break
      }

      todosRegistros = todosRegistros.concat(chunk)
      console.log(`Ã°Å¸"Â¦ Chunk ${Math.floor(offset/chunkSize) + 1}: ${chunk.length} registros (total: ${todosRegistros.length})`)
      
      // Se retornou menos que o chunk size, chegamos ao fim
      if (chunk.length < chunkSize) {
        hasMore = false
      } else {
        offset += chunkSize
      }
    }

    return todosRegistros
  }

  const buscarDadosData = async (data: string) => {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('Erro ao conectar com banco');
      return {
        data,
        faturamento: 0,
        faturamentoYuzer: 0,
        faturamentoContaHub: 0,
        faturamentoSympla: 0,
        clientes: 0,
        ticketMedio: 0,
        reservas: 0,
        tempoCozinha: 0,
        tempoBar: 0,
        pratos: [],
        faturamento_horas: []
      };
    }

    let faturamento = 0
    let faturamentoYuzer = 0
    let faturamentoContaHub = 0
    let faturamentoSympla = 0
    let totalRegistrosFaturamento = 0

    const CHUNK_SIZE = 1000
    let offset = 0

    try {
      // 1. DETECÃ¡â€¡Ã¡Æ'O INTELIGENTE DO SISTEMA USADO (Yuzer vs ContaHub)
      console.log(`Ã°Å¸"Â Detectando sistema usado para ${data}...`)
      
      // 1.1. Verificar TOTAL COMPLETO do Yuzer (com paginaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica)
      console.log(`Ã°Å¸"Â Buscando TODOS os registros do Yuzer para ${data}...`)
      
      const queryYuzerTotal = supabase
        .from('yuzer_analitico')
        .select('valor_total')
        .eq('bar_id', selectedBar?.id)
        .eq('data_pedido', data)
      
      const yuzerTotalData = await buscarTodosRegistros(queryYuzerTotal)
      console.log(`Ã°Å¸"Â¦ Total de registros Yuzer encontrados: ${yuzerTotalData.length}`)

      const yuzerFaturamentoTotal = yuzerTotalData?.reduce((sum: number, item: unknown) => sum + (parseFloat(item.valor_total) || 0), 0) || 0
      const yuzerRegistrosTotal = yuzerTotalData?.length || 0

      // 1.2. Verificar TOTAL COMPLETO do ContaHub (fatporhora)
      const { data: fatHoraTotalData } = await supabase
        .from('fatporhora')
        .select('valor')
        .eq('bar_id', selectedBar?.id)
        .eq('vd_dtgerencial', data)

      const contahubFaturamentoTotal = fatHoraTotalData?.reduce((sum: number, item: unknown) => sum + (parseFloat(item.valor) || 0), 0) || 0
      const contahubRegistrosTotal = fatHoraTotalData?.length || 0

      // 1.3. Decidir qual sistema usar baseado nos TOTAIS COMPLETOS
      const isYuzerDay = yuzerRegistrosTotal > 0 && (yuzerFaturamentoTotal > contahubFaturamentoTotal)
      const isContaHubDay = contahubRegistrosTotal > 0 && !isYuzerDay

      console.log(`Ã°Å¸"Å  DETECÃ¡â€¡Ã¡Æ'O DE SISTEMA para ${data}:`)
      console.log(`   Ã°Å¸ÂÂº Yuzer: ${yuzerRegistrosTotal} registros, R$ ${yuzerFaturamentoTotal.toFixed(2)} (TOTAL COMPLETO)`)
      console.log(`   Ã°Å¸'Â» ContaHub: ${contahubRegistrosTotal} registros, R$ ${contahubFaturamentoTotal.toFixed(2)} (TOTAL COMPLETO)`)
      console.log(`   Ã°Å¸Å½Â¯ Sistema detectado: ${isYuzerDay ? 'YUZER' : isContaHubDay ? 'CONTAHUB' : 'HÃ¡BRIDO'}`)

      // 2. BUSCAR FATURAMENTO DA FONTE PRINCIPAL DETECTADA
      if (isYuzerDay) {
        // DIA YUZER: Usar dados jÃ¡Â¡ buscados
        console.log(`Ã°Å¸ÂÂº DIA YUZER DETECTADO - Usando faturamento completo: R$ ${yuzerFaturamentoTotal.toFixed(2)}`)
        faturamentoYuzer = yuzerFaturamentoTotal

        // Buscar dados complementares do ContaHub (se houver)
        if (contahubFaturamentoTotal > 0) {
          console.log(`Ã°Å¸'Â» Adicionando dados complementares do ContaHub: R$ ${contahubFaturamentoTotal.toFixed(2)}`)
          faturamentoContaHub = contahubFaturamentoTotal
        }

      } else {
        // DIA CONTAHUB: Usar lÃ¡Â³gica original
        console.log(`Ã°Å¸'Â» Buscando faturamento do ContaHub/Pagamentos para ${data}...`)
        
        // Buscar dados do Yuzer (pode ter alguns dados)
        const { data: yuzerEstatisticas } = await supabase
          .from('yuzer_estatisticas_detalhadas')
          .select('total')
          .eq('bar_id', selectedBar?.id)
          .eq('data_evento', data)

        if (yuzerEstatisticas && yuzerEstatisticas.length > 0) {
          faturamentoYuzer = yuzerEstatisticas.reduce((sum: number, item: unknown) => sum + (parseFloat(item.total) || 0), 0)
          console.log(`Ã°Å¸ÂÂº Faturamento Yuzer (estatÃ¡Â­sticas): R$ ${faturamentoYuzer.toFixed(2)}`)
        }

        // Buscar dados do ContaHub via pagamentos
        while (true) {
          const { data: fatData } = await supabase
            .from('pagamentos')
            .select('liquido, origem')
            .eq('bar_id', selectedBar?.id)
            .eq('dt_gerencial', data)
            .not('liquido', 'is', null)
            .neq('pag', 'Conta Assinada')
            .range(offset, offset + CHUNK_SIZE - 1)

          if (!fatData || fatData.length === 0) break

          const chunkSympla = fatData
            .filter((item: unknown) => item.origem?.toLowerCase().includes('sympla'))
            .reduce((sum: number, item: unknown) => sum + (parseFloat(item.liquido) || 0), 0)
          
          const chunkContaHub = fatData
            .filter((item: unknown) => !item.origem?.toLowerCase().includes('sympla'))
            .reduce((sum: number, item: unknown) => sum + (parseFloat(item.liquido) || 0), 0)

          faturamentoSympla += chunkSympla
          faturamentoContaHub += chunkContaHub
          totalRegistrosFaturamento += fatData.length
          
          console.log(`Ã°Å¸'Â» Chunk processado: ${fatData.length} registros, Sympla: R$ ${chunkSympla.toFixed(2)}, ContaHub: R$ ${chunkContaHub.toFixed(2)}`)
          
          offset += CHUNK_SIZE
          if (fatData.length < CHUNK_SIZE) break
        }
      }

      // FATURAMENTO TOTAL = Fonte principal + complementares
      faturamento = faturamentoYuzer + faturamentoContaHub + faturamentoSympla
      
      // 2.1. FATURAMENTO PERÃ¡ODU (adicional da tabela periodo)
      console.log(`Ã°Å¸'Â° Buscando faturamento adicional na tabela 'periodo' para ${data}...`)
      let faturamentoPeriodo = 0
      try {
        const { data: periodoData } = await supabase
          .from('periodo')
          .select('liquido_netto')
          .eq('bar_id', selectedBar?.id)
          .eq('dt_gerencial', data.replace(/-/g, ''))

        if (periodoData && periodoData.length > 0) {
          // Filtrar apenas valores nÃ¡Â£o nulos no JavaScript
          const dadosValidos = periodoData.filter((item: unknown) => item.liquido_netto != null)
          if (dadosValidos.length > 0) {
            faturamentoPeriodo = dadosValidos.reduce((sum: number, item: unknown) => sum + (parseFloat(item.liquido_netto) || 0), 0)
            console.log(`Ã°Å¸'Â° Faturamento perÃ¡Â­odo encontrado: R$ ${faturamentoPeriodo.toFixed(2)} (${dadosValidos.length} registros)`)
            faturamento += faturamentoPeriodo
          } else {
            console.log(`Ã°Å¸'Â° Nenhum faturamento perÃ¡Â­odo vÃ¡Â¡lido encontrado para ${data}`)
          }
        } else {
          console.log(`Ã°Å¸'Â° Nenhum faturamento perÃ¡Â­odo encontrado para ${data}`)
        }
      } catch (error) {
        console.log(`ÂÅ' Erro ao buscar faturamento perÃ¡Â­odo:`, error)
      }
      
      // 2.2. FATURAMENTO BILHETERIA SYMPLA (adicional da tabela sympla_bilheteria)
      console.log(`Ã°Å¸Å½Â« Buscando faturamento de bilheteria Sympla para ${data}...`)
      let faturamentoBilheteriaSympla = 0
      try {
        const { data: bilheteriaData } = await supabase
          .from('sympla_bilheteria')
          .select('total_liquido')
          .eq('bar_id', selectedBar?.id)
          .eq('data_evento', data)
          .not('total_liquido', 'is', null)

        if (bilheteriaData && bilheteriaData.length > 0) {
          faturamentoBilheteriaSympla = bilheteriaData.reduce((sum: number, item: unknown) => sum + (parseFloat(item.total_liquido) || 0), 0)
          console.log(`Ã°Å¸Å½Â« Faturamento bilheteria Sympla encontrado: R$ ${faturamentoBilheteriaSympla.toFixed(2)} (${bilheteriaData.length} registros)`)
          faturamento += faturamentoBilheteriaSympla
          faturamentoSympla += faturamentoBilheteriaSympla // Adicionar ao total Sympla
        } else {
          console.log(`Ã°Å¸Å½Â« Nenhum faturamento de bilheteria Sympla encontrado para ${data}`)
        }
      } catch (error) {
        console.log(`ÂÅ' Erro ao buscar faturamento bilheteria Sympla:`, error)
      }
      
      console.log(`Ã°Å¸'Â° FATURAMENTO TOTAL FINAL: R$ ${faturamento.toFixed(2)} (Yuzer: R$ ${faturamentoYuzer.toFixed(2)} + ContaHub: R$ ${faturamentoContaHub.toFixed(2)} + Sympla: R$ ${faturamentoSympla.toFixed(2)} + PerÃ¡Â­odo: R$ ${faturamentoPeriodo.toFixed(2)} + Bilheteria: R$ ${faturamentoBilheteriaSympla.toFixed(2)})`)
      
      if (faturamento === 0) {
        console.log(`Å¡Â Ã¯Â¸Â ATENÃ¡â€¡Ã¡Æ'O: Nenhum faturamento encontrado para ${data}. Pode ser uma data futura sem dados reais.`)
      }

      // 3. CLIENTES (LÃ¡"GICA INTELIGENTE BASEADA NO SISTEMA DETECTADO)
      let clientes = 0
      let clientesSource = 'N/A'
      
      if (isYuzerDay) {
        // DIA YUZER: Priorizar check-ins Sympla (clientes reais)
        console.log(`Ã°Å¸' DIA YUZER - Buscando check-ins Sympla para ${data}...`)
        try {
          const { data: symplaData } = await supabase
            .from('cliente_visitas')
            .select('id')
            .eq('bar_id', selectedBar?.id)
            .eq('data_visita', data)
            .eq('tipo_visita', 'evento_sympla')

          if (symplaData && symplaData.length > 0) {
            clientes = symplaData.length
            clientesSource = 'sympla_checkins_yuzer'
            console.log(`Ã°Å¸Å½Â« Check-ins Sympla encontrados para dia Yuzer: ${clientes}`)
          } else {
            console.log(`Ã°Å¸Å½Â« Nenhum check-in Sympla encontrado para dia Yuzer ${data}`)
            // Fallback para pessoas_diario_corrigido se nÃ¡Â£o houver Sympla
            console.log(`Ã°Å¸' Fallback: Buscando clientes na tabela 'pessoas_diario_corrigido' para ${data}...`)
            try {
              const { data: pessoasData } = await supabase
                .from('pessoas_diario_corrigido')
                .select('total_pessoas_bruto')
                .eq('dt_gerencial', data)
                .maybeSingle()

              if (pessoasData) {
                clientes = pessoasData.total_pessoas_bruto || 0
                clientesSource = 'pessoas_diario_fallback_yuzer'
              }
            } catch (error) {
              console.log(`ÂÅ' Erro ao buscar fallback pessoas_diario_corrigido:`, error)
            }
          }
        } catch (error) {
          console.log(`ÂÅ' Erro ao buscar check-ins Sympla para dia Yuzer:`, error)
        }
      } else {
        // DIA CONTAHUB: Usar lÃ¡Â³gica original (pessoas_diario_corrigido + Sympla como complemento)
        console.log(`Ã°Å¸' DIA CONTAHUB - Buscando clientes na tabela 'pessoas_diario_corrigido' para ${data}...`)
        try {
          const { data: pessoasData, error: pessoasError } = await supabase
            .from('pessoas_diario_corrigido')
            .select('total_pessoas_bruto')
            .eq('dt_gerencial', data)
            .maybeSingle()

          if (pessoasData) {
            clientes = pessoasData.total_pessoas_bruto || 0
            clientesSource = 'pessoas_diario_corrigido'
          } else {
            console.log(`Å¡Â Ã¯Â¸Â Nenhum dado de clientes encontrado na tabela pessoas_diario_corrigido para ${data}`)
          }
        } catch (error) {
          console.log(`ÂÅ' Erro ao buscar clientes pessoas_diario_corrigido:`, error)
        }

        // Buscar Sympla como complemento/comparaÃ¡Â§Ã¡Â£o
        console.log(`Ã°Å¸Å½Â« Buscando check-ins Sympla para ${data}...`)
        let clientesSympla = 0
        try {
          const { data: symplaData } = await supabase
            .from('cliente_visitas')
            .select('id')
            .eq('bar_id', selectedBar?.id)
            .eq('data_visita', data)
            .eq('tipo_visita', 'evento_sympla')

          if (symplaData && symplaData.length > 0) {
            clientesSympla = symplaData.length
            console.log(`Ã°Å¸Å½Â« Check-ins Sympla encontrados: ${clientesSympla}`)
            
            // Se nÃ¡Â£o tinha dados de pessoas_diario_corrigido, usar Sympla
            if (clientes === 0) {
              clientes = clientesSympla
              clientesSource = 'sympla_checkins'
            } else {
              // Se tinha dados de pessoas_diario_corrigido, comparar e usar o maior
              if (clientesSympla > clientes) {
                console.log(`Ã°Å¸"Å  Sympla tem mais clientes (${clientesSympla}) que pessoas_diario_corrigido (${clientes}), usando Sympla`)
                clientes = clientesSympla
                clientesSource = 'sympla_checkins_maior'
              } else {
                console.log(`Ã°Å¸"Å  Mantendo pessoas_diario_corrigido (${clientes}) maior que Sympla (${clientesSympla})`)
                clientesSource = 'pessoas_diario_corrigido_maior'
              }
            }
          } else {
            console.log(`Ã°Å¸Å½Â« Nenhum check-in Sympla encontrado para ${data}`)
          }
        } catch (error) {
          console.log(`ÂÅ' Erro ao buscar check-ins Sympla:`, error)
        }
      }



      if (clientes === 0) {
        clientesSource = 'sem_dados'
      }

      console.log(`Ã°Å¸' Total clientes FINAL (${clientesSource}): ${clientes}`)

      // DEBUG: Verificar se hÃ¡Â¡ problema com datas futuras
      const hoje = new Date().toISOString().split('T')[0]
      const isDataFutura = data > hoje
      if (isDataFutura) {
        console.log(`Å¡Â Ã¯Â¸Â ATENÃ¡â€¡Ã¡Æ'O: ${data} Ã¡Â© uma data futura (hoje: ${hoje})`)
      }

      // DEBUG: Resumo final dos dados encontrados
      console.log(`Ã°Å¸"Å  RESUMO FINAL para ${data}:`)
      console.log(`   Ã°Å¸'Â° Faturamento total: R$ ${faturamento.toFixed(2)}`)
      console.log(`   Dados válidos? ${(faturamento > 0 || clientes > 0) ? 'SIM' : 'NÃO'}`)

      // 4. RESERVAS GETIN
      let reservas = 0
      if (data && data.length === 10) {
        try {
          console.log(`Ã°Å¸"Â¦ Buscando reservas GetIn para ${data}...`)
          const response = await fetch(`/api/dashboard/reservas-getin?data=${data}&tipo=dia`)
          if (response.ok) {
            const reservaData = await response.json()
            if (reservaData.success) {
              reservas = reservaData.data.estatisticas.total_reservas || 0
              console.log(`Ã°Å¸"Â¦ Total reservas: ${reservas}`)
            }
          }
        } catch (error) {
          console.log(`ÂÅ' Erro na API de reservas:`, error)
        }
      }

      // 5. TEMPOS DE ATENDIMENTO
      let tempoMedioCozinha = 0
      let tempoMedioBar = 0
      
      console.log(`ÂÂ±Ã¯Â¸Â Buscando tempos para ${data}...`)
      // CORREÃ¡â€¡Ã¡Æ'O: Evitar problemas de timezone usando split ao invÃ¡Â©s de new Date()
      const [ano, mes, dia] = data.split('-').map(Number)

      console.log(`ÂÂ±Ã¯Â¸Â Buscando tempo para ano=${ano}, mes=${mes}, dia=${dia}`)

      const { data: tempoData } = await supabase
        .from('tempo')
        .select('grp_desc, t1_t2')
        .eq('bar_id', selectedBar?.id)
        .eq('ano', ano)
        .eq('mes', mes)
        .eq('dia', dia)
        .not('t1_t2', 'is', null)

      if (tempoData && tempoData.length > 0) {
        console.log(`ÂÂ±Ã¯Â¸Â Dados de tempo encontrados: ${tempoData.length} registros`)
        
        // Filtrar dados de bar/bebidas
        const temposBar = tempoData.filter((item: unknown) => {
          const tempo = parseFloat(item.t1_t2) || 0
          const grupo = (item.grp_desc || '').toLowerCase()
          
          const isBar = grupo.includes('cerveja') || 
                       grupo.includes('drink') || 
                       grupo.includes('dose') || 
                       grupo.includes('bebida') || 
                       grupo.includes('balde') ||
                       grupo.includes('combo') ||
                       grupo === ''
          
          return isBar && tempo > 0.5 && tempo <= 20
        })
        
        // Filtrar dados de cozinha
        const temposCozinha = tempoData.filter((item: unknown) => {
          const tempo = parseFloat(item.t1_t2) || 0
          const grupo = (item.grp_desc || '').toLowerCase()
          
          const isCozinha = grupo.includes('prato') || 
                           grupo.includes('comida') || 
                           grupo.includes('lanche') ||
                           grupo.includes('petisco') ||
                           grupo.includes('entrada')
          
          return isCozinha && tempo >= 1 && tempo <= 45
        })
        
        tempoMedioBar = temposBar.length > 0 
          ? temposBar.reduce((sum: number, item: unknown) => sum + parseFloat(item.t1_t2), 0) / temposBar.length 
          : 0
        
        tempoMedioCozinha = temposCozinha.length > 0 
          ? temposCozinha.reduce((sum: number, item: unknown) => sum + parseFloat(item.t1_t2), 0) / temposCozinha.length 
          : 0
        
        console.log(`ÂÂ±Ã¯Â¸Â Tempo mÃ¡Â©dio cozinha: ${tempoMedioCozinha.toFixed(1)}min (${temposCozinha.length} registros)`)
        console.log(`ÂÂ±Ã¯Â¸Â Tempo mÃ¡Â©dio bar: ${tempoMedioBar.toFixed(1)}min (${temposBar.length} registros)`)
        
        if (temposCozinha.length === 0 && temposBar.length === 0) {
          console.log(`Å¡Â Ã¯Â¸Â Nenhum tempo vÃ¡Â¡lido encontrado nos ${tempoData.length} registros para ${data}`)
          console.log(`Ã°Å¸"â€¹ Grupos encontrados: ${[...new Set(tempoData.map((t: unknown) => t.grp_desc))].slice(0,5).join(', ')}`)
        }
      } else {
        console.log(`ÂÂ±Ã¯Â¸Â Nenhum dado de tempo encontrado para ${data}`)
      }

      // 6. FATURAMENTO E CLIENTES POR HORA (INTELIGENTE)
      console.log(`ÂÂ° Buscando faturamento e clientes por hora para ${data}...`)
      
      let faturamento_horas: Array<{
        hora: string
        faturamento: number
        vendas: number
        faturamento_acumulado?: number
        clientes_acumulados?: number
      }> = []

      if (isYuzerDay) {
        // DIA YUZER: Buscar dados por hora do yuzer_analitico (com paginaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica)
        console.log(`Ã°Å¸ÂÂº Buscando TODOS os dados por hora do Yuzer para ${data}...`)
        
        const queryYuzerHora = supabase
          .from('yuzer_analitico')
          .select('data_hora_pedido, valor_total, pedido_id')
          .eq('bar_id', selectedBar?.id)
          .eq('data_pedido', data)
          .not('data_hora_pedido', 'is', null)
        
        const yuzerHoraData = await buscarTodosRegistros(queryYuzerHora)
        console.log(`Ã°Å¸"Â¦ Total de registros por hora encontrados: ${yuzerHoraData.length}`)

        if (yuzerHoraData && yuzerHoraData.length > 0) {
          // Para dias Yuzer, distribuir check-ins Sympla proporcionalmente ao faturamento por hora
          console.log(`Ã°Å¸Å½Â« Distribuindo ${clientes} check-ins Sympla proporcionalmente ao faturamento Yuzer por hora...`)

          // Agrupar faturamento por hora
          const dadosPorHora: {[hora: string]: {faturamento: number, pedidos: Set<string>}} = {}
          
          yuzerHoraData.forEach((item: unknown) => {
            if (item.data_hora_pedido) {
              // CORREÃ¡â€¡Ã¡Æ'O: Extrair hora diretamente da string para evitar problemas de timezone
              const horaString = item.data_hora_pedido.split('T')[1] || '00:00:00'
              const hora = horaString.split(':')[0].padStart(2, '0') + ':00'
              
              if (!dadosPorHora[hora]) {
                dadosPorHora[hora] = { faturamento: 0, pedidos: new Set() }
              }
              
              dadosPorHora[hora].faturamento += parseFloat(item.valor_total) || 0
              if (item.pedido_id) {
                dadosPorHora[hora].pedidos.add(item.pedido_id)
              }
            }
          })

          // Calcular faturamento total para proporÃ¡Â§Ã¡Â£o
          const faturamentoTotal = Object.values(dadosPorHora).reduce((sum, dados: unknown) => sum + dados.faturamento, 0)
          
          // Distribuir clientes proporcionalmente ao faturamento
          const clientesPorHora: {[hora: string]: number} = {}
          let clientesDistribuidos = 0
          
          Object.keys(dadosPorHora).forEach((hora: string) => {
            const proporcao = dadosPorHora[hora].faturamento / faturamentoTotal
            const clientesHora = Math.round(clientes * proporcao)
            clientesPorHora[hora] = clientesHora
            clientesDistribuidos += clientesHora
          })
          
          // Ajustar diferenÃ¡Â§a de arredondamento
          const diferenca = clientes - clientesDistribuidos
          if (diferenca !== 0) {
            const horaComMaiorFaturamento = Object.keys(dadosPorHora).reduce((max, hora) => 
              dadosPorHora[hora].faturamento > dadosPorHora[max].faturamento ? hora : max
            )
            clientesPorHora[horaComMaiorFaturamento] += diferenca
          }
          
          console.log(`Ã°Å¸Å½Â« Clientes distribuÃ¡Â­dos por hora:`, clientesPorHora)

          // Converter para array ordenado
          const horasOrdenadas = Object.keys(dadosPorHora).sort()
          let faturamentoAcumulado = 0
          let clientesAcumulados = 0

          faturamento_horas = horasOrdenadas.map((hora: string) => {
            const dados: unknown = dadosPorHora[hora]
            const faturamento = dados.faturamento
            // CORREÃ¡â€¡Ã¡Æ'O: Para dias Yuzer, usar clientes distribuÃ¡Â­dos proporcionalmente
            const vendas = clientesPorHora[hora] || 0
            
            faturamentoAcumulado += faturamento
            clientesAcumulados += vendas

            return {
              hora,
              faturamento,
              vendas,
              faturamento_acumulado: faturamentoAcumulado,
              clientes_acumulados: clientesAcumulados
            }
          })

          console.log(`Ã°Å¸ÂÂº Yuzer - Dados por hora: ${faturamento_horas.length} horÃ¡Â¡rios`)
          console.log(`Ã°Å¸"Å  Faturamento acumulado: R$ ${faturamentoAcumulado.toFixed(2)}`)
          console.log(`Ã°Å¸' Dados vÃ¡Â¡lidos: ${clientesAcumulados}`)
        }

      } else {
        // DIA CONTAHUB: Usar lÃ¡Â³gica original (fatporhora + analitico)
        console.log(`Ã°Å¸'Â» Buscando dados por hora do ContaHub para ${data}...`)
        
        const { data: fatHoraData, error: fatHoraError } = await supabase
          .from('fatporhora')
          .select('hora, valor, qtd, vd_dtgerencial')
          .eq('bar_id', selectedBar?.id)
          .eq('vd_dtgerencial', data)
          .not('valor', 'is', null)
          .order('hora')

        if (fatHoraError) {
          console.error('Erro ao buscar faturamento por hora:', fatHoraError)
        }

        // BUSCAR CLIENTES POR HORA DA TABELA ANALITICO (com paginaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica)
        console.log(`Ã°Å¸' Buscando clientes por hora da tabela analitico para ${data}...`)
        
        const queryClientesHora = supabase
          .from('analitico')
          .select('created_at, vd')
          .eq('bar_id', selectedBar?.id)
          .eq('vd_dtgerencial', data)
          .not('vd', 'is', null)
        
        const clientesHoraData = await buscarTodosRegistros(queryClientesHora)
        console.log(`Ã°Å¸' Total de registros de clientes encontrados: ${clientesHoraData.length}`)

        const clientesPorHora: {[hora: string]: number} = {}
        
        if (clientesHoraData && clientesHoraData.length > 0) {
          // Agrupar clientes Ã¡Âºnicos por hora
          const clientesUnicos = new Map()
          
          clientesHoraData.forEach((item: unknown) => {
            if (item.created_at && item.vd) {
              // CORREÃ¡â€¡Ã¡Æ'O: Extrair hora diretamente da string para evitar problemas de timezone
              const horaString = item.created_at.split('T')[1] || '00:00:00'
              const hora = horaString.split(':')[0].padStart(2, '0') + ':00'
              const clienteId = item.vd
              
              if (!clientesUnicos.has(hora)) {
                clientesUnicos.set(hora, new Set())
              }
              clientesUnicos.get(hora).add(clienteId)
            }
          })
          
          // Converter para objeto com contagem
          clientesUnicos.forEach((clientes, hora) => {
            clientesPorHora[hora] = clientes.size
          })
          
          console.log(`Ã°Å¸' Clientes por hora encontrados:`, clientesPorHora)
        } else {
          console.log(`Ã°Å¸' Nenhum dado de clientes por hora encontrado na tabela analitico para ${data}`)
        }

        // Processar faturamento por hora com valores acumulados
        if (fatHoraData && fatHoraData.length > 0) {
          // Ordenar por hora para calcular acumulados corretamente
          const dadosOrdenados = fatHoraData
            .map((f: unknown) => {
              const hora = f.hora
              const faturamento = parseFloat(f.valor) || 0
              // CORREÃ¡â€¡Ã¡Æ'O: Usar qtd da fatporhora ou clientes da analitico
              const vendas = clientesPorHora[hora] || parseInt(f.qtd) || 0
              
              return {
                hora,
                faturamento,
                vendas
              }
            })
            .sort((a: unknown, b: unknown) => a.hora.localeCompare(b.hora))

          // Calcular valores acumulados
          let faturamentoAcumulado = 0
          let clientesAcumulados = 0

          faturamento_horas = dadosOrdenados.map((item: unknown) => {
            faturamentoAcumulado += item.faturamento
            clientesAcumulados += item.vendas

            return {
              ...item,
              faturamento_acumulado: faturamentoAcumulado,
              clientes_acumulados: clientesAcumulados
            }
          })

          console.log(`Ã°Å¸'Â» ContaHub - Dados por hora: ${faturamento_horas.length} horÃ¡Â¡rios`)
          console.log(`Ã°Å¸"Å  Faturamento acumulado: R$ ${faturamentoAcumulado.toFixed(2)}`)
          console.log(`Ã°Å¸' Dados vÃ¡Â¡lidos: ${clientesAcumulados}`)
        }
      }

      // Debug dos primeiros horÃ¡Â¡rios
      if (faturamento_horas.length > 0) {
        console.log(`ÂÂ° Primeiros horÃ¡Â¡rios:`)
        faturamento_horas.slice(0, 3).forEach((h: unknown) => {
          console.log(`   ${h.hora}: R$ ${h.faturamento.toFixed(2)} | ${h.vendas} clientes | Acum: R$ ${h.faturamento_acumulado?.toFixed(2)} | ${h.clientes_acumulados} clientes`)
        })
      } else {
        console.log(`ÂÂ° Nenhum dado de faturamento por hora encontrado para ${data}`)
      }

      // 7. TICKET MÃ¡â€°DIO
      const ticketMedio = clientes > 0 ? faturamento / clientes : 0

      const resultado = {
        data,
        faturamento,
        faturamentoYuzer,
        faturamentoContaHub,
        faturamentoSympla,
        clientes,
        ticketMedio,
        reservas,
        tempoCozinha: tempoMedioCozinha,
        tempoBar: tempoMedioBar,
        pratos: [],
        artista: 'N/A',
        faturamento_horas
      }

      console.log(`Ã°Å¸"Å  Dados finais para ${data}:`, resultado)
      return resultado

    } catch (error) {
      console.error(`ÂÅ' Erro ao buscar dados para ${data}:`, error)
      return {
        data,
        faturamento: 0,
        faturamentoYuzer: 0,
        faturamentoContaHub: 0,
        faturamentoSympla: 0,
        clientes: 0,
        ticketMedio: 0,
        reservas: 0,
        tempoCozinha: 0,
        tempoBar: 0,
        pratos: [],
        artista: 'N/A',
        faturamento_horas: []
      }
    }
  }

  const buscarComparacaoDatas = async () => {
    if (!selectedBar || !data1 || !data2) {
      alert('Por favor, selecione um bar e duas datas para comparaÃ¡Â§Ã¡Â£o!')
      return
    }

    setLoading(true)
    try {
      // Padronizar artistas antes da comparaÃ¡Â§Ã¡Â£o
      await padronizarArtistas()
      
      console.log('Ã°Å¸"Å  Comparando datas:', data1, 'vs', data2)

      // Buscar dados das duas datas em paralelo
      const [dados1, dados2] = await Promise.all([
        buscarDadosData(data1),
        buscarDadosData(data2)
      ])

      setDadosComparativos([dados1, dados2])

      // Buscar anÃ¡Â¡lise de recorrÃ¡Âªncia de clientes
      try {
        const response = await fetch(
          `/api/dashboard/recorrencia-clientes?bar_id=${selectedBar.id}&data1=${data1}&data2=${data2}&artista1=${(dados1 as unknown).artista || 'N/A'}&artista2=${(dados2 as unknown).artista || 'N/A'}`
        )
        const result = await response.json()
        if (result.success) {
          setRecorrenciaClientes(result.data)
        }
      } catch (error) {
        console.log('Erro ao buscar recorrÃ¡Âªncia:', error)
        setRecorrenciaClientes(null)
      }
      
    } catch (error) {
      console.error('Erro ao buscar comparação de datas:', error)
      setDadosComparativos([])
      setRecorrenciaClientes(null)
    } finally {
      setLoading(false)
    }
  }

  const buscarComparacaoArtistas = async () => {
    if (!selectedBar || !artistaSelecionado1 || !artistaSelecionado2) {
      alert('Por favor, selecione um bar e dois artistas!')
      return
    }

    setLoading(true)
    try {
      console.log('Ã°Å¸Å½Â¤ Comparando artistas:', artistaSelecionado1, 'vs', artistaSelecionado2)

      const statsArtistas = await Promise.all([
        buscarStatsArtista(artistaSelecionado1),
        buscarStatsArtista(artistaSelecionado2)
      ])

      setDadosArtistas({
        artista1: statsArtistas[0],
        artista2: statsArtistas[1]
      })
      
    } catch (error) {
      console.error('Erro ao buscar comparação de artistas:', error)
      setDadosArtistas({ artista1: null, artista2: null })
    } finally {
      setLoading(false)
    }
  }

  const buscarStatsArtista = async (nomeArtista: string): Promise<ArtistaStats | null> => {
    try {
      console.log(`Ã°Å¸Å½Â¤ Buscando stats para artista: ${nomeArtista}`)

      // Inicializar cliente Supabase
      const supabase = await getSupabaseClient();
      if (!supabase) {
        console.error('Erro ao conectar com banco');
        return null;
      }

      // Buscar eventos do artista
      console.log(`Ã°Å¸"Â Buscando TODOS os eventos para ${nomeArtista} no bar ${selectedBar?.id}...`)
      const { data: eventos } = await supabase
        .from('eventos')
        .select('data_evento')
        .eq('bar_id', selectedBar?.id)
        .eq('nome_artista', nomeArtista)
        .order('data_evento', { ascending: false })

      if (!eventos || eventos.length === 0) {
        console.log(`ÂÅ' Nenhum evento encontrado para ${nomeArtista}`)
        return null
      }

      console.log(`Ã°Å¸"â€¦ TOTAL de eventos encontrados para ${nomeArtista}: ${eventos.length}`)
      console.log(`Ã°Å¸"â€¦ Eventos completos:`, eventos)
      const datasEventos = eventos.map((e: unknown) => e.data_evento)
      console.log(`Ã°Å¸"â€  TODAS as datas dos eventos (${datasEventos.length}): ${datasEventos.join(', ')}`)

      // Buscar dados de todas as datas
      const dadosEventos = await Promise.all(
        datasEventos.map((data: string) => buscarDadosData(data))
      )

      console.log(`Ã°Å¸"Ë† Todos os dados dos eventos:`, dadosEventos)

      // Filtrar apenas dados vÃ¡Â¡lidos (com faturamento > 0 ou clientes > 0)
      const dadosValidos = dadosEventos.filter((d: DadosComparacao) => d.faturamento > 0 || d.clientes > 0)
      console.log(`Å"â€¦ Dados vÃ¡Â¡lidos (faturamento > 0 ou clientes > 0): ${dadosValidos.length}`)

      // LOGS DETALHADOS para debug
      console.log(`Ã°Å¸"Â ANÃ¡LISE DETALHADA DOS EVENTOS DE ${nomeArtista}:`)
      dadosEventos.forEach((dados: unknown, index: unknown) => {
        const isValido = dados.faturamento > 0 || dados.clientes > 0
        console.log(`Ã°Å¸"â€¦ ${dados.data}: Faturamento R$ ${dados.faturamento.toFixed(2)}, Clientes: ${dados.clientes}, VÃ¡Â¡lido: ${isValido ? 'Å"â€¦' : 'ÂÅ'}`)
        if (!isValido) {
          console.log(`   Å¡Â Ã¯Â¸Â Evento sem dados: pode ser data futura ou problema na busca`)
        }
      })

      if (dadosValidos.length < datasEventos.length) {
        const datasSemDados = datasEventos.filter((d: DadosComparacao) => d.faturamento === 0 && d.clientes === 0).map((d: DadosComparacao) => d.data)
        console.log(`Å¡Â Ã¯Â¸Â ATENÃ¡â€¡Ã¡Æ'O: ${datasSemDados.length} datas sem dados vÃ¡Â¡lidos: ${datasSemDados.join(', ')}`)
        console.log(`Ã°Å¸Â¡ Provavelmente sÃ¡Â£o datas futuras ainda sem movimentaÃ¡Â§Ã¡Â£o real`)
      }

      if (dadosValidos.length === 0) {
        console.log(`ÂÅ' Nenhum dado vÃ¡Â¡lido encontrado para ${nomeArtista}`)
        return null
      }

      // Calcular mÃ¡Â©tricas bÃ¡Â¡sicas
      const totalFaturamento = dadosValidos.reduce((sum: number, d: DadosComparacao) => sum + d.faturamento, 0)
      const totalFaturamentoYuzer = dadosValidos.reduce((sum: number, d: DadosComparacao) => sum + d.faturamentoYuzer, 0)
      const totalFaturamentoContaHub = dadosValidos.reduce((sum: number, d: DadosComparacao) => sum + d.faturamentoContaHub, 0)
      const totalFaturamentoSympla = dadosValidos.reduce((sum: number, d: DadosComparacao) => sum + d.faturamentoSympla, 0)
      const totalClientes = dadosValidos.reduce((sum: number, d: DadosComparacao) => sum + d.clientes, 0)
      const totalReservas = dadosValidos.reduce((sum: number, d: DadosComparacao) => sum + d.reservas, 0)
      
      console.log(`Ã°Å¸Â§Â® CÃ¡LCULOS PARA ${nomeArtista}:`)
      console.log(`Ã°Å¸"Å  Total de eventos vÃ¡Â¡lidos: ${dadosValidos.length}`)
      console.log(`Ã°Å¸'Â° Total faturamento: R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`Ã°Å¸ÂÂ» Total Yuzer: R$ ${totalFaturamentoYuzer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`Ã°Å¸Å½Â« Total ContaHub: R$ ${totalFaturamentoContaHub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`Ã°Å¸Å½Å¸Ã¯Â¸Â Total Sympla: R$ ${totalFaturamentoSympla.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      console.log(`Ã°Å¸"â€ž Faturamento mÃ¡Â©dio serÃ¡Â¡: R$ ${(totalFaturamento / dadosValidos.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)

      // Calcular tempos mÃ¡Â©dios (apenas onde hÃ¡Â¡ dados)
      const dadosComTempoCozinha = dadosValidos.filter((d: DadosComparacao) => d.tempoCozinha > 0)
      const dadosComTempoBar = dadosValidos.filter((d: DadosComparacao) => d.tempoBar > 0)
      
      const tempoMedioCozinha = dadosComTempoCozinha.length > 0 
        ? dadosComTempoCozinha.reduce((sum: number, d: DadosComparacao) => sum + d.tempoCozinha, 0) / dadosComTempoCozinha.length 
        : 0

      const tempoMedioBar = dadosComTempoBar.length > 0 
        ? dadosComTempoBar.reduce((sum: number, d: DadosComparacao) => sum + d.tempoBar, 0) / dadosComTempoBar.length 
        : 0

      // Buscar recorrÃ¡Âªncia mÃ¡Â©dia do artista
      const recorrenciaMedia = await buscarRecorrenciaPorArtista(nomeArtista)

      // Calcular eficiÃ¡Âªncia de atendimento (baseado nos tempos)
      let eficienciaAtendimento = 0
      if (tempoMedioBar > 0) {
        // Quanto menor o tempo, maior a eficiÃ¡Âªncia (escala 0-100)
        eficienciaAtendimento = Math.max(0, Math.min(100, 100 - (tempoMedioBar * 5)))
      }

      // Calcular crescimento de clientes (comparar primeiro vs Ã¡Âºltimo evento)
      let crescimentoClientes = 0
      if (dadosValidos.length >= 2) {
        const primeiroEvento = dadosValidos[dadosValidos.length - 1] // mais antigo
        const ultimoEvento = dadosValidos[0] // mais recente
        if (primeiroEvento.clientes > 0) {
          crescimentoClientes = ((ultimoEvento.clientes - primeiroEvento.clientes) / primeiroEvento.clientes) * 100
        }
      }

      // FidelizaÃ¡Â§Ã¡Â£o = recorrÃ¡Âªncia + crescimento (mÃ¡Â©trica combinada)
      const fidelizacaoClientes = (recorrenciaMedia * 0.7) + (Math.max(0, crescimentoClientes) * 0.3)

      const resultado: ArtistaStats = {
        nome: nomeArtista,
        // TOTAIS (somados de todos os eventos)
        faturamentoTotal: totalFaturamento,
        faturamentoYuzerTotal: totalFaturamentoYuzer,
        faturamentoContaHubTotal: totalFaturamentoContaHub,
        faturamentoSymplaTotal: totalFaturamentoSympla,
        clientesTotal: totalClientes,
        reservasTotal: totalReservas,
        // MÃ¡â€°DIAS (total dividido pelo nÃ¡Âºmero de eventos)
        faturamentoMedio: totalFaturamento / dadosValidos.length,
        faturamentoYuzerMedio: totalFaturamentoYuzer / dadosValidos.length,
        faturamentoContaHubMedio: totalFaturamentoContaHub / dadosValidos.length,
        faturamentoSymplaMedio: totalFaturamentoSympla / dadosValidos.length,
        clientesMedio: totalClientes / dadosValidos.length,
        reservasMedio: totalReservas / dadosValidos.length,
        // TICKET MÃ¡â€°DIO (faturamento total / clientes total)
        ticketMedio: totalClientes > 0 ? totalFaturamento / totalClientes : 0,
        tempoMedioCozinha,
        tempoMedioBar,
        totalEventos: eventos.length,
        eventosComDados: dadosValidos.length,
        recorrenciaMedia,
        fidelizacaoClientes,
        crescimentoClientes,
        eficienciaAtendimento
      }

      console.log(`Ã°Å¸Ââ€  Resultado final para ${nomeArtista}:`, resultado)
      return resultado

    } catch (error) {
      console.error(`ÂÅ' Erro ao buscar stats do artista ${nomeArtista}:`, error)
      return null
    }
  }

  const gerarInsightComparacao = () => {
    if (dadosComparativos.length !== 2) return null

    const [dados1, dados2] = dadosComparativos
    const insights = []

    // Faturamento
    const difFaturamento = (dados2?.faturamento || 0) - (dados1?.faturamento || 0)
    const percFaturamento = (dados1?.faturamento || 0) > 0 ? (difFaturamento / (dados1?.faturamento || 0)) * 100 : 0
    
    if (difFaturamento > 0) {
      insights.push(`Ã°Å¸"Ë† Faturamento cresceu R$ ${difFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (+${percFaturamento.toFixed(1)}%)`)
    } else if (difFaturamento < 0) {
      insights.push(`Ã°Å¸"â€° Faturamento caiu R$ ${Math.abs(difFaturamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percFaturamento.toFixed(1)}%)`)
    }

    // Clientes
    const difClientes = (dados2?.clientes || 0) - (dados1?.clientes || 0)
    if (difClientes > 0) {
      insights.push(`Ã°Å¸' Recebeu ${difClientes} clientes a mais`)
    } else if (difClientes < 0) {
      insights.push(`Ã°Å¸' Recebeu ${Math.abs(difClientes)} clientes a menos`)
    }

    // Ticket mÃ¡Â©dio
    const difTicket = (dados2?.ticketMedio || 0) - (dados1?.ticketMedio || 0)
    if (Math.abs(difTicket) > 5) {
      insights.push(`Ã°Å¸Å½Â¯ Ticket mÃ¡Â©dio ${difTicket > 0 ? 'aumentou' : 'diminuiu'} R$ ${Math.abs(difTicket).toFixed(2)}`)
    }

    // Tempos
    if ((dados2?.tempoCozinha || 0) > 0 && (dados1?.tempoCozinha || 0) > 0) {
      const difTempoCozinha = (dados2?.tempoCozinha || 0) - (dados1?.tempoCozinha || 0)
      if (Math.abs(difTempoCozinha) > 1) {
        insights.push(`Ã°Å¸'â‚¬ÂÃ°Å¸ÂÂ³ Tempo de cozinha ${difTempoCozinha > 0 ? 'aumentou' : 'diminuiu'} ${Math.abs(difTempoCozinha).toFixed(1)} min`)
      }
    }

    // Artistas
    if ((dados2?.artista || 0) !== (dados1?.artista || 0)) {
      insights.push(`Ã°Å¸Å½Â¤ MudanÃ¡Â§a de artista: ${(dados1?.artista || 0)} â€ ' ${(dados2?.artista || 0)}`)
    }

    return insights
  }

  const gerarInsightArtistas = () => {
    const { artista1, artista2 } = dadosArtistas
    if (!artista1 || !artista2) return null

    const insights = []

    // Faturamento mÃ¡Â©dio
    const melhorFaturamento = artista1.faturamentoMedio > artista2.faturamentoMedio ? artista1 : artista2
    const difFaturamento = Math.abs(artista1.faturamentoMedio - artista2.faturamentoMedio)
    insights.push(`Ã°Å¸'Â° ${melhorFaturamento.nome} gera R$ ${difFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais por evento`)

    // Clientes mÃ¡Â©dios
    const melhorClientes = artista1.clientesMedio > artista2.clientesMedio ? artista1 : artista2
    const difClientes = Math.abs(artista1.clientesMedio - artista2.clientesMedio)
    insights.push(`Ã°Å¸' ${melhorClientes.nome} atrai ${difClientes.toFixed(0)} clientes a mais por evento`)

    // Ticket mÃ¡Â©dio
    const melhorTicket = artista1.ticketMedio > artista2.ticketMedio ? artista1 : artista2
    const difTicket = Math.abs(artista1.ticketMedio - artista2.ticketMedio)
    insights.push(`Ã°Å¸Å½Â¯ ${melhorTicket.nome} tem ticket mÃ¡Â©dio R$ ${difTicket.toFixed(2)} superior`)

    // ConsistÃ¡Âªncia
    const maisConsistente = artista1.totalEventos > artista2.totalEventos ? artista1 : artista2
    insights.push(`Ã°Å¸Å½Âª ${maisConsistente.nome} tem mais eventos registrados (${maisConsistente.totalEventos} vs ${maisConsistente === artista1 ? artista2.totalEventos : artista1.totalEventos})`)

    // Performance geral
    const scoreArtista1 = (artista1.faturamentoMedio * 0.4) + (artista1.clientesMedio * 0.3) + (artista1.ticketMedio * 0.3)
    const scoreArtista2 = (artista2.faturamentoMedio * 0.4) + (artista2.clientesMedio * 0.3) + (artista2.ticketMedio * 0.3)
    const melhorGeral = scoreArtista1 > scoreArtista2 ? artista1 : artista2
    insights.push(`Ã°Å¸Ââ€  ${melhorGeral.nome} tem melhor performance geral para a casa`)

    return insights
  }

  // Gerar insights avanÃ¡Â§ados baseados na comparaÃ¡Â§Ã¡Â£o
  const gerarInsights = (dados1: DadosComparacao, dados2: DadosComparacao, stats1: ArtistaStats, stats2: ArtistaStats): string[] => {
    const insights: string[] = []
    
    // AnÃ¡Â¡lise de faturamento
    const diferencaFat = (((dados1?.faturamento || 0) - (dados2?.faturamento || 0)) / (dados2?.faturamento || 0)) * 100
    if (Math.abs(diferencaFat) > 20) {
      const melhor = diferencaFat > 0 ? (dados1?.artista || 0) : (dados2?.artista || 0)
      insights.push(`Ã°Å¸'Â° ${melhor} tem faturamento ${Math.abs(diferencaFat).toFixed(1)}% superior`)
    }
    
    // AnÃ¡Â¡lise de ticket mÃ¡Â©dio
    const diferencaTicket = (((dados1?.ticketMedio || 0) - (dados2?.ticketMedio || 0)) / (dados2?.ticketMedio || 0)) * 100
    if (Math.abs(diferencaTicket) > 15) {
      const melhor = diferencaTicket > 0 ? (dados1?.artista || 0) : (dados2?.artista || 0)
      insights.push(`Ã°Å¸Å½Â¯ ${melhor} gera ticket mÃ¡Â©dio ${Math.abs(diferencaTicket).toFixed(1)}% maior`)
    }
    
    // AnÃ¡Â¡lise de tempos
    if ((dados1?.tempoBar || 0) > 0 && (dados2?.tempoBar || 0) > 0) {
      const melhorTempo = (dados1?.tempoBar || 0) < (dados2?.tempoBar || 0) ? (dados1?.artista || 0) : (dados2?.artista || 0)
      insights.push(`Å¡Â¡ ${melhorTempo} tem atendimento mais rÃ¡Â¡pido no bar`)
    }
    
    // AnÃ¡Â¡lise de clientes
    const diferencaClientes = (((dados1?.clientes || 0) - (dados2?.clientes || 0)) / (dados2?.clientes || 0)) * 100
    if (Math.abs(diferencaClientes) > 25) {
      const melhor = diferencaClientes > 0 ? (dados1?.artista || 0) : (dados2?.artista || 0)
      insights.push(`Ã°Å¸' ${melhor} atrai ${Math.abs(diferencaClientes).toFixed(1)}% mais pÃ¡Âºblico`)
    }
    
    return insights
  }

  // Buscar dados de recorrÃ¡Âªncia especÃ¡Â­ficos por artista (otimizado)
  const buscarRecorrenciaPorArtista = async (nomeArtista: string) => {
    try {
      console.log(`Ã°Å¸"â€ž Calculando recorrÃ¡Âªncia estimada para ${nomeArtista}...`)
      
      // Inicializar cliente Supabase
      const supabase = await getSupabaseClient();
      if (!supabase) {
        console.error('Erro ao conectar com banco');
        return 0;
      }
      
      // Buscar todos os eventos do artista
      const { data: eventosArtista } = await supabase
        .from('eventos')
        .select('data_evento')
        .eq('bar_id', selectedBar?.id)
        .eq('nome_artista', nomeArtista)
        .order('data_evento', { ascending: true })

      if (!eventosArtista || eventosArtista.length < 2) {
        console.log(`ÂÅ' Poucos eventos para ${nomeArtista}: ${eventosArtista?.length || 0}`)
        return 0
      }

      const totalEventos = eventosArtista.length
      
      // Buscar dados de TODOS os eventos para ter uma base mais precisa
      let totalPessoas = 0
      let eventosComDados = 0

      for (const evento of eventosArtista) {
        try {
          // Buscar dados de pessoas_diario_corrigido
          const { data: pessoasData } = await supabase
            .from('pessoas_diario_corrigido')
            .select('total_pessoas_bruto')
            .eq('dt_gerencial', evento.data_evento)
            .maybeSingle()

          let pessoasEvento = pessoasData?.total_pessoas_bruto || 0

          // Se nÃ¡Â£o tem dados em pessoas_diario_corrigido, buscar em Sympla
          if (pessoasEvento === 0) {
            const { data: symplaData } = await supabase
              .from('cliente_visitas')
              .select('id')
              .eq('bar_id', selectedBar?.id)
              .eq('data_visita', evento.data_evento)
              .eq('tipo_visita', 'evento_sympla')

            if (symplaData && symplaData.length > 0) {
              pessoasEvento = symplaData.length
            }
          }

          if (pessoasEvento > 0) {
            totalPessoas += pessoasEvento
            eventosComDados++
          }
        } catch (error) {
          console.log(`Erro ao buscar dados para ${evento.data_evento}:`, error)
        }
      }

      // Calcular estimativa de recorrÃ¡Âªncia baseada em heurÃ¡Â­sticas melhoradas
      let recorrenciaEstimada = 0
      
      if (eventosComDados > 0) {
        const mediaPessoas = totalPessoas / eventosComDados
        const percentualEventosComDados = (eventosComDados / totalEventos) * 100
        
        // HeurÃ¡Â­stica melhorada: considera nÃ¡Âºmero de eventos, pÃ¡Âºblico mÃ¡Â©dio e consistÃ¡Âªncia
        if (totalEventos >= 10) {
          if (mediaPessoas > 500) {
            recorrenciaEstimada = 45 + (percentualEventosComDados * 0.3)
          } else if (mediaPessoas > 200) {
            recorrenciaEstimada = 35 + (percentualEventosComDados * 0.25)
          } else {
            recorrenciaEstimada = 25 + (percentualEventosComDados * 0.2)
          }
        } else if (totalEventos >= 5) {
          if (mediaPessoas > 500) {
            recorrenciaEstimada = 40 + (percentualEventosComDados * 0.25)
          } else if (mediaPessoas > 200) {
            recorrenciaEstimada = 30 + (percentualEventosComDados * 0.2)
          } else {
            recorrenciaEstimada = 20 + (percentualEventosComDados * 0.15)
          }
        } else {
          if (mediaPessoas > 500) {
            recorrenciaEstimada = 35 + (percentualEventosComDados * 0.2)
          } else if (mediaPessoas > 200) {
            recorrenciaEstimada = 25 + (percentualEventosComDados * 0.15)
          } else {
            recorrenciaEstimada = 15 + (percentualEventosComDados * 0.1)
          }
        }
      } else {
        // Fallback baseado apenas no nÃ¡Âºmero de eventos
        recorrenciaEstimada = totalEventos >= 10 ? 30 : totalEventos >= 5 ? 20 : 15
      }

      // Limitar entre 5% e 80%
      recorrenciaEstimada = Math.max(5, Math.min(80, recorrenciaEstimada))

      console.log(`Ã°Å¸"Å  RecorrÃ¡Âªncia estimada para ${nomeArtista}: ${recorrenciaEstimada.toFixed(1)}% (${totalEventos} eventos, ${eventosComDados} com dados, mÃ¡Â©dia ${(totalPessoas/eventosComDados || 0).toFixed(0)} pessoas)`)
      return recorrenciaEstimada

    } catch (error) {
      console.log(`Erro ao buscar recorrÃ¡Âªncia para ${nomeArtista}:`, error)
      return 0
    }
  }

  const compararDatas = async () => {
    if (!artistaSelecionado1 || !artistaSelecionado2 || !selectedBar?.id) return
    
    setLoading(true)
    console.log(`Ã°Å¸Å½Â¤ Comparando artistas: ${artistaSelecionado1} vs ${artistaSelecionado2}`)

    try {
      // Buscar estatÃ¡Â­sticas de ambos os artistas
      const [stats1, stats2] = await Promise.all([
        buscarStatsArtista(artistaSelecionado1),
        buscarStatsArtista(artistaSelecionado2)
      ])

      if (!stats1 || !stats2) {
        alert('Erro ao buscar dados dos artistas. Verifique se existem eventos cadastrados.')
        return
      }

      // Para comparaÃ¡Â§Ã¡Â£o de artistas, nÃ¡Â£o precisamos dos dados detalhados de recorrÃ¡Âªncia
      // A recorrÃ¡Âªncia jÃ¡Â¡ estÃ¡Â¡ calculada nas stats individuais de cada artista
      setRecorrenciaClientes(null) // Limpar dados de recorrÃ¡Âªncia detalhada

      // Calcular mÃ¡Â©dias e criar dados comparativos
      const dadosData1: DadosComparacao = {
        data: `${artistaSelecionado1} (MÃ¡Â©dia)`,
        faturamento: stats1.faturamentoMedio,
        faturamentoYuzer: stats1.faturamentoYuzerMedio,
        faturamentoContaHub: stats1.faturamentoContaHubMedio,
        faturamentoSympla: stats1.faturamentoSymplaMedio,
        clientes: stats1.clientesMedio,
        ticketMedio: stats1.ticketMedio,
        reservas: stats1.reservasMedio || 0,
        tempoCozinha: stats1.tempoMedioCozinha,
        tempoBar: stats1.tempoMedioBar,
        pratos: [],
        artista: artistaSelecionado1,
        faturamento_horas: [] // Dados por hora nÃ¡Â£o disponÃ¡Â­veis para comparaÃ¡Â§Ã¡Â£o de artistas
      }

      const dadosData2: DadosComparacao = {
        data: `${artistaSelecionado2} (MÃ¡Â©dia)`,
        faturamento: stats2.faturamentoMedio,
        faturamentoYuzer: stats2.faturamentoYuzerMedio,
        faturamentoContaHub: stats2.faturamentoContaHubMedio,
        faturamentoSympla: stats2.faturamentoSymplaMedio,
        clientes: stats2.clientesMedio,
        ticketMedio: stats2.ticketMedio,
        reservas: stats2.reservasMedio || 0,
        tempoCozinha: stats2.tempoMedioCozinha,
        tempoBar: stats2.tempoMedioBar,
        pratos: [],
        artista: artistaSelecionado2,
        faturamento_horas: [] // Dados por hora nÃ¡Â£o disponÃ¡Â­veis para comparaÃ¡Â§Ã¡Â£o de artistas
      }

      setDadosComparativos([dadosData1, dadosData2])

      // Gerar insights
      const novosInsights = gerarInsights(dadosData1, dadosData2, stats1, stats2)
      setInsights(novosInsights)

    } catch (error) {
      console.error('Erro na comparaÃ¡Â§Ã¡Â£o:', error)
      alert('Erro ao processar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* BotÃ¡Â£o de Voltar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/configuracoes')}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para ConfiguraÃ¡Â§Ã¡Âµes
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">Ã°Å¸"Å  ComparaÃ¡Â§Ã¡Â£o de Dados</h1>
          <p className="text-slate-600 mt-1">Compare performance entre datas especÃ¡Â­ficas ou artistas diferentes</p>
        </div>
      </div>

      {/* Adicionar CSS especÃ¡Â­fico para valores monetÃ¡Â¡rios */}
      <style jsx>{`
        .valor-monetario {
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          font-weight: 700 !important;
          font-size: 1.125rem !important;
          line-height: 1.5 !important;
          color: #1e293b !important;
          display: block !important;
          white-space: nowrap !important;
          overflow: visible !important;
          text-overflow: clip !important;
          max-width: none !important;
          width: auto !important;
          height: auto !important;
          min-height: 1.5rem !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          background: transparent !important;
          text-align: center !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
        
        .card-valor {
          min-width: 120px !important;
          text-align: center !important;
          padding: 12px !important;
          background: white !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
          overflow: visible !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
        .debug-valor {
          border: 1px solid red !important;
          background: yellow !important;
          padding: 4px !important;
          font-weight: bold !important;
          font-size: 14px !important;
          color: black !important;
          display: block !important;
          text-align: center !important;
          margin: 2px 0 !important;
        }
      `}</style>

      {/* Controles de ComparaÃ¡Â§Ã¡Â£o */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Ã°Å¸"Å  ComparaÃ¡Â§Ã¡Â£o de Dados</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de ComparaÃ¡Â§Ã¡Â£o */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de ComparaÃ¡Â§Ã¡Â£o
            </label>
            <select 
              value={tipoComparacao} 
              onChange={(e) => setTipoComparacao(e.target.value as TipoComparacao)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="datas-especificas">Ã°Å¸â€"Ã¯Â¸Â Comparar Datas EspecÃ¡Â­ficas</option>
              <option value="artistas">Ã°Å¸Å½Â¤ Comparar Artistas</option>
            </select>
          </div>

          {/* Seletor de Bar */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bar
            </label>
            <BarSelector />
          </div>
        </div>

        {/* Controles especÃ¡Â­ficos para cada tipo */}
        {tipoComparacao === 'datas-especificas' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data 1
              </label>
              <input
                type="date"
                value={data1}
                onChange={(e) => setData1(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data 2
              </label>
              <input
                type="date"
                value={data2}
                onChange={(e) => setData2(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={buscarComparacaoDatas}
                disabled={!data1 || !data2 || loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Comparando...' : 'Comparar Datas'}
              </button>
            </div>
          </div>
        )}

        {tipoComparacao === 'artistas' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Artista 1
              </label>
              <select
                value={artistaSelecionado1}
                onChange={(e) => setArtistaSelecionado1(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione o artista 1</option>
                {listaArtistas.map((artista) => (
                  <option key={artista} value={artista}>{artista}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Artista 2
              </label>
              <select
                value={artistaSelecionado2}
                onChange={(e) => setArtistaSelecionado2(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione o artista 2</option>
                {listaArtistas.filter((a) => a !== artistaSelecionado1).map((artista) => (
                  <option key={artista} value={artista}>{artista}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={buscarComparacaoArtistas}
                disabled={!artistaSelecionado1 || !artistaSelecionado2 || loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Comparando...' : 'Comparar Artistas'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resultados da ComparaÃ¡Â§Ã¡Â£o */}
      {((tipoComparacao === 'datas-especificas' && dadosComparativos.length === 2) ||
        (tipoComparacao === 'artistas' && dadosArtistas.artista1 && dadosArtistas.artista2)) && (
        <>
          {/* VisÃ¡Â£o Geral dos Dados */}
          {tipoComparacao === 'artistas' && dadosArtistas.artista1 && dadosArtistas.artista2 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Ã°Å¸Å½Â¯ VisÃ¡Â£o Geral dos Artistas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="font-medium">Ã°Å¸Å½Â¤ {dadosArtistas.artista1.nome}:</span>
                  <span className="ml-2 text-green-600">Å"â€¦ Dados disponÃ¡Â­veis</span>
                  <div className="mt-1 text-xs text-gray-600 space-y-1">
                    <div>Ã°Å¸'Â° Faturamento mÃ¡Â©dio: R$ {dadosArtistas.artista1.faturamentoMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <div>Ã°Å¸"Å  Faturamento total: R$ {dadosArtistas.artista1.faturamentoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    {dadosArtistas.artista1.faturamentoYuzerTotal > 0 && (
                      <div>Ã°Å¸ÂÂ» Yuzer total: R$ {dadosArtistas.artista1.faturamentoYuzerTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    )}
                    {dadosArtistas.artista1.faturamentoContaHubTotal > 0 && (
                      <div>Ã°Å¸Å½Â« ContaHub total: R$ {dadosArtistas.artista1.faturamentoContaHubTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    )}
                    {dadosArtistas.artista1.faturamentoSymplaTotal > 0 && (
                      <div>Ã°Å¸Å½Å¸Ã¯Â¸Â Sympla total: R$ {dadosArtistas.artista1.faturamentoSymplaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    )}
                    <div>Ã°Å¸' Clientes total: {dadosArtistas.artista1.clientesTotal.toLocaleString('pt-BR')}</div>
                    <div>Ã°Å¸"Å  {dadosArtistas.artista1.eventosComDados}/{dadosArtistas.artista1.totalEventos} eventos com dados</div>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Ã°Å¸Å½Â¤ {dadosArtistas.artista2.nome}:</span>
                  <span className="ml-2 text-green-600">Å"â€¦ Dados disponÃ¡Â­veis</span>
                  <div className="mt-1 text-xs text-gray-600 space-y-1">
                    <div>Ã°Å¸'Â° Faturamento mÃ¡Â©dio: R$ {dadosArtistas.artista2.faturamentoMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    <div>Ã°Å¸"Å  Faturamento total: R$ {dadosArtistas.artista2.faturamentoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    {dadosArtistas.artista2.faturamentoYuzerTotal > 0 && (
                      <div>Ã°Å¸ÂÂ» Yuzer total: R$ {dadosArtistas.artista2.faturamentoYuzerTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    )}
                    {dadosArtistas.artista2.faturamentoContaHubTotal > 0 && (
                      <div>Ã°Å¸Å½Â« ContaHub total: R$ {dadosArtistas.artista2.faturamentoContaHubTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    )}
                    {dadosArtistas.artista2.faturamentoSymplaTotal > 0 && (
                      <div>Ã°Å¸Å½Å¸Ã¯Â¸Â Sympla total: R$ {dadosArtistas.artista2.faturamentoSymplaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                    )}
                    <div>Ã°Å¸' Clientes total: {dadosArtistas.artista2.clientesTotal.toLocaleString('pt-BR')}</div>
                    <div>Ã°Å¸"Å  {dadosArtistas.artista2.eventosComDados}/{dadosArtistas.artista2.totalEventos} eventos com dados</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cards de ComparaÃ¡Â§Ã¡Â£o - Datas */}
          {tipoComparacao === 'datas-especificas' && dadosComparativos.length === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dadosComparativos.map((dados, index) => (
                <div key={index} className={`bg-white rounded-xl p-6 shadow-sm border ${
                  index === 0 ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
                }`}>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    {index === 0 ? 'Ã°Å¸"â€¦ Data 1' : 'Ã°Å¸"â€¦ Data 2'}
                    <span className="ml-auto text-sm font-normal text-slate-600">
                      {parseDataSemTimezone(dados.data).toLocaleDateString('pt-BR')}
                    </span>
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸'Â°</div>
                        <div className="valor-monetario">
                          R$ {dados.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="debug-valor">
                          DEBUG: {dados.faturamento}
                        </div>
                        <div className="text-xs text-slate-600">Faturamento</div>
                      </div>
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸' Clientes</div>
                        <div className="valor-monetario">
                          {dados.clientes}
                        </div>
                        <div className="text-xs text-slate-600">Clientes</div>
                      </div>
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸Å½Â¯</div>
                        <div className="valor-monetario">
                          R$ {dados.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="debug-valor">
                          DEBUG: {dados.ticketMedio}
                        </div>
                        <div className="text-xs text-slate-600">Ticket MÃ¡Â©dio</div>
                      </div>
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸"â€¦</div>
                        <div className="valor-monetario">
                          {dados.reservas}
                        </div>
                        <div className="text-xs text-slate-600">Reservas</div>
                      </div>
                    </div>

                    {dados.tempoCozinha > 0 && dados.tempoBar > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="card-valor">
                          <div className="text-2xl mb-1">Ã°Å¸'â‚¬ÂÃ°Å¸ÂÂ³</div>
                          <div className="valor-monetario">
                            {dados.tempoCozinha.toFixed(1)} min
                          </div>
                          <div className="text-xs text-slate-600">Tempo Cozinha</div>
                        </div>
                        <div className="card-valor">
                          <div className="text-2xl mb-1">Ã°Å¸ÂÂ¹</div>
                          <div className="valor-monetario">
                            {dados.tempoBar.toFixed(1)} min
                          </div>
                          <div className="text-xs text-slate-600">Tempo Bar</div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-700 mb-2">Ã°Å¸Å½Â¤ Artista: {dados.artista}</div>
                      <div className="text-sm font-medium text-slate-700 mb-2">Ã°Å¸ÂÂ½Ã¯Â¸Â Top Pratos:</div>
                      <div className="space-y-1">
                        {dados.pratos.slice(0, 3).map((prato, i) => (
                          <div key={i} className="flex justify-between text-xs text-slate-600">
                            <span>{prato.nome}</span>
                            <span>{prato.quantidade}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cards de ComparaÃ¡Â§Ã¡Â£o - Artistas */}
          {tipoComparacao === 'artistas' && dadosArtistas.artista1 && dadosArtistas.artista2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[dadosArtistas.artista1, dadosArtistas.artista2].map((artista, index) => (
                <div key={index} className={`bg-white rounded-xl p-6 shadow-sm border ${
                  index === 0 ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
                }`}>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                    Ã°Å¸Å½Â¤ Artista: {artista.nome}
                    <span className="ml-auto text-sm font-normal text-slate-600">
                      {artista.totalEventos} eventos ({artista.eventosComDados} com dados)
                    </span>
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸'Â°</div>
                        <div className="valor-monetario">
                          R$ {artista.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="debug-valor">
                          DEBUG: {artista.faturamentoTotal}
                        </div>
                        <div className="text-xs text-slate-600">Faturamento Total</div>
                        <div className="text-xs text-gray-500 mt-1">
                          MÃ¡Â©dia: R$ {artista.faturamentoMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸' Clientes</div>
                        <div className="valor-monetario">
                          {artista.clientesTotal.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-slate-600">Clientes Total</div>
                        <div className="text-xs text-gray-500 mt-1">
                          MÃ¡Â©dia: {artista.clientesMedio.toFixed(1)}
                        </div>
                      </div>
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸Å½Â¯</div>
                        <div className="valor-monetario">
                          R$ {artista.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="debug-valor">
                          DEBUG: {artista.ticketMedio}
                        </div>
                        <div className="text-xs text-slate-600">Ticket MÃ¡Â©dio</div>
                        <div className="text-xs text-gray-500 mt-1">
                          (Total Ã¡Â· Total clientes)
                        </div>
                      </div>
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸"â€¦</div>
                        <div className="valor-monetario">
                          {artista.reservasTotal.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-slate-600">Reservas Total</div>
                        <div className="text-xs text-gray-500 mt-1">
                          MÃ¡Â©dia: {artista.reservasMedio.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸"â€ž</div>
                        <div className="valor-monetario">
                          {artista.recorrenciaMedia.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-600">RecorrÃ¡Âªncia</div>
                      </div>
                      <div className="card-valor">
                        <div className="text-2xl mb-1">Ã°Å¸'Â</div>
                        <div className="valor-monetario">
                          {artista.fidelizacaoClientes.toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-600">FidelizaÃ¡Â§Ã¡Â£o</div>
                      </div>
                    </div>

                    {artista.tempoMedioCozinha > 0 && artista.tempoMedioBar > 0 && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="card-valor">
                          <div className="text-2xl mb-1">Ã°Å¸'â‚¬ÂÃ°Å¸ÂÂ³</div>
                          <div className="valor-monetario">
                            {artista.tempoMedioCozinha.toFixed(1)} min
                          </div>
                          <div className="text-xs text-slate-600">Tempo Cozinha</div>
                        </div>
                        <div className="card-valor">
                          <div className="text-2xl mb-1">Ã°Å¸ÂÂ¹</div>
                          <div className="valor-monetario">
                            {artista.tempoMedioBar.toFixed(1)} min
                          </div>
                          <div className="text-xs text-slate-600">Tempo Bar</div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="valor-monetario text-purple-800">
                            {artista.fidelizacaoClientes.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-600">FidelizaÃ¡Â§Ã¡Â£o</div>
                        </div>
                        <div>
                          <div className="valor-monetario text-orange-800">
                            {artista.eficienciaAtendimento.toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-600">EficiÃ¡Âªncia</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AnÃ¡Â¡lise de RecorrÃ¡Âªncia de Clientes - ComparaÃ¡Â§Ã¡Â£o de Datas */}
          {recorrenciaClientes && tipoComparacao === 'datas-especificas' && typeof recorrenciaClientes === 'object' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Ã°Å¸' AnÃ¡Â¡lise de RecorrÃ¡Âªncia de Clientes</h3>
              {recorrenciaClientes.limitedData ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">Å¡Â Ã¯Â¸Â</div>
                    <div>
                      <h4 className="font-semibold text-yellow-800">Dados Limitados</h4>
                      <p className="text-sm text-yellow-700 mt-1">{recorrenciaClientes.message}</p>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="font-medium">{recorrenciaClientes.data?.data1}:</span>
                          <span className="ml-2">{recorrenciaClientes.data?.totalData1 || 0} pessoas</span>
                        </div>
                        <div>
                          <span className="font-medium">{recorrenciaClientes.data?.data2}:</span>
                          <span className="ml-2">{recorrenciaClientes.data?.totalData2 || 0} pessoas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl mb-2">Ã°Å¸"â€ž</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {recorrenciaClientes.recorrentes || 0}
                      </div>
                      <div className="text-sm text-blue-600">Clientes Recorrentes</div>
                      <div className="text-xs text-blue-500 mt-1">
                        {recorrenciaClientes.percentualRecorrencia || 0}% do total
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl mb-2">Å"Â¨</div>
                      <div className="text-2xl font-bold text-green-800">
                        {recorrenciaClientes.novos || 0}
                      </div>
                      <div className="text-sm text-green-600">Novos Clientes</div>
                      <div className="text-xs text-green-500 mt-1">
                        {recorrenciaClientes.percentualNovos || 0}% do total
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl mb-2">Ã°Å¸"Å </div>
                      <div className="text-lg font-bold text-purple-800">
                        {recorrenciaClientes.insights?.fidelizacao || 'N/A'}
                      </div>
                      <div className="text-sm text-purple-600">FidelizaÃ¡Â§Ã¡Â£o</div>
                      <div className="text-xs text-purple-500 mt-1">
                        Crescimento: {recorrenciaClientes.crescimento?.toFixed(1) || 0}%
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Insights da ComparaÃ¡Â§Ã¡Â£o de Datas */}
          {tipoComparacao === 'datas-especificas' && dadosComparativos.length === 2 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Ã°Å¸"Â Insights da ComparaÃ¡Â§Ã¡Â£o</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Ã°Å¸"Å  MudanÃ¡Â§as Identificadas</h4>
                  <div className="space-y-2">
                    {gerarInsightComparacao()?.map((insight, i) => (
                      <div key={i} className="text-sm text-slate-600 bg-gray-50 p-2 rounded">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">Ã°Å¸' RecomendaÃ¡Â§Ã¡Âµes</h4>
                  <div className="space-y-2">
                    {(() => {
                      const insights = gerarInsightComparacao() || []
                      const recomendacoes = []
                      
                      if (insights.some(i => i.includes('Faturamento caiu'))) {
                        recomendacoes.push('Ã°Å¸"â€ž Revisar estratÃ¡Â©gias de pricing e promoÃ¡Â§Ã¡Âµes')
                      }
                      if (insights.some(i => i.includes('clientes a menos'))) {
                        recomendacoes.push('Ã°Å¸"Â¢ Intensificar marketing e divulgaÃ¡Â§Ã¡Â£o')
                      }
                      if (insights.some(i => i.includes('Tempo de cozinha aumentou'))) {
                        recomendacoes.push('Å¡Â¡ Otimizar processos da cozinha')
                      }
                      if (insights.some(i => i.includes('MudanÃ¡Â§a de artista'))) {
                        recomendacoes.push('Ã°Å¸Å½Âµ Avaliar impacto do artista nos resultados')
                      }
                      
                      if (recomendacoes.length === 0) {
                        recomendacoes.push('Å"â€¦ Performance consistente, manter estratÃ¡Â©gias atuais')
                      }
                      
                      return recomendacoes.map((rec, i) => (
                        <div key={i} className="text-sm text-slate-600 bg-blue-50 p-2 rounded">
                          {rec}
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ComparaÃ¡Â§Ã¡Â£o por HorÃ¡Â¡rio - Apenas para datas especÃ¡Â­ficas */}
          {tipoComparacao === 'datas-especificas' && dadosComparativos.length === 2 && (
            dadosComparativos[0].faturamento_horas.length > 0 || dadosComparativos[1].faturamento_horas.length > 0
          ) && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">ÂÂ° ComparaÃ¡Â§Ã¡Â£o por HorÃ¡Â¡rio</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Ã°Å¸"â€¹ Como interpretar os dados:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-700">
                  <div>
                    <div className="font-semibold mb-1">Ã°Å¸'Â° Faturamento:</div>
                    <div>â‚¬Â¢ <strong>Linha superior:</strong> Vendas naquela hora especÃ¡Â­fica</div>
                    <div>â‚¬Â¢ <strong>Linha inferior:</strong> Total acumulado atÃ¡Â© aquela hora</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">Ã°Å¸' Clientes:</div>
                    <div>â‚¬Â¢ <strong>Linha superior:</strong> Clientes acumulados da Data 1</div>
                    <div>â‚¬Â¢ <strong>Linha inferior:</strong> Clientes acumulados da Data 2</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  <strong>Exemplo:</strong> Ã¡â‚¬s 18h, se mostra "R$ 500 | R$ 2.000", significa que naquela hora vendeu R$ 500 e o total do dia atÃ¡Â© Ã¡s 18h era R$ 2.000
                </div>
              </div>
              
              {/* FunÃ¡Â§Ã¡Â£o para formatar horas */}
              {(() => {
                const formatHour = (hour: string) => {
                  if (hour === "24:00") return "00:00"
                  if (hour === "25:00") return "01:00"
                  return hour
                }

                // Combinar horÃ¡Â¡rios das duas datas
                const todosHorarios = new Set([
                  ...dadosComparativos[0].faturamento_horas.map((h) => h.hora),
                  ...dadosComparativos[1].faturamento_horas.map((h) => h.hora)
                ])
                
                const horariosOrdenados = Array.from(todosHorarios).sort()

                return (
                  <div className="space-y-4">
                    {/* CabeÃ¡Â§alhos */}
                    <div className="grid grid-cols-5 gap-2 text-xs font-semibold text-slate-700 border-b pb-2">
                      <div>HorÃ¡Â¡rio</div>
                      <div className="text-center">Ã°Å¸"â€¦ {parseDataSemTimezone(dadosComparativos[0].data).toLocaleDateString('pt-BR')}<br/>
                        <span className="text-xs font-normal text-slate-500">Hora | Acumulado</span>
                      </div>
                      <div className="text-center">Ã°Å¸"â€¦ {parseDataSemTimezone(dadosComparativos[1].data).toLocaleDateString('pt-BR')}<br/>
                        <span className="text-xs font-normal text-slate-500">Hora | Acumulado</span>
                      </div>
                      <div className="text-center">Ã°Å¸' Clientes<br/>
                        <span className="text-xs font-normal text-slate-500">Data 1 | Data 2</span>
                      </div>
                      <div className="text-center">Ã°Å¸"Å  DiferenÃ¡Â§a<br/>
                        <span className="text-xs font-normal text-slate-500">Hora | Acumulado</span>
                      </div>
                    </div>

                    {/* Dados por horÃ¡Â¡rio */}
                    <div className="max-h-96 overflow-y-auto space-y-1">
                      {horariosOrdenados.map((hora) => {
                        const data1Hora = dadosComparativos[0].faturamento_horas.find((h) => h.hora === hora)
                        const data2Hora = dadosComparativos[1].faturamento_horas.find((h) => h.hora === hora)
                        
                        const valor1 = data1Hora?.faturamento || 0
                        const valor2 = data2Hora?.faturamento || 0
                        const acumulado1 = data1Hora?.faturamento_acumulado || 0
                        const acumulado2 = data2Hora?.faturamento_acumulado || 0
                        const clientes1 = data1Hora?.clientes_acumulados || 0
                        const clientes2 = data2Hora?.clientes_acumulados || 0
                        
                        // Calcular diferenÃ¡Â§as percentuais
                        const diferencaHora = ((valor2 - valor1) / (valor1 || 1)) * 100
                        const diferencaAcumulado = ((acumulado2 - acumulado1) / (acumulado1 || 1)) * 100
                        const temDiferenca = Math.abs(diferencaHora) > 5 || Math.abs(diferencaAcumulado) > 5
                        
                        return (
                          <div key={hora} className={`grid grid-cols-5 gap-2 text-xs py-2 px-2 rounded-lg ${
                            temDiferenca ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                          }`}>
                            {/* HorÃ¡Â¡rio */}
                            <div className="font-medium text-slate-700 text-center">
                              {formatHour(hora)}
                            </div>
                            
                            {/* Data 1 - Hora | Acumulado */}
                            <div className={`text-center ${
                              valor1 > 0 ? 'text-blue-700' : 'text-gray-400'
                            }`}>
                              <div className="font-semibold">
                                {valor1 > 0 ? `R$ ${valor1.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '---'}
                              </div>
                              <div className="text-xs text-blue-600">
                                {acumulado1 > 0 ? `R$ ${acumulado1.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '---'}
                              </div>
                            </div>
                            
                            {/* Data 2 - Hora | Acumulado */}
                            <div className={`text-center ${
                              valor2 > 0 ? 'text-green-700' : 'text-gray-400'
                            }`}>
                              <div className="font-semibold">
                                {valor2 > 0 ? `R$ ${valor2.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '---'}
                              </div>
                              <div className="text-xs text-green-600">
                                {acumulado2 > 0 ? `R$ ${acumulado2.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}` : '---'}
                              </div>
                            </div>
                            
                            {/* Clientes Data 1 | Data 2 */}
                            <div className="text-center text-purple-700">
                              <div className="font-semibold">
                                {clientes1 > 0 ? clientes1 : '---'}
                              </div>
                              <div className="text-xs text-purple-600">
                                {clientes2 > 0 ? clientes2 : '---'}
                              </div>
                            </div>
                            
                            {/* DiferenÃ¡Â§as */}
                            <div className="text-center">
                              {/* DiferenÃ¡Â§a da hora */}
                              {valor1 > 0 && valor2 > 0 && (
                                <div className={`text-xs px-1 py-0.5 rounded mb-1 ${
                                  diferencaHora > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {diferencaHora > 0 ? '+' : ''}{diferencaHora.toFixed(0)}%
                                </div>
                              )}
                              {/* DiferenÃ¡Â§a acumulado */}
                              {acumulado1 > 0 && acumulado2 > 0 && (
                                <div className={`text-xs px-1 py-0.5 rounded ${
                                  diferencaAcumulado > 0 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {diferencaAcumulado > 0 ? '+' : ''}{diferencaAcumulado.toFixed(0)}%
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Resumo dos horÃ¡Â¡rios */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-700">Ã°Å¸"Å  {parseDataSemTimezone(dadosComparativos[0].data).toLocaleDateString('pt-BR')}:</h4>
                          {(() => {
                            const horas1 = dadosComparativos[0].faturamento_horas.filter((h) => h.faturamento > 0)
                            if (horas1.length === 0) return <span className="text-gray-500">Sem dados de horÃ¡Â¡rio</span>
                            
                            const melhorHora1 = horas1.reduce((max, h) => h.faturamento > max.faturamento ? h : max)
                            const totalHoras1 = horas1.length
                            const ultimaHora1 = horas1[horas1.length - 1]
                            
                            return (
                              <div className="space-y-1 text-xs text-slate-600">
                                <div>Ã°Å¸â€¢Â Melhor horÃ¡Â¡rio: <span className="font-semibold">{formatHour(melhorHora1.hora)}</span> (R$ {melhorHora1.faturamento.toLocaleString('pt-BR', {minimumFractionDigits: 0})})</div>
                                <div>Ã°Å¸"Ë† HorÃ¡Â¡rios ativos: <span className="font-semibold">{totalHoras1}</span></div>
                                <div>Ã°Å¸'Â° Faturamento final: <span className="font-semibold">R$ {(ultimaHora1?.faturamento_acumulado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 0})}</span></div>
                                <div>Ã°Å¸' Dados vÃ¡Â¡lidos: <span className="font-semibold">{ultimaHora1?.clientes_acumulados || 0}</span></div>
                              </div>
                            )
                          })()}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-700">Ã°Å¸"Å  {parseDataSemTimezone(dadosComparativos[1].data).toLocaleDateString('pt-BR')}:</h4>
                          {(() => {
                            const horas2 = dadosComparativos[1].faturamento_horas.filter((h) => h.faturamento > 0)
                            if (horas2.length === 0) return <span className="text-gray-500">Sem dados de horÃ¡Â¡rio</span>
                            
                            const melhorHora2 = horas2.reduce((max, h) => h.faturamento > max.faturamento ? h : max)
                            const totalHoras2 = horas2.length
                            const ultimaHora2 = horas2[horas2.length - 1]
                            
                            return (
                              <div className="space-y-1 text-xs text-slate-600">
                                <div>Ã°Å¸â€¢Â Melhor horÃ¡Â¡rio: <span className="font-semibold">{formatHour(melhorHora2.hora)}</span> (R$ {melhorHora2.faturamento.toLocaleString('pt-BR', {minimumFractionDigits: 0})})</div>
                                <div>Ã°Å¸"Ë† HorÃ¡Â¡rios ativos: <span className="font-semibold">{totalHoras2}</span></div>
                                <div>Ã°Å¸'Â° Faturamento final: <span className="font-semibold">R$ {(ultimaHora2?.faturamento_acumulado || 0).toLocaleString('pt-BR', {minimumFractionDigits: 0})}</span></div>
                                <div>Ã°Å¸' Dados vÃ¡Â¡lidos: <span className="font-semibold">{ultimaHora2?.clientes_acumulados || 0}</span></div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Insights da ComparaÃ¡Â§Ã¡Â£o de Artistas */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Ã°Å¸"Â AnÃ¡Â¡lise Comparativa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-700 mb-3">Ã°Å¸"Å  Insights Identificados</h4>
                <div className="space-y-2">
                  {gerarInsightArtistas()?.map((insight, i) => (
                    <div key={i} className="text-sm text-slate-600 bg-gray-50 p-2 rounded">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 mb-3">Ã°Å¸' EstratÃ¡Â©gias Recomendadas</h4>
                <div className="space-y-2">
                  {(() => {
                    const { artista1, artista2 } = dadosArtistas
                    if (!artista1 || !artista2) return []
                    
                    const recomendacoes = []
                    const melhor = artista1.faturamentoMedio > artista2.faturamentoMedio ? artista1 : artista2
                    const pior = melhor === artista1 ? artista2 : artista1
                    
                    recomendacoes.push(`Ã°Å¸Å½Â¯ Priorizar agendamento de ${melhor.nome} para datas especiais`)
                    recomendacoes.push(`Ã°Å¸"Ë† ${melhor.nome} tem ROI superior para eventos premium`)
                    recomendacoes.push(`Ã°Å¸"â€ž Analisar estratÃ¡Â©gias de ${pior.nome} para otimizar performance`)
                    recomendacoes.push(`Ã°Å¸'Â° ${melhor.nome} justifica investimento maior em cachÃ¡Âª`)
                    
                    return recomendacoes.map((rec, i) => (
                      <div key={i} className="text-sm text-slate-600 bg-blue-50 p-2 rounded">
                        {rec}
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Estado vazio */}
      {((tipoComparacao === 'datas-especificas' && dadosComparativos.length === 0) ||
        (tipoComparacao === 'artistas' && !dadosArtistas.artista1 && !dadosArtistas.artista2)) && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="text-6xl mb-4">
            {tipoComparacao === 'datas-especificas' ? 'Ã°Å¸"â€¦' : 'Ã°Å¸Å½Â¤'}
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {tipoComparacao === 'datas-especificas' 
              ? 'Selecione duas datas para comparaÃ¡Â§Ã¡Â£o' 
              : 'Selecione dois artistas para comparaÃ¡Â§Ã¡Â£o'
            }
          </h3>
          <p className="text-slate-500">
            {tipoComparacao === 'datas-especificas' 
              ? 'Escolha duas datas diferentes e compare dados de faturamento, clientes, recorrÃ¡Âªncia e performance.'
              : 'Compare o desempenho de diferentes artistas para otimizar a programaÃ¡Â§Ã¡Â£o do seu bar.'
            }
          </p>
        </div>
      )}
    </div>
  )
} 

