import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CommandRequest {
  command: string; // resumo, meta, cmv, faturamento, etc
  barId?: number;
  webhook_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { command, barId = 3, webhook_url }: CommandRequest = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const webhookUrl = webhook_url || Deno.env.get('DISCORD_ALERTAS_WEBHOOK')
    if (!webhookUrl) {
      throw new Error('Webhook do Discord não configurado')
    }

    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)
    
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay())
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

    let embed: {
      title: string;
      description: string;
      color: number;
      fields?: { name: string; value: string; inline?: boolean }[];
      footer: { text: string };
      timestamp: string;
    }

    // Formatar moeda
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    const formatNumber = (value: number) =>
      new Intl.NumberFormat('pt-BR').format(Math.round(value))

    switch (command.toLowerCase()) {
      case 'resumo':
      case '/resumo': {
        // Buscar dados do último evento e da semana
        const { data: eventosRecentes } = await supabase
          .from('eventos_base')
          .select('data_evento, real_r, cl_real, m1_r, nome')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .order('data_evento', { ascending: false })
          .limit(7)

        const ultimoEvento = eventosRecentes?.[0]
        const fatSemana = eventosRecentes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0
        const clientesSemana = eventosRecentes?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0
        const metaSemana = eventosRecentes?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0
        const atingimento = metaSemana > 0 ? (fatSemana / metaSemana * 100).toFixed(1) : '0'
        const ticketMedio = clientesSemana > 0 ? fatSemana / clientesSemana : 0

        embed = {
          title: '📊 Resumo da Semana',
          description: `**Último evento:** ${ultimoEvento?.nome || '-'} (${ultimoEvento?.data_evento || '-'})`,
          color: 3066993, // Verde
          fields: [
            { name: '💰 Faturamento', value: formatCurrency(fatSemana), inline: true },
            { name: '👥 Clientes', value: formatNumber(clientesSemana), inline: true },
            { name: '🎟️ Ticket Médio', value: formatCurrency(ticketMedio), inline: true },
            { name: '📈 Meta', value: `${atingimento}%`, inline: true },
            { name: '🎯 Objetivo', value: formatCurrency(metaSemana), inline: true },
            { name: '📅 Dias', value: `${eventosRecentes?.length || 0} eventos`, inline: true }
          ],
          footer: { text: '🤖 Zykor Agent' },
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'meta':
      case '/meta': {
        // Buscar progresso da meta mensal
        const { data: eventosMes } = await supabase
          .from('eventos_base')
          .select('real_r, m1_r')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .gte('data_evento', inicioMes.toISOString().split('T')[0])

        const fatMes = eventosMes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0
        const metaMes = eventosMes?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0
        const diasPassados = hoje.getDate()
        const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
        const diasRestantes = diasNoMes - diasPassados
        const atingimento = metaMes > 0 ? (fatMes / metaMes * 100).toFixed(1) : '0'
        const faltaParaMeta = Math.max(0, metaMes - fatMes)
        const necessarioPorDia = diasRestantes > 0 ? faltaParaMeta / diasRestantes : 0

        // Cor baseada no progresso
        const progresso = parseFloat(atingimento)
        const color = progresso >= 100 ? 3066993 : progresso >= 80 ? 3447003 : progresso >= 50 ? 16776960 : 15158332

        embed = {
          title: '🎯 Progresso da Meta',
          description: progresso >= 100 ? '✅ Meta batida!' : `Faltam **${formatCurrency(faltaParaMeta)}** para bater a meta`,
          color,
          fields: [
            { name: '💰 Realizado', value: formatCurrency(fatMes), inline: true },
            { name: '🎯 Meta', value: formatCurrency(metaMes), inline: true },
            { name: '📊 Atingimento', value: `${atingimento}%`, inline: true },
            { name: '📅 Dias passados', value: `${diasPassados}`, inline: true },
            { name: '⏳ Dias restantes', value: `${diasRestantes}`, inline: true },
            { name: '💵 Necessário/dia', value: formatCurrency(necessarioPorDia), inline: true }
          ],
          footer: { text: '🤖 Zykor Agent' },
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'cmv':
      case '/cmv': {
        const { data: cmvData } = await supabase
          .from('cmv_semanal')
          .select('cmv_percentual, custo_total, faturamento')
          .eq('bar_id', barId)
          .order('data_inicio', { ascending: false })
          .limit(2)

        const cmvAtual = cmvData?.[0]?.cmv_percentual || 0
        const cmvAnterior = cmvData?.[1]?.cmv_percentual || 0
        const variacao = cmvAtual - cmvAnterior
        const metaCMV = 34

        const color = cmvAtual <= metaCMV ? 3066993 : cmvAtual <= 36 ? 16776960 : 15158332
        const status = cmvAtual <= metaCMV ? '✅ Dentro da meta!' : '⚠️ Acima do limite'

        embed = {
          title: '📦 CMV - Custo de Mercadoria Vendida',
          description: status,
          color,
          fields: [
            { name: '📊 CMV Atual', value: `${cmvAtual.toFixed(1)}%`, inline: true },
            { name: '🎯 Meta', value: `< ${metaCMV}%`, inline: true },
            { name: '📈 Variação', value: `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}%`, inline: true },
            { name: '💰 Custo Total', value: formatCurrency(cmvData?.[0]?.custo_total || 0), inline: true },
            { name: '💵 Faturamento', value: formatCurrency(cmvData?.[0]?.faturamento || 0), inline: true },
            { name: '📅 Semana anterior', value: `${cmvAnterior.toFixed(1)}%`, inline: true }
          ],
          footer: { text: '🤖 Zykor Agent' },
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'faturamento':
      case '/faturamento': {
        const { data: eventosOntem } = await supabase
          .from('eventos_base')
          .select('data_evento, real_r, cl_real, m1_r, nome')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .eq('data_evento', ontem.toISOString().split('T')[0])
          .single()

        const fat = eventosOntem?.real_r || 0
        const meta = eventosOntem?.m1_r || 0
        const clientes = eventosOntem?.cl_real || 0
        const ticket = clientes > 0 ? fat / clientes : 0
        const atingimento = meta > 0 ? (fat / meta * 100).toFixed(1) : '0'

        embed = {
          title: `💰 Faturamento de Ontem - ${eventosOntem?.nome || 'N/A'}`,
          description: `Data: ${ontem.toLocaleDateString('pt-BR')}`,
          color: parseFloat(atingimento) >= 100 ? 3066993 : parseFloat(atingimento) >= 80 ? 3447003 : 15158332,
          fields: [
            { name: '💵 Faturamento', value: formatCurrency(fat), inline: true },
            { name: '🎯 Meta', value: formatCurrency(meta), inline: true },
            { name: '📊 Atingimento', value: `${atingimento}%`, inline: true },
            { name: '👥 Clientes', value: formatNumber(clientes), inline: true },
            { name: '🎟️ Ticket Médio', value: formatCurrency(ticket), inline: true }
          ],
          footer: { text: '🤖 Zykor Agent' },
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'produtos':
      case '/produtos': {
        const { data: produtosVendas } = await supabase
          .from('contahub_analitico')
          .select('prd_desc, qtd, valorfinal')
          .eq('bar_id', barId)
          .gte('trn_dtgerencial', inicioSemana.toISOString().split('T')[0])

        // Agrupar por produto
        const grouped: Record<string, { qtd: number; valor: number }> = {}
        produtosVendas?.forEach(p => {
          if (!p.prd_desc) return
          if (!grouped[p.prd_desc]) grouped[p.prd_desc] = { qtd: 0, valor: 0 }
          grouped[p.prd_desc].qtd += p.qtd || 0
          grouped[p.prd_desc].valor += p.valorfinal || 0
        })

        const top5 = Object.entries(grouped)
          .sort((a, b) => b[1].valor - a[1].valor)
          .slice(0, 5)

        embed = {
          title: '🏆 Top 5 Produtos da Semana',
          description: top5.map((p, i) => 
            `${['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} **${p[0]}**\n    ${formatCurrency(p[1].valor)} (${p[1].qtd} un.)`
          ).join('\n\n'),
          color: 15844367, // Dourado
          footer: { text: '🤖 Zykor Agent' },
          timestamp: new Date().toISOString()
        }
        break
      }

      case 'help':
      case '/help':
      case 'ajuda':
      case '/ajuda': {
        embed = {
          title: '🤖 Comandos do Zykor Agent',
          description: 'Use estes comandos para consultas rápidas:',
          color: 5793266, // Roxo
          fields: [
            { name: '📊 /resumo', value: 'Resumo da semana atual', inline: true },
            { name: '🎯 /meta', value: 'Progresso da meta mensal', inline: true },
            { name: '📦 /cmv', value: 'CMV da última semana', inline: true },
            { name: '💰 /faturamento', value: 'Faturamento de ontem', inline: true },
            { name: '🏆 /produtos', value: 'Top 5 produtos vendidos', inline: true },
            { name: '❓ /help', value: 'Esta mensagem de ajuda', inline: true }
          ],
          footer: { text: '🤖 Zykor Agent - Sistema de Gestão de Bares' },
          timestamp: new Date().toISOString()
        }
        break
      }

      default:
        embed = {
          title: '❓ Comando não reconhecido',
          description: `O comando \`${command}\` não foi encontrado.\n\nDigite **/help** para ver os comandos disponíveis.`,
          color: 15158332, // Vermelho
          footer: { text: '🤖 Zykor Agent' },
          timestamp: new Date().toISOString()
        }
    }

    // Enviar para Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    })

    if (!discordResponse.ok) {
      throw new Error(`Discord webhook failed: ${discordResponse.status}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        command,
        message: 'Resposta enviada para Discord' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no comando Discord:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
