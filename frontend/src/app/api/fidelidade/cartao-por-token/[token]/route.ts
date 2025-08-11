import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this'

// GET - Obter dados do cartão digital por token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    if (!token) {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar autenticação
    const authorization = request.headers.get('authorization')
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Acesso negado - Autenticação necessária' },
        { status: 401 }
      )
    }

    const sessionToken = authorization.substring(7)

    let authenticatedCustomerId: string
    try {
      const decoded = jwt.verify(sessionToken, JWT_SECRET) as any
      authenticatedCustomerId = decoded.customer_id
      
      if (!authenticatedCustomerId) {
        return NextResponse.json(
          { error: 'Token inválido' },
          { status: 401 }
        )
      }
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    // Buscar membro pelo token do QR Code
    const { data: membro, error: membroError } = await supabase
      .from('fidelidade_membros')
      .select(`
        id,
        nome,
        email,
        status,
        plano,
        qr_token,
        data_adesao,
        proxima_cobranca,
        bar_id,
        valor_mensalidade,
        credito_mensal
      `)
      .eq('qr_code_token', token)
      .eq('status', 'ativo')
      .single()

    if (membroError || !membro) {
      return NextResponse.json(
        { error: 'Cartão não encontrado ou membro inativo' },
        { status: 404 }
      )
    }

    // Verificar se o cliente autenticado é o dono do cartão
    if (membro.id !== authenticatedCustomerId) {
      return NextResponse.json(
        { error: 'Acesso negado - Este cartão não pertence a você' },
        { status: 403 }
      )
    }

    // Buscar últimas transações para histórico (opcional)
    const { data: transacoes, error: transacoesError } = await supabase
      .from('fidelidade_transacoes')
      .select('tipo, valor, descricao, data_transacao')
      .eq('membro_id', membro.id)
      .order('data_transacao', { ascending: false })
      .limit(5)

    // Calcular saldo atual baseado nas transações
    const { data: saldoData } = await supabase
      .rpc('consultar_qr_fidelidade', { qr_token_input: token })

    const saldoAtual = saldoData?.consultar_qr_fidelidade?.saldo_atual || 0

    // Gerar URL do QR Code para o cartão
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cartao/${token}`

    return NextResponse.json({
      membro: {
        id: membro.id,
        nome: membro.nome,
        email: membro.email,
        plano: membro.plano || 'VIP',
        valor_mensalidade: membro.valor_mensalidade || 100.00,
        credito_mensal: membro.credito_mensal || 150.00,
        proxima_cobranca: membro.proxima_cobranca
      },
      saldo: saldoAtual,
      qr_code_url: qrCodeUrl,
      transacoes: transacoes || []
    })

  } catch (error) {
    console.error('🚨 Erro ao buscar cartão por token:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
