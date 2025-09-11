import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("🍽️ ContaHub ProdPorHora - Coleta Específica de Produtos por Hora");

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
      title: isError ? '❌ ContaHub ProdPorHora - Erro' : '🍽️ ContaHub ProdPorHora',
      description: message,
      color: isError ? 15158332 : 3447003, // Vermelho ou Azul
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SGB ContaHub ProdPorHora'
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
  
  // Log detalhado da resposta
  console.log('📥 Resposta ContaHub (primeiros 200 chars):', responseText.substring(0, 200));
  console.log('📏 Tamanho da resposta:', responseText.length);
  console.log('🔍 Primeiros 10 caracteres (códigos):', responseText.substring(0, 10).split('').map(c => c.charCodeAt(0)));
  
  // Limpar possíveis caracteres invisíveis no início
  const cleanedText = responseText.trim().replace(/^\uFEFF/, ''); // Remove BOM se existir
  
  try {
    return JSON.parse(cleanedText);
  } catch (parseError) {
    console.error('❌ Erro ao fazer parse da resposta ContaHub:', parseError);
    console.error('📥 Resposta original:', responseText);
    console.error('📥 Resposta limpa:', cleanedText);
    console.error('🔍 Primeiro caractere problemático:', cleanedText.charCodeAt(0));
    throw new Error(`Erro no parsing da resposta ContaHub: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}

// Função removida - não precisamos mais salvar dados brutos
// A função agora processa e insere diretamente na tabela final

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('📥 Body recebido:', requestBody);
    
    let parsedBody = {};
    try {
      // Tentar fazer o parse do JSON
      if (requestBody && requestBody.trim() !== '') {
        parsedBody = JSON.parse(requestBody);
      }
    } catch (jsonError) {
      console.error('❌ Erro ao fazer parse do JSON:', jsonError);
      console.error('📥 Body problemático:', requestBody);
      throw new Error(`Erro no parsing do JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }
    
    const { bar_id, data_date } = parsedBody;
    
    if (!bar_id || !data_date) {
      throw new Error('bar_id e data_date são obrigatórios');
    }
    
    console.log(`🎯 Coletando PRODPORHORA para bar_id=${bar_id}, data=${data_date}`);
    
    // Enviar notificação de início
    await sendDiscordNotification(`🚀 **Iniciando coleta ProdPorHora**\n\n📊 **Data:** ${data_date}\n🏪 **Bar ID:** ${bar_id}\n⏰ **Início:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
    
    // Configurar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis do Supabase não encontradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Configurar ContaHub
    const contahubEmail = Deno.env.get('CONTAHUB_EMAIL') || 'digao@3768';
    const contahubPassword = Deno.env.get('CONTAHUB_PASSWORD') || 'Geladeira@001';
    const contahubBaseUrl = 'https://sp.contahub.com';
    
    console.log('🔍 Debug ContaHub credentials:');
    console.log('- Email env var:', Deno.env.get('CONTAHUB_EMAIL') ? 'SET' : 'NOT SET');
    console.log('- Password env var:', Deno.env.get('CONTAHUB_PASSWORD') ? 'SET' : 'NOT SET');
    console.log('- Using email:', contahubEmail);
    console.log('- Using password:', contahubPassword ? 'SET' : 'NOT SET');
    
    if (!contahubEmail || !contahubPassword) {
      throw new Error('Variáveis do ContaHub não encontradas');
    }
    
    // Login no ContaHub
    const sessionToken = await loginContaHub(contahubEmail, contahubPassword);
    
    // Gerar timestamp dinâmico
    const queryTimestamp = generateDynamicTimestamp();
    
    // emp_id fixo para Ordinário (bar_id = 3)
    const emp_id = "3768";
    
    // URL específica para prodporhora (qry=95)
    const url = `${contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=95&d0=${data_date}&d1=${data_date}&prod=&grupo=&turno=&emp=${emp_id}&nfe=1`;
    
    console.log(`🔗 URL ProdPorHora: ${url}`);
    
    // Buscar dados do ContaHub
    const rawData = await fetchContaHubData(url, sessionToken);
    
    console.log(`📊 Dados recebidos do ContaHub: ${rawData?.list?.length || 0} produtos`);
    
    // 2. PROCESSAR E INSERIR DADOS DIRETAMENTE NA TABELA
    console.log('\n🔄 Processando dados diretamente...');
    
    let processedRecords = 0;
    
    if (rawData?.list && Array.isArray(rawData.list)) {
      console.log(`🔄 Processando dados para ${data_date}...`);
      
      // Primeiro, limpar dados existentes para esta data específica
      console.log(`🧹 Removendo dados existentes para ${data_date}...`);
      const { error: deleteError } = await supabase
        .from('contahub_prodporhora')
        .delete()
        .eq('bar_id', bar_id)
        .eq('data_gerencial', data_date);
      
      if (deleteError) {
        console.error('❌ Erro ao limpar dados existentes:', deleteError);
        throw new Error(`Erro ao limpar dados: ${deleteError.message}`);
      }
      
      // Processar cada registro exatamente como retorna do ContaHub
      const recordsToInsert = [];
      
      for (const registro of rawData.list) {
        // Extrair dados do registro
        const produtoId = registro.prd?.toString() || '';
        const produtoDescricao = registro.prd_desc || '';
        const grupoDescricao = registro.grp_desc || '';
        const quantidade = parseFloat(registro.qtd || 0);
        const valorPago = parseFloat(registro.$valorpago || 0);
        const desconto = parseFloat(registro.$desconto || 0);
        const horaTexto = registro.hora || '00:00';
        
        // Converter hora de "23:00" para número 23, "24:00" para 24, etc.
        const horaNumero = parseInt(horaTexto.split(':')[0]);
        
        // Calcular valor unitário (valor pago + desconto) / quantidade
        const valorTotal = valorPago + desconto;
        const valorUnitario = quantidade > 0 ? valorTotal / quantidade : 0;
        
        recordsToInsert.push({
          bar_id: bar_id,
          data_gerencial: data_date,
          hora: horaNumero,
          produto_id: produtoId,
          produto_descricao: produtoDescricao,
          grupo_descricao: grupoDescricao,
          quantidade: quantidade,
          valor_unitario: valorUnitario,
          valor_total: valorPago // Valor efetivamente pago (sem desconto)
        });
      }
      
      // Inserir todos os registros em lotes menores
      if (recordsToInsert.length > 0) {
        console.log(`📥 Inserindo ${recordsToInsert.length} registros na tabela...`);
        
        const batchSize = 100; // Inserir em lotes de 100
        let totalInserted = 0;
        
        for (let i = 0; i < recordsToInsert.length; i += batchSize) {
          const batch = recordsToInsert.slice(i, i + batchSize);
          console.log(`📦 Inserindo lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(recordsToInsert.length/batchSize)} (${batch.length} registros)...`);
          
          const { data: insertedData, error: insertError } = await supabase
            .from('contahub_prodporhora')
            .insert(batch)
            .select('id');
          
          if (insertError) {
            console.error('❌ Erro ao inserir lote:', insertError);
            console.error('📦 Lote problemático:', batch.slice(0, 2)); // Mostrar apenas 2 registros para debug
            throw new Error(`Erro ao inserir lote: ${insertError.message}`);
          }
          
          totalInserted += insertedData?.length || 0;
          console.log(`✅ Lote inserido: ${insertedData?.length || 0} registros`);
        }
        
        processedRecords = totalInserted;
        console.log(`✅ Total de ${processedRecords} registros inseridos com sucesso!`);
      }
    }
    
    // Resultado final
    const summary = {
      bar_id,
      data_date,
      data_type: 'prodporhora',
      produtos_processados: rawData?.list?.length || 0,
      registros_inseridos: processedRecords,
      processamento_completo: true
    };
    
    console.log('\n📊 RESUMO PRODPORHORA:');
    console.log(`- Data: ${data_date}`);
    console.log(`- Produtos processados: ${summary.produtos_processados}`);
    console.log(`- Registros inseridos: ${summary.registros_inseridos}`);
    console.log(`- Status: Processamento completo`);
    
    // Notificação de sucesso
    const successMessage = `✅ **ProdPorHora processado com sucesso**\n\n📊 **Resultados:**\n• Data: ${data_date}\n• Produtos: ${summary.produtos_processados}\n• Registros inseridos: ${summary.registros_inseridos}\n• Status: Completo\n\n⏰ **Fim:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
    await sendDiscordNotification(successMessage);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'ProdPorHora coletado e processado completamente',
      summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    
    // Enviar notificação de erro crítico
    const errorMessage = `❌ **Erro na coleta ProdPorHora**\n\n⏰ **Tempo:** ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n🚨 **Erro:** ${error instanceof Error ? error.message : String(error)}`;
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
