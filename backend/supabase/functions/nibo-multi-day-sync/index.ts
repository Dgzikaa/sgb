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
    const requestBody = await req.text()
    console.log('📥 Recebido body:', requestBody)
    
    const { barId, cronSecret, days = 7 } = JSON.parse(requestBody || '{}')
    
    // Verificar autorização
    if (cronSecret !== 'manual_test' && cronSecret !== 'pgcron_nibo') {
      return new Response(
        JSON.stringify({ error: 'CRON_SECRET inválido' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔄 Iniciando sincronização NIBO multi-dias para bar ${barId} (${days} dias)...`)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const results = []
    let totalJobs = 0
    let totalRecords = 0

    // Sincronizar dia por dia dos últimos N dias
    for (let i = 0; i < days; i++) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - i)
      const dateStr = targetDate.toISOString().split('T')[0]
      
      console.log(`📅 Sincronizando dia ${i + 1}/${days}: ${dateStr}`)

      try {
        // Chamar nibo-sync para data específica
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/nibo-sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            barId: barId,
            cronSecret: 'manual_test',
            specific_date: dateStr
          })
        })

        const syncResult = await syncResponse.json()
        
        if (syncResult.success) {
          const agendamentosResult = syncResult.agendamentos
          if (agendamentosResult && agendamentosResult.count > 0) {
            totalJobs++
            totalRecords += agendamentosResult.count
            console.log(`✅ ${dateStr}: ${agendamentosResult.count} registros sincronizados`)
          } else {
            console.log(`ℹ️ ${dateStr}: Nenhum registro atualizado`)
          }
          
          results.push({
            date: dateStr,
            success: true,
            records: agendamentosResult?.count || 0,
            batch_id: agendamentosResult?.batch_id || null
          })
        } else {
          console.log(`❌ ${dateStr}: Erro - ${syncResult.error}`)
          results.push({
            date: dateStr,
            success: false,
            error: syncResult.error
          })
        }

        // Pausa entre dias para não sobrecarregar
        if (i < days - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

      } catch (error) {
        console.error(`❌ Erro ao sincronizar ${dateStr}:`, error)
        results.push({
          date: dateStr,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // Resumo final
    const summary = {
      success: true,
      days_processed: days,
      jobs_created: totalJobs,
      total_records: totalRecords,
      results: results,
      timestamp: new Date().toISOString()
    }

    console.log(`🎯 RESUMO FINAL:`)
    console.log(`   - Dias processados: ${days}`)
    console.log(`   - Jobs criados: ${totalJobs}`)
    console.log(`   - Total de registros: ${totalRecords}`)

    // Enviar notificação Discord se houve processamento
    if (totalJobs > 0 || totalRecords > 0) {
      try {
        const discordResponse = await fetch(`${supabaseUrl}/functions/v1/discord-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: '🎉 Sincronização NIBO Multi-Dias Concluída',
            processed_records: totalRecords,
            bar_id: barId,
            execution_time: `${days} dias processados`,
            webhook_type: 'nibo',
            custom_message: `🎯 **Resumo da Sincronização Multi-Dias:**

📊 **Estatísticas:**
• **Dias processados:** ${days}
• **Jobs criados:** ${totalJobs}
• **Total de registros:** ${totalRecords}
• **Bar ID:** ${barId}

💾 **Detalhes por dia:**
${results.map(r => `• **${r.date}:** ${r.success ? `✅ ${r.records || 0} registros` : `❌ ${r.error}`}`).join('\n')}

⏰ **Concluído:** ${new Date().toLocaleString('pt-BR')}
🚀 **Próxima execução:** Automática via pg_cron (4h)`
          })
        })

        if (discordResponse.ok) {
          console.log('✅ Notificação Discord enviada com sucesso')
        } else {
          console.error('❌ Erro ao enviar notificação Discord:', await discordResponse.text())
        }
      } catch (error) {
        console.error('❌ Erro ao enviar notificação Discord:', error)
      }
    } else {
      console.log('ℹ️ Nenhum processamento realizado - notificação Discord não enviada')
    }

    return new Response(
      JSON.stringify(summary),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error: unknown) {
    console.error('❌ Erro geral:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
