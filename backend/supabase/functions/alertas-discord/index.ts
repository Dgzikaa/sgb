import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AlertaDiscord {
  id: number
  bar_id: number
  tipo: string
  categoria: string
  titulo: string
  mensagem: string
  dados: Record<string, unknown> | null
}

interface RelatorioMatinoData {
  faturamentoOntem: number
  clientesOntem: number
  faturamentoMes: number
  metaMes: number
  percentualMeta: number
  eventosRealizados: number
  diasRestantes: number
  alertasPendentes: number
  statusGeral: 'verde' | 'amarelo' | 'vermelho'
}

class AlertasDiscordService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  async getWebhook(barId: number, tipo: string = 'alertas'): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('discord_webhooks')
      .select('webhook_url')
      .eq('bar_id', barId)
      .eq('tipo', tipo)
      .eq('ativo', true)
      .single()

    if (error || !data) {
      console.error(`Webhook não encontrado para bar ${barId}, tipo ${tipo}:`, error?.message)
      return null
    }

    return data.webhook_url
  }

  async enviarMensagem(webhookUrl: string, embed: Record<string, unknown>): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [embed]
        })
      })

      if (!response.ok) {
        console.error('Erro ao enviar para Discord:', response.status, await response.text())
        return false
      }

      return true
    } catch (error) {
      console.error('Erro ao enviar mensagem Discord:', error)
      return false
    }
  }

  async processarAlertasPendentes(barId: number): Promise<number> {
    // Buscar alertas não enviados
    const { data: alertas, error } = await this.supabase
      .from('alertas_enviados')
      .select('*')
      .eq('bar_id', barId)
      .eq('enviado_discord', false)
      .order('criado_em', { ascending: true })
      .limit(10)

    if (error || !alertas || alertas.length === 0) {
      console.log('Nenhum alerta pendente para enviar')
      return 0
    }

    const webhookUrl = await this.getWebhook(barId, 'alertas')
    if (!webhookUrl) {
      console.log('Webhook de alertas não configurado')
      return 0
    }

    let enviados = 0

    for (const alerta of alertas as AlertaDiscord[]) {
      // Definir cor baseada no tipo
      let color = 0x00ff00 // Verde
      let emoji = 'ℹ️'
      
      switch (alerta.tipo) {
        case 'critico':
          color = 0xff0000 // Vermelho
          emoji = '🚨'
          break
        case 'erro':
          color = 0xff6600 // Laranja
          emoji = '❌'
          break
        case 'aviso':
          color = 0xffcc00 // Amarelo
          emoji = '⚠️'
          break
        case 'info':
          color = 0x0099ff // Azul
          emoji = 'ℹ️'
          break
      }

      const embed = {
        title: `${emoji} ${alerta.titulo}`,
        description: alerta.mensagem,
        color: color,
        fields: [
          { name: 'Categoria', value: alerta.categoria, inline: true },
          { name: 'Tipo', value: alerta.tipo, inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'SGB - Sistema de Alertas' }
      }

      const sucesso = await this.enviarMensagem(webhookUrl, embed)
      
      if (sucesso) {
        // Marcar como enviado
        await this.supabase
          .from('alertas_enviados')
          .update({ enviado_discord: true })
          .eq('id', alerta.id)
        
        enviados++
      }

      // Pausa entre mensagens para não ser bloqueado pelo rate limit
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return enviados
  }

  async gerarRelatorioMatinal(barId: number): Promise<RelatorioMatinoData> {
    const hoje = new Date()
    const ontem = new Date(hoje)
    ontem.setDate(ontem.getDate() - 1)
    const ontemStr = ontem.toISOString().split('T')[0]
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    const inicioMesStr = inicioMes.toISOString().split('T')[0]
    
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    const diasRestantes = fimMes.getDate() - hoje.getDate()

    // Buscar dados de ontem
    const { data: eventoOntem } = await this.supabase
      .from('eventos_base')
      .select('real_r, cl_real, sympla_liquido, yuzer_liquido')
      .eq('bar_id', barId)
      .eq('data_evento', ontemStr)
      .eq('ativo', true)
      .single()

    const faturamentoOntem = (eventoOntem?.real_r || 0) + (eventoOntem?.sympla_liquido || 0) + (eventoOntem?.yuzer_liquido || 0)
    const clientesOntem = eventoOntem?.cl_real || 0

    // Buscar faturamento do mês
    const { data: eventosMes } = await this.supabase
      .from('eventos_base')
      .select('real_r, sympla_liquido, yuzer_liquido')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .gte('data_evento', inicioMesStr)
      .lte('data_evento', ontemStr)

    const faturamentoMes = (eventosMes || []).reduce((acc, e) => 
      acc + (e.real_r || 0) + (e.sympla_liquido || 0) + (e.yuzer_liquido || 0), 0
    )

    const eventosRealizados = (eventosMes || []).filter(e => (e.real_r || 0) > 0).length

    // Buscar meta do mês
    const { data: metaData } = await this.supabase
      .from('metas_mensais')
      .select('receita_meta')
      .eq('bar_id', barId)
      .eq('ano', hoje.getFullYear())
      .eq('mes', hoje.getMonth() + 1)
      .single()

    const metaMes = metaData?.receita_meta || 0
    const percentualMeta = metaMes > 0 ? (faturamentoMes / metaMes) * 100 : 0

    // Buscar alertas pendentes
    const { count: alertasPendentes } = await this.supabase
      .from('alertas_enviados')
      .select('id', { count: 'exact', head: true })
      .eq('bar_id', barId)
      .eq('resolvido', false)

    // Determinar status geral
    let statusGeral: 'verde' | 'amarelo' | 'vermelho' = 'verde'
    if (percentualMeta < 50 || (alertasPendentes || 0) > 5) {
      statusGeral = 'vermelho'
    } else if (percentualMeta < 80 || (alertasPendentes || 0) > 2) {
      statusGeral = 'amarelo'
    }

    return {
      faturamentoOntem,
      clientesOntem,
      faturamentoMes,
      metaMes,
      percentualMeta,
      eventosRealizados,
      diasRestantes,
      alertasPendentes: alertasPendentes || 0,
      statusGeral
    }
  }

  async enviarRelatorioMatinal(barId: number): Promise<boolean> {
    const webhookUrl = await this.getWebhook(barId, 'alertas')
    if (!webhookUrl) {
      console.log('Webhook não configurado para relatório matinal')
      return false
    }

    const dados = await this.gerarRelatorioMatinal(barId)

    // Formatar valores
    const formatCurrency = (value: number) => 
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    // Definir cor baseada no status
    let color = 0x00ff00 // Verde
    let statusEmoji = '✅'
    if (dados.statusGeral === 'amarelo') {
      color = 0xffcc00
      statusEmoji = '⚠️'
    } else if (dados.statusGeral === 'vermelho') {
      color = 0xff0000
      statusEmoji = '🚨'
    }

    const hoje = new Date()
    const mesNome = hoje.toLocaleDateString('pt-BR', { month: 'long' })

    const embed = {
      title: `${statusEmoji} Relatório Matinal - ${hoje.toLocaleDateString('pt-BR')}`,
      description: `Resumo diário do SGB`,
      color: color,
      fields: [
        { 
          name: '📊 Ontem', 
          value: `**Faturamento:** ${formatCurrency(dados.faturamentoOntem)}\n**Clientes:** ${dados.clientesOntem}`,
          inline: true 
        },
        { 
          name: `📈 ${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}`, 
          value: `**Realizado:** ${formatCurrency(dados.faturamentoMes)}\n**Meta:** ${formatCurrency(dados.metaMes)}\n**Progresso:** ${dados.percentualMeta.toFixed(1)}%`,
          inline: true 
        },
        { 
          name: '📅 Status', 
          value: `**Eventos:** ${dados.eventosRealizados}\n**Dias restantes:** ${dados.diasRestantes}\n**Alertas:** ${dados.alertasPendentes}`,
          inline: true 
        }
      ],
      footer: { text: 'SGB - Relatório Automático • Todo dia às 7h' },
      timestamp: new Date().toISOString()
    }

    // Adicionar barra de progresso visual
    const barraProgresso = this.gerarBarraProgresso(dados.percentualMeta)
    embed.fields.push({
      name: '📊 Progresso da Meta',
      value: barraProgresso,
      inline: false
    })

    return await this.enviarMensagem(webhookUrl, embed)
  }

  gerarBarraProgresso(percentual: number): string {
    const tamanho = 20
    const preenchido = Math.min(Math.round((percentual / 100) * tamanho), tamanho)
    const vazio = tamanho - preenchido
    
    const barra = '█'.repeat(preenchido) + '░'.repeat(vazio)
    return `\`${barra}\` ${percentual.toFixed(1)}%`
  }
}

serve(async (req) => {
  // CORS
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
    const body = await req.json()
    const { action, barId = 3 } = body

    // Verificar autenticação
    const authHeader = req.headers.get('authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!authHeader || !authHeader.includes(serviceRoleKey || '')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const service = new AlertasDiscordService()
    let result: Record<string, unknown> = {}

    switch (action) {
      case 'processar_alertas':
        const enviados = await service.processarAlertasPendentes(barId)
        result = { success: true, alertasEnviados: enviados }
        break

      case 'relatorio_matinal':
        const sucesso = await service.enviarRelatorioMatinal(barId)
        result = { success: sucesso, message: sucesso ? 'Relatório enviado' : 'Falha ao enviar' }
        break

      case 'teste':
        // Enviar mensagem de teste
        const webhookUrl = await service.getWebhook(barId, 'alertas')
        if (webhookUrl) {
          const testEmbed = {
            title: '🧪 Teste de Conexão',
            description: 'Se você está vendo esta mensagem, a integração está funcionando!',
            color: 0x00ff00,
            timestamp: new Date().toISOString(),
            footer: { text: 'SGB - Sistema de Alertas' }
          }
          const ok = await service.enviarMensagem(webhookUrl, testEmbed)
          result = { success: ok, message: ok ? 'Teste enviado!' : 'Falha no teste' }
        } else {
          result = { success: false, message: 'Webhook não configurado' }
        }
        break

      default:
        result = { success: false, error: 'Ação inválida' }
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro na Edge Function alertas-discord:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
