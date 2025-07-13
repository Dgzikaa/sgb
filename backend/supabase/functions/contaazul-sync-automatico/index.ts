import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logBrasiliaEdge, formatarDataHoraEdge, timestampBrasiliaEdge } from '../_shared/timezone.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para buscar webhook da tabela
async function getWebhookUrl(barId: string, webhookType: string = 'contaazul', supabaseClient: any) {
  const { data: webhookConfig, error } = await supabaseClient
    .from('api_credentials')
    .select('configuracoes')
    .eq('bar_id', barId)
    .eq('sistema', 'contaazul')
    .eq('ambiente', 'producao')
    .single()

  if (error || !webhookConfig) {
    console.warn(`⚠️ Webhook config não encontrada para bar ${barId}, usando fallback`)
    // Fallback para webhook padrão se não encontrar configuração
    return 'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ'
  }

  const webhook = webhookConfig.configuracoes?.webhook_url
  
  if (!webhook || webhook.trim() === '') {
    console.warn(`⚠️ Webhook ${webhookType} não configurado para bar ${barId}, usando fallback`)
    // Fallback para webhook padrão
    return 'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ'
  }

  console.log(`✅ Webhook ${webhookType} encontrado para bar ${barId}`)
  return webhook
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Método não permitido')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { barId, source = 'manual' } = await req.json()

    if (!barId) {
      throw new Error('barId é obrigatório')
    }

    logBrasiliaEdge(`🤖 SYNC AUTOMÁTICO - Iniciando para bar ${barId} (fonte: ${source})`)

    // Notificar início
    await notificarDiscord(`🚀 **ContaAzul Sync Iniciado**\n\n📊 Bar: ${barId}\n⏰ Horário: ${formatarDataHoraEdge(new Date())}\n🤖 Fonte: ${source}`, barId, supabaseClient)

    const tempoInicio = Date.now()

    // 1. Verificar se existem credenciais ativas
    const { data: credentials, error: dbError } = await supabaseClient
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single()

    if (dbError || !credentials) {
      const mensagemErro = 'Credenciais ContaAzul não encontradas ou inativas'
      console.error('❌ SYNC -', mensagemErro, dbError)
             await notificarDiscord(`❌ **Erro no Sync ContaAzul**\n\n📊 Bar: ${barId}\n🚫 Erro: ${mensagemErro}\n⏰ ${formatarDataHoraEdge(new Date())}`, barId, supabaseClient)
      throw new Error(mensagemErro)
    }

    console.log('🔍 Credenciais encontradas')

    // 2. Chamar nossa API interna de dados brutos
    console.log('🔄 Chamando API de coleta de dados brutos...')
    
    const apiUrl = Deno.env.get('API_BASE_URL') || 'https://sgbv2.vercel.app'
    const dadosBrutosResponse = await fetch(`${apiUrl}/api/contaazul/sync-dados-brutos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sgb-dados-brutos-processamento-2025'
      },
      body: JSON.stringify({ 
        barId: barId,
        source: source 
      })
    })

    if (!dadosBrutosResponse.ok) {
      const errorText = await dadosBrutosResponse.text()
      const mensagemErro = `Erro na coleta de dados brutos: ${dadosBrutosResponse.status} - ${errorText}`
      console.error('❌', mensagemErro)
             await notificarDiscord(`❌ **Erro na Coleta de Dados Brutos**\n\n📊 Bar: ${barId}\n🚫 Status: ${dadosBrutosResponse.status}\n📄 Detalhes: ${errorText}\n⏰ ${formatarDataHoraEdge(new Date())}`, barId, supabaseClient)
      throw new Error(mensagemErro)
    }

    const dadosBrutosResult = await dadosBrutosResponse.json()
    console.log('✅ Dados brutos coletados:', dadosBrutosResult)

    // 3. Aguardar processamento do trigger
    console.log('⏳ Aguardando trigger processar dados brutos...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    const tempoTotal = Date.now() - tempoInicio
    const duracaoFormatada = `${Math.floor(tempoTotal / 1000)}s`

    // Notificar sucesso
    const mensagemSucesso = `✅ **ContaAzul Sync Concluído**\n\n📊 Bar: ${barId}\n⏱️ Duração: ${duracaoFormatada}\n📦 Dados brutos: ✅\n🔥 Trigger: Processando automaticamente\n⏰ ${formatarDataHoraEdge(new Date())}`
    
    await notificarDiscord(mensagemSucesso, barId, supabaseClient)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sync executado com sucesso',
        stats: {
          dadosBrutos: dadosBrutosResult,
          processamento: 'trigger_automatico',
          duracao: duracaoFormatada,
          fonte: source
        },
        timestamp: formatarDataHoraEdge(new Date())
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ Erro no sync automático:', errorMessage)
    
    // Notificar erro se conseguirmos
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      )
      const { barId } = await req.clone().json()
      if (barId) {
        await notificarDiscord(`💥 **Erro Crítico no Sync**\n\n📊 Bar: ${barId}\n🚫 Erro: ${errorMessage}\n⏰ ${formatarDataHoraEdge(new Date())}`, barId, supabaseClient)
      }
    } catch (notifyError) {
      console.error('❌ Falha ao notificar erro:', notifyError)
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function notificarDiscord(mensagem: string, barId: string, supabaseClient: any) {
  try {
    const webhookUrl = await getWebhookUrl(barId, 'contaazul', supabaseClient)
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: mensagem,
        username: 'ContaAzul Sync Bot',
        avatar_url: 'https://play-lh.googleusercontent.com/EMobDJKabP1eY_63QHgPS_-TK3eRfxXaeOnERbcRaWAw573iaV74pXS9xOv997dRZtM'
      })
    })

    if (response.ok) {
      console.log('✅ Discord notificado')
    } else {
      console.error('❌ Erro ao notificar Discord:', response.status)
    }
  } catch (error) {
    console.error('❌ Erro na notificação Discord:', error)
  }
} 