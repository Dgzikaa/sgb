import { NextRequest, NextResponse } from 'next/server'
import { getPluggyClient } from '@/lib/pluggy-client'

/**
 * POST /api/fp/pluggy/webhook/register
 * Registra o webhook no Pluggy para receber notificações automáticas
 * Ref: https://docs.pluggy.ai/reference/webhooks-create
 * 
 * IMPORTANTE: Este endpoint deve ser chamado APENAS UMA VEZ para configurar o webhook
 * Depois disso, o Pluggy enviará notificações automaticamente para nossa URL
 */
export async function POST(request: NextRequest) {
  try {
    const pluggyClient = getPluggyClient()
    
    // URL do nosso webhook (production)
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/fp/pluggy/webhook`
      : 'https://zykor.vercel.app/api/fp/pluggy/webhook'

    console.log('📝 Registrando webhook no Pluggy:', webhookUrl)

    // Criar webhook no Pluggy
    // @ts-ignore
    const webhook = await pluggyClient.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url: webhookUrl,
        event: 'all', // Receber todos os eventos
      })
    })

    console.log('✅ Webhook registrado com sucesso:', webhook.id)

    return NextResponse.json({
      success: true,
      message: 'Webhook registrado com sucesso no Pluggy!',
      data: {
        id: webhook.id,
        url: webhook.url,
        event: webhook.event,
        createdAt: webhook.createdAt
      }
    })
  } catch (error: any) {
    console.error('❌ Erro ao registrar webhook:', error)

    // Se já existe, retornar sucesso
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      return NextResponse.json({
        success: true,
        message: 'Webhook já está registrado no Pluggy'
      })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao registrar webhook'
    }, { status: 500 })
  }
}

/**
 * GET /api/fp/pluggy/webhook/register
 * Lista webhooks registrados no Pluggy
 */
export async function GET(request: NextRequest) {
  try {
    const pluggyClient = getPluggyClient()
    
    // @ts-ignore
    const webhooks = await pluggyClient.request('/webhooks', {
      method: 'GET'
    })

    return NextResponse.json({
      success: true,
      data: webhooks.results || []
    })
  } catch (error: any) {
    console.error('❌ Erro ao listar webhooks:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * DELETE /api/fp/pluggy/webhook/register
 * Remove um webhook registrado no Pluggy
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get('id')

    if (!webhookId) {
      return NextResponse.json({
        success: false,
        error: 'ID do webhook é obrigatório'
      }, { status: 400 })
    }

    const pluggyClient = getPluggyClient()
    
    // @ts-ignore
    await pluggyClient.request(`/webhooks/${webhookId}`, {
      method: 'DELETE'
    })

    console.log('✅ Webhook removido:', webhookId)

    return NextResponse.json({
      success: true,
      message: 'Webhook removido com sucesso'
    })
  } catch (error: any) {
    console.error('❌ Erro ao remover webhook:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
