import { NextResponse } from 'next/server'
import { JWT } from 'google-auth-library'

export const dynamic = 'force-dynamic'

// GET - Testar configuração do Google Wallet
export async function GET() {
  try {
    // Verificar se as env vars estão configuradas
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
    
    if (!serviceAccountKey || !issuerId) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables em falta',
        missing: {
          serviceAccount: !serviceAccountKey,
          issuerId: !issuerId
        }
      })
    }

    // Testar decodificação da service account
    let serviceAccount
    try {
      const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
      serviceAccount = JSON.parse(decoded)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao decodificar service account key'
      })
    }

    // Testar criação do JWT Client
    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
    })

    // Testar autorização
    await jwtClient.authorize()
    
    return NextResponse.json({
      success: true,
      message: 'Google Wallet configurado com sucesso!',
      issuer_id: issuerId,
      service_account_email: serviceAccount.client_email,
      has_access_token: !!jwtClient.credentials.access_token
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro na configuração',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
