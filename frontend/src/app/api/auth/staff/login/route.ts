import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Buscar funcionário no banco de dados
    const { data: funcionario, error: funcionarioError } = await supabase
      .from('usuarios')
      .select('id, nome, email, senha_hash, tipo, status, bar_id')
      .eq('email', email.toLowerCase())
      .eq('status', 'ativo')
      .single()

    if (funcionarioError || !funcionario) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar se é funcionário (não admin)
    if (funcionario.tipo !== 'funcionario') {
      return NextResponse.json(
        { error: 'Acesso negado - Esta área é restrita a funcionários' },
        { status: 403 }
      )
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, funcionario.senha_hash)
    
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        staff_id: funcionario.id,
        email: funcionario.email,
        nome: funcionario.nome,
        bar_id: funcionario.bar_id,
        tipo: funcionario.tipo
      },
      JWT_SECRET,
      { expiresIn: '8h' } // Token válido por 8 horas
    )

    // Log de acesso
    await supabase
      .from('fidelidade_qr_scanner_logs')
      .insert({
        funcionario_id: funcionario.id,
        acao: 'login',
        detalhes: { 
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        }
      })

    return NextResponse.json({
      success: true,
      token,
      funcionario: {
        id: funcionario.id,
        nome: funcionario.nome,
        email: funcionario.email,
        bar_id: funcionario.bar_id
      }
    })

  } catch (error) {
    console.error('🚨 Erro no login de funcionário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
