import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDiscordAlert } from '@/lib/discord/sendDiscordAlert'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface InterWebhookPayload {
  codigoSolicitacao: string
  status: 'APROVADO' | 'REJEITADO' | 'CANCELADO'
  dataHora: string
  valor?: number
  descricao?: string
  destinatario?: {
    nome?: string
    chave?: string
  }
  motivoRejeicao?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: InterWebhookPayload = await request.json()
    const { codigoSolicitacao, status, dataHora, valor, descricao, destinatario, motivoRejeicao } = body

    console.log('🔔 Webhook Inter recebido:', {
      codigoSolicitacao,
      status,
      dataHora,
      valor,
      descricao,
      destinatario
    })

    // Validar dados obrigatórios
    if (!codigoSolicitacao || !status || !dataHora) {
      console.error('❌ Dados obrigatórios ausentes no webhook')
      return NextResponse.json({ error: 'Dados obrigatórios ausentes' }, { status: 400 })
    }

    // Buscar pagamento pelo código de solicitação
    const { data: pagamentos, error: searchError } = await supabase
      .from('pagamentos_agendamento')
      .select('*')
      .eq('inter_aprovacao_id', codigoSolicitacao)

    if (searchError) {
      console.error('❌ Erro ao buscar pagamento:', searchError)
      return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 })
    }

    if (!pagamentos || pagamentos.length === 0) {
      console.warn('⚠️ Pagamento não encontrado para código:', codigoSolicitacao)
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    const pagamento = pagamentos[0]
    console.log('📋 Pagamento encontrado:', pagamento)

    // Atualizar status do pagamento baseado na resposta do Inter
    let novoStatus: string
    let mensagemDiscord: string

    switch (status) {
      case 'APROVADO':
        novoStatus = 'aprovado'
        mensagemDiscord = `✅ **Pagamento PIX APROVADO!**
        
**Detalhes:**
• Código: \`${codigoSolicitacao}\`
• Beneficiário: ${destinatario?.nome || pagamento.nome_beneficiario}
• Valor: R$ ${valor?.toFixed(2) || pagamento.valor}
• Data/Hora: ${new Date(dataHora).toLocaleString('pt-BR')}
• Descrição: ${descricao || pagamento.descricao}

🎉 Pagamento foi aprovado pelo gestor e será processado!`
        break

      case 'REJEITADO':
        novoStatus = 'erro'
        mensagemDiscord = `❌ **Pagamento PIX REJEITADO!**
        
**Detalhes:**
• Código: \`${codigoSolicitacao}\`
• Beneficiário: ${destinatario?.nome || pagamento.nome_beneficiario}
• Valor: R$ ${valor?.toFixed(2) || pagamento.valor}
• Data/Hora: ${new Date(dataHora).toLocaleString('pt-BR')}
• Motivo: ${motivoRejeicao || 'Não informado'}

⚠️ Pagamento foi rejeitado pelo gestor.`
        break

      case 'CANCELADO':
        novoStatus = 'erro'
        mensagemDiscord = `🚫 **Pagamento PIX CANCELADO!**
        
**Detalhes:**
• Código: \`${codigoSolicitacao}\`
• Beneficiário: ${destinatario?.nome || pagamento.nome_beneficiario}
• Valor: R$ ${valor?.toFixed(2) || pagamento.valor}
• Data/Hora: ${new Date(dataHora).toLocaleString('pt-BR')}

🚫 Pagamento foi cancelado.`
        break

      default:
        console.warn('⚠️ Status desconhecido:', status)
        return NextResponse.json({ error: 'Status desconhecido' }, { status: 400 })
    }

    // Atualizar pagamento no banco
    const { error: updateError } = await supabase
      .from('pagamentos_agendamento')
      .update({
        status: novoStatus,
        updated_at: new Date().toISOString()
      })
      .eq('inter_aprovacao_id', codigoSolicitacao)

    if (updateError) {
      console.error('❌ Erro ao atualizar pagamento:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar pagamento' }, { status: 500 })
    }

    console.log('✅ Pagamento atualizado com sucesso:', { codigoSolicitacao, novoStatus })

    // Enviar notificação para Discord
    try {
      await sendDiscordAlert(mensagemDiscord, pagamento.bar_id)
      console.log('✅ Notificação enviada para Discord')
    } catch (discordError) {
      console.error('❌ Erro ao enviar notificação Discord:', discordError)
      // Não falhar o webhook por erro no Discord
    }

    // Criar notificação no sistema
    try {
      const { error: notificationError } = await supabase
        .from('notificacoes_sistema')
        .insert({
          bar_id: pagamento.bar_id,
          tipo: 'pagamento_inter',
          titulo: `Pagamento PIX ${status.toLowerCase()}`,
          mensagem: mensagemDiscord.replace(/\*\*/g, '').replace(/`/g, ''),
          dados: {
            codigo_solicitacao: codigoSolicitacao,
            status: status,
            valor: valor || pagamento.valor,
            beneficiario: destinatario?.nome || pagamento.nome_beneficiario,
            data_hora: dataHora
          },
          lida: false,
          created_at: new Date().toISOString()
        })

      if (notificationError) {
        console.error('❌ Erro ao criar notificação:', notificationError)
      } else {
        console.log('✅ Notificação criada no sistema')
      }
    } catch (notificationError) {
      console.error('❌ Erro ao criar notificação:', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: `Pagamento ${status.toLowerCase()} com sucesso`,
      codigoSolicitacao,
      status: novoStatus
    })

  } catch (error) {
    console.error('❌ Erro no webhook Inter:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET para verificar se o webhook está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Inter Banking está funcionando',
    timestamp: new Date().toISOString()
  })
} 