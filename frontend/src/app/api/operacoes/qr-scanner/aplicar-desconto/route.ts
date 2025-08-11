import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this'

// POST - Aplicar desconto via QR Code (autenticação obrigatória)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação de funcionário
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Acesso negado - Autenticação necessária' },
        { status: 401 }
      )
    }

    const token = authorization.substring(7)
    let funcionarioAutenticado: any

    try {
      funcionarioAutenticado = jwt.verify(token, JWT_SECRET) as any
      
      if (!funcionarioAutenticado.staff_id || funcionarioAutenticado.tipo !== 'funcionario') {
        return NextResponse.json(
          { error: 'Acesso negado - Token inválido para funcionário' },
          { status: 401 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Acesso negado - Token inválido ou expirado' },
        { status: 401 }
      )
    }

    const { 
      qr_token, 
      valor_desconto,
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
      qr_token_input: qr_token,
      valor_desconto_input: valor_desconto,
      funcionario_id_input: funcionarioAutenticado.staff_id
    })

    if (error) {
      console.error('Erro ao aplicar desconto:', error)
      
      // Log do erro no banco
      await supabase.from('fidelidade_qr_scanner_logs').insert({
        funcionario_id: funcionarioAutenticado.staff_id,
        acao: 'desconto_erro',
        qr_token,
        valor_operacao: valor_desconto,
        detalhes: { 
          erro: error.message,
          ip: ip || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          observacoes
        }
      })

      return NextResponse.json(
        { error: 'Erro ao aplicar desconto', details: error.message },
        { status: 500 }
      )
    }

    // Verificar se aplicação foi bem-sucedida
    const resultado = data?.aplicar_desconto_qr
    if (!resultado || !resultado.success) {
      // Log de desconto negado
      await supabase.from('fidelidade_qr_scanner_logs').insert({
        funcionario_id: funcionarioAutenticado.staff_id,
        acao: 'desconto_negado',
        qr_token,
        valor_operacao: valor_desconto,
        detalhes: { 
          motivo: resultado?.message || 'Saldo insuficiente',
          ip: ip || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          observacoes
        }
      })

      return NextResponse.json({
        success: false,
        message: resultado?.message || 'Não foi possível aplicar o desconto'
      }, { status: 400 })
    }

    // Log de sucesso
    await supabase.from('fidelidade_qr_scanner_logs').insert({
      funcionario_id: funcionarioAutenticado.staff_id,
      acao: 'desconto_aplicado',
      qr_token,
      valor_operacao: valor_desconto,
      detalhes: {
        saldo_anterior: resultado.saldo_anterior,
        saldo_atual: resultado.saldo_atual,
        membro_nome: resultado.membro_nome,
        ip: ip || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        observacoes
      }
    })

    // Retornar sucesso com detalhes
    return NextResponse.json({
      success: true,
      ...resultado,
      observacoes,
      aplicado_em: new Date().toISOString(),
      funcionario: {
        nome: funcionarioAutenticado.nome,
        id: funcionarioAutenticado.staff_id
      }
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

// GET removido - apenas POST com autenticação