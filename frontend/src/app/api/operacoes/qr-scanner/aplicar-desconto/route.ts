import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - Aplicar desconto via QR Code
export async function POST(request: NextRequest) {
  try {
    const { 
      qr_token, 
      valor_desconto,
      funcionario_id = null,
      bar_id = 3,
      observacoes = null
    } = await request.json()

    // Validações básicas
    if (!qr_token) {
      return NextResponse.json(
        { error: 'QR Code é obrigatório' },
        { status: 400 }
      )
    }

    if (!valor_desconto || valor_desconto <= 0) {
      return NextResponse.json(
        { error: 'Valor do desconto deve ser maior que zero' },
        { status: 400 }
      )
    }

    // Capturar IP do usuário para auditoria
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip

    // Chamar função do banco para aplicar desconto
    const { data, error } = await supabase.rpc('aplicar_desconto_qr', {
      p_qr_token: qr_token,
      p_valor_desconto: valor_desconto,
      p_funcionario_id: funcionario_id,
      p_bar_id: bar_id
    })

    if (error) {
      console.error('Erro ao aplicar desconto:', error)
      return NextResponse.json(
        { error: 'Erro ao aplicar desconto', details: error.message },
        { status: 500 }
      )
    }

    // Se aplicação falhou (saldo insuficiente, etc)
    if (!data.success) {
      // Log do erro no banco
      await supabase.from('fidelidade_qr_scanner_logs').insert({
        qr_token,
        acao: 'desconto_negado',
        valor_operacao: valor_desconto,
        resultado: data,
        bar_id,
        funcionario_id,
        ip_origem: ip
      })

      return NextResponse.json(data, { status: 400 })
    }

    // Log de sucesso
    await supabase.from('fidelidade_qr_scanner_logs').insert({
      qr_token,
      membro_id: data.membro_id,
      acao: 'desconto_aplicado',
      valor_operacao: valor_desconto,
      resultado: {
        ...data,
        observacoes
      },
      bar_id,
      funcionario_id,
      ip_origem: ip
    })

    // Retornar sucesso com detalhes
    return NextResponse.json({
      ...data,
      observacoes,
      aplicado_em: new Date().toISOString(),
      aplicado_por: funcionario_id
    })

  } catch (error) {
    console.error('Erro inesperado ao aplicar desconto:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET - Para testes rápidos via URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qr_token = searchParams.get('token')
    const valor_desconto = parseFloat(searchParams.get('valor') || '0')
    const bar_id = parseInt(searchParams.get('bar_id') || '3')

    if (!qr_token || !valor_desconto) {
      return NextResponse.json(
        { error: 'Parâmetros token e valor são obrigatórios' },
        { status: 400 }
      )
    }

    // Capturar IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip

    // Chamar função do banco
    const { data, error } = await supabase.rpc('aplicar_desconto_qr', {
      p_qr_token: qr_token,
      p_valor_desconto: valor_desconto,
      p_funcionario_id: null, // GET não tem funcionario
      p_bar_id: bar_id
    })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao aplicar desconto', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro inesperado ao aplicar desconto:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
