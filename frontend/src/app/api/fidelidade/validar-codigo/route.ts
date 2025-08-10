import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - Validar código de convite + CPF (antes do cadastro)
export async function POST(request: NextRequest) {
  try {
    const { codigo, cpf, bar_id } = await request.json()

    // Validações de entrada
    if (!codigo) {
      return NextResponse.json(
        { error: 'Código de convite é obrigatório' },
        { status: 400 }
      )
    }

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    if (!bar_id) {
      return NextResponse.json(
        { error: 'Bar é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do CPF (11 dígitos)
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      return NextResponse.json(
        { error: 'CPF deve ter 11 dígitos' },
        { status: 400 }
      )
    }

    // 1. Verificar se CPF já está cadastrado no mesmo bar
    const { data: membroExistente, error: cpfError } = await supabase
      .from('fidelidade_membros')
      .select('id, nome, created_at')
      .eq('cpf', cpfLimpo)
      .eq('bar_id', bar_id)
      .single()

    if (membroExistente) {
      return NextResponse.json(
        { 
          valido: false,
          error: 'CPF já cadastrado',
          detalhes: `Este CPF já possui cadastro no programa de fidelidade desde ${new Date(membroExistente.created_at).toLocaleDateString('pt-BR')}`,
          codigo_erro: 'CPF_JA_CADASTRADO'
        },
        { status: 409 }
      )
    }

    // 2. Verificar se código de convite é válido
    const { data: codigoData, error: codigoError } = await supabase
      .from('fidelidade_codigos_convite')
      .select('*')
      .eq('codigo', codigo.toUpperCase())
      .eq('ativo', true)
      .single()

    if (codigoError || !codigoData) {
      return NextResponse.json(
        { 
          valido: false,
          error: 'Código de convite inválido',
          detalhes: 'Código não encontrado ou inativo',
          codigo_erro: 'CODIGO_INVALIDO'
        },
        { status: 404 }
      )
    }

    // 3. Verificar se código já foi usado
    if (codigoData.usado) {
      return NextResponse.json(
        { 
          valido: false,
          error: 'Código já foi utilizado',
          detalhes: `Este código foi usado em ${new Date(codigoData.data_uso).toLocaleDateString('pt-BR')}`,
          codigo_erro: 'CODIGO_JA_USADO'
        },
        { status: 409 }
      )
    }

    // 4. Verificar se código expirou
    const agora = new Date()
    const dataExpiracao = new Date(codigoData.data_expiracao)
    
    if (agora > dataExpiracao) {
      return NextResponse.json(
        { 
          valido: false,
          error: 'Código expirado',
          detalhes: `Código válido até ${dataExpiracao.toLocaleDateString('pt-BR')}`,
          codigo_erro: 'CODIGO_EXPIRADO'
        },
        { status: 410 }
      )
    }

    // ✅ Tudo válido!
    return NextResponse.json({
      valido: true,
      codigo: codigoData.codigo,
      cpf: cpfLimpo,
      bar_id: bar_id,
      data_expiracao: codigoData.data_expiracao,
      mensagem: 'Código e CPF válidos! Pode prosseguir com o cadastro.',
      // Token temporário para validar no cadastro
      validation_token: Buffer.from(`${codigo}-${cpfLimpo}-${bar_id}-${Date.now()}`).toString('base64')
    })

  } catch (error) {
    console.error('Erro ao validar código e CPF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Verificar apenas código (sem CPF)
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
      .select('codigo, usado, data_expiracao, data_uso')
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
          error: 'Código já foi utilizado',
          data_uso: codigoData.data_uso
        },
        { status: 409 }
      )
    }

    // Verificar se expirou
    const agora = new Date()
    const dataExpiracao = new Date(codigoData.data_expiracao)
    
    if (agora > dataExpiracao) {
      return NextResponse.json(
        { 
          valido: false, 
          error: 'Código expirado',
          data_expiracao: codigoData.data_expiracao
        },
        { status: 410 }
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
