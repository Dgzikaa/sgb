import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface InterPixCallback {
  chave: string
  codigoSolicitacao: string
  dataHoraMovimento: string
  dataHoraSolicitacao: string
  descricaoPagamento: string
  endToEnd: string
  instituicaoDestinatario: string
  recebedor: {
    cpfCnpj: string
    nome: string
  }
  status: 'PROCESSADO' | 'REJEITADO' | 'PENDENTE'
  tipoMovimentacao: 'PAGAMENTO'
  valor: string
}

export async function POST(request: NextRequest) {
  try {
    const body: InterPixCallback = await request.json()
    
    console.log('📨 Callback PIX recebido do Inter:', {
      codigoSolicitacao: body.codigoSolicitacao,
      status: body.status,
      valor: body.valor,
      endToEnd: body.endToEnd,
      dataHoraMovimento: body.dataHoraMovimento
    })

    // Salvar callback no banco de dados
    const { data: callbackData, error: callbackError } = await supabase
      .from('inter_callbacks')
      .insert({
        codigo_solicitacao: body.codigoSolicitacao,
        end_to_end: body.endToEnd,
        status: body.status,
        valor: parseFloat(body.valor),
        descricao: body.descricaoPagamento,
        chave_pix: body.chave,
        recebedor_nome: body.recebedor.nome,
        recebedor_cpf_cnpj: body.recebedor.cpfCnpj,
        data_hora_movimento: body.dataHoraMovimento,
        data_hora_solicitacao: body.dataHoraSolicitacao,
        instituicao_destinatario: body.instituicaoDestinatario,
        tipo_movimentacao: body.tipoMovimentacao,
        payload_completo: body
      })

    if (callbackError) {
      console.error('❌ Erro ao salvar callback:', callbackError)
      // Não falhar o callback, apenas logar o erro
    } else {
      console.log('✅ Callback salvo no banco:', callbackData)
    }

    // Atualizar status na tabela pix_enviados
    console.log('🔄 Atualizando status do PIX:', body.codigoSolicitacao)
    
    const { data: updateData, error: updateError } = await supabase
      .from('pix_enviados')
      .update({ 
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('txid', body.codigoSolicitacao)
      .select()

    if (updateError) {
      console.error('❌ Erro ao atualizar status do PIX:', updateError)
    } else {
      console.log('✅ Status do PIX atualizado:', updateData)
    }

    // Enviar notificação para Discord
    try {
      await enviarNotificacaoDiscord(body)
      console.log('✅ Notificação Discord enviada')
    } catch (discordError) {
      console.error('⚠️ Erro ao enviar notificação Discord:', discordError)
      // Não falhar o callback se o Discord der erro
    }

    // Retornar 200 para confirmar recebimento
    return NextResponse.json({ 
      success: true, 
      message: 'Callback processado com sucesso',
      codigoSolicitacao: body.codigoSolicitacao
    })

  } catch (error: any) {
    console.error('❌ Erro ao processar callback PIX:', error)
    
    // Sempre retornar 200 para não fazer o Inter reenviar
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    })
  }
}

// Função para enviar notificação para Discord
async function enviarNotificacaoDiscord(callback: InterPixCallback) {
  try {
    // Buscar webhook do Discord
    const { data: credenciaisDiscord, error } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('sistema', 'banco_inter')
      .eq('ativo', true)
      .single()

    if (error || !credenciaisDiscord?.configuracoes?.webhook_url) {
      console.log('⚠️ Webhook do Discord não encontrado')
      return false
    }

    const webhookUrl = credenciaisDiscord.configuracoes.webhook_url
    
    // Definir cor baseada no status
    let color = 0xffa500 // Laranja (padrão)
    let statusEmoji = "⏳"
    let statusText = "Processando"
    
    if (callback.status === 'PROCESSADO') {
      color = 0x00ff00 // Verde
      statusEmoji = "✅"
      statusText = "Processado"
    } else if (callback.status === 'REJEITADO') {
      color = 0xff0000 // Vermelho
      statusEmoji = "❌"
      statusText = "Rejeitado"
    }

    const embed = {
      title: `${statusEmoji} PIX ${statusText} - Callback Inter`,
      color: color,
      fields: [
        {
          name: "Valor",
          value: `R$ ${parseFloat(callback.valor).toFixed(2)}`,
          inline: true
        },
        {
          name: "Status",
          value: `${statusEmoji} ${statusText}`,
          inline: true
        },
        {
          name: "Recebedor",
          value: callback.recebedor.nome,
          inline: true
        },
        {
          name: "Chave PIX",
          value: callback.chave,
          inline: true
        },
        {
          name: "End-to-End",
          value: callback.endToEnd,
          inline: true
        },
        {
          name: "Código Solicitação",
          value: callback.codigoSolicitacao,
          inline: true
        },
        {
          name: "Descrição",
          value: callback.descricaoPagamento,
          inline: false
        },
        {
          name: "Data/Hora Movimento",
          value: new Date(callback.dataHoraMovimento).toLocaleString('pt-BR'),
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "SGB - Callback Inter"
      }
    }

    const payload = {
      embeds: [embed]
    }

    console.log('📤 Enviando notificação Discord...')
    console.log('🔗 Webhook URL:', webhookUrl)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('📡 Status da resposta Discord:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro no Discord:', errorText)
      throw new Error(`Discord webhook error: ${response.status} - ${errorText}`)
    }

    console.log('✅ Notificação enviada para Discord')
    return true
  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error)
    throw error
  }
} 