import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ========================================
// 📊 GET - BUSCAR DADOS DE DESEMPENHO
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { bar_id, permissao } = JSON.parse(userData)

    // Verificar permissões
    if (!['admin', 'manager'].includes(permissao)) {
      return NextResponse.json({ 
        error: 'Sem permissão para acessar dados de desempenho' 
      }, { status: 403 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    
    const ano = searchParams.get('ano') || new Date().getFullYear().toString()
    const mes = searchParams.get('mes') // Filtro opcional por mês

    console.log('🔍 Buscando dados de desempenho:', { bar_id, ano, mes })

    let query = supabase
      .from('desempenho_semanal')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('ano', parseInt(ano))
      .order('numero_semana', { ascending: true })

    // Filtrar por mês se especificado
    if (mes) {
      const mesInt = parseInt(mes)
      query = query.gte('data_inicio', `${ano}-${mesInt.toString().padStart(2, '0')}-01`)
      
      // Calcular último dia do mês
      const ultimoDiaMes = new Date(parseInt(ano), mesInt, 0).getDate()
      query = query.lte('data_fim', `${ano}-${mesInt.toString().padStart(2, '0')}-${ultimoDiaMes}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erro ao buscar desempenho:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar dados de desempenho',
        details: error.message 
      }, { status: 500 })
    }

    // Buscar estatísticas resumidas
    const { data: resumo, error: resumoError } = await supabase
      .from('vw_desempenho_resumo')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('ano', parseInt(ano))
      .single()

    return NextResponse.json({
      success: true,
      data: data || [],
      resumo: resumo || {
        total_semanas: 0,
        faturamento_medio: 0,
        faturamento_total_ano: 0,
        clientes_medio: 0,
        clientes_total_ano: 0,
        ticket_medio_geral: 0,
        atingimento_medio: 0,
        cmv_medio: 0
      },
      ano: parseInt(ano),
      mes: mes ? parseInt(mes) : null
    })

  } catch (error: any) {
    console.error('❌ Erro na API de desempenho:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// 💾 POST - CRIAR/ATUALIZAR SEMANA
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { bar_id, permissao } = JSON.parse(userData)

    // Verificar permissões
    if (!['admin', 'manager'].includes(permissao)) {
      return NextResponse.json({ 
        error: 'Sem permissão para salvar dados de desempenho' 
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      ano,
      numero_semana,
      data_inicio,
      data_fim,
      faturamento_total,
      faturamento_entrada,
      faturamento_bar,
      clientes_atendidos,
      reservas_totais,
      reservas_presentes,
      cmv_teorico,
      cmv_limpo,
      meta_semanal,
      observacoes
    } = body

    // Validações
    if (!ano || !numero_semana || !data_inicio || !data_fim) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: ano, numero_semana, data_inicio, data_fim' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('💾 Salvando dados de desempenho:', { bar_id, ano, numero_semana })

    const dadosSemana = {
      bar_id,
      ano: parseInt(ano),
      numero_semana: parseInt(numero_semana),
      data_inicio,
      data_fim,
      faturamento_total: parseFloat(faturamento_total) || 0,
      faturamento_entrada: parseFloat(faturamento_entrada) || 0,
      faturamento_bar: parseFloat(faturamento_bar) || 0,
      clientes_atendidos: parseInt(clientes_atendidos) || 0,
      reservas_totais: parseInt(reservas_totais) || 0,
      reservas_presentes: parseInt(reservas_presentes) || 0,
      cmv_teorico: parseFloat(cmv_teorico) || 0,
      cmv_limpo: parseFloat(cmv_limpo) || 0,
      meta_semanal: parseFloat(meta_semanal) || 0,
      observacoes: observacoes || null
    }

    // Usar upsert para criar ou atualizar
    const { data, error } = await supabase
      .from('desempenho_semanal')
      .upsert(dadosSemana, {
        onConflict: 'bar_id,ano,numero_semana'
      })
      .select()

    if (error) {
      console.error('❌ Erro ao salvar desempenho:', error)
      return NextResponse.json({ 
        error: 'Erro ao salvar dados de desempenho',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Dados de desempenho salvos com sucesso',
      data: data?.[0] || dadosSemana
    })

  } catch (error: any) {
    console.error('❌ Erro ao salvar desempenho:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// ========================================
// 🗑️ DELETE - EXCLUIR SEMANA
// ========================================
export async function DELETE(request: NextRequest) {
  try {
    const headersList = headers()
    const userData = headersList.get('x-user-data')
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    const { bar_id, permissao } = JSON.parse(userData)

    // Verificar permissões
    if (!['admin'].includes(permissao)) {
      return NextResponse.json({ 
        error: 'Apenas administradores podem excluir dados de desempenho' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const ano = searchParams.get('ano')
    const numero_semana = searchParams.get('numero_semana')

    if (!id && (!ano || !numero_semana)) {
      return NextResponse.json({ 
        error: 'Informe o ID ou ano+numero_semana para excluir' 
      }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🗑️ Excluindo dados de desempenho:', { bar_id, id, ano, numero_semana })

    let query = supabase
      .from('desempenho_semanal')
      .delete()
      .eq('bar_id', bar_id)

    if (id) {
      query = query.eq('id', parseInt(id))
    } else {
      query = query.eq('ano', parseInt(ano!)).eq('numero_semana', parseInt(numero_semana!))
    }

    const { error } = await query

    if (error) {
      console.error('❌ Erro ao excluir desempenho:', error)
      return NextResponse.json({ 
        error: 'Erro ao excluir dados de desempenho',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Dados de desempenho excluídos com sucesso'
    })

  } catch (error: any) {
    console.error('❌ Erro ao excluir desempenho:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
} 