import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🧪 Iniciando teste do webhook Discord de segurança...')

    // Buscar webhook da configuração
    const { data: webhookConfig, error: configError } = await supabaseClient
      .from('webhook_configs')
      .select('configuracoes')
      .eq('bar_id', 'ordinario')
      .single()

    if (configError || !webhookConfig?.configuracoes?.sistema) {
      console.error('❌ Webhook não configurado:', configError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Webhook não configurado',
          details: configError 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    const webhookUrl = webhookConfig.configuracoes.sistema
    console.log('🔗 Webhook encontrado:', webhookUrl.substring(0, 50) + '...')

    // Registrar evento de teste no banco
    const testEvent = {
      event_id: `discord_test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'critical',
      category: 'system',
      event_type: 'discord_webhook_test',
      ip_address: '203.0.113.199',
      user_agent: 'Discord-Test-Function/1.0',
      endpoint: '/functions/v1/discord-security-test',
      details: {
        test_type: 'webhook_verification',
        message: 'TESTE MANUAL DO SISTEMA DE SEGURANÇA',
        triggered_by: 'edge_function',
        timestamp: new Date().toISOString()
      },
      risk_score: 100,
      resolved: false
    }

    const { error: insertError } = await supabaseClient
      .from('security_events')
      .insert([testEvent])

    if (insertError) {
      console.error('❌ Erro ao inserir evento:', insertError)
    } else {
      console.log('✅ Evento de teste registrado no banco')
    }

    // Preparar mensagem para Discord
    const discordMessage = {
      embeds: [{
        title: '🧪 TESTE DO SISTEMA DE SEGURANÇA',
        description: `**TESTE MANUAL** - Verificando funcionamento do webhook\n\n**Se você está vendo esta mensagem, o sistema está funcionando corretamente!**`,
        color: 0xff6600, // Orange para teste
        fields: [
          {
            name: '🎯 Tipo de Teste',
            value: 'Webhook Discord - Sistema de Segurança',
            inline: true
          },
          {
            name: '⏰ Timestamp',
            value: new Date().toLocaleString('pt-BR'),
            inline: true
          },
          {
            name: '🔍 Detalhes',
            value: 'Teste manual disparado via Edge Function',
            inline: false
          },
          {
            name: '📍 Origem',
            value: 'Edge Function: `discord-security-test`',
            inline: true
          },
          {
            name: '🤖 Status',
            value: 'Sistema de monitoramento ATIVO',
            inline: true
          }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: '🧪 SGB Security Test - Sistema Funcionando'
        }
      }]
    }

    // Enviar para Discord
    console.log('📤 Enviando mensagem para Discord...')
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordMessage)
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error('❌ Erro ao enviar para Discord:', discordResponse.status, errorText)
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao enviar webhook',
          discord_status: discordResponse.status,
          discord_error: errorText
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('✅ Mensagem enviada para Discord com sucesso!')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Teste do webhook enviado com sucesso!',
        event_id: testEvent.event_id,
        timestamp: testEvent.timestamp,
        discord_status: discordResponse.status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro no teste do Discord:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        stack: errorStack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 