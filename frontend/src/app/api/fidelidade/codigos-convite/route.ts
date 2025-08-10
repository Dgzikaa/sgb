import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Verificar se código é válido
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const codigo = searchParams.get('codigo')

    if (!codigo) {
      return NextResponse.json(
        { error: 'Código é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar código na base
    const { data: codigoData, error } = await supabase
      .from('fidelidade_codigos_convite')
      .select('*')
      .eq('codigo', codigo.toUpperCase())
      .eq('ativo', true)
      .single()

    if (error || !codigoData) {
      return NextResponse.json(
        { 
          valido: false, 
          error: 'Código inválido ou não encontrado' 
        },
        { status: 404 }
      )
    }

    // Verificar se já foi usado
    if (codigoData.usado) {
      return NextResponse.json(
        { 
          valido: false, 
          error: 'Código já foi utilizado' 
        },
        { status: 400 }
      )
    }

    // Verificar se expirou
    const agora = new Date()
    const dataExpiracao = new Date(codigoData.data_expiracao)
    
    if (agora > dataExpiracao) {
      return NextResponse.json(
        { 
          valido: false, 
          error: 'Código expirado' 
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valido: true,
      codigo: codigoData.codigo,
      data_expiracao: codigoData.data_expiracao
    })

  } catch (error) {
    console.error('Erro ao verificar código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Marcar código como usado (com validações de segurança)
export async function POST(request: NextRequest) {
  try {
    const { codigo, membro_id, cpf, bar_id } = await request.json()

    if (!codigo) {
      return NextResponse.json(
        { error: 'Código é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se CPF já está cadastrado no mesmo bar
    if (cpf && bar_id) {
      const { data: membroExistente } = await supabase
        .from('fidelidade_membros')
        .select('id, nome')
        .eq('cpf', cpf)
        .eq('bar_id', bar_id)
        .single()

      if (membroExistente) {
        return NextResponse.json(
          { 
            error: 'CPF já cadastrado no programa de fidelidade',
            detalhes: 'Cada CPF pode ter apenas um cadastro por estabelecimento'
          },
          { status: 409 }
        )
      }
    }

    // Verificar novamente se código ainda está disponível
    const { data: codigoData, error: codigoError } = await supabase
      .from('fidelidade_codigos_convite')
      .select('*')
      .eq('codigo', codigo.toUpperCase())
      .eq('usado', false)
      .eq('ativo', true)
      .single()

    if (codigoError || !codigoData) {
      return NextResponse.json(
        { error: 'Código inválido ou já foi utilizado' },
        { status: 400 }
      )
    }

    // Atualizar código como usado (transação atômica)
    const { data, error } = await supabase
      .from('fidelidade_codigos_convite')
      .update({
        usado: true,
        usado_por: membro_id,
        data_uso: new Date().toISOString()
      })
      .eq('codigo', codigo.toUpperCase())
      .eq('usado', false)
      .eq('ativo', true)
      .select()

    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { 
          error: 'Código já foi utilizado por outra pessoa',
          detalhes: 'Cada código pode ser usado apenas uma vez'
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      codigo_usado: data[0],
      mensagem: 'Código validado com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao usar código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET /admin - Listar códigos disponíveis (para admin)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'listar-disponiveis') {
      const { data: codigos, error } = await supabase
        .from('fidelidade_codigos_convite')
        .select('codigo, usado, data_expiracao, data_uso')
        .eq('ativo', true)
        .order('codigo')

      if (error) {
        return NextResponse.json(
          { error: 'Erro ao buscar códigos' },
          { status: 500 }
        )
      }

      const disponiveis = codigos?.filter(c => !c.usado) || []
      const usados = codigos?.filter(c => c.usado) || []

      return NextResponse.json({
        total: codigos?.length || 0,
        disponiveis: disponiveis.length,
        usados: usados.length,
        codigos_disponiveis: disponiveis.map(c => c.codigo),
        codigos_usados: usados
      })
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro ao listar códigos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
