import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Datas de início da entrada obrigatória
const DATAS_ENTRADA = {
  quarta: '2025-11-19', // Quarta-feira
  sexta: '2025-11-14'   // Sexta-feira (primeira sexta após 13/11)
}

export async function GET() {
  try {
    // 1. Métricas de Ticket Médio - QUARTAS
    const { data: ticketQuartas, error: errTicketQuartas } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          CASE 
            WHEN dt_gerencial < '${DATAS_ENTRADA.quarta}' THEN 'antes'
            ELSE 'depois'
          END as periodo,
          COUNT(*) as total_comandas,
          COUNT(DISTINCT vd_cpf) FILTER (WHERE vd_cpf IS NOT NULL AND vd_cpf != '') as clientes_unicos,
          ROUND(AVG(vd_vrcheio)::numeric, 2) as ticket_medio,
          ROUND(AVG(vd_vrdescontos)::numeric, 2) as desconto_medio,
          ROUND(AVG(vd_vrcheio - COALESCE(vd_vrdescontos, 0))::numeric, 2) as ticket_liquido,
          ROUND(SUM(vd_vrcheio)::numeric, 2) as faturamento_bruto,
          ROUND(SUM(vd_vrcheio - COALESCE(vd_vrdescontos, 0))::numeric, 2) as faturamento_liquido
        FROM contahub_vendas
        WHERE EXTRACT(DOW FROM dt_gerencial) = 3
          AND dt_gerencial >= '2025-09-01'
        GROUP BY 1
        ORDER BY 1
      `
    })

    // 2. Métricas de Ticket Médio - SEXTAS
    const { data: ticketSextas, error: errTicketSextas } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          CASE 
            WHEN dt_gerencial < '${DATAS_ENTRADA.sexta}' THEN 'antes'
            ELSE 'depois'
          END as periodo,
          COUNT(*) as total_comandas,
          COUNT(DISTINCT vd_cpf) FILTER (WHERE vd_cpf IS NOT NULL AND vd_cpf != '') as clientes_unicos,
          ROUND(AVG(vd_vrcheio)::numeric, 2) as ticket_medio,
          ROUND(AVG(vd_vrdescontos)::numeric, 2) as desconto_medio,
          ROUND(AVG(vd_vrcheio - COALESCE(vd_vrdescontos, 0))::numeric, 2) as ticket_liquido,
          ROUND(SUM(vd_vrcheio)::numeric, 2) as faturamento_bruto,
          ROUND(SUM(vd_vrcheio - COALESCE(vd_vrdescontos, 0))::numeric, 2) as faturamento_liquido
        FROM contahub_vendas
        WHERE EXTRACT(DOW FROM dt_gerencial) = 5
          AND dt_gerencial >= '2025-09-01'
        GROUP BY 1
        ORDER BY 1
      `
    })

    // 3. Recorrência - QUARTAS
    const { data: recorrenciaQuartas, error: errRecQuartas } = await supabase.rpc('execute_sql', {
      query: `
        WITH clientes_antes AS (
          SELECT DISTINCT vd_cpf
          FROM contahub_vendas
          WHERE vd_cpf IS NOT NULL AND vd_cpf != ''
            AND EXTRACT(DOW FROM dt_gerencial) = 3
            AND dt_gerencial >= '2025-09-01'
            AND dt_gerencial < '${DATAS_ENTRADA.quarta}'
        ),
        clientes_depois AS (
          SELECT DISTINCT vd_cpf
          FROM contahub_vendas
          WHERE vd_cpf IS NOT NULL AND vd_cpf != ''
            AND EXTRACT(DOW FROM dt_gerencial) = 3
            AND dt_gerencial >= '${DATAS_ENTRADA.quarta}'
        )
        SELECT 
          (SELECT COUNT(*) FROM clientes_antes) as clientes_antes,
          (SELECT COUNT(*) FROM clientes_depois) as clientes_depois,
          (SELECT COUNT(*) FROM clientes_antes c1 
           WHERE EXISTS (SELECT 1 FROM clientes_depois c2 WHERE c1.vd_cpf = c2.vd_cpf)) as retornaram,
          (SELECT COUNT(*) FROM clientes_antes c1 
           WHERE NOT EXISTS (SELECT 1 FROM clientes_depois c2 WHERE c1.vd_cpf = c2.vd_cpf)) as deixaram_de_ir,
          (SELECT COUNT(*) FROM clientes_depois c1 
           WHERE NOT EXISTS (SELECT 1 FROM clientes_antes c2 WHERE c1.vd_cpf = c2.vd_cpf)) as novos_clientes
      `
    })

    // 4. Recorrência - SEXTAS
    const { data: recorrenciaSextas, error: errRecSextas } = await supabase.rpc('execute_sql', {
      query: `
        WITH clientes_antes AS (
          SELECT DISTINCT vd_cpf
          FROM contahub_vendas
          WHERE vd_cpf IS NOT NULL AND vd_cpf != ''
            AND EXTRACT(DOW FROM dt_gerencial) = 5
            AND dt_gerencial >= '2025-09-01'
            AND dt_gerencial < '${DATAS_ENTRADA.sexta}'
        ),
        clientes_depois AS (
          SELECT DISTINCT vd_cpf
          FROM contahub_vendas
          WHERE vd_cpf IS NOT NULL AND vd_cpf != ''
            AND EXTRACT(DOW FROM dt_gerencial) = 5
            AND dt_gerencial >= '${DATAS_ENTRADA.sexta}'
        )
        SELECT 
          (SELECT COUNT(*) FROM clientes_antes) as clientes_antes,
          (SELECT COUNT(*) FROM clientes_depois) as clientes_depois,
          (SELECT COUNT(*) FROM clientes_antes c1 
           WHERE EXISTS (SELECT 1 FROM clientes_depois c2 WHERE c1.vd_cpf = c2.vd_cpf)) as retornaram,
          (SELECT COUNT(*) FROM clientes_antes c1 
           WHERE NOT EXISTS (SELECT 1 FROM clientes_depois c2 WHERE c1.vd_cpf = c2.vd_cpf)) as deixaram_de_ir,
          (SELECT COUNT(*) FROM clientes_depois c1 
           WHERE NOT EXISTS (SELECT 1 FROM clientes_antes c2 WHERE c1.vd_cpf = c2.vd_cpf)) as novos_clientes
      `
    })

    // 5. Evolução semanal - QUARTAS
    const { data: evolucaoQuartas, error: errEvoQuartas } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          dt_gerencial as data,
          CASE WHEN dt_gerencial < '${DATAS_ENTRADA.quarta}' THEN 'antes' ELSE 'depois' END as periodo,
          COUNT(*) as comandas,
          COUNT(DISTINCT vd_cpf) FILTER (WHERE vd_cpf IS NOT NULL AND vd_cpf != '') as clientes,
          ROUND(AVG(vd_vrcheio)::numeric, 2) as ticket_medio,
          ROUND(SUM(vd_vrcheio)::numeric, 2) as faturamento
        FROM contahub_vendas
        WHERE EXTRACT(DOW FROM dt_gerencial) = 3
          AND dt_gerencial >= '2025-09-01'
        GROUP BY 1, 2
        ORDER BY 1
      `
    })

    // 6. Evolução semanal - SEXTAS
    const { data: evolucaoSextas, error: errEvoSextas } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          dt_gerencial as data,
          CASE WHEN dt_gerencial < '${DATAS_ENTRADA.sexta}' THEN 'antes' ELSE 'depois' END as periodo,
          COUNT(*) as comandas,
          COUNT(DISTINCT vd_cpf) FILTER (WHERE vd_cpf IS NOT NULL AND vd_cpf != '') as clientes,
          ROUND(AVG(vd_vrcheio)::numeric, 2) as ticket_medio,
          ROUND(SUM(vd_vrcheio)::numeric, 2) as faturamento
        FROM contahub_vendas
        WHERE EXTRACT(DOW FROM dt_gerencial) = 5
          AND dt_gerencial >= '2025-09-01'
        GROUP BY 1, 2
        ORDER BY 1
      `
    })

    // 7. Baseline de recorrência (set -> out, antes da entrada)
    const { data: baselineQuartas } = await supabase.rpc('execute_sql', {
      query: `
        WITH clientes_set AS (
          SELECT DISTINCT vd_cpf FROM contahub_vendas
          WHERE vd_cpf IS NOT NULL AND vd_cpf != ''
            AND EXTRACT(DOW FROM dt_gerencial) = 3
            AND dt_gerencial >= '2025-09-01' AND dt_gerencial < '2025-10-01'
        ),
        clientes_out AS (
          SELECT DISTINCT vd_cpf FROM contahub_vendas
          WHERE vd_cpf IS NOT NULL AND vd_cpf != ''
            AND EXTRACT(DOW FROM dt_gerencial) = 3
            AND dt_gerencial >= '2025-10-01' AND dt_gerencial < '2025-11-01'
        )
        SELECT 
          (SELECT COUNT(*) FROM clientes_set) as clientes_setembro,
          (SELECT COUNT(*) FROM clientes_set c1 
           WHERE EXISTS (SELECT 1 FROM clientes_out c2 WHERE c1.vd_cpf = c2.vd_cpf)) as retornaram_outubro
      `
    })

    const { data: baselineSextas } = await supabase.rpc('execute_sql', {
      query: `
        WITH clientes_set AS (
          SELECT DISTINCT vd_cpf FROM contahub_vendas
          WHERE vd_cpf IS NOT NULL AND vd_cpf != ''
            AND EXTRACT(DOW FROM dt_gerencial) = 5
            AND dt_gerencial >= '2025-09-01' AND dt_gerencial < '2025-10-01'
        ),
        clientes_out AS (
          SELECT DISTINCT vd_cpf FROM contahub_vendas
          WHERE vd_cpf IS NOT NULL AND vd_cpf != ''
            AND EXTRACT(DOW FROM dt_gerencial) = 5
            AND dt_gerencial >= '2025-10-01' AND dt_gerencial < '2025-11-01'
        )
        SELECT 
          (SELECT COUNT(*) FROM clientes_set) as clientes_setembro,
          (SELECT COUNT(*) FROM clientes_set c1 
           WHERE EXISTS (SELECT 1 FROM clientes_out c2 WHERE c1.vd_cpf = c2.vd_cpf)) as retornaram_outubro
      `
    })

    return NextResponse.json({
      success: true,
      datasEntrada: DATAS_ENTRADA,
      quartas: {
        ticket: ticketQuartas || [],
        recorrencia: recorrenciaQuartas?.[0] || {},
        evolucao: evolucaoQuartas || [],
        baseline: baselineQuartas?.[0] || {}
      },
      sextas: {
        ticket: ticketSextas || [],
        recorrencia: recorrenciaSextas?.[0] || {},
        evolucao: evolucaoSextas || [],
        baseline: baselineSextas?.[0] || {}
      }
    })

  } catch (error) {
    console.error('Erro na análise de couvert:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar dados de análise' 
    }, { status: 500 })
  }
}



