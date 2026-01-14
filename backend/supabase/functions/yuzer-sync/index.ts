import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("🚀 Yuzer Sync Automático - Edge Function");

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
}

// Interface para o body da requisição
interface RequestBody {
  bar_id?: number;
  start_date?: string; // formato DD.MM.YYYY
  end_date?: string;   // formato DD.MM.YYYY
  token_yuzer?: string;
  automated?: boolean;
}

// Função para buscar credenciais do Yuzer
async function getYuzerCredentials(supabase: any, barId: number): Promise<string | null> {
  try {
    console.log(`🔍 Buscando credenciais Yuzer para bar_id: ${barId}`);
    
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('api_token')
      .eq('sistema', 'yuzer')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .limit(1);

    console.log('🔍 Resultado da busca:', { credentials, error, count: credentials?.length });

    if (error || !credentials || credentials.length === 0) {
      console.error('❌ Credenciais Yuzer não encontradas:', error);
      return null;
    }

    const token = credentials[0].api_token;
    console.log(`✅ Token encontrado: ${token.substring(0, 8)}...`);
    return token;
  } catch (error) {
    console.error('❌ Erro ao buscar credenciais Yuzer:', error);
    return null;
  }
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        message: 'Yuzer Sync Edge Function',
        usage: 'POST com body: { bar_id: 3, start_date: "DD.MM.YYYY", end_date: "DD.MM.YYYY" }'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  const startTime = Date.now();

  try {
    // Verificar autenticação - aceitar qualquer formato válido
    const authHeader = req.headers.get('authorization');
    console.log(`🔐 Authorization header: "${authHeader}"`);
    
    // Aceitar SERVICE_ROLE_KEY (mais estável) ou outros tokens válidos
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (authHeader) {
      if (authHeader.includes(serviceRoleKey || '') || authHeader.includes('sgb-cron-token-secure-2025') || authHeader.startsWith('Bearer ')) {
        console.log('✅ Authentication passed - SERVICE_ROLE_KEY, pgcron or Bearer token');
      } else {
        console.error('❌ Invalid authorization format');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid authorization format',
            help: 'Use Bearer SERVICE_ROLE_KEY or valid token'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Para compatibilidade, aceitar requisições sem auth durante teste
      console.log('⚠️ No authorization header - allowing for testing');
    }

    // Parse do body
    const body: RequestBody = await req.json();
    const { bar_id, start_date, end_date, token_yuzer, automated } = body;

    // Validar parâmetros obrigatórios
    if (!bar_id) {
      throw new Error('bar_id é obrigatório');
    }
    if (!start_date) {
      throw new Error('start_date é obrigatório (formato DD.MM.YYYY)');
    }
    if (!end_date) {
      throw new Error('end_date é obrigatório (formato DD.MM.YYYY)');
    }

    // Configuração
    const targetBarId = bar_id;
    const startDate = start_date;
    const endDate = end_date;

    // Conectar ao Supabase com service role para acessar api_credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar dados do bar
    const { data: barData } = await supabase
      .from('bars')
      .select('nome')
      .eq('id', targetBarId)
      .single();
    
    const barNome = barData?.nome;

    console.log(`🎯 YUZER SYNC - Bar: ${barNome} (${targetBarId}), Período: ${startDate} até ${endDate}`);

    // Buscar token do Yuzer
    const yuzerToken = token_yuzer || await getYuzerCredentials(supabase, targetBarId);
    
    if (!yuzerToken) {
      throw new Error(`Token Yuzer não encontrado para o bar ${targetBarId}`);
    }

    console.log(`🔑 Token Yuzer: ${yuzerToken.substring(0, 8)}...`);

    // Converter datas para ISO
    const [diaStart, mesStart, anoStart] = startDate.split('.');
    const [diaEnd, mesEnd, anoEnd] = endDate.split('.');
    const fromDateISO = `${anoStart}-${mesStart.padStart(2, '0')}-${diaStart.padStart(2, '0')}T00:00:00.000Z`;
    const toDateISO = `${anoEnd}-${mesEnd.padStart(2, '0')}-${diaEnd.padStart(2, '0')}T23:59:59.999Z`;

    console.log(`📅 Período ISO: ${fromDateISO} até ${toDateISO}`);

    // 1. BUSCAR ESTATÍSTICAS (sales panels)
    console.log('\n🎯 1/2 - Importando estatísticas agregadas...');
    
    const statsResponse = await fetch('https://api.eagle.yuzer.com.br/api/dashboards/salesPanels/statistics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'yuzer': yuzerToken
      },
      body: JSON.stringify({
        from: fromDateISO,
        to: toDateISO
      })
    });

    if (!statsResponse.ok) {
      throw new Error(`Erro na API de estatísticas: ${statsResponse.status}`);
    }

    const statsData = await statsResponse.json();
    console.log(`📊 Estatísticas: Total ${statsData.total || 0}, Count ${statsData.count || 0}, Items ${statsData.data?.length || 0}`);

    console.log(`📊 Eventos encontrados: ${statsData.data?.length || 0}`);

    // 3. INSERIR EVENTOS BRUTOS (sales panels)
    console.log('\n🎯 3/5 - Inserindo eventos brutos...');
    await insertYuzerEventos(supabase, statsData, targetBarId);

    // 4. PROCESSAR CADA EVENTO INDIVIDUALMENTE (como no teste que funcionava)
    console.log('\n🎯 4/5 - Processando dados por evento...');
    let totalProdutosInseridos = 0;
    
    if (statsData.data && Array.isArray(statsData.data)) {
      for (const evento of statsData.data) {
        const eventoId = evento.id;
        const eventoNome = evento.name || `Evento ${eventoId}`;
        
        console.log(`\n📊 Processando evento: ${eventoNome} (ID: ${eventoId})`);
        
        // Inserir produtos deste evento específico
        const produtosInseridos = await insertYuzerProdutosPorEvento(supabase, eventoId, eventoNome, targetBarId, yuzerToken);
        totalProdutosInseridos += produtosInseridos;
      }
    }

    // 5. INSERIR DADOS DE PAGAMENTO E FATURAMENTO POR HORA
    console.log('\n🎯 5/5 - Inserindo dados brutos de pagamento e faturamento...');
    await insertYuzerPagamentoEFaturamento(supabase, statsData, [], targetBarId, yuzerToken);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`✅ Yuzer Sync concluído: ${statsData.data?.length || 0} eventos, ${totalProdutosInseridos} produtos em ${executionTime}ms`);

    // 🔄 ATUALIZAR EVENTOS_BASE COM DADOS DO YUZER
    try {
      console.log('\n🔄 Atualizando eventos_base com dados do Yuzer...');
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_eventos_base_with_sympla_yuzer', {
          p_bar_id: targetBarId,
          p_data_inicio: startDate,
          p_data_fim: endDate
        });

      if (updateError) {
        console.error('❌ Erro ao atualizar eventos_base:', updateError);
      } else {
        console.log(`✅ eventos_base atualizado: ${updateResult?.[0]?.mensagem || 'OK'}`);
      }
    } catch (updateError) {
      console.error('❌ Erro ao atualizar eventos_base:', updateError);
    }

    // 🚀 CHAMAR DISCORD NOTIFICATION para EVENTOS (Yuzer)
    try {
      const discordResponse = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/discord-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          title: '✅ Yuzer Sync Concluído',
          webhook_type: 'eventos',
          processed_records: totalProdutosInseridos,
          bar_id: targetBarId,
          execution_time: `${executionTime}ms`,
          custom_message: `🎮 **Sincronização Yuzer finalizada!**\n\n📊 **Resultados:**\n• **Eventos:** ${statsData.data?.length || 0} processados\n• **Produtos:** ${totalProdutosInseridos} sincronizados\n• **Bar:** ${barNome} (ID: ${targetBarId})\n• **Período:** ${startDate} até ${endDate}\n• **Tempo:** ${executionTime}ms\n\n💾 **Dados atualizados:** Eventos, produtos, pagamentos e faturamento por hora\n⏰ **Concluído:** ${new Date().toLocaleString('pt-BR')}`
        })
      });

      if (!discordResponse.ok) {
        console.error('❌ Erro ao enviar notificação Discord Yuzer:', discordResponse.status);
      } else {
        console.log('📢 Notificação Discord Yuzer enviada');
      }
    } catch (discordError) {
      console.error('❌ Erro ao enviar notificação Discord Yuzer:', discordError);
    }

    // Retornar resposta de sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: `Dados do Yuzer importados com sucesso para ${barNome}!`,
        data: {
          bar_id: targetBarId,
          bar_nome: barNome,
          periodo: `${startDate} até ${endDate}`,
          eventos_processados: statsData.data?.length || 0,
          produtos_inseridos: totalProdutosInseridos,
          execution_time_ms: executionTime,
          automated: automated || false
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no Yuzer Sync:', error);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message || 'Erro desconhecido',
        execution_time_ms: executionTime
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

// ===================================
// FUNÇÕES DE INSERÇÃO POR TABELA
// ===================================

// Inserir eventos brutos (sales panels)
async function insertYuzerEventos(supabase: any, statsData: any, barId: number) {
  if (!statsData?.data || !Array.isArray(statsData.data)) {
    console.log('⚠️ Sem dados de events para inserir');
    return;
  }

  const eventos: any[] = [];
  
  for (const evento of statsData.data) {
    // Extrair datas do nome do evento (suporta eventos multi-dias)
    const { dataInicio, dataFim } = extrairDatasDoNomeEvento(evento.name);
    
    eventos.push({
      bar_id: barId,
      evento_id: evento.id,
      nome_evento: evento.name || `Evento ${evento.id}`,
      data_inicio: dataInicio,
      data_fim: dataFim,
      status: 'ativo',
      company_name: evento.companyName || null,
      company_document: evento.companyDocument || null,
      raw_data: evento,
      updated_at: new Date().toISOString()
    });
  }
  
  if (eventos.length > 0) {
    const { error } = await supabase
      .from('yuzer_eventos')
      .upsert(eventos, {
        onConflict: 'evento_id',
        ignoreDuplicates: false
      });
      
    if (error) {
      console.error('❌ Erro ao inserir eventos:', error.message);
    } else {
      console.log(`✅ ${eventos.length} eventos inseridos`);
    }
  }
}

// Função auxiliar para extrair datas do nome do evento (suporta eventos multi-dias)
// Exemplos suportados:
// - "Carnaval 01/03 até 04/03/25" -> inicio: 01/03, fim: 04/03
// - "Evento 01/03 a 04/03/2025" -> inicio: 01/03, fim: 04/03
// - "Show 15/03/2025" -> inicio e fim: 15/03
// - "Festival 01-04/03/25" -> inicio: 01/03, fim: 04/03
function extrairDatasDoNomeEvento(nomeEvento: string): { dataInicio: string | null, dataFim: string | null } {
  if (!nomeEvento) {
    return { dataInicio: null, dataFim: null };
  }

  // Padrão 1: "DD/MM até DD/MM/YYYY" ou "DD/MM a DD/MM/YYYY"
  const regexPeriodo = /(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\s*(?:até|a|ate)\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/i;
  const matchPeriodo = nomeEvento.match(regexPeriodo);
  
  if (matchPeriodo) {
    let [, diaInicio, mesInicio, anoInicio, diaFim, mesFim, anoFim] = matchPeriodo;
    
    // Se não tem ano no início, usa o mesmo do fim
    if (!anoInicio) {
      anoInicio = anoFim;
    }
    
    // Normaliza anos de 2 dígitos
    if (anoInicio.length === 2) {
      anoInicio = parseInt(anoInicio) < 50 ? `20${anoInicio}` : `19${anoInicio}`;
    }
    if (anoFim.length === 2) {
      anoFim = parseInt(anoFim) < 50 ? `20${anoFim}` : `19${anoFim}`;
    }
    
    const dataInicioStr = `${anoInicio}-${mesInicio.padStart(2, '0')}-${diaInicio.padStart(2, '0')}`;
    const dataFimStr = `${anoFim}-${mesFim.padStart(2, '0')}-${diaFim.padStart(2, '0')}`;
    
    console.log(`📅 Evento multi-dias detectado: ${nomeEvento} -> ${dataInicioStr} até ${dataFimStr}`);
    
    return {
      dataInicio: `${dataInicioStr}T18:00:00.000Z`,
      dataFim: `${dataFimStr}T23:59:59.999Z`
    };
  }
  
  // Padrão 2: "DD-DD/MM/YYYY" (ex: "01-04/03/25")
  const regexDiasRange = /(\d{1,2})\s*[-–]\s*(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
  const matchDiasRange = nomeEvento.match(regexDiasRange);
  
  if (matchDiasRange) {
    let [, diaInicio, diaFim, mes, ano] = matchDiasRange;
    
    if (ano.length === 2) {
      ano = parseInt(ano) < 50 ? `20${ano}` : `19${ano}`;
    }
    
    const dataInicioStr = `${ano}-${mes.padStart(2, '0')}-${diaInicio.padStart(2, '0')}`;
    const dataFimStr = `${ano}-${mes.padStart(2, '0')}-${diaFim.padStart(2, '0')}`;
    
    console.log(`📅 Evento multi-dias (range) detectado: ${nomeEvento} -> ${dataInicioStr} até ${dataFimStr}`);
    
    return {
      dataInicio: `${dataInicioStr}T18:00:00.000Z`,
      dataFim: `${dataFimStr}T23:59:59.999Z`
    };
  }
  
  // Padrão 3: Data única "DD/MM/YYYY"
  const regexSimples = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
  const matchSimples = nomeEvento.match(regexSimples);
  
  if (matchSimples) {
    let [, dia, mes, ano] = matchSimples;
    
    if (ano.length === 2) {
      ano = parseInt(ano) < 50 ? `20${ano}` : `19${ano}`;
    }
    
    const dataEvento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    
    return {
      dataInicio: `${dataEvento}T18:00:00.000Z`,
      dataFim: `${dataEvento}T23:59:59.999Z`
    };
  }
  
  // Fallback: sem data encontrada
  return { dataInicio: null, dataFim: null };
}

// Função auxiliar para extrair data do nome do evento (mantida para compatibilidade)
function extrairDataDoNomeEvento(nomeEvento: string): string {
  const { dataInicio } = extrairDatasDoNomeEvento(nomeEvento);
  if (dataInicio) {
    return dataInicio.split('T')[0];
  }
  // Fallback: usar data atual
  return new Date().toISOString().split('T')[0];
}

// Inserir produtos por evento específico (como no teste que funcionava)
async function insertYuzerProdutosPorEvento(supabase: any, eventoId: number, nomeEvento: string, barId: number, yuzerToken: string): Promise<number> {
  try {
    // Extrair data do evento e criar período (10h do dia até 10h do dia seguinte)
    const dataEvento = extrairDataDoNomeEvento(nomeEvento);
    const dataInicio = new Date(`${dataEvento}T13:00:00.000Z`); // 10h Brasil = 13h UTC
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 1); // Dia seguinte 10h
    
    const bodyPeriodo = {
      from: dataInicio.toISOString(),
      to: dataFim.toISOString()
    };
    
    const response = await fetch(`https://api.eagle.yuzer.com.br/api/salesPanels/${eventoId}/dashboards/products/statistics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'yuzer': yuzerToken
      },
      body: JSON.stringify(bodyPeriodo)
    });
    
    if (!response.ok) {
      console.log(`⚠️ Erro ao buscar produtos do evento ${eventoId}: ${response.status}`);
      return 0;
    }
    
    const produtoData = await response.json();
    
    if (!produtoData.data || !Array.isArray(produtoData.data) || produtoData.data.length === 0) {
      console.log(`⚠️ Sem produtos para evento ${nomeEvento}`);
      return 0;
    }
    
    const produtos = produtoData.data;
    const totalVendas = produtoData.total || 0;
    
    console.log(`   💰 Total vendas: R$ ${totalVendas.toFixed(2)} - ${produtos.length} produtos`);
    
    if (totalVendas === 0) {
      console.log(`⚠️ Vendas zeradas para evento ${nomeEvento}`);
      return 0;
    }
    
    // Preparar dados dos produtos (SEM categorização - view faz isso)
    const dadosProdutos = produtos.map((produto: any) => ({
      bar_id: barId,
      evento_id: eventoId,
      data_evento: dataEvento,
      produto_id: produto.id,
      produto_nome: produto.name,
      quantidade: produto.count || 0,
      valor_total: produto.total || 0,
      percentual: produto.percent || 0,
      categoria: null, // View yuzer_resumo2 faz categorização
      subcategoria: produto.type || null,
      eh_ingresso: null, // View determina isso
      raw_data: produto,
      updated_at: new Date().toISOString()
    }));
    
    if (dadosProdutos.length > 0) {
      const { error } = await supabase
        .from('yuzer_produtos')
        .upsert(dadosProdutos, {
          onConflict: 'bar_id,evento_id,data_evento,produto_id',
          ignoreDuplicates: false
        });
        
      if (error) {
        console.error(`❌ Erro ao inserir produtos do evento ${eventoId}:`, error.message);
        return 0;
      }
      
      console.log(`✅ ${dadosProdutos.length} produtos inseridos para ${nomeEvento}`);
      return dadosProdutos.length;
    }
    
    return 0;
    
  } catch (error) {
    console.error(`❌ Erro ao processar produtos do evento ${eventoId}:`, (error as Error).message);
    return 0;
  }
}

// Inserir dados de pagamento e faturamento por hora
async function insertYuzerPagamentoEFaturamento(supabase: any, statsData: any, _allOrders: any[], barId: number, yuzerToken: string) {
  if (!statsData?.data || !Array.isArray(statsData.data)) {
    console.log('⚠️ Sem dados de events para pagamento/faturamento');
    return;
  }

  for (const evento of statsData.data) {
    try {
      // Extrair data do evento
      const regex = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
      const match = evento.name?.match(regex);
      
      if (!match) continue;
      
      let [, dia, mes, ano] = match;
      if (ano.length === 2) {
        ano = parseInt(ano) < 50 ? `20${ano}` : `19${ano}`;
      }
      const dataEvento = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      // Período 10h do dia até 10h do dia seguinte (10h Brasil = 13h UTC)
      const dataInicio = `${dataEvento}T13:00:00.000Z`;
      const dataFimDate = new Date(`${dataEvento}T13:00:00.000Z`);
      dataFimDate.setDate(dataFimDate.getDate() + 1); // Dia seguinte
      const dataFim = dataFimDate.toISOString();

      // 1. FATURAMENTO POR HORA
      try {
        const fatResponse = await fetch(`https://api.eagle.yuzer.com.br/api/salesPanels/${evento.id}/dashboards/earningsAndSells/hour`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'yuzer': yuzerToken
          },
          body: JSON.stringify({
            from: dataInicio,
            to: dataFim
          })
        });

        if (fatResponse.ok) {
          const fatData = await fatResponse.json();
          const dadosFatHora: any[] = [];
          
          // Estrutura correta: { categories: [...], series: [{ data: [...] }] }
          if (fatData.categories && fatData.series?.[0]?.data) {
            const categories = fatData.categories;
            const seriesData = fatData.series[0].data;
            
            categories.forEach((categoria: string, index: number) => {
              const item = seriesData[index];
              const faturamento = item && typeof item === 'object' ? (item.total || 0) : (Number(item) || 0);
              const vendas = item && typeof item === 'object' ? (item.sells || 0) : 0;
              dadosFatHora.push({
                bar_id: barId,
                evento_id: evento.id,
                data_evento: dataEvento,
                hora: index,
                hora_formatada: categoria,
                faturamento: faturamento,
                vendas: vendas,
                raw_data: item,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            });
          }
          
          if (dadosFatHora.length > 0) {
            const { error } = await supabase
              .from('yuzer_fatporhora')
              .upsert(dadosFatHora, {
                onConflict: 'bar_id,evento_id,data_evento,hora',
                ignoreDuplicates: false
              });
              
            if (!error) {
              console.log(`✅ Faturamento por hora: ${dadosFatHora.length} registros inseridos para evento ${evento.name}`);
            }
          }
        }
      } catch (err) {
        console.error(`❌ Erro no faturamento por hora do evento ${evento.id}:`, (err as Error).message);
      }

      // 2. DADOS DE PAGAMENTO
      try {
        const pagResponse = await fetch(`https://api.eagle.yuzer.com.br/api/salesPanels/${evento.id}/dashboards/payments/statistics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'yuzer': yuzerToken
          },
          body: JSON.stringify({
            from: dataInicio,
            to: dataFim
          })
        });

        if (pagResponse.ok) {
          const pagData = await pagResponse.json();
          
          // Extrair valores por método (estrutura correta: methods array)
          const methods = pagData.methods || [];
          const credito = methods.find((m: any) => m.name === 'CREDIT_CARD')?.total || 0;
          const debito = methods.find((m: any) => m.name === 'DEBIT_CARD')?.total || 0;
          const pix = methods.find((m: any) => m.name === 'PIX')?.total || 0;
          const dinheiro = methods.find((m: any) => m.name === 'CASH')?.total || 0;
          const producao = methods.find((m: any) => m.name === 'PRODUCTION')?.total || 0;
          const cancelado = methods.find((m: any) => m.name === 'CANCELLED')?.total || 0;
          
          const faturamentoBruto = pagData.total || 0;
          const descontoCredito = credito * 0.035; // 3.5%
          const descontoDebitoPix = (debito + pix) * 0.015; // 1.5%
          const totalDescontos = descontoCredito + descontoDebitoPix;
          const valorLiquido = faturamentoBruto - totalDescontos;
          
          const pagamentoData = {
            bar_id: barId,
            evento_id: evento.id,
            data_evento: dataEvento,
            faturamento_bruto: faturamentoBruto,
            credito: credito,
            debito: debito,
            pix: pix,
            dinheiro: dinheiro,
            producao: producao,
            desconto_credito: descontoCredito,
            desconto_debito_pix: descontoDebitoPix,
            total_descontos: totalDescontos,
            aluguel_equipamentos: 0,
            valor_liquido: valorLiquido,
            total_cancelado: cancelado,
            quantidade_pedidos: pagData.count || 0,
            raw_data: pagData,
            updated_at: new Date().toISOString()
          };
          
          const { error } = await supabase
            .from('yuzer_pagamento')
            .upsert(pagamentoData, {
              onConflict: 'bar_id,evento_id,data_evento',
              ignoreDuplicates: false
            });
            
          if (!error) {
            console.log(`✅ Pagamento: R$ ${faturamentoBruto.toFixed(2)} bruto, R$ ${valorLiquido.toFixed(2)} líquido para evento ${evento.name}`);
          }
        }
      } catch (err) {
        console.error(`❌ Erro no pagamento do evento ${evento.id}:`, (err as Error).message);
      }
      
    } catch (err) {
      console.error(`❌ Erro geral no evento ${evento.id}:`, (err as Error).message);
    }
  }
}