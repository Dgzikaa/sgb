import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

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

    const { nome, email, telefone, empresa, mensagem } = await request.json()

    // Validações
    if (!nome || !email || !mensagem) {
      return NextResponse.json(
        { error: 'Nome, email e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // SEGURANÇA: Verificar se é um email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
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
    <title>Novo Contato - ZYKOR</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 20px; text-align: center; color: white; }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
        .subtitle { font-size: 16px; opacity: 0.9; }
        .content { padding: 30px; }
        .contact-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin-bottom: 20px; }
        .contact-info { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .field { margin: 12px 0; }
        .field-label { font-weight: 600; color: #374151; }
        .field-value { color: #6b7280; margin-top: 4px; }
        .message-box { background: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        .priority { background: #fef3c7; color: #92400e; padding: 12px; border-radius: 8px; margin: 20px 0; text-align: center; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 ZYKOR</div>
            <div class="subtitle">Sistema de Gestão</div>
        </div>
        
        <div class="content">
            <div class="contact-badge">📩 Novo Contato</div>
            
            <h1 style="color: #1f2937; margin-bottom: 20px;">Solicitação de Contato</h1>
            
            <p style="color: #4b5563; line-height: 1.6;">
                Nova solicitação de contato recebida através do site ZYKOR.
            </p>
            
            <div class="priority">
                ⭐ PRIORIDADE: Responder em até 24 horas
            </div>
            
            <div class="contact-info">
                <h3 style="color: #1f2937; margin-top: 0;">Dados do Interessado:</h3>
                
                <div class="field">
                    <div class="field-label">👤 Nome:</div>
                    <div class="field-value">${nome}</div>
                </div>
                
                <div class="field">
                    <div class="field-label">📧 Email:</div>
                    <div class="field-value"><a href="mailto:${email}" style="color: #3b82f6;">${email}</a></div>
                </div>
                
                ${telefone ? `
                <div class="field">
                    <div class="field-label">📱 Telefone:</div>
                    <div class="field-value"><a href="tel:${telefone}" style="color: #3b82f6;">${telefone}</a></div>
                </div>
                ` : ''}
                
                ${empresa ? `
                <div class="field">
                    <div class="field-label">🏪 Estabelecimento:</div>
                    <div class="field-value">${empresa}</div>
                </div>
                ` : ''}
            </div>
            
            <div class="message-box">
                <h4 style="color: #1e40af; margin-top: 0;">💬 Mensagem:</h4>
                <p style="color: #1e3a8a; line-height: 1.6; margin: 0;">
                    ${mensagem}
                </p>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #0369a1; margin-top: 0;">📋 Próximos Passos:</h4>
                <ol style="color: #0c4a6e; line-height: 1.6; margin: 0;">
                    <li>Responder o email em até 24h</li>
                    <li>Agendar uma demonstração se necessário</li>
                    <li>Enviar proposta personalizada</li>
                    <li>Acompanhar o lead no CRM</li>
                </ol>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                🕐 <strong>Recebido em:</strong> ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            </p>
        </div>
        
        <div class="footer">
            <p><strong>ZYKOR - Sistema de Gestão</strong></p>
            <p>Este é um email automático de contato do site. Responda diretamente ao interessado.</p>
        </div>
    </div>
</body>
</html>
    `

    // Enviar email para você
    const result = await resend.emails.send({
      from: 'ZYKOR Contato <contato@zykor.com.br>',
      to: ['rodrigo.zykor@gmail.com'],
      subject: `🚀 Novo Contato ZYKOR: ${nome} ${empresa ? `(${empresa})` : ''}`,
      html: htmlContent,
      replyTo: email
    })

    console.log('📧 Email de contato enviado:', result)

    // Enviar email de confirmação para o cliente
    const confirmationHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Contato Recebido - ZYKOR</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 40px 20px; text-align: center; color: white; }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
        .content { padding: 30px; }
        .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin-bottom: 20px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 ZYKOR</div>
            <div style="font-size: 16px; opacity: 0.9;">Sistema de Gestão</div>
        </div>
        
        <div class="content">
            <div class="success-badge">✅ Mensagem Recebida</div>
            
            <h1 style="color: #1f2937; margin-bottom: 20px;">Olá, ${nome}!</h1>
            
            <p style="color: #4b5563; line-height: 1.6;">
                Obrigado por entrar em contato conosco! Recebemos sua mensagem e nossa equipe entrará em contato em até <strong>24 horas</strong>.
            </p>
            
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #92400e; margin-top: 0;">🎯 O que acontece agora?</h3>
                <ul style="color: #92400e; line-height: 1.6;">
                    <li>Nossa equipe analisará sua solicitação</li>
                    <li>Entraremos em contato para entender melhor suas necessidades</li>
                    <li>Agendaremos uma demonstração personalizada do ZYKOR</li>
                    <li>Criaremos uma proposta específica para seu estabelecimento</li>
                </ul>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1e40af; margin-top: 0;">📱 Enquanto isso, que tal conhecer nosso sistema de fidelidade?</h4>
                <p style="color: #1e3a8a; line-height: 1.6;">
                    Visite <a href="https://zykor.com.br/fidelidade" style="color: #3b82f6;">zykor.com.br/fidelidade</a> e veja como funciona nosso programa VIP digital!
                </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
                Se tiver alguma dúvida urgente, pode responder este email diretamente.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>ZYKOR - Revolucionando a Gestão de Bares</strong></p>
            <p>📧 contato@zykor.com.br | 🌐 zykor.com.br</p>
        </div>
    </div>
</body>
</html>
    `

    // Enviar confirmação para o cliente
    await resend.emails.send({
      from: 'ZYKOR <contato@zykor.com.br>',
      to: [email],
      subject: '✅ Contato Recebido - ZYKOR entrará em contato em breve!',
      html: confirmationHtml
    })

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso'
    })

  } catch (error) {
    console.error('🚨 Erro ao enviar contato:', error)
    
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem. Tente novamente.' },
      { status: 500 }
    )
  }
}
