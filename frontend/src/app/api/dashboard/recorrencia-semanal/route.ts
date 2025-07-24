import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const data_inicio = searchParams.get('data_inicio')
    const data_fim = searchParams.get('data_fim')
    const bar_id = searchParams.get('bar_id')

    if (!data_inicio || !data_fim || !bar_id) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios: data_inicio, data_fim, bar_id' },
        { status: 400 }
      )
    }

    console.log('📱 API Recorrência Semanal - Parâmetros recebidos:', {
      data_inicio,
      data_fim,
      bar_id
    })

    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient()
    if (!supabase) {
      console.error('❌ Erro ao conectar com banco')
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      )
    }

    try {
      // Buscar dados de reservas com telefone/celular do período atual
      console.log('🔍 Buscando reservas com telefones...')
      
      // Primeira tentativa: buscar da tabela getin_reservas se existir
      const reservasQuery = supabase
        .from('getin_reservas')
        .select('phone, name, date, people')
        .gte('date', data_inicio)
        .lte('date', data_fim)
        .not('phone', 'is', null)
        .neq('phone', '')

      const { data: reservasGetin, error: errorGetin } = await reservasQuery

      let dadosReservas = reservasGetin || []

      if (errorGetin || !reservasGetin || reservasGetin.length === 0) {
        console.log('⚠️ Tabela getin_reservas não encontrada ou sem dados, tentando outras fontes...')
        
        // Tentar buscar da tabela contahub se tiver campos de telefone
        const { data: contahubData, error: contahubError } = await supabase
          .from('analitico')
          .select('vd_dtgerencial, tel_cli, nm_cli')
          .eq('bar_id', parseInt(bar_id))
          .gte('vd_dtgerencial', data_inicio)
          .lte('vd_dtgerencial', data_fim)
          .not('tel_cli', 'is', null)
          .neq('tel_cli', '')
          .limit(1000)

        if (!contahubError && contahubData && contahubData.length > 0) {
          console.log(`📞 Dados ContaHub encontrados: ${contahubData.length}`)
          dadosReservas = contahubData.map((item: unknown) => ({
            phone: item.tel_cli,
            name: item.nm_cli,
            date: item.vd_dtgerencial,
            people: 1 // assumir 1 pessoa por registro
          }))
        }
      }

      console.log(`📊 Total de registros com telefone: ${dadosReservas.length}`)

      if (dadosReservas.length === 0) {
        return NextResponse.json({
          success: true,
          recorrencia: {
            clientes_unicos: 0,
            clientes_recorrentes: 0,
            taxa_recorrencia: 0,
            total_registros: 0,
            visitas_por_cliente: {},
            detalhes_recorrentes: []
          },
          meta: {
            periodo: `${data_inicio} a ${data_fim}`,
            bar_id: parseInt(bar_id),
            observacao: 'Nenhum dado com telefone encontrado para análise'
          }
        })
      }

      // Analisar recorrência por telefone
      const clientesPorTelefone = new Map()

      dadosReservas.forEach((reserva: unknown) => {
        const telefone = String(reserva.phone).replace(/\D/g, '') // remover caracteres não numéricos
        
        if (telefone.length >= 8) { // telefone válido
          if (!clientesPorTelefone.has(telefone)) {
            clientesPorTelefone.set(telefone, {
              telefone,
              nome: reserva.name || 'Cliente',
              visitas: [],
              total_visitas: 0,
              total_pessoas: 0
            })
          }

          const cliente = clientesPorTelefone.get(telefone)
          cliente.visitas.push({
            data: reserva.date,
            pessoas: parseInt(reserva.people || '1')
          })
          cliente.total_visitas++
          cliente.total_pessoas += parseInt(reserva.people || '1')
        }
      })

      // Analisar padrões de recorrência
      const clientesArray = Array.from(clientesPorTelefone.values())
      const clientesUnicos = clientesArray.length
      const clientesRecorrentes = clientesArray.filter(cliente => cliente.total_visitas > 1).length
      const taxaRecorrencia = clientesUnicos > 0 ? (clientesRecorrentes / clientesUnicos) * 100 : 0

      // Agrupar por número de visitas
      const visitasPorCliente = {
        '1_visita': 0,
        '2_visitas': 0,
        '3_visitas': 0,
        '4_ou_mais': 0
      }

      clientesArray.forEach(cliente => {
        if (cliente.total_visitas === 1) {
          visitasPorCliente['1_visita']++
        } else if (cliente.total_visitas === 2) {
          visitasPorCliente['2_visitas']++
        } else if (cliente.total_visitas === 3) {
          visitasPorCliente['3_visitas']++
        } else {
          visitasPorCliente['4_ou_mais']++
        }
      })

      // Detalhar clientes mais recorrentes (top 10)
      const clientesRecorrentesDetalhados = clientesArray
        .filter(cliente => cliente.total_visitas > 1)
        .sort((a, b) => b.total_visitas - a.total_visitas)
        .slice(0, 10)
        .map(cliente => ({
          nome: cliente.nome,
          telefone: cliente.telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3'), // formatar telefone
          total_visitas: cliente.total_visitas,
          total_pessoas: cliente.total_pessoas,
          primeira_visita: cliente.visitas[0]?.data,
          ultima_visita: cliente.visitas[cliente.visitas.length - 1]?.data,
          datas_visitas: cliente.visitas.map((v: unknown) => v.data).join(', ')
        }))

      const recorrencia = {
        clientes_unicos: clientesUnicos,
        clientes_recorrentes: clientesRecorrentes,
        taxa_recorrencia: Math.round(taxaRecorrencia * 10) / 10,
        total_registros: dadosReservas.length,
        visitas_por_cliente: visitasPorCliente,
        detalhes_recorrentes: clientesRecorrentesDetalhados
      }

      console.log('📱 Análise de recorrência concluída:', {
        clientes_unicos: clientesUnicos,
        clientes_recorrentes: clientesRecorrentes,
        taxa_recorrencia: `${recorrencia.taxa_recorrencia}%`
      })

      return NextResponse.json({
        success: true,
        recorrencia,
        meta: {
          periodo: `${data_inicio} a ${data_fim}`,
          bar_id: parseInt(bar_id),
          criterio: 'Agrupamento por número de telefone',
          fonte_dados: reservasGetin && reservasGetin.length > 0 ? 'getin_reservas' : 'analitico'
        }
      })

    } catch (dbError) {
      console.error('❌ Erro ao buscar dados de recorrência:', dbError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados: ' + (dbError as Error).message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Erro na API Recorrência Semanal:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 
