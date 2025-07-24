import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getInterAccessToken } from '@/lib/inter/getAccessToken'
import { getInterCredentials } from '@/lib/api-credentials'
import { getUserAuth } from '@/lib/auth-helper'
import { sendDiscordAlert } from '@/lib/discord/sendDiscordAlert'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔔 Webhook Inter recebido:', JSON.stringify(body, null, 2))

    // Verificar se é um evento válido
    if (!body.evento || !body.data) {
      return NextResponse.json({ error: 'Evento inválido' }, { status: 400 })
    }

    // Obter dados do usuário autenticado
    const userAuth = await getUserAuth(request)
    if (!userAuth) {
      console.error('❌ Usuário não autenticado')
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    console.log('👤 Usuário autenticado:', userAuth.nome, 'Bar ID:', userAuth.bar_id)

    // Obter credenciais do Inter para o bar específico
    const credentials = await getInterCredentials(userAuth.bar_id.toString())
    if (!credentials) {
      console.error('❌ Credenciais do Inter não encontradas para o bar:', userAuth.bar_id)
      return NextResponse.json({ error: 'Credenciais não configuradas' }, { status: 500 })
    }

    // Obter token de acesso
    const accessToken = await getInterAccessToken()
    if (!accessToken) {
      console.error('❌ Falha ao obter token de acesso')
      return NextResponse.json({ error: 'Falha na autenticação' }, { status: 500 })
    }

    // Processar diferentes tipos de eventos
    switch (body.evento) {
      case 'PIX_RECEBIDO':
        await processarPixRecebido(body.data, accessToken, userAuth.bar_id)
        break
      
      case 'PIX_ENVIADO':
        await processarPixEnviado(body.data, accessToken, userAuth.bar_id)
        break
      
      case 'BOLETO_VENCIDO':
        await processarBoletoVencido(body.data, accessToken, userAuth.bar_id)
        break
      
      case 'BOLETO_PAGO':
        await processarBoletoPago(body.data, accessToken, userAuth.bar_id)
        break
      
      default:
        console.log(`ℹ️ Evento não processado: ${body.evento}`)
    }

    // Salvar log do webhook
    await salvarLogWebhook(body, userAuth.bar_id)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro no webhook Inter:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

async function processarPixRecebido(data: any, accessToken: string, barId: number) {
  console.log('💰 Processando PIX recebido:', data)
  
  // Salvar no banco de dados
  const { error } = await supabase
    .from('pix_recebidos')
    .insert({
      txid: data.txid,
      valor: data.valor,
      pagador: data.pagador,
      data_recebimento: new Date().toISOString(),
      status: 'recebido',
      bar_id: barId
    })

  if (error) {
    console.error('❌ Erro ao salvar PIX:', error)
  }

  // Enviar notificação para Discord
  try {
    const valor = parseFloat(data.valor) || 0
    const pagadorNome = data.pagador?.nome || 'Desconhecido'
    
    const mensagem = `💰 **PIX RECEBIDO**\n\n` +
      `**Valor:** R$ ${valor.toFixed(2)}\n` +
      `**Pagador:** ${pagadorNome}\n` +
      `**TXID:** \`${data.txid}\`\n` +
      `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
      `**Bar ID:** ${barId}`

    await sendDiscordAlert(mensagem, barId)
  } catch (discordError) {
    console.error('❌ Erro ao enviar notificação Discord:', discordError)
  }

  // Salvar notificação no sistema
  try {
    await supabase
      .from('notificacoes_sistema')
      .insert({
        tipo: 'pix_recebido',
        titulo: 'PIX Recebido',
        mensagem: `PIX de R$ ${(parseFloat(data.valor) || 0).toFixed(2)} recebido de ${data.pagador?.nome || 'Desconhecido'}`,
        dados: data,
        bar_id: barId,
        lida: false,
        data_criacao: new Date().toISOString()
      })
  } catch (notifError) {
    console.error('❌ Erro ao salvar notificação do sistema:', notifError)
  }
}

async function processarPixEnviado(data: any, accessToken: string, barId: number) {
  console.log('💸 Processando PIX enviado:', data)
  
  const { error } = await supabase
    .from('pix_enviados')
    .insert({
      txid: data.txid,
      valor: data.valor,
      beneficiario: data.beneficiario,
      data_envio: new Date().toISOString(),
      status: 'enviado',
      bar_id: barId
    })

  if (error) {
    console.error('❌ Erro ao salvar PIX enviado:', error)
  }

  // Enviar notificação para Discord
  try {
    const valor = parseFloat(data.valor) || 0
    const beneficiarioNome = data.beneficiario?.nome || 'Desconhecido'
    
    const mensagem = `💸 **PIX ENVIADO**\n\n` +
      `**Valor:** R$ ${valor.toFixed(2)}\n` +
      `**Beneficiário:** ${beneficiarioNome}\n` +
      `**TXID:** \`${data.txid}\`\n` +
      `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
      `**Bar ID:** ${barId}`

    await sendDiscordAlert(mensagem, barId)
  } catch (discordError) {
    console.error('❌ Erro ao enviar notificação Discord:', discordError)
  }

  // Salvar notificação no sistema
  try {
    await supabase
      .from('notificacoes_sistema')
      .insert({
        tipo: 'pix_enviado',
        titulo: 'PIX Enviado',
        mensagem: `PIX de R$ ${(parseFloat(data.valor) || 0).toFixed(2)} enviado para ${data.beneficiario?.nome || 'Desconhecido'}`,
        dados: data,
        bar_id: barId,
        lida: false,
        data_criacao: new Date().toISOString()
      })
  } catch (notifError) {
    console.error('❌ Erro ao salvar notificação do sistema:', notifError)
  }
}

async function processarBoletoVencido(data: any, accessToken: string, barId: number) {
  console.log('📅 Processando boleto vencido:', data)
  
  const { error } = await supabase
    .from('boletos')
    .update({ status: 'vencido' })
    .eq('nosso_numero', data.nossoNumero)
    .eq('bar_id', barId)

  if (error) {
    console.error('❌ Erro ao atualizar boleto:', error)
  }

  // Enviar notificação para Discord
  try {
    const valor = parseFloat(data.valor) || 0
    
    const mensagem = `📅 **BOLETO VENCIDO**\n\n` +
      `**Nosso Número:** \`${data.nossoNumero}\`\n` +
      `**Valor:** R$ ${valor.toFixed(2)}\n` +
      `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
      `**Bar ID:** ${barId}`

    await sendDiscordAlert(mensagem, barId)
  } catch (discordError) {
    console.error('❌ Erro ao enviar notificação Discord:', discordError)
  }

  // Salvar notificação no sistema
  try {
    await supabase
      .from('notificacoes_sistema')
      .insert({
        tipo: 'boleto_vencido',
        titulo: 'Boleto Vencido',
        mensagem: `Boleto ${data.nossoNumero} vencido - R$ ${(parseFloat(data.valor) || 0).toFixed(2)}`,
        dados: data,
        bar_id: barId,
        lida: false,
        data_criacao: new Date().toISOString()
      })
  } catch (notifError) {
    console.error('❌ Erro ao salvar notificação do sistema:', notifError)
  }
}

async function processarBoletoPago(data: any, accessToken: string, barId: number) {
  console.log('✅ Processando boleto pago:', data)
  
  const { error } = await supabase
    .from('boletos')
    .update({ 
      status: 'pago',
      data_pagamento: new Date().toISOString(),
      valor_pago: data.valorPago
    })
    .eq('nosso_numero', data.nossoNumero)
    .eq('bar_id', barId)

  if (error) {
    console.error('❌ Erro ao atualizar boleto pago:', error)
  }

  // Enviar notificação para Discord
  try {
    const valorPago = parseFloat(data.valorPago) || 0
    
    const mensagem = `✅ **BOLETO PAGO**\n\n` +
      `**Nosso Número:** \`${data.nossoNumero}\`\n` +
      `**Valor Pago:** R$ ${valorPago.toFixed(2)}\n` +
      `**Data:** ${new Date().toLocaleString('pt-BR')}\n` +
      `**Bar ID:** ${barId}`

    await sendDiscordAlert(mensagem, barId)
  } catch (discordError) {
    console.error('❌ Erro ao enviar notificação Discord:', discordError)
  }

  // Salvar notificação no sistema
  try {
    await supabase
      .from('notificacoes_sistema')
      .insert({
        tipo: 'boleto_pago',
        titulo: 'Boleto Pago',
        mensagem: `Boleto ${data.nossoNumero} pago - R$ ${(parseFloat(data.valorPago) || 0).toFixed(2)}`,
        dados: data,
        bar_id: barId,
        lida: false,
        data_criacao: new Date().toISOString()
      })
  } catch (notifError) {
    console.error('❌ Erro ao salvar notificação do sistema:', notifError)
  }
}

async function salvarLogWebhook(body: any, barId: number) {
  const { error } = await supabase
    .from('webhook_logs')
    .insert({
      provider: 'inter',
      evento: body.evento,
      dados: body,
      data_recebimento: new Date().toISOString(),
      bar_id: barId
    })

  if (error) {
    console.error('❌ Erro ao salvar log:', error)
  }
} 