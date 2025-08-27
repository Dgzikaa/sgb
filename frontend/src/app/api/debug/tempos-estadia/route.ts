import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { cliente } = await request.json()
    
    console.log(`🔍 DEBUG: Buscando dados para cliente: ${cliente}`)
    
    // 1. Buscar períodos do cliente
    const { data: periodos, error: errorPeriodos } = await supabase
      .from('contahub_periodo')
      .select('cli_nome, cli_fone, dt_gerencial, vd_mesadesc, vr_pagamentos')
      .eq('bar_id', 3)
      .ilike('cli_nome', `%${cliente}%`)
      .order('dt_gerencial', { ascending: false })
      .limit(50)
    
    if (errorPeriodos) {
      console.error('Erro ao buscar períodos:', errorPeriodos)
      return NextResponse.json({ error: 'Erro ao buscar períodos' }, { status: 500 })
    }
    
    console.log(`📄 Encontrados ${periodos?.length || 0} períodos`)
    
    // 2. Buscar pagamentos para as datas encontradas
    const datas = periodos?.map(p => p.dt_gerencial) || []
    const { data: pagamentos, error: errorPagamentos } = await supabase
      .from('contahub_pagamentos')
      .select('cliente, mesa, dt_gerencial, valor, hr_lancamento, hr_transacao')
      .eq('bar_id', 3)
      .in('dt_gerencial', datas)
      .not('hr_transacao', 'is', null)
      .neq('hr_transacao', '')
      .order('dt_gerencial', { ascending: false })
    
    if (errorPagamentos) {
      console.error('Erro ao buscar pagamentos:', errorPagamentos)
      return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 })
    }
    
    console.log(`💳 Encontrados ${pagamentos?.length || 0} pagamentos`)
    
    // 3. Fazer o cruzamento e calcular tempos
    const resultados = []
    
    for (const periodo of periodos || []) {
      const resultado: any = {
        data: periodo.dt_gerencial,
        nome: periodo.cli_nome,
        telefone: periodo.cli_fone,
        mesa_periodo: periodo.vd_mesadesc,
        valor_periodo: parseFloat(periodo.vr_pagamentos || '0'),
      }
      
      // Buscar pagamento correspondente
      const pagamentoCorrespondente = pagamentos?.find(pag => {
        if (pag.dt_gerencial !== periodo.dt_gerencial) return false
        
        const periodoNome = (periodo.cli_nome || '').toLowerCase().trim()
        const pagamentoCliente = (pag.cliente || '').toLowerCase().trim()
        const periodoValor = parseFloat(periodo.vr_pagamentos || '0')
        const pagamentoValor = parseFloat(pag.valor || '0')
        
        // Match por NOME + VALOR
        if (periodoNome && pagamentoCliente && periodoValor > 0 && pagamentoValor > 0) {
          const primeiroNomePeriodo = periodoNome.split(' ')[0]
          const primeiroNomePagamento = pagamentoCliente.split(' ')[0]
          
          if (primeiroNomePeriodo.length > 2 && 
              primeiroNomePagamento.includes(primeiroNomePeriodo) &&
              Math.abs(periodoValor - pagamentoValor) < 0.01) {
            return true
          }
        }
        
        // Match por NOME apenas
        if (periodoNome && pagamentoCliente) {
          const primeiroNomePeriodo = periodoNome.split(' ')[0]
          const primeiroNomePagamento = pagamentoCliente.split(' ')[0]
          if (primeiroNomePeriodo.length > 3 && primeiroNomePagamento.length > 3 && 
              primeiroNomePeriodo === primeiroNomePagamento) {
            return true
          }
        }
        
        return false
      })
      
      if (pagamentoCorrespondente) {
        resultado.pagamento_cliente = pagamentoCorrespondente.cliente
        resultado.pagamento_mesa = pagamentoCorrespondente.mesa
        resultado.valor_pagamento = parseFloat(pagamentoCorrespondente.valor || '0')
        resultado.hr_lancamento = pagamentoCorrespondente.hr_lancamento
        resultado.hr_transacao = pagamentoCorrespondente.hr_transacao
        
        // Determinar tipo de match
        const periodoNome = (periodo.cli_nome || '').toLowerCase().trim()
        const pagamentoCliente = (pagamentoCorrespondente.cliente || '').toLowerCase().trim()
        const periodoValor = parseFloat(periodo.vr_pagamentos || '0')
        const pagamentoValor = parseFloat(pagamentoCorrespondente.valor || '0')
        
        if (periodoNome && pagamentoCliente && periodoValor > 0 && pagamentoValor > 0 &&
            Math.abs(periodoValor - pagamentoValor) < 0.01) {
          resultado.tipo_match = 'NOME_VALOR'
        } else {
          resultado.tipo_match = 'NOME_APENAS'
        }
        
        // Calcular tempo
        try {
          const hrLancamento = new Date(pagamentoCorrespondente.hr_lancamento)
          const hrTransacao = new Date(pagamentoCorrespondente.hr_transacao)
          const tempoMinutos = (hrTransacao.getTime() - hrLancamento.getTime()) / (1000 * 60)
          
          if (tempoMinutos > 0 && tempoMinutos < 1440) { // Entre 0 e 24h
            resultado.tempo_calculado = tempoMinutos
            const horas = Math.floor(tempoMinutos / 60)
            const minutos = Math.round(tempoMinutos % 60)
            resultado.tempo_formatado = `${horas}h ${minutos}min`
          }
        } catch (error) {
          console.warn('Erro ao calcular tempo:', error)
        }
      } else {
        resultado.tipo_match = 'SEM_MATCH'
      }
      
      resultados.push(resultado)
    }
    
    console.log(`✅ Processados ${resultados.length} registros`)
    console.log(`🎯 Matches encontrados: ${resultados.filter(r => r.tipo_match !== 'SEM_MATCH').length}`)
    
    return NextResponse.json({
      success: true,
      cliente,
      total_periodos: periodos?.length || 0,
      total_pagamentos: pagamentos?.length || 0,
      total_matches: resultados.filter(r => r.tipo_match !== 'SEM_MATCH').length,
      dados: resultados
    })
    
  } catch (error) {
    console.error('Erro na API de debug:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
