import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this'

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json()

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar cliente por email
    const { data: customer, error: customerError } = await supabase
      .from('fidelidade_membros')
      .select('id, nome, email, cpf, senha_hash, status, bar_id')
      .eq('email', email.trim().toLowerCase())
      .eq('status', 'ativo')
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verificar senha
    if (!customer.senha_hash) {
      return NextResponse.json(
        { error: 'Conta não configurada. Entre em contato com o suporte.' },
        { status: 401 }
      )
    }

    const senhaCorreta = await bcrypt.compare(senha, customer.senha_hash)
    
    if (!senhaCorreta) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Gerar JWT token
    const token = jwt.sign(
      { 
        customer_id: customer.id,
        email: customer.email,
        bar_id: customer.bar_id
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token válido por 7 dias
    )

    // Registrar login para auditoria
    await supabase
      .from('fidelidade_access_logs')
      .insert({
        membro_id: customer.id,
        action: 'login',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        nome: customer.nome,
        email: customer.email,
        cpf: customer.cpf
      }
    })

  } catch (error) {
    console.error('🚨 Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
