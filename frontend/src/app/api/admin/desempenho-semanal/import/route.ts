import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth, isAdmin } from '@/lib/auth-helper'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ========================================
// 📊 IMPORTAR DADOS DE DESEMPENHO SEMANAL
// ========================================
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAuth(request)

    // Verificar permissões
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ 
        error: 'Apenas administradores podem importar dados' 
      }, { status: 403 })
    }

    const { bar_id } = user

    const body = await request.json()
    const { dados, substituir_existentes = false } = body

    if (!dados || !Array.isArray(dados)) {
      return NextResponse.json({ 
        error: 'Dados inválidos. Esperado array de semanas' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📊 Importando dados de desempenho:', { 
      bar_id, 
      total_semanas: dados.length,
      substituir_existentes 
    })

    let dadosImportados = 0
    let dadosAtualizados = 0
    let erros = []

    for (const semana of dados) {
      try {
        // Validar campos obrigatórios
        if (!semana.ano || !semana.numero_semana || !semana.data_inicio || !semana.data_fim) {
          erros.push(`Semana ${semana.numero_semana}: campos obrigatórios faltando`)
          continue
        }

        const dadosSemana = {
          bar_id,
          ano: parseInt(semana.ano),
          numero_semana: parseInt(semana.numero_semana),
          data_inicio: semana.data_inicio,
          data_fim: semana.data_fim,
          faturamento_total: parseFloat(semana.faturamento_total) || 0,
          faturamento_entrada: parseFloat(semana.faturamento_entrada) || 0,
          faturamento_bar: parseFloat(semana.faturamento_bar) || 0,
          clientes_atendidos: parseInt(semana.clientes_atendidos) || 0,
          reservas_totais: parseInt(semana.reservas_totais) || 0,
          reservas_presentes: parseInt(semana.reservas_presentes) || 0,
          cmv_teorico: parseFloat(semana.cmv_teorico) || 0,
          cmv_limpo: parseFloat(semana.cmv_limpo) || 0,
          meta_semanal: parseFloat(semana.meta_semanal) || 200000,
          observacoes: semana.observacoes || null
        }

        // Verificar se já existe
        const { data: existente } = await supabase
          .from('desempenho_semanal')
          .select('id')
          .eq('bar_id', bar_id)
          .eq('ano', dadosSemana.ano)
          .eq('numero_semana', dadosSemana.numero_semana)
          .single()

        if (existente && !substituir_existentes) {
          console.log(`⚠️ Semana ${semana.numero_semana} já existe, pulando`)
          continue
        }

        // Inserir ou atualizar
        const { error } = await supabase
          .from('desempenho_semanal')
          .upsert(dadosSemana, {
            onConflict: 'bar_id,ano,numero_semana'
          })

        if (error) {
          erros.push(`Semana ${semana.numero_semana}: ${error.message}`)
          continue
        }

        if (existente) {
          dadosAtualizados++
        } else {
          dadosImportados++
        }

      } catch (error: any) {
        erros.push(`Semana ${semana.numero_semana}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Importação concluída',
      resultados: {
        dados_importados: dadosImportados,
        dados_atualizados: dadosAtualizados,
        total_processados: dadosImportados + dadosAtualizados,
        erros: erros.length,
        detalhes_erros: erros
      }
    })

  } catch (error: any) {
    console.error('❌ Erro na importação:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// 📋 TEMPLATE DE DADOS PARA IMPORTAÇÃO
// ========================================
export async function GET() {
  const template = {
    exemplo: "Estrutura de dados para importação",
    formato: [
      {
        ano: 2025,
        numero_semana: 5,
        data_inicio: "2025-01-27",
        data_fim: "2025-02-02",
        faturamento_total: 75314.54,
        faturamento_entrada: 0,
        faturamento_bar: 75314.54,
        clientes_atendidos: 0,
        reservas_totais: 0,
        reservas_presentes: 0,
        cmv_teorico: 0,
        cmv_limpo: 0,
        meta_semanal: 200000,
        observacoes: "Dados da planilha"
      }
    ],
    instrucoes: {
      campos_obrigatorios: ["ano", "numero_semana", "data_inicio", "data_fim"],
      campos_opcionais: ["faturamento_total", "faturamento_entrada", "faturamento_bar", "clientes_atendidos", "reservas_totais", "reservas_presentes", "cmv_teorico", "cmv_limpo", "meta_semanal", "observacoes"],
      formato_datas: "YYYY-MM-DD",
      substituir_existentes: "false por padrão, true para sobrescrever dados existentes"
    }
  }

  return NextResponse.json(template)
} 