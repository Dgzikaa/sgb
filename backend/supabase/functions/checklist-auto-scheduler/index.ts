import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Configurar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🚀 Iniciando verificação de agendamentos automáticos...')
    
    // Log para debug
    const authHeader = req.headers.get('authorization')
    console.log('🔑 Auth header presente:', !!authHeader)

    // Buscar agendamentos ativos que precisam gerar checklists
    const { data: agendamentosPendentes, error: errorAgendamentos } = await supabase
      .from('checklist_schedules')
      .select(`
        *,
        checklists (
          id,
          nome,
          setor,
          tipo
        )
      `)
      .eq('ativo', true)
      .lte('proxima_execucao_em', new Date().toISOString())

    if (errorAgendamentos) {
      console.error('❌ Erro ao buscar agendamentos:', errorAgendamentos)
      throw errorAgendamentos
    }

    console.log(`📋 Encontrados ${agendamentosPendentes?.length || 0} agendamentos pendentes`)

    let processados = 0
    let erros = 0

    for (const agendamento of agendamentosPendentes || []) {
      try {
        console.log(`🔄 Processando agendamento: ${agendamento.titulo}`)

        // 1. Criar entrada na tabela checklist_agendamentos
        const dataAgendada = new Date()
        const deadline = new Date(dataAgendada.getTime() + (agendamento.tempo_limite_horas * 60 * 60 * 1000))

        const { data: novoAgendamento, error: errorNovoAgendamento } = await supabase
          .from('checklist_agendamentos')
          .insert({
            checklist_id: agendamento.checklist_id,
            data_agendada: dataAgendada.toISOString(),
            deadline: deadline.toISOString(),
            status: 'agendado',
            prioridade: agendamento.prioridade,
            observacoes: `Criado automaticamente pelo agendamento: ${agendamento.titulo}`,
            criado_por: agendamento.criado_por,
            bar_id: agendamento.bar_id
          })
          .select()
          .single()

        if (errorNovoAgendamento) {
          console.error(`❌ Erro ao criar agendamento para ${agendamento.titulo}:`, errorNovoAgendamento)
          erros++
          continue
        }

        console.log(`✅ Agendamento criado:`, novoAgendamento.id)

        // 2. Criar execução automática
        const dataAlerta = new Date(deadline.getTime() - (agendamento.tempo_alerta_horas * 60 * 60 * 1000))

        const { error: errorExecucao } = await supabase
          .from('checklist_auto_executions')
          .insert({
            checklist_schedule_id: agendamento.id,
            checklist_agendamento_id: novoAgendamento.id,
            status: 'pendente',
            data_limite: deadline.toISOString(),
            data_alerta: dataAlerta.toISOString()
          })

        if (errorExecucao) {
          console.error(`❌ Erro ao criar execução automática:`, errorExecucao)
          erros++
          continue
        }

        // 3. Atualizar última execução do agendamento
        const { error: errorUpdate } = await supabase
          .from('checklist_schedules')
          .update({
            ultima_execucao_em: dataAgendada.toISOString()
          })
          .eq('id', agendamento.id)

        if (errorUpdate) {
          console.error(`❌ Erro ao atualizar agendamento:`, errorUpdate)
        }

        // 4. Enviar notificação WhatsApp
        if (agendamento.responsaveis_whatsapp && agendamento.responsaveis_whatsapp.length > 0) {
          try {
            const whatsappResponse = await fetch('https://sgbv2.vercel.app/api/configuracoes/whatsapp/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                numbers: agendamento.responsaveis_whatsapp,
                type: 'checklist_notification',
                checklist_data: {
                  checklist_id: agendamento.checklist_id,
                  checklist_nome: agendamento.checklists?.nome || agendamento.titulo,
                  bar_nome: 'Bar Principal', // TODO: buscar nome do bar
                  deadline: deadline.toISOString(),
                  responsavel: 'Equipe',
                  status: 'agendado',
                  prioridade: agendamento.prioridade
                }
              })
            })

            if (whatsappResponse.ok) {
              console.log(`📱 WhatsApp enviado para: ${agendamento.responsaveis_whatsapp.join(', ')}`)
            }
          } catch (whatsappError) {
            console.error('❌ Erro ao enviar WhatsApp:', whatsappError)
          }
        }

        // 5. Log de sucesso
        await supabase
          .from('checklist_automation_logs')
          .insert({
            tipo: 'agendamento_criado',
            checklist_schedule_id: agendamento.id,
            dados: {
              checklist_agendamento_id: novoAgendamento.id,
              deadline: deadline.toISOString(),
              agendamento_titulo: agendamento.titulo,
              whatsapp_enviado: !!(agendamento.responsaveis_whatsapp && agendamento.responsaveis_whatsapp.length > 0)
            },
            mensagem: `Agendamento automático criado com sucesso para ${agendamento.titulo}`,
            nivel: 'info'
          })

        processados++
        console.log(`✅ Agendamento ${agendamento.titulo} processado com sucesso`)

      } catch (error: any) {
        console.error(`❌ Erro ao processar agendamento ${agendamento.titulo}:`, error)
        erros++

        // Log de erro
        await supabase
          .from('checklist_automation_logs')
          .insert({
            tipo: 'erro',
            checklist_schedule_id: agendamento.id,
            dados: { error: error.message },
            mensagem: `Erro ao processar agendamento ${agendamento.titulo}: ${error.message}`,
            nivel: 'error'
          })
      }
    }

    const resultado = {
      success: true,
      timestamp: new Date().toISOString(),
      agendamentos_encontrados: agendamentosPendentes?.length || 0,
      agendamentos_processados: processados,
      erros: erros,
      message: `Processamento concluído: ${processados} agendamentos processados, ${erros} erros`
    }

    console.log('🎉 Processamento concluído:', resultado)

    return new Response(JSON.stringify(resultado), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    })

  } catch (error: any) {
    console.error('💥 Erro geral na função:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      status: 500,
    })
  }
}) 