import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { logBrasiliaEdge, formatarDataHoraEdge, timestampBrasiliaEdge } from '../_shared/timezone.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CONTAAZUL_TOKEN_URL = 'https://auth.contaazul.com/oauth2/token'

// Função para buscar webhook da tabela
async function getWebhookUrl(barId: string, webhookType: string = 'contaazul', supabaseClient: any) {
  const { data: webhookConfig, error } = await supabaseClient
    .from('webhook_configs')
    .select('configuracoes')
    .eq('bar_id', barId)
    .single()

  if (error || !webhookConfig) {
    console.warn(`⚠️ Webhook config não encontrada para bar ${barId}, usando fallback`)
    // Fallback para webhook padrão se não encontrar configuração
    return 'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ'
  }

  const webhook = webhookConfig.configuracoes[webhookType]
  
  if (!webhook || webhook.trim() === '') {
    console.warn(`⚠️ Webhook ${webhookType} não configurado para bar ${barId}, usando sistema como fallback`)
    // Fallback para webhook sistema se o ContaAzul não estiver configurado
    return webhookConfig.configuracoes['sistema'] || 
           'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ'
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

    const { barId } = await req.json()

    if (!barId) {
      throw new Error('barId é obrigatório')
    }

    logBrasiliaEdge(`🤖 SYNC AUTOMÁTICO - Iniciando para bar ${barId}`)

    // 1. Buscar credenciais usando o mesmo padrão do frontend que funciona
    const { data: credentials, error: dbError } = await supabaseClient
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single()

    if (dbError || !credentials) {
      console.error('❌ SYNC - Credenciais não encontradas:', dbError)
      throw new Error('Credenciais não encontradas')
    }

    console.log('🔍 Credenciais encontradas')

    // 2. Verificar se token precisa ser renovado
    const agora = new Date()
    const expiraEm = new Date(credentials.expires_at)
    const precisaRenovar = expiraEm <= agora

    console.log(`⏰ Token expira em: ${expiraEm.toISOString()}`)
    console.log(`⏰ Agora: ${agora.toISOString()}`)
    console.log(`🔄 Precisa renovar: ${precisaRenovar}`)

    let tokenAtualizado = credentials.access_token

    // 3. Renovar token se necessário - usando o mesmo padrão do frontend
    if (precisaRenovar) {
      console.log('🔄 Renovando token automaticamente...')
      
      if (!credentials.refresh_token) {
        throw new Error('Refresh token não disponível. Autorização manual necessária.')
      }

      const novoToken = await renovarTokenAutomaticamente(credentials, supabaseClient)
      if (!novoToken.success) {
        throw new Error(`Erro ao renovar token: ${novoToken.error}`)
      }

      tokenAtualizado = novoToken.access_token
      console.log('✅ Token renovado com sucesso')
      
      // Notificar Discord sobre renovação de token
      await notificarDiscord(`🔄 **Token ContaAzul Renovado!**\n\n🏢 **Bar ID:** ${barId}\n⏰ **Horário:** ${formatarDataHoraEdge(new Date())}\n🆕 **Novo token expira em:** ${novoToken.expires_at ? formatarDataHoraEdge(novoToken.expires_at) : 'N/A'}`, barId, supabaseClient)
    }

    // 4. Executar coleta rápida de dados
    console.log('📊 Iniciando coleta rápida de dados...')
    const coletaData = await executarColetaRapida(tokenAtualizado, barId, supabaseClient)
    console.log('✅ Coleta concluída automaticamente')

    // 5. Notificar Discord sobre coleta
    if (coletaData.success) {
      await notificarDiscord(`📊 **Coleta ContaAzul Automática!**\n\n🏢 **Bar ID:** ${barId}\n⏰ **Horário:** ${formatarDataHoraEdge(new Date())}\n📈 **Dados Coletados:**\n- Categorias: ${coletaData.estatisticas.categorias_processadas}\n- Páginas de Receitas: ${coletaData.estatisticas.receitas_paginas_coletadas}\n- Páginas de Despesas: ${coletaData.estatisticas.despesas_paginas_coletadas}\n- Tempo: ${Math.round(coletaData.estatisticas.tempo_execucao / 1000)}s\n\n⚡ **Processamento automático iniciado em background**`, barId, supabaseClient)
    } else {
      await notificarDiscord(`❌ **Erro na Coleta ContaAzul!**\n\n🏢 **Bar ID:** ${barId}\n⏰ **Horário:** ${formatarDataHoraEdge(new Date())}\n🚨 **Erro:** ${coletaData.error}`, barId, supabaseClient)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Sync automático concluído',
        tokenRenovado: precisaRenovar,
        coletaResults: coletaData,
        timestamp: timestampBrasiliaEdge()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Erro no sync automático:', error)
    
    // Notificar Discord sobre erro
    let errorBarId = 'N/A'
    try {
      const body = await req.json()
      errorBarId = body.barId || 'N/A'
    } catch {
      // Ignore error getting barId
    }
    
    // Para notificação de erro, usar fallback webhook se necessário
    await notificarDiscord(`❌ **Erro no Sync Automático!**\n\n🏢 **Bar ID:** ${errorBarId}\n⏰ **Horário:** ${formatarDataHoraEdge(new Date())}\n🚨 **Erro:** ${error instanceof Error ? error.message : 'Erro desconhecido'}`, errorBarId, null)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: timestampBrasiliaEdge()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function renovarTokenAutomaticamente(credentials: any, supabaseClient: any) {
  try {
    // Usar o mesmo padrão do frontend - btoa para base64 no Deno
    const basicAuth = btoa(`${credentials.client_id}:${credentials.client_secret}`)
    
    const response = await fetch(CONTAAZUL_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: credentials.refresh_token
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Erro na renovação do token:', data)
      return { success: false, error: data.error || 'Erro ao renovar token' }
    }

    // Salvar novos tokens usando o mesmo padrão do frontend
    const expiresAt = new Date(Date.now() + (data.expires_in * 1000))
    
    const { error: updateError } = await supabaseClient
      .from('api_credentials')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token || credentials.refresh_token,
        expires_at: expiresAt.toISOString(),
        last_token_refresh: timestampBrasiliaEdge(),
        token_refresh_count: (credentials.token_refresh_count || 0) + 1,
        atualizado_em: timestampBrasiliaEdge()
      })
      .eq('id', credentials.id)

    if (updateError) {
      console.error('❌ Erro ao salvar token renovado:', updateError)
      return { success: false, error: 'Erro ao salvar token renovado' }
    }

    return {
      success: true,
      access_token: data.access_token,
      expires_at: expiresAt
    }
  } catch (error) {
    console.error('❌ Erro na renovação automática:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

async function executarColetaRapida(accessToken: string, barId: string, supabaseClient: any) {
  const baseUrl = 'https://api-v2.contaazul.com'
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }

  const stats = {
    categorias_processadas: 0,
    receitas_paginas_coletadas: 0,
    despesas_paginas_coletadas: 0,
    tempo_inicio: new Date(),
    tempo_execucao: 0
  }

  try {
    // 1. Sync Categorias - usando endpoint correto
    console.log('📁 Sincronizando categorias...')
    let paginaCategoria = 1
    const tamanhoPagina = 500 // Aumentado para coleta JSON rápida
    
    while (true) {
      const urlCategorias = `${baseUrl}/v1/categorias?pagina=${paginaCategoria}&tamanho_pagina=${tamanhoPagina}`
      const respCategorias = await fetch(urlCategorias, { headers })
      const categoriasData = await respCategorias.json()
      
      console.log(`📁 Categorias - Página ${paginaCategoria} - Status: ${respCategorias.status}`)
      
      if (!respCategorias.ok) {
        console.error(`❌ Erro na API categorias: ${respCategorias.status} - ${JSON.stringify(categoriasData)}`)
        throw new Error(`API ContaAzul erro: ${categoriasData.error || categoriasData.error_description || 'Erro desconhecido'}`)
      }
      
      // Dados podem estar em `itens`, `dados` ou direto na raiz
      const categorias = categoriasData.itens || categoriasData.dados || categoriasData
      if (!categorias || categorias.length === 0) break
      
      for (const categoria of categorias) {
        await supabaseClient
          .from('contaazul_categorias')
          .upsert({
            bar_id: barId,
            id: categoria.id,
            nome: categoria.nome,
            descricao: categoria.descricao || null,
            tipo: categoria.tipo,
            codigo: categoria.codigo || null,
            permite_filhos: categoria.permite_filhos || false,
            categoria_pai_id: categoria.categoria_pai_id || null,
            entrada_dre: categoria.entrada_dre || null,
            ativo: true
          })
        
        stats.categorias_processadas++
      }
      
      paginaCategoria++
      if (categorias.length < tamanhoPagina) break
    }

    // 2. Coletar Receitas como JSON bruto (rápido) - máximo 10 páginas por categoria
    console.log('💰 Coletando receitas como JSON...')
    
    // Buscar categorias de receita para usar no filtro
    const { data: categoriasReceita } = await supabaseClient
      .from('contaazul_categorias')
      .select('id')
      .eq('bar_id', barId)
      .eq('tipo', 'RECEITA')
    
    if (categoriasReceita && categoriasReceita.length > 0) {
      for (const categoria of categoriasReceita) {
        let paginaReceita = 1
        const maxPaginas = 20 // Aumentado para coleta JSON
        
        while (paginaReceita <= maxPaginas) {
          const urlReceitas = `${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?` +
            `ids_categorias=${categoria.id}&` +
            `data_vencimento_de=2024-01-01&` +
            `data_vencimento_ate=2027-01-01&` +
            `pagina=${paginaReceita}&` +
            `tamanho_pagina=${tamanhoPagina}`
          
          const respReceitas = await fetch(urlReceitas, { headers })
          console.log(`💰 Receitas - Cat: ${categoria.id} - Página ${paginaReceita} - Status: ${respReceitas.status}`)
          
          if (!respReceitas.ok) {
            console.error(`❌ Erro na API receitas: ${respReceitas.status}`)
            break
          }
          
          const receitasData = await respReceitas.json()
          const receitas = receitasData.itens || receitasData.dados || receitasData
          
          if (!receitas || receitas.length === 0) break
          
          // Salvar como JSON bruto na tabela de dados brutos
          await supabaseClient
            .from('contaazul_dados_brutos')
            .insert({
              bar_id: barId,
              tipo: 'receitas',
              categoria_id: categoria.id,
              pagina: paginaReceita,
              dados_json: receitas,
              total_registros: receitas.length
            })
          
          stats.receitas_paginas_coletadas++
          paginaReceita++
          
          if (receitas.length < tamanhoPagina) break
        }
      }
    }

    // 3. Coletar Despesas como JSON bruto (rápido) - máximo 10 páginas por categoria
    console.log('💸 Coletando despesas como JSON...')
    
    // Buscar categorias de despesa para usar no filtro
    const { data: categoriasDespesa } = await supabaseClient
      .from('contaazul_categorias')
      .select('id')
      .eq('bar_id', barId)
      .eq('tipo', 'DESPESA')
    
    if (categoriasDespesa && categoriasDespesa.length > 0) {
      for (const categoria of categoriasDespesa) {
        let paginaDespesa = 1
        const maxPaginas = 20 // Aumentado para coleta JSON
        
        while (paginaDespesa <= maxPaginas) {
          const urlDespesas = `${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar?` +
            `ids_categorias=${categoria.id}&` +
            `data_vencimento_de=2024-01-01&` +
            `data_vencimento_ate=2027-01-01&` +
            `pagina=${paginaDespesa}&` +
            `tamanho_pagina=${tamanhoPagina}`
          
          const respDespesas = await fetch(urlDespesas, { headers })
          console.log(`💸 Despesas - Cat: ${categoria.id} - Página ${paginaDespesa} - Status: ${respDespesas.status}`)
          
          if (!respDespesas.ok) {
            console.error(`❌ Erro na API despesas: ${respDespesas.status}`)
            break
          }
          
          const despesasData = await respDespesas.json()
          const despesas = despesasData.itens || despesasData.dados || despesasData
          
          if (!despesas || despesas.length === 0) break
          
          // Salvar como JSON bruto na tabela de dados brutos
          await supabaseClient
            .from('contaazul_dados_brutos')
            .insert({
              bar_id: barId,
              tipo: 'despesas',
              categoria_id: categoria.id,
              pagina: paginaDespesa,
              dados_json: despesas,
              total_registros: despesas.length
            })
          
          stats.despesas_paginas_coletadas++
          paginaDespesa++
          
          if (despesas.length < tamanhoPagina) break
        }
      }
    }

    // Calcular tempo de execução
    stats.tempo_execucao = new Date().getTime() - stats.tempo_inicio.getTime()
    
    return {
      success: true,
      message: 'Coleta de dados realizada com sucesso',
      estatisticas: stats
    }

  } catch (error) {
    console.error('❌ Erro no sync:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      estatisticas: stats
    }
  }
}

async function notificarDiscord(mensagem: string, barId: string, supabaseClient: any) {
  try {
    let webhookUrl = 'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ'
    
    // Tentar buscar webhook da tabela se supabaseClient estiver disponível
    if (supabaseClient && barId && barId !== 'N/A') {
      try {
        webhookUrl = await getWebhookUrl(barId, 'contaazul', supabaseClient)
      } catch (error) {
        console.warn('⚠️ Erro ao buscar webhook, usando fallback:', error)
      }
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🏢 SGB - ContaAzul Sync',
          description: mensagem,
          color: 0x00ff00,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Sistema de Gestão de Bares'
          }
        }]
      })
    })

    console.log('📱 Notificação Discord enviada')
  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error)
  }
} 