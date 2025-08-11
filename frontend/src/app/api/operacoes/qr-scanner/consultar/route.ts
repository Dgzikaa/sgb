import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this'

// POST - Consultar dados do QR Code (autenticação obrigatória)
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

    const { qr_token } = await request.json()

    // Validações básicas
    if (!qr_token) {
      return NextResponse.json(
        { error: 'QR Code é obrigatório' },
        { status: 400 }
      )
    }

    // Capturar IP do usuário para auditoria
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip

    // Chamar função do banco para consultar QR
    const { data, error } = await supabase.rpc('consultar_qr_fidelidade', {
      qr_token_input: qr_token
    })

    if (error) {
      console.error('Erro ao consultar QR:', error)
      return NextResponse.json(
        { error: 'Erro ao consultar QR Code', details: error.message },
        { status: 500 }
      )
    }

    // Log de auditoria
    await supabase
      .from('fidelidade_qr_scanner_logs')
      .insert({
        funcionario_id: funcionarioAutenticado.staff_id,
        acao: 'consultar_qr',
        qr_token,
        detalhes: { 
          ip: ip || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          resultado: data ? 'sucesso' : 'erro'
        }
      })

    // Retornar resultado da consulta
    return NextResponse.json({
      success: true,
      data,
      funcionario: {
        nome: funcionarioAutenticado.nome,
        id: funcionarioAutenticado.staff_id
      }
    })

  } catch (error) {
    console.error('Erro inesperado na consulta QR:', error)
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