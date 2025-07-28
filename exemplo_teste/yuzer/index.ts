import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YuzerApiResponse {
  total: number;
  count: number;
  data: Array<{
    id: number;
    name: string;
    total: number;
    count: number;
    percent: number;
  }>;
}

interface YuzerOrdersResponse {
  content: Array<{
    id: string;
    createdAt: string;
    paymentStatus: string;
    cashier?: {
      id: string;
      name: string;
      serial: string;
    };
    operation?: {
      id: number;
      name: string;
      description: string;
    };
    cart: {
      productsAmount: number;
      grossTotal: number;
      subTotal: number;
      tax: number;
      total: number;
      products: Array<{
        id: string;
        productId: number;
        name: string;
        description: string;
        quantity: number;
        price: number;
        total: number;
        grossTotal: number;
        brand?: {
          id: number;
          name: string;
          description: string;
        };
        type: string;
        image?: string;
      }>;
    };
    paymentMethods: string[];
    onlinePaymentMethods?: string[];
    validated: boolean;
  }>;
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

interface RequestBody {
  bar_id: number;
  start_date: string; // formato DD.MM.YYYY
  end_date: string;   // formato DD.MM.YYYY
  token_yuzer?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          error: 'Método não permitido. Use POST.',
          example: {
            bar_id: 1,
            start_date: "15.06.2025",
            end_date: "15.06.2025"
          }
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body: RequestBody = await req.json();
    const { bar_id, start_date, end_date, token_yuzer } = body;

