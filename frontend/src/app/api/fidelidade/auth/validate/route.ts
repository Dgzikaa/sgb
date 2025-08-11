import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this'

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authorization.substring(7) // Remove "Bearer "

    try {
      // Verificar e decodificar JWT
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      if (!decoded.customer_id) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        )
      }

      // Buscar dados atualizados do cliente
      const { data: customer, error } = await supabase
        .from('fidelidade_membros')
        .select('id, nome, email, cpf, status, bar_id')
        .eq('id', decoded.customer_id)
        .eq('status', 'ativo')
        .single()

      if (error || !customer) {
        return NextResponse.json(
          { error: 'Cliente não encontrado ou inativo' },
          { status: 404 }
        )
      }

      // Registrar acesso para auditoria
      await supabase
        .from('fidelidade_access_logs')
        .insert({
          membro_id: customer.id,
          action: 'session_validation',
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        })
        .select()

      return NextResponse.json({
        id: customer.id,
        nome: customer.nome,
        email: customer.email,
        cpf: customer.cpf,
        bar_id: customer.bar_id,
        authenticated: true
      })

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('🚨 Erro na validação de sessão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
