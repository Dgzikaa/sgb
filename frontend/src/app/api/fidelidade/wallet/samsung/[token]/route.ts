import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Gerar Samsung Wallet Pass
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

    // Samsung Wallet usa formato próprio
    const samsungWalletPass = {
      // Metadados do pass
      passTypeIdentifier: "pass.br.com.zykor.fidelidade.samsung",
      formatVersion: 1,
      teamIdentifier: process.env.SAMSUNG_TEAM_ID || "SAMSUNG_TEAM",
      organizationName: "Ordinário Bar e Música",
      description: "Cartão de Fidelidade Digital",
      
      // Visual
      backgroundColor: "rgb(234, 88, 12)", // Laranja Ordinário
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(254, 215, 170)",
      logoText: "Ordinário",
      
      // Dados principais
      membershipCard: {
        primaryFields: [{
          key: "balance",
          label: "SALDO DISPONÍVEL",
          value: `R$ ${cartaoData.saldo.toFixed(2)}`
        }],
        
        secondaryFields: [{
          key: "member_name",
          label: "MEMBRO",
          value: cartaoData.membro.nome
        }, {
          key: "plan",
          label: "PLANO",
          value: cartaoData.membro.plano.toUpperCase()
        }],
        
        auxiliaryFields: [{
          key: "establishment",
          label: "ESTABELECIMENTO",
          value: "Ordinário Bar e Música"
        }, {
          key: "next_charge",
          label: "PRÓXIMA COBRANÇA",
          value: cartaoData.membro.proxima_cobranca ? 
            new Date(cartaoData.membro.proxima_cobranca).toLocaleDateString('pt-BR') : 
            'N/A'
        }]
      },
      
      // QR Code
      barcode: {
        message: cartaoData.qr_code_url,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1"
      },
      
      // Informações adicionais
      relevantDate: cartaoData.membro.proxima_cobranca,
      
      // Links e contatos
      associatedStoreIdentifiers: [],
      webServiceURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/`,
      
      // Dados únicos
      authenticationToken: token,
      serialNumber: cartaoData.membro.id
    }

    // Por enquanto, Samsung Pay também está em desenvolvimento
    return NextResponse.json({
      success: true,
      type: 'samsung_wallet',
      instructions: {
        title: 'Samsung Wallet em Desenvolvimento',
        message: 'A integração com Samsung Wallet está sendo finalizada.',
        fallback: {
          cartao_url: `${process.env.NEXT_PUBLIC_APP_URL}/cartao/${token}`,
          instrucoes: [
            '1. Use Samsung Internet para melhor experiência',
            '2. Adicione à tela inicial via menu (⋮)',
            '3. Selecione "Adicionar página à tela inicial"',
            '4. Seu cartão ficará como um app Samsung'
          ]
        }
      },
      samsung_wallet_object: samsungWalletPass // Para debug/desenvolvimento
    })

  } catch (error) {
    console.error('Erro ao gerar Samsung Wallet pass:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
