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
    // Verificar se é uma chamada autorizada (pode ser via cron job ou webhook)
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Iniciando reprocessamento automático diário...')

    // Executar função de reprocessamento
    const { data, error } = await supabase.rpc('executar_reprocessamento_diario')

    if (error) {
      console.error('❌ Erro no reprocessamento:', error)
      throw error
    }

    const resultado = data[0]
    
    console.log('✅ Reprocessamento concluído:', {
      total_marcados: resultado.total_marcados,
      total_processados: resultado.total_processados,
      tempo_execucao: resultado.tempo_execucao,
      eventos: resultado.eventos_processados
    })

    // Notificar Discord se configurado
    const discordWebhook = Deno.env.get('DISCORD_WEBHOOK_URL')
    if (discordWebhook && resultado.total_processados > 0) {
      try {
        await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🔄 Reprocessamento Automático Concluído',
              description: `**${resultado.total_processados}** eventos reprocessados com sucesso`,
              color: 0x00ff00,
              fields: [
                {
                  name: 'Eventos Marcados',
                  value: resultado.total_marcados.toString(),
                  inline: true
                },
                {
                  name: 'Eventos Processados', 
                  value: resultado.total_processados.toString(),
                  inline: true
                },
                {
                  name: 'Tempo de Execução',
                  value: resultado.tempo_execucao,
                  inline: true
                }
              ],
              timestamp: new Date().toISOString(),
              footer: {
                text: 'SGB - Sistema de Gestão de Bares'
              }
            }]
          })
        })
      } catch (discordError) {
        console.error('⚠️ Erro ao enviar notificação Discord:', discordError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reprocessamento automático concluído',
        stats: {
          total_marcados: resultado.total_marcados,
          total_processados: resultado.total_processados,
          tempo_execucao: resultado.tempo_execucao,
          eventos_processados: resultado.eventos_processados
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Erro na Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
