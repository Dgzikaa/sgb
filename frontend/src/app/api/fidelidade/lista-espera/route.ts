import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - Cadastrar na lista de espera
export async function POST(request: NextRequest) {
  try {
    const { nome, email, telefone, bar_id = 1 } = await request.json()

    // Validações básicas
    if (!nome || !email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Verificar se email já está na lista
    const { data: existente } = await supabase
      .from('fidelidade_lista_espera')
      .select('id')
      .eq('email', email)
      .eq('bar_id', bar_id)
      .single()

    if (existente) {
      return NextResponse.json(
        { error: 'Email já cadastrado na lista de espera' },
        { status: 409 }
      )
    }

    // Cadastrar na lista de espera
    const { data: novoRegistro, error } = await supabase
      .from('fidelidade_lista_espera')
      .insert({
        nome,
        email,
        telefone: telefone || null,
        bar_id,
        status: 'aguardando',
        data_cadastro: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao cadastrar na lista de espera:', error)
      return NextResponse.json(
        { error: 'Erro ao cadastrar na lista de espera' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      registro: {
        id: novoRegistro.id,
        nome: novoRegistro.nome,
        email: novoRegistro.email,
        posicao: await obterPosicaoNaFila(novoRegistro.id, bar_id)
      },
      mensagem: 'Cadastrado com sucesso na lista de espera!'
    })

  } catch (error) {
    console.error('Erro ao cadastrar na lista de espera:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar pessoas na lista de espera (admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = parseInt(searchParams.get('bar_id') || '1')
    const status = searchParams.get('status') || 'aguardando'
    const limite = parseInt(searchParams.get('limite') || '50')

    const { data: registros, error } = await supabase
      .from('fidelidade_lista_espera')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('status', status)
      .order('data_cadastro', { ascending: true })
      .limit(limite)

    if (error) {
      console.error('Erro ao buscar lista de espera:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar lista de espera' },
        { status: 500 }
      )
    }

    // Adicionar posição na fila para cada registro
    const registrosComPosicao = registros.map((registro, index) => ({
      ...registro,
      posicao: index + 1
    }))

    return NextResponse.json({
      success: true,
      total: registros.length,
      registros: registrosComPosicao
    })

  } catch (error) {
    console.error('Erro ao buscar lista de espera:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar status na lista de espera
export async function PUT(request: NextRequest) {
  try {
    const { id, status, observacoes } = await request.json()

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID e status são obrigatórios' },
        { status: 400 }
      )
    }

    const statusValidos = ['aguardando', 'convidado', 'cadastrado', 'cancelado']
    if (!statusValidos.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    const { data: registroAtualizado, error } = await supabase
      .from('fidelidade_lista_espera')
      .update({
        status,
        observacoes,
        data_atualizacao: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar lista de espera:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar registro' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      registro: registroAtualizado,
      mensagem: 'Status atualizado com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao atualizar lista de espera:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para obter posição na fila
async function obterPosicaoNaFila(registroId: string, barId: number): Promise<number> {
  try {
    const { data: registros } = await supabase
      .from('fidelidade_lista_espera')
      .select('id, data_cadastro')
      .eq('bar_id', barId)
      .eq('status', 'aguardando')
      .order('data_cadastro', { ascending: true })

    const posicao = registros?.findIndex(r => r.id === registroId) ?? -1
    return posicao >= 0 ? posicao + 1 : 0
  } catch (error) {
    console.error('Erro ao calcular posição na fila:', error)
    return 0
  }
}
