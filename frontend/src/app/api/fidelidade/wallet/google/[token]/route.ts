import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateGoogleWalletPass } from '@/lib/googleWallet'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Gerar Google Pay Pass
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Buscar dados do cartão
    const { data: cartaoData, error } = await supabase.rpc('buscar_cartao_por_token', {
      p_token: token
    })

    if (error || !cartaoData) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 
        !process.env.GOOGLE_WALLET_ISSUER_ID) {
      
      return NextResponse.json({
        success: false,
        type: 'google_pay',
        instructions: {
          title: 'Google Pay - Configuração Necessária',
          message: 'As credenciais do Google Wallet precisam ser configuradas no Vercel.',
          fallback: {
            cartao_url: `${process.env.NEXT_PUBLIC_APP_URL}/cartao/${token}`,
            instrucoes: [
              '1. Adicione esta página aos favoritos',
              '2. Ou use "Adicionar à tela inicial" no Chrome',
              '3. Seu cartão ficará sempre acessível'
            ]
          }
        }
      })
    }

    try {
      // Gerar pass do Google Wallet
      const saveUrl = await generateGoogleWalletPass(cartaoData)
      
      return NextResponse.json({
        success: true,
        type: 'google_pay',
        save_url: saveUrl,
        instructions: {
          title: 'Adicionar ao Google Pay',
          message: 'Toque no botão abaixo para adicionar seu cartão ao Google Pay.',
          action: {
            text: 'Adicionar ao Google Pay',
            url: saveUrl
          }
        }
      })

    } catch (walletError) {
      console.error('Erro do Google Wallet:', walletError)
      
      // Fallback caso a API falhe
      return NextResponse.json({
        success: false,
        type: 'google_pay',
        instructions: {
          title: 'Google Pay Temporariamente Indisponível',
          message: 'Tente novamente em alguns minutos ou use as opções abaixo.',
          fallback: {
            cartao_url: `${process.env.NEXT_PUBLIC_APP_URL}/cartao/${token}`,
            instrucoes: [
              '1. Adicione esta página aos favoritos',
              '2. Ou use "Adicionar à tela inicial" no Chrome',
              '3. Seu cartão ficará sempre acessível'
            ]
          }
        },
        error: walletError instanceof Error ? walletError.message : 'Erro desconhecido'
      })
    }

  } catch (error) {
    console.error('Erro ao gerar Google Pay pass:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
