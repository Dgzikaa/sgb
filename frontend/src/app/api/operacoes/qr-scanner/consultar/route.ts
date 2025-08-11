import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - Consultar dados do QR Code (sem aplicar desconto)
export async function POST(request: NextRequest) {
  try {
    const { 
      qr_token, 
      bar_id = 3,
      funcionario_id = null 
    } = await request.json()

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
      p_qr_token: qr_token,
      p_bar_id: bar_id,
      p_funcionario_id: funcionario_id,
      p_ip_origem: ip
    })

    if (error) {
      console.error('Erro ao consultar QR:', error)
      return NextResponse.json(
        { error: 'Erro ao consultar QR Code', details: error.message },
        { status: 500 }
      )
    }

    // Retornar resultado da consulta
    return NextResponse.json(data)

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

// GET - Consulta via query params (para testes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qr_token = searchParams.get('token')
    const bar_id = parseInt(searchParams.get('bar_id') || '3')

    if (!qr_token) {
      return NextResponse.json(
        { error: 'Parâmetro token é obrigatório' },
        { status: 400 }
      )
    }

    // Capturar IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.ip

    // Chamar função do banco
    const { data, error } = await supabase.rpc('consultar_qr_fidelidade', {
      p_qr_token: qr_token,
      p_bar_id: bar_id,
      p_funcionario_id: null,
      p_ip_origem: ip
    })

    if (error) {
      console.error('Erro ao consultar QR:', error)
      return NextResponse.json(
        { error: 'Erro ao consultar QR Code', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

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
