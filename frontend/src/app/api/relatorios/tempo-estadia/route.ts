import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }
    
    const supabase = await getAdminClient()
    
    // Obter bar_id do header
    const barIdHeader = request.headers.get('x-user-data')
    let barId: number | null = null
    if (barIdHeader) {
      try {
        const parsed = JSON.parse(barIdHeader)
        if (parsed?.bar_id) barId = parseInt(String(parsed.bar_id))
      } catch (error) {
        console.warn('Erro ao parsear barIdHeader:', error)
      }
    }
    
    if (!barId) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 })
    }

    // 1. Tempo médio por MÊS
    const { data: porMes, error: errMes } = await supabase.rpc('get_tempo_estadia_por_mes', { p_bar_id: barId })
    
    // Se a função não existir, fazer query direta
    let dadosPorMes = porMes
    if (errMes) {
      console.log('Função RPC não existe, usando query direta...')
      const { data, error } = await supabase
        .from('contahub_vendas')
        .select('dt_gerencial, tempo_estadia_minutos')
        .eq('bar_id', barId)
        .gt('tempo_estadia_minutos', 0)
        .lt('tempo_estadia_minutos', 720)
      
      if (error) throw error
      
      // Agrupar por mês manualmente
      const mesMap = new Map<string, { total: number; count: number }>()
      for (const row of data || []) {
        const mes = row.dt_gerencial.substring(0, 7) // YYYY-MM
        const atual = mesMap.get(mes) || { total: 0, count: 0 }
        atual.total += row.tempo_estadia_minutos
        atual.count += 1
        mesMap.set(mes, atual)
      }
      
      dadosPorMes = Array.from(mesMap.entries()).map(([mes, dados]) => ({
        periodo: mes,
        total_vendas: dados.count,
        tempo_medio_minutos: Math.round(dados.total / dados.count * 10) / 10
      })).sort((a, b) => a.periodo.localeCompare(b.periodo))
    }

    // 2. Tempo médio por DIA DA SEMANA
    const { data: rawDiaSemana, error: errDia } = await supabase
      .from('contahub_vendas')
      .select('dt_gerencial, tempo_estadia_minutos')
      .eq('bar_id', barId)
      .gt('tempo_estadia_minutos', 0)
      .lt('tempo_estadia_minutos', 720)
    
    if (errDia) throw errDia
    
    const diasSemanaMap = new Map<number, { total: number; count: number }>()
    for (const row of rawDiaSemana || []) {
      const data = new Date(row.dt_gerencial + 'T12:00:00Z')
      const diaSemana = data.getUTCDay()
      const atual = diasSemanaMap.get(diaSemana) || { total: 0, count: 0 }
      atual.total += row.tempo_estadia_minutos
      atual.count += 1
      diasSemanaMap.set(diaSemana, atual)
    }
    
    const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const dadosPorDiaSemana = Array.from(diasSemanaMap.entries()).map(([dia, dados]) => ({
      dia_semana: dia,
      dia_nome: nomesDias[dia],
      total_vendas: dados.count,
      tempo_medio_minutos: Math.round(dados.total / dados.count * 10) / 10
    })).sort((a, b) => a.dia_semana - b.dia_semana)

    // 3. Tempo médio por SEMANA do ano
    const semanaMap = new Map<string, { total: number; count: number }>()
    for (const row of rawDiaSemana || []) {
      const data = new Date(row.dt_gerencial + 'T12:00:00Z')
      const ano = data.getUTCFullYear()
      const inicioAno = new Date(Date.UTC(ano, 0, 1))
      const diffDias = Math.floor((data.getTime() - inicioAno.getTime()) / (1000 * 60 * 60 * 24))
      const semana = Math.ceil((diffDias + inicioAno.getUTCDay() + 1) / 7)
      const chave = `${ano}-W${semana.toString().padStart(2, '0')}`
      
      const atual = semanaMap.get(chave) || { total: 0, count: 0 }
      atual.total += row.tempo_estadia_minutos
      atual.count += 1
      semanaMap.set(chave, atual)
    }
    
    const dadosPorSemana = Array.from(semanaMap.entries()).map(([semana, dados]) => ({
      periodo: semana,
      total_vendas: dados.count,
      tempo_medio_minutos: Math.round(dados.total / dados.count * 10) / 10
    })).sort((a, b) => a.periodo.localeCompare(b.periodo))

    // 4. Estatísticas gerais
    const totalVendas = rawDiaSemana?.length || 0
    const tempoTotal = rawDiaSemana?.reduce((sum, r) => sum + r.tempo_estadia_minutos, 0) || 0
    const tempoMedioGeral = totalVendas > 0 ? Math.round(tempoTotal / totalVendas * 10) / 10 : 0
    
    // Calcular moda (faixa mais comum)
    const faixas = new Map<string, number>()
    for (const row of rawDiaSemana || []) {
      const tempo = row.tempo_estadia_minutos
      let faixa = ''
      if (tempo < 60) faixa = '0-1h'
      else if (tempo < 120) faixa = '1-2h'
      else if (tempo < 180) faixa = '2-3h'
      else if (tempo < 240) faixa = '3-4h'
      else if (tempo < 300) faixa = '4-5h'
      else if (tempo < 360) faixa = '5-6h'
      else faixa = '6h+'
      
      faixas.set(faixa, (faixas.get(faixa) || 0) + 1)
    }
    
    const distribuicaoFaixas = Array.from(faixas.entries())
      .map(([faixa, count]) => ({
        faixa,
        total: count,
        percentual: Math.round(count / totalVendas * 1000) / 10
      }))
      .sort((a, b) => {
        const ordem = ['0-1h', '1-2h', '2-3h', '3-4h', '4-5h', '5-6h', '6h+']
        return ordem.indexOf(a.faixa) - ordem.indexOf(b.faixa)
      })

    // 5. Top clientes com maior tempo médio (mínimo 3 visitas)
    const clienteMap = new Map<string, { nome: string; tempos: number[] }>()
    
    interface VendaCliente {
      cli_fone: string | null
      vd_nome: string | null
      tempo_estadia_minutos: number
    }
    
    const { data: vendasClientes } = await supabase
      .from('contahub_vendas')
      .select('cli_fone, vd_nome, tempo_estadia_minutos')
      .eq('bar_id', barId)
      .gt('tempo_estadia_minutos', 0)
      .lt('tempo_estadia_minutos', 720)
      .not('cli_fone', 'is', null)
    
    for (const row of (vendasClientes || []) as VendaCliente[]) {
      const fone = (row.cli_fone || '').replace(/\D/g, '')
      if (!fone) continue
      
      const atual = clienteMap.get(fone) || { nome: row.vd_nome || 'Sem nome', tempos: [] as number[] }
      atual.tempos.push(row.tempo_estadia_minutos)
      if (row.vd_nome && row.vd_nome.length > atual.nome.length) {
        atual.nome = row.vd_nome
      }
      clienteMap.set(fone, atual)
    }
    
    const topClientesMaiorTempo = Array.from(clienteMap.entries())
      .filter(([, dados]) => dados.tempos.length >= 3)
      .map(([fone, dados]) => ({
        telefone: fone,
        nome: dados.nome,
        visitas: dados.tempos.length,
        tempo_medio_minutos: Math.round(dados.tempos.reduce((a, b) => a + b, 0) / dados.tempos.length * 10) / 10
      }))
      .sort((a, b) => b.tempo_medio_minutos - a.tempo_medio_minutos)
      .slice(0, 20)

    return NextResponse.json({
      estatisticas: {
        total_vendas: totalVendas,
        tempo_medio_geral_minutos: tempoMedioGeral,
        tempo_medio_formatado: `${Math.floor(tempoMedioGeral / 60)}h ${Math.round(tempoMedioGeral % 60)}min`
      },
      por_mes: dadosPorMes,
      por_dia_semana: dadosPorDiaSemana,
      por_semana: dadosPorSemana,
      distribuicao_faixas: distribuicaoFaixas,
      top_clientes_maior_tempo: topClientesMaiorTempo
    })
    
  } catch (error) {
    console.error('Erro na API tempo-estadia:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

