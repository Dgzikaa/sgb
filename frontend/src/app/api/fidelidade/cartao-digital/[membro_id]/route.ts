import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Obter dados do cartão digital do membro
export async function GET(
  request: NextRequest,
  { params }: { params: { membro_id: string } }
) {
  try {
    const { membro_id } = params

    if (!membro_id) {
      return NextResponse.json(
        { error: 'ID do membro é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados do membro
    const { data: membro, error: membroError } = await supabase
      .from('fidelidade_membros')
      .select(`
        id,
        nome,
        email,
        status,
        plano,
        qr_code_token,
        data_adesao,
        proxima_cobranca,
        bar_id,
        bars!inner(id, nome)
      `)
      .eq('id', membro_id)
      .eq('status', 'ativo')
      .single()

    if (membroError || !membro) {
      return NextResponse.json(
        { error: 'Membro não encontrado ou inativo' },
        { status: 404 }
      )
    }

    // Buscar saldo atual
    const { data: saldo, error: saldoError } = await supabase
      .from('fidelidade_saldos')
      .select('saldo_atual, ultimo_credito')
      .eq('membro_id', membro_id)
      .single()

    // Buscar últimos check-ins
    const { data: checkins, error: checkinsError } = await supabase
      .from('fidelidade_checkins')
      .select('data_checkin, pontos_ganhos')
      .eq('membro_id', membro_id)
      .order('data_checkin', { ascending: false })
      .limit(5)

    // Gerar URL do QR Code para o cartão
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cartao/${membro.qr_code_token}`

    return NextResponse.json({
      success: true,
      cartao: {
        membro: {
          id: membro.id,
          nome: membro.nome,
          email: membro.email,
          status: membro.status,
          plano: membro.plano,
          data_adesao: membro.data_adesao,
          proxima_cobranca: membro.proxima_cobranca
        },
        bar: membro.bars,
        saldo: saldo?.saldo_atual || 0,
        ultimo_credito: saldo?.ultimo_credito,
        qr_code_token: membro.qr_code_token,
        qr_code_url: qrCodeUrl,
        checkins_recentes: checkins || [],
        wallet_urls: {
          // URLs para adicionar à wallet
          apple: `https://wallet.apple.com/passes?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/wallet/apple/${membro.qr_code_token}`)}`,
          google: `https://pay.google.com/passes/save?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/wallet/google/${membro.qr_code_token}`)}`
        }
      }
    })

  } catch (error) {
    console.error('🚨 Erro ao gerar cartão digital:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
