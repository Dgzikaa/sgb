import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - Criar novo membro
export async function POST(request: NextRequest) {
  try {
    const {
      codigo_convite,
      cpf,
      nome,
      email,
      telefone,
      data_nascimento,
      endereco,
      bar_id = 1
    } = await request.json()

    // Validações básicas
    if (!codigo_convite || !cpf || !nome || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: codigo_convite, cpf, nome, email' },
        { status: 400 }
      )
    }

    // Verificar se código é válido e não foi usado
    const { data: codigoData, error: codigoError } = await supabase
      .from('fidelidade_codigos_convite')
      .select('*')
      .eq('codigo', codigo_convite.toUpperCase())
      .eq('usado', false)
      .eq('ativo', true)
      .single()

    if (codigoError || !codigoData) {
      return NextResponse.json(
        { error: 'Código de convite inválido ou já foi utilizado' },
        { status: 400 }
      )
    }

    // Verificar se CPF já está cadastrado
    const cpfLimpo = cpf.replace(/\D/g, '')
    const { data: membroExistente } = await supabase
      .from('fidelidade_membros')
      .select('id')
      .eq('cpf', cpfLimpo)
      .eq('bar_id', bar_id)
      .single()

    if (membroExistente) {
      return NextResponse.json(
        { error: 'CPF já cadastrado no programa de fidelidade' },
        { status: 409 }
      )
    }

    // Criar membro
    const { data: novoMembro, error: membroError } = await supabase
      .from('fidelidade_membros')
      .insert({
        nome,
        email,
        telefone,
        cpf: cpfLimpo,
        data_nascimento,
        endereco,
        status: 'ativo',
        plano: 'vip',
        valor_mensalidade: 100.00,
        credito_mensal: 150.00,
        data_adesao: new Date().toISOString(),
        bar_id,
        codigo_convite_usado: codigo_convite.toUpperCase()
      })
      .select()
      .single()

    if (membroError) {
      console.error('Erro ao criar membro:', membroError)
      return NextResponse.json(
        { error: 'Erro ao criar membro no banco de dados' },
        { status: 500 }
      )
    }

    // Marcar código como usado
    const { error: codigoUpdateError } = await supabase
      .from('fidelidade_codigos_convite')
      .update({
        usado: true,
        usado_por: novoMembro.id,
        data_uso: new Date().toISOString()
      })
      .eq('codigo', codigo_convite.toUpperCase())

    if (codigoUpdateError) {
      console.error('Erro ao marcar código como usado:', codigoUpdateError)
      // Não falha a criação do membro por isso, apenas loga o erro
    }

    return NextResponse.json({
      success: true,
      membro: {
        id: novoMembro.id,
        nome: novoMembro.nome,
        email: novoMembro.email,
        cpf: novoMembro.cpf,
        plano: novoMembro.plano,
        valor_mensalidade: novoMembro.valor_mensalidade,
        credito_mensal: novoMembro.credito_mensal
      },
      mensagem: 'Membro criado com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao criar membro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Buscar membro por ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const cpf = searchParams.get('cpf')

    if (!id && !cpf) {
      return NextResponse.json(
        { error: 'ID ou CPF é obrigatório' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('fidelidade_membros')
      .select('*')

    if (id) {
      query = query.eq('id', id)
    } else if (cpf) {
      query = query.eq('cpf', cpf.replace(/\D/g, ''))
    }

    const { data: membro, error } = await query.single()

    if (error || !membro) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      membro: {
        id: membro.id,
        nome: membro.nome,
        email: membro.email,
        cpf: membro.cpf,
        telefone: membro.telefone,
        data_nascimento: membro.data_nascimento,
        endereco: membro.endereco,
        status: membro.status,
        plano: membro.plano,
        valor_mensalidade: membro.valor_mensalidade,
        credito_mensal: membro.credito_mensal,
        data_adesao: membro.data_adesao
      }
    })

  } catch (error) {
    console.error('Erro ao buscar membro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
