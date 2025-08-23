import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

// Verificar se a chave da API está disponível
const RESEND_API_KEY = process.env.RESEND_API_KEY || 'dummy-key'
const resend = new Resend(RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    // Verificar se a API está configurada
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'dummy-key') {
      return NextResponse.json(
        { error: 'Serviço de email não configurado' },
        { status: 503 }
      )
    }

    const { to, memberName, cardUrl, inviteCode } = await request.json()

    // Validações
    if (!to || !memberName || !cardUrl) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: to, memberName, cardUrl' },
        { status: 400 }
      )
    }

    // SEGURANÇA: Verificar se é um email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bem-vindo ao VIP - ZYKOR</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 20px; text-align: center; color: white; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .subtitle { font-size: 16px; opacity: 0.9; }
        .content { padding: 30px; }
        .welcome-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin-bottom: 20px; }
        .card-button { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; margin: 20px 0; }
        .benefits { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .benefit-item { margin: 8px 0; color: #92400e; }
        .invite-code { background: #1f2937; color: #fbbf24; padding: 15px; border-radius: 8px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🍻 ZYKOR</div>
            <div class="subtitle">Ordinário Bar e Música</div>
        </div>
        
        <div class="content">
            <div class="welcome-badge">🎉 Bem-vindo ao VIP</div>
            
            <h1 style="color: #1f2937; margin-bottom: 20px;">Olá, ${memberName}!</h1>
            
            <p style="color: #4b5563; line-height: 1.6;">
                Parabéns! Você agora faz parte do seleto grupo VIP do Ordinário Bar. Prepare-se para uma experiência única!
            </p>
            
            ${inviteCode ? `
            <div style="text-align: center;">
                <p style="color: #4b5563; margin-bottom: 10px;"><strong>Seu código de convite exclusivo:</strong></p>
                <div class="invite-code">${inviteCode}</div>
                <p style="color: #6b7280; font-size: 14px;">Compartilhe com moderação - apenas 100 vagas disponíveis!</p>
            </div>
            ` : ''}
            
            <div class="benefits">
                <h3 style="color: #92400e; margin-top: 0;">🎁 Seus Benefícios VIP:</h3>
                <div class="benefit-item">💰 R$ 150,00 em créditos mensais</div>
                <div class="benefit-item">👑 Entrada VIP sem fila</div>
                <div class="benefit-item">🍹 Drink especial exclusivo todo mês</div>
                <div class="benefit-item">🎪 Convites para eventos privados</div>
                <div class="benefit-item">🎵 Acesso a shows e eventos especiais</div>
                <div class="benefit-item">📱 Cartão digital na sua wallet</div>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6;">
                Seu cartão de fidelidade VIP está pronto! Acesse pelo link abaixo e adicione à sua wallet:
            </p>
            
            <div style="text-align: center;">
                <a href="${cardUrl}" class="card-button">
                    📱 Acessar Meu Cartão VIP
                </a>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1e40af; margin-top: 0;">📍 Como usar seu cartão:</h4>
                <ol style="color: #1e3a8a; line-height: 1.6;">
                    <li>Acesse o link do cartão no seu celular</li>
                    <li>Adicione à sua Apple Wallet ou Google Pay</li>
                    <li>Na hora de pagar no bar, mostre o QR Code</li>
                    <li>O garçom escaneará e aplicará o desconto</li>
                </ol>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                💡 <strong>Dica:</strong> Salve o link nos favoritos do seu celular para acesso rápido!
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Horários do Ordinário Bar:</strong></p>
            <p>Seg-Dom: 18h às 02h | Shows especiais aos finais de semana</p>
            <p>📍 [Endereço do Bar] | 📱 [Telefone] | 📧 contato@zykor.com.br</p>
            <br>
            <p style="color: #9ca3af;">Este é um email automático do programa de fidelidade VIP.</p>
        </div>
    </div>
</body>
</html>
    `

    const result = await resend.emails.send({
      from: 'ZYKOR VIP <vip@zykor.com.br>',
      to: [to],
      subject: '🎉 Bem-vindo ao VIP! Seu cartão está pronto',
      html: htmlContent
    })

    console.log('📧 Email de boas-vindas enviado:', result)

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
      message: 'Email de boas-vindas enviado'
    })

  } catch (error) {
    console.error('🚨 Erro ao enviar email de boas-vindas:', error)
    
    return NextResponse.json(
      { error: 'Erro ao enviar email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