    if (!bar_id || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ 
          error: 'bar_id, start_date e end_date são obrigatórios. Formato: DD.MM.YYYY'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🎯 YUZER IMPORT FINAL - Bar: ${bar_id}, Período: ${start_date} até ${end_date}`);

    // Verificar autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader || (!authHeader.includes('sgb-cron-token-secure-2025') && !authHeader.includes(Deno.env.get('SUPABASE_ANON_KEY')!))) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const yuzerToken = token_yuzer || Deno.env.get('YUZER_API_TOKEN');
    if (!yuzerToken) {
      throw new Error('YUZER_API_TOKEN não encontrado');
    }

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Converter datas DD.MM.YYYY para ISO
    const convertDate = (dateStr: string): string => {
      const [day, month, year] = dateStr.split('.');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const fromDateStr = convertDate(start_date);
    const toDateStr = convertDate(end_date);
    
    const fromDate = new Date(fromDateStr);
    fromDate.setHours(0, 0, 0, 0);
    
    const toDate = new Date(toDateStr);
    toDate.setHours(23, 59, 59, 999);

    console.log(`📅 Período ISO: ${fromDate.toISOString()} até ${toDate.toISOString()}`);

    // PARTE 1: Importar estatísticas agregadas
    console.log(`📊 1/2 - Importando estatísticas agregadas...`);
    
    const yuzerStatsPayload = {
      currency: null,
      from: fromDate.toISOString(),
      to: toDate.toISOString()
    };
    
    const statsResponse = await fetch('https://api.eagle.yuzer.com.br/api/dashboards/salesPanels/statistics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'yuzer': yuzerToken
      },
      body: JSON.stringify(yuzerStatsPayload)
    });

    let statsInserted = 0;
    if (statsResponse.ok) {
      const statsData: YuzerApiResponse = await statsResponse.json();
      console.log(`✅ Estatísticas: Total ${statsData.total}, Count ${statsData.count}, Itens ${statsData.data.length}`);

      // Deletar registros antigos de estatísticas
      await supabase
        .from('yuzer_estatisticas_detalhadas')
        .delete()
        .eq('bar_id', bar_id);

      // Inserir estatísticas
      const detalhes = statsData.data.map(item => {
        let dataEvento: string | null = null;
        const matchData = item.name.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
        if (matchData) {
          const dia = matchData[1].padStart(2, '0');
          const mes = matchData[2].padStart(2, '0');
          let ano = matchData[3] || '2025';
          if (ano.length === 2) ano = '20' + ano;
          dataEvento = `${ano}-${mes}-${dia}`;
        }
        
        return {
          estatistica_id: 1,
          item_id: item.id,
          nome: item.name,
          total: item.total,
          count: item.count,
          percent: item.percent,
          data_evento: dataEvento,
          bar_id: bar_id,
          created_at: new Date().toISOString()
        };
      });

      const { error: statsError } = await supabase
        .from('yuzer_estatisticas_detalhadas')
        .insert(detalhes);

      if (!statsError) {
        statsInserted = detalhes.length;
        console.log(`✅ Inseridas ${statsInserted} estatísticas`);
      }
    }

    // PARTE 2: Importar pedidos individuais
    console.log(`🛒 2/2 - Importando pedidos individuais...`);

    // Deletar registros antigos de pedidos do período
    await supabase
      .from('yuzer_analitico')
      .delete()
      .eq('bar_id', bar_id)
      .gte('data_pedido', fromDateStr)
      .lte('data_pedido', toDateStr);

    // Buscar pedidos com paginação
    let allOrders: any[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      console.log(`📄 Buscando página ${page}/${totalPages}...`);
      
      const ordersPayload = {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        addTaxInTotal: false,
        page: page,
        perPage: 100,
        sort: "desc",
        sortColumn: "createdAt",
        status: "ALL"
      };
      
      const ordersResponse = await fetch('https://api.eagle.yuzer.com.br/api/orders/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'yuzer': yuzerToken
        },
        body: JSON.stringify(ordersPayload)
      });

      if (!ordersResponse.ok) {
        console.log(`⚠️ Erro na API Orders: ${ordersResponse.status}`);
        break;
      }

      const ordersData: YuzerOrdersResponse = await ordersResponse.json();
      console.log(`✅ Página ${page}: ${ordersData.content.length} pedidos (Total: ${ordersData.totalElements})`);
      
      allOrders.push(...ordersData.content);
      totalPages = ordersData.totalPages;
      page++;
      
      if (page > 50) { // Limite de segurança
        console.log('⚠️ Limite de 50 páginas atingido');
        break;
      }
      
    } while (page <= totalPages);

    console.log(`📦 Total coletado: ${allOrders.length} pedidos`);

    // Processar e inserir produtos
    const produtos: any[] = [];
    
    for (const order of allOrders) {
      if (!order.cart?.products?.length) continue;
      
      const dataPedido = new Date(order.createdAt).toISOString().split('T')[0];
      
      for (const product of order.cart.products) {
        produtos.push({
          bar_id: bar_id,
          pedido_id: order.id,
          produto_id: product.productId?.toString() || product.id,
          produto_nome: product.name || 'Produto sem nome',
          produto_descricao: product.description || '',
          quantidade: product.quantity || 0,
          preco_unitario: product.price || 0,
          valor_total: product.total || 0,
          valor_bruto: product.grossTotal || product.total || 0,
          marca_id: product.brand?.id?.toString() || null,
          marca_nome: product.brand?.name || null,
          tipo_produto: product.type || 'UNKNOWN',
          data_pedido: dataPedido,
          data_hora_pedido: order.createdAt,
          status_pagamento: order.paymentStatus || 'UNKNOWN',
          metodos_pagamento: order.paymentMethods?.join(', ') || '',
          metodos_pagamento_online: order.onlinePaymentMethods?.join(', ') || '',
          caixa_id: order.cashier?.id || null,
          caixa_nome: order.cashier?.name || null,
          caixa_serial: order.cashier?.serial || null,
          operacao_id: order.operation?.id?.toString() || null,
          operacao_nome: order.operation?.name || null,
          operacao_descricao: order.operation?.description || null,
          pedido_validado: order.validated || false,
          valor_total_pedido: order.cart.total || 0,
          quantidade_produtos_pedido: order.cart.productsAmount || 0,
          subtotal_pedido: order.cart.subTotal || 0,
          taxa_pedido: order.cart.tax || 0,
          imagem_produto: product.image || null,
          created_at: new Date().toISOString()
        });
      }
    }

    console.log(`📝 Inserindo ${produtos.length} produtos...`);

    // Inserir em lotes
    let totalInseridos = 0;
    const loteSize = 1000;
    
    for (let i = 0; i < produtos.length; i += loteSize) {
      const lote = produtos.slice(i, i + loteSize);
      
      const { error } = await supabase
        .from('yuzer_analitico')
        .insert(lote);

      if (!error) {
        totalInseridos += lote.length;
        console.log(`✅ Lote ${Math.floor(i/loteSize) + 1}: ${lote.length} produtos (Total: ${totalInseridos})`);
      } else {
        console.log(`❌ Erro no lote ${Math.floor(i/loteSize) + 1}: ${error.message}`);
      }
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    const response = {
      success: true,
      message: 'Dados do Yuzer importados com sucesso!',
      data: {
        bar_id,
        periodo: `${start_date} até ${end_date}`,
        pedidos_processados: allOrders.length,
        produtos_inseridos: totalInseridos,
        estatisticas_inseridas: statsInserted,
        is_update: true,
        execution_time_ms: executionTime
      },
      result: {
        inserted: totalInseridos + statsInserted,
        skipped: 0,
        execution_time: executionTime
      }
    };

    console.log(`✅ Importação concluída: ${allOrders.length} pedidos, ${totalInseridos} produtos, ${statsInserted} estatísticas em ${executionTime}ms`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido',
        data: {
          bar_id: 0,
          periodo: 'N/A',
          pedidos_processados: 0,
          produtos_inseridos: 0,
          estatisticas_inseridas: 0,
          is_update: false,
          execution_time_ms: executionTime
        },
        result: {
          inserted: 0,
          skipped: 0,
          execution_time: executionTime,
          error: error.message || 'Erro desconhecido'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 