import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * UMBLER SEND - Envia mensagens via Umbler Talk API
 * 
 * Modos de operação:
 * - single: Envia mensagem para um único número
 * - bulk: Disparo em massa para lista de números (campanha)
 * 
 * Endpoints Umbler usados:
 * - POST /v1/messages/simplified/ - Envio simplificado
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UMBLER_API_BASE = 'https://app-utalk.umbler.com/api'

interface SendRequest {
  bar_id: number
  mode: 'single' | 'bulk'
  // Para single
  to_phone?: string
  message?: string
  // Para bulk (campanha)
  campanha_id?: string
  destinatarios?: Array<{
    telefone: string
    nome?: string
    cliente_contahub_id?: number
  }>
  template_mensagem?: string
  variaveis?: Record<string, string>
  // Rate limiting
  delay_ms?: number // Delay entre mensagens no bulk (default: 1000ms)
}

interface UmblerSendResponse {
  success: boolean
  messageId?: string
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body: SendRequest = await req.json()
    const { bar_id, mode } = body

    if (!bar_id) {
      throw new Error('bar_id é obrigatório')
    }

    // Buscar configuração do bar
    const { data: config, error: configError } = await supabase
      .from('umbler_config')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .single()

    if (configError || !config) {
      throw new Error('Configuração Umbler não encontrada para este bar')
    }

    // ========================================
    // MODO SINGLE - Envio único
    // ========================================
    if (mode === 'single') {
      const { to_phone, message } = body
      
      if (!to_phone || !message) {
        throw new Error('to_phone e message são obrigatórios para modo single')
      }

      const result = await sendMessage(
        config.api_token,
        config.organization_id,
        config.phone_number,
        to_phone,
        message
      )

      // Salvar mensagem no banco
      if (result.success && result.messageId) {
        await supabase
          .from('umbler_mensagens')
          .insert({
            id: result.messageId,
            bar_id: bar_id,
            channel_id: config.channel_id,
            direcao: 'saida',
            tipo_remetente: 'campanha',
            contato_telefone: normalizePhone(to_phone),
            tipo_mensagem: 'text',
            conteudo: message,
            status: 'enviada',
            enviada_em: new Date().toISOString()
          })
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ========================================
    // MODO BULK - Disparo em massa
    // ========================================
    if (mode === 'bulk') {
      const { 
        campanha_id, 
        destinatarios, 
        template_mensagem, 
        variaveis,
        delay_ms = 1000 
      } = body

      if (!destinatarios || destinatarios.length === 0) {
        throw new Error('destinatarios é obrigatório para modo bulk')
      }

      if (!template_mensagem) {
        throw new Error('template_mensagem é obrigatório para modo bulk')
      }

      // Se tem campanha_id, atualizar status
      if (campanha_id) {
        await supabase
          .from('umbler_campanhas')
          .update({ 
            status: 'em_execucao',
            iniciado_em: new Date().toISOString()
          })
          .eq('id', campanha_id)
      }

      const results = {
        total: destinatarios.length,
        enviados: 0,
        erros: 0,
        detalhes: [] as Array<{
          telefone: string
          success: boolean
          messageId?: string
          error?: string
        }>
      }

      // Processar cada destinatário
      for (let i = 0; i < destinatarios.length; i++) {
        const dest = destinatarios[i]
        const telefoneNormalizado = normalizePhone(dest.telefone)
        
        // Substituir variáveis na mensagem
        let mensagemFinal = template_mensagem
        const primeiroNome = dest.nome?.split(' ')[0] || 'Cliente'
        
        mensagemFinal = mensagemFinal.replace(/\{nome\}/gi, primeiroNome)
        mensagemFinal = mensagemFinal.replace(/\{telefone\}/gi, dest.telefone)
        
        if (variaveis) {
          for (const [key, value] of Object.entries(variaveis)) {
            mensagemFinal = mensagemFinal.replace(new RegExp(`\\{${key}\\}`, 'gi'), value)
          }
        }

        try {
          const result = await sendMessage(
            config.api_token,
            config.organization_id,
            config.phone_number,
            telefoneNormalizado,
            mensagemFinal
          )

          results.detalhes.push({
            telefone: dest.telefone,
            success: result.success,
            messageId: result.messageId,
            error: result.error
          })

          if (result.success) {
            results.enviados++

            // Salvar mensagem no banco
            await supabase
              .from('umbler_mensagens')
              .insert({
                id: result.messageId || `bulk_${Date.now()}_${i}`,
                bar_id: bar_id,
                channel_id: config.channel_id,
                direcao: 'saida',
                tipo_remetente: 'campanha',
                contato_telefone: telefoneNormalizado,
                contato_nome: dest.nome,
                tipo_mensagem: 'text',
                conteudo: mensagemFinal,
                status: 'enviada',
                campanha_id: campanha_id,
                enviada_em: new Date().toISOString()
              })

            // Atualizar destinatário da campanha
            if (campanha_id) {
              await supabase
                .from('umbler_campanha_destinatarios')
                .update({
                  status: 'enviado',
                  mensagem_id: result.messageId,
                  enviado_em: new Date().toISOString()
                })
                .eq('campanha_id', campanha_id)
                .eq('telefone', telefoneNormalizado)
            }
          } else {
            results.erros++

            // Atualizar destinatário com erro
            if (campanha_id) {
              await supabase
                .from('umbler_campanha_destinatarios')
                .update({
                  status: 'erro',
                  erro_mensagem: result.error
                })
                .eq('campanha_id', campanha_id)
                .eq('telefone', telefoneNormalizado)
            }
          }

          // Rate limiting entre mensagens
          if (i < destinatarios.length - 1 && delay_ms > 0) {
            await delay(delay_ms)
          }

          // Log de progresso a cada 10 mensagens
          if ((i + 1) % 10 === 0) {
            console.log(`Progresso: ${i + 1}/${destinatarios.length} (${results.enviados} OK, ${results.erros} erros)`)
            
            // Atualizar campanha com progresso
            if (campanha_id) {
              await supabase
                .from('umbler_campanhas')
                .update({ 
                  enviados: results.enviados,
                  erros: results.erros
                })
                .eq('id', campanha_id)
            }
          }

        } catch (error) {
          console.error(`Erro ao enviar para ${dest.telefone}:`, error)
          results.erros++
          results.detalhes.push({
            telefone: dest.telefone,
            success: false,
            error: String(error)
          })
        }
      }

      // Atualizar campanha com totais finais
      if (campanha_id) {
        await supabase
          .from('umbler_campanhas')
          .update({ 
            status: 'concluida',
            enviados: results.enviados,
            erros: results.erros,
            finalizado_em: new Date().toISOString()
          })
          .eq('id', campanha_id)
      }

      return new Response(
        JSON.stringify({
          success: true,
          ...results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('mode deve ser "single" ou "bulk"')

  } catch (error) {
    console.error('Erro no envio Umbler:', error)
    
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

async function sendMessage(
  apiToken: string,
  organizationId: string,
  fromPhone: string,
  toPhone: string,
  message: string
): Promise<UmblerSendResponse> {
  try {
    const response = await fetch(`${UMBLER_API_BASE}/v1/messages/simplified/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ToPhone: normalizePhone(toPhone),
        FromPhone: normalizePhone(fromPhone),
        OrganizationId: organizationId,
        Message: message
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro Umbler API:', response.status, errorText)
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      messageId: data.id || data.messageId || data.Id
    }

  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    return {
      success: false,
      error: String(error)
    }
  }
}

function normalizePhone(phone: string): string {
  if (!phone) return ''
  // Remove tudo que não é número
  let normalized = phone.replace(/\D/g, '')
  // Garante que começa com 55 (Brasil)
  if (normalized.length === 11) {
    normalized = '55' + normalized
  } else if (normalized.length === 10) {
    normalized = '55' + normalized
  }
  // Remove o + inicial se existir
  if (normalized.startsWith('+')) {
    normalized = normalized.substring(1)
  }
  return normalized
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
