import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PKPass } from 'passkit-generator'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Gerar arquivo .pkpass para Apple Wallet
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params

    // Buscar dados do membro
    const { data: membro, error } = await supabase
      .from('fidelidade_membros')
      .select(`
        id,
        nome,
        email,
        qr_code_token,
        plano,
        bar_id,
        bars!inner(id, nome)
      `)
      .eq('qr_code_token', token)
      .eq('status', 'ativo')
      .single()

    if (error || !membro) {
      return NextResponse.json(
        { error: 'Cartão não encontrado' },
        { status: 404 }
      )
    }

    // Buscar saldo atual
    const { data: saldo } = await supabase
      .from('fidelidade_saldos')
      .select('saldo_atual')
      .eq('membro_id', membro.id)
      .single()

    try {
      // Verificar se variáveis de ambiente dos certificados existem
      if (!process.env.APPLE_PASS_CERT || !process.env.APPLE_PASS_KEY || !process.env.APPLE_WWDR_CERT) {
        throw new Error('Certificados Apple Wallet não configurados nas variáveis de ambiente')
      }

      // Decodificar certificados base64
      const signerCert = Buffer.from(process.env.APPLE_PASS_CERT, 'base64')
      const signerKey = Buffer.from(process.env.APPLE_PASS_KEY, 'base64') 
      const wwdrCert = Buffer.from(process.env.APPLE_WWDR_CERT, 'base64')

      // Criar o pass
      const pass = await PKPass.from({
        model: path.join(process.cwd(), 'apple-wallet-template'),
        certificates: {
          wwdr: wwdrCert,
          signerCert: signerCert,
          signerKey: signerKey,
          signerKeyPassphrase: process.env.APPLE_PASS_CERT_PASSWORD || ''
        }
      }, {
        // Dados do pass
        serialNumber: membro.qr_code_token,
        description: `Cartão de Fidelidade - ${membro.bars.nome}`,
        organizationName: membro.bars.nome,
        teamIdentifier: process.env.APPLE_TEAM_ID!,
        passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
        
        // Cores (formato Apple)
        backgroundColor: 'rgb(234, 88, 12)', // Orange-600
        foregroundColor: 'rgb(255, 255, 255)',
        labelColor: 'rgb(254, 215, 170)', // Orange-200
        
        // Código de barras
        barcodes: [{
          format: 'PKBarcodeFormatQR',
          message: `${process.env.NEXT_PUBLIC_APP_URL}/cartao/${token}`,
          messageEncoding: 'iso-8859-1'
        }],

        // Estrutura do cartão
        storeCard: {
          primaryFields: [{
            key: 'balance',
            label: 'SALDO DISPONÍVEL',
            value: `R$ ${(saldo?.saldo_atual || 0).toFixed(2)}`
          }],
          secondaryFields: [
            {
              key: 'name',
              label: 'MEMBRO',
              value: membro.nome
            },
            {
              key: 'tier',
              label: 'PLANO',
              value: membro.plano.toUpperCase()
            }
          ],
          auxiliaryFields: [{
            key: 'location',
            label: 'ESTABELECIMENTO',
            value: membro.bars.nome
          }],
          backFields: [
            {
              key: 'terms',
              label: 'COMO USAR',
              value: 'Mostre este cartão no estabelecimento para acumular pontos e resgatar benefícios.'
            },
            {
              key: 'contact',
              label: 'CONTATO',
              value: 'Para dúvidas, entre em contato através do nosso sistema.'
            }
          ]
        },

        // Web service para atualizações
        webServiceURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/wallet/updates`,
        authenticationToken: membro.qr_code_token,

        // Localizações relevantes
        locations: [{
          latitude: -15.7942,
          longitude: -47.8821,
          relevantText: `Use seu cartão no ${membro.bars.nome}`
        }]
      })

      // Gerar o buffer do .pkpass
      const buffer = pass.getAsBuffer()

      // Retornar o arquivo .pkpass para abrir diretamente na Wallet
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.pkpass',
          'Content-Disposition': `inline; filename="${membro.bars?.nome?.replace(/\s+/g, '_') || 'Ordinario'}_Fidelidade.pkpass"`
        }
      })

    } catch (passError) {
      console.error('🚨 Erro ao gerar .pkpass:', passError)
      
      // Em caso de erro, retornar status 503 sem JSON visível
      return new NextResponse('Apple Wallet temporariamente indisponível', {
        status: 503,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }

  } catch (error) {
    console.error('🚨 Erro ao gerar Apple Wallet pass:', error)
    return new NextResponse('Serviço temporariamente indisponível', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
}
