import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// POST - Enviar QR Code do membro via WhatsApp
export async function POST(request: NextRequest) {
  try {
    const { membro_id, telefone, tipo = 'cartao' } = await request.json()

    // Validações básicas
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
        telefone,
        status,
        plano,
        qr_code_token,
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

    // Usar telefone do parâmetro ou do membro
    const telefoneDestino = telefone || membro.telefone

    if (!telefoneDestino) {
      return NextResponse.json(
        { error: 'Telefone é obrigatório' },
        { status: 400 }
      )
    }

    // Limpar telefone (remover caracteres especiais)
    const telefoneLimpo = telefoneDestino.replace(/[^0-9]/g, '')

    // URLs para diferentes tipos de envio
    const urls = {
      cartao: `${process.env.NEXT_PUBLIC_APP_URL}/cartao/${membro.qr_code_token}`,
      qrcode_direto: `${process.env.NEXT_PUBLIC_APP_URL}/api/fidelidade/qrcode/${membro.qr_code_token}`,
    }

    const urlCartao = urls[tipo as keyof typeof urls] || urls.cartao

    // Mensagem personalizada
    const mensagem = `🎉 *Seu Cartão VIP está pronto!*

Olá ${membro.nome}! 👋

Seu cartão de fidelidade do *${membro.bars.nome}* está ativo e pronto para usar!

🎯 *Como usar:*
• Acesse o link abaixo
• Mostre o QR Code no estabelecimento
• Acumule pontos e ganhe benefícios

🔗 *Seu cartão digital:*
${urlCartao}

💡 *Dica:* Adicione à sua carteira digital para acesso mais rápido!

---
💳 Plano: ${membro.plano}
🏪 ${membro.bars.nome}
📱 ZYKOR - Sistema de Fidelidade`

    // URL do WhatsApp com a mensagem
    const whatsappUrl = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`

    // Registrar envio no banco (opcional - para histórico)
    try {
      await supabase
        .from('fidelidade_envios_whatsapp')
        .insert({
          membro_id: membro.id,
          telefone: telefoneDestino,
          tipo,
          mensagem,
          whatsapp_url: whatsappUrl,
          status: 'enviado',
          data_envio: new Date().toISOString()
        })
    } catch (logError) {
      console.warn('Erro ao registrar envio no banco:', logError)
      // Não interrompe o fluxo se falhar o log
    }

    return NextResponse.json({
      success: true,
      membro: {
        nome: membro.nome,
        telefone: telefoneDestino,
        bar: membro.bars.nome
      },
      whatsapp: {
        url: whatsappUrl,
        mensagem,
        cartao_url: urlCartao
      },
      message: 'Link do WhatsApp gerado com sucesso'
    })

  } catch (error) {
    console.error('🚨 Erro ao gerar link WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar envios recentes (opcional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const membro_id = searchParams.get('membro_id')

    if (!membro_id) {
      return NextResponse.json(
        { error: 'ID do membro é obrigatório' },
        { status: 400 }
      )
    }

    const { data: envios, error } = await supabase
      .from('fidelidade_envios_whatsapp')
      .select('*')
      .eq('membro_id', membro_id)
      .order('data_envio', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      envios: envios || []
    })

  } catch (error) {
    console.error('🚨 Erro ao listar envios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
