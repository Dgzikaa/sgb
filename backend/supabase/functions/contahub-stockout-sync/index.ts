import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("📦 ContaHub Stockout Sync - Controle de Estoque");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateDynamicTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

// Função para enviar notificação Discord
async function sendDiscordNotification(message: string, isError: boolean = false) {
  try {
    const webhookUrl = Deno.env.get('DISCORD_CONTAHUB_WEBHOOK');
    if (!webhookUrl) {
      console.log('⚠️ Discord webhook não configurado');
      return;
    }

    const embed = {
      title: isError ? '❌ ContaHub Stockout - Erro' : '📦 ContaHub Stockout',
      description: message,
      color: isError ? 15158332 : 3066993, // Vermelho ou Verde
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SGB Stockout Control'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });

    if (!response.ok) {
      console.error('❌ Erro ao enviar notificação Discord:', response.status, response.statusText);
    } else {
      console.log('📢 Notificação Discord enviada');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error);
  }
}

// Função de login no ContaHub
async function loginContaHub(email: string, password: string): Promise<string> {
  console.log('🔐 Fazendo login no ContaHub...');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordSha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const loginData = new URLSearchParams({
    "usr_email": email,
    "usr_password_sha1": passwordSha1
  });
  
  const loginTimestamp = generateDynamicTimestamp();
  const loginResponse = await fetch(`https://sp.contahub.com/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    body: loginData,
  });
  
  if (!loginResponse.ok) {
    throw new Error(`Erro no login ContaHub: ${loginResponse.statusText}`);
  }
  
  const setCookieHeaders = loginResponse.headers.get('set-cookie');
  if (!setCookieHeaders) {
    throw new Error('Cookies de sessão não encontrados no login');
  }
  
  console.log('✅ Login ContaHub realizado com sucesso');
  return setCookieHeaders;
}

// Função para fazer requisições ao ContaHub
async function fetchContaHubData(url: string, sessionToken: string) {
  console.log(`🔗 Fazendo requisição: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Cookie': sessionToken,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erro na requisição ContaHub: ${response.statusText}`);
  }
  
  const responseText = await response.text();
  return JSON.parse(responseText);
}

// Função para processar dados de stockout
async function processStockoutData(supabase: any, rawData: any, dataDate: string, barId: number) {
  console.log('📦 Processando dados de stockout...');
  
  if (!rawData?.list || !Array.isArray(rawData.list)) {
    console.log('⚠️ Nenhum dado de produto encontrado');
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;
  const stockoutRecords = [];

  for (const item of rawData.list) {
    try {
      // Extrair informações do produto (estrutura da API de produtos)
      const produtoId = item.prd || item.produto_id || item.id || 'unknown';
      const produtoDescricao = item.prd_desc || item.produto || item.descricao || item.nome || 'Produto sem nome';
      const grupoDescricao = item.grp_desc || item.grupo || item.categoria || 'Sem grupo';
      
      // Determinar se o produto está ativo baseado na coluna 'prd_venda'
      // Se prd_venda = "S", produto está ativo para venda
      const ativoContahub = item.prd_venda === "S" || item.prd_venda === true;

      const stockoutRecord = {
        bar_id: barId,
        data_consulta: dataDate,
        hora_consulta: '20:00:00',
        
        // Campos de produto
        produto_id: String(produtoId),
        produto_nome: produtoDescricao,
        produto_ativo: ativoContahub,
        grupo_produto: grupoDescricao,
        categoria_produto: item.grp_desc || item.categoria || 'Sem categoria',
        
        // Dados completos do JSON original
        raw_data: item,
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      stockoutRecords.push(stockoutRecord);
      processed++;

    } catch (error) {
      console.error('❌ Erro ao processar item:', error, item);
      errors++;
    }
  }

  // Salvar todos os registros de uma vez
  if (stockoutRecords.length > 0) {
    const { data, error } = await supabase
      .from('contahub_stockout')
      .insert(stockoutRecords);

    if (error) {
      console.error('❌ Erro ao salvar dados de stockout:', error);
      throw new Error(`Erro ao salvar stockout: ${error.message}`);
    }

    console.log(`✅ ${stockoutRecords.length} registros de stockout salvos`);
  }

  return { processed, errors };
}

// Função para processar dados fornecidos diretamente (modo histórico)
async function processStockoutDataDirect(supabase: any, produtosData: any[], dataDate: string, barId: number) {
  console.log('📦 Processando dados fornecidos diretamente...');
  
  if (!produtosData || !Array.isArray(produtosData)) {
    console.log('⚠️ Nenhum dado de produto fornecido');
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;
  const stockoutRecords = [];

  for (const produto of produtosData) {
    try {
      // Mapear todos os campos da API ContaHub para a estrutura da tabela
      const rawItem = produto.raw_data;
      
      const stockoutRecord = {
        bar_id: barId,
        data_consulta: dataDate,
        hora_consulta: '20:00:00',
        
        // Campos de produto
        produto_id: String(rawItem.prd || rawItem.produto_id || 'unknown'),
        produto_nome: rawItem.prd_desc || produto.produto_descricao || 'Sem nome',
        produto_ativo: produto.ativo_contahub,
        grupo_produto: rawItem.loc_desc || produto.grupo_descricao || 'Sem grupo',
        categoria_produto: rawItem.grp_desc || rawItem.categoria || 'Sem categoria',
        
        // Dados completos do JSON original
        raw_data: rawItem,
        
        // Timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      stockoutRecords.push(stockoutRecord);
      processed++;

    } catch (error) {
      console.error('❌ Erro ao processar produto:', error, produto);
      errors++;
    }
  }

  // Salvar todos os registros de uma vez
  if (stockoutRecords.length > 0) {
    const { data, error } = await supabase
      .from('contahub_stockout')
      .insert(stockoutRecords);

    if (error) {
      console.error('❌ Erro ao salvar dados de stockout:', error);
      throw new Error(`Erro ao salvar stockout: ${error.message}`);
    }

    console.log(`✅ ${stockoutRecords.length} registros de stockout salvos`);
  }

  return { processed, errors };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('📥 Body recebido:', requestBody);
    
    const { bar_id, data_date, produtos_data, force_save } = JSON.parse(requestBody || '{}');
    
    if (!bar_id || !data_date) {
      throw new Error('bar_id e data_date são obrigatórios');
    }
    
    console.log(`📦 Processando stockout para bar_id=${bar_id}, data=${data_date}`);
    
    // Enviar notificação de início
    await sendDiscordNotification(`🚀 **Iniciando sync de stockout**\n\n📊 **Data:** ${data_date}\n🏪 **Bar ID:** ${bar_id}\n⏰ **Início:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Configurar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis do Supabase não encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Configurar ContaHub
    const contahubEmail = Deno.env.get('CONTAHUB_EMAIL');
    const contahubPassword = Deno.env.get('CONTAHUB_PASSWORD');
    const contahubBaseUrl = 'https://sp.contahub.com';
    
    if (!contahubEmail || !contahubPassword) {
      throw new Error('Variáveis do ContaHub não encontradas');
    }
    
    let processResult;
    
    // Se produtos_data foi fornecido, usar diretamente (modo histórico)
    if (produtos_data && Array.isArray(produtos_data)) {
      console.log(`📦 Usando dados fornecidos: ${produtos_data.length} produtos`);
      
      // Processar dados fornecidos diretamente
      processResult = await processStockoutDataDirect(supabase, produtos_data, data_date, bar_id);
      
    } else {
      // Modo normal: buscar dados do ContaHub
      console.log('🔗 Buscando dados do ContaHub...');
      
      // Login no ContaHub
      const sessionToken = await loginContaHub(contahubEmail, contahubPassword);
      
      // Gerar timestamp dinâmico para a query
      const queryTimestamp = generateDynamicTimestamp();
      
      // emp_id fixo para Ordinário (bar_id = 3)
      const emp_id = "3768";
      
      // URL para buscar dados de produtos (API de produtos do ContaHub)
      const url = `${contahubBaseUrl}/rest/contahub.cmds.ProdutoCmd/getProdutos/${queryTimestamp}?emp=${emp_id}&prd_desc=%20&grp=-29&nfe=1`;
      
      console.log(`🔗 URL Stockout: ${url}`);
      
      // Buscar dados do ContaHub
      const rawData = await fetchContaHubData(url, sessionToken);
      
      // Processar dados de stockout
      processResult = await processStockoutData(supabase, rawData, data_date, bar_id);
    }
    
    // Calcular estatísticas de stockout
    const { data: stockoutStats } = await supabase
      .from('contahub_stockout')
      .select('produto_ativo')
      .eq('bar_id', bar_id)
      .eq('data_consulta', data_date);
    
    const totalProdutos = stockoutStats?.length || 0;
    const produtosAtivos = stockoutStats?.filter(p => p.produto_ativo).length || 0;
    const produtosInativos = totalProdutos - produtosAtivos;
    const percentualStockout = totalProdutos > 0 ? ((produtosInativos / totalProdutos) * 100).toFixed(2) : '0.00';
    
    const summary = {
      bar_id,
      data_date,
      total_produtos: totalProdutos,
      produtos_ativos: produtosAtivos,
      produtos_inativos: produtosInativos,
      percentual_stockout: `${percentualStockout}%`,
      processed_records: processResult.processed,
      errors: processResult.errors
    };
    
    console.log('\n📊 RESUMO STOCKOUT:');
    console.log(`- Total produtos: ${totalProdutos}`);
    console.log(`- Produtos ativos: ${produtosAtivos}`);
    console.log(`- Produtos inativos: ${produtosInativos}`);
    console.log(`- % Stockout: ${percentualStockout}%`);
    console.log(`- Processados: ${processResult.processed}`);
    console.log(`- Erros: ${processResult.errors}`);
    
    // Enviar notificação de conclusão
    const successMessage = `✅ **Sync de stockout concluído**\n\n📊 **Resultados:**\n• Total produtos: ${totalProdutos}\n• Produtos ativos: ${produtosAtivos}\n• Produtos inativos: ${produtosInativos}\n• **% Stockout: ${percentualStockout}%**\n\n⏰ **Fim:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
    await sendDiscordNotification(successMessage);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Sync de stockout concluído com sucesso',
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Erro geral no sync de stockout:', error);
    
    // Enviar notificação de erro crítico
    const errorMessage = `❌ **Erro crítico no sync de stockout**\n\n⏰ **Tempo:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n🚨 **Erro:** ${error instanceof Error ? error.message : String(error)}`;
    await sendDiscordNotification(errorMessage, true);
  
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
