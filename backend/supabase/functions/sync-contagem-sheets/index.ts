/**
 * 📊 EDGE FUNCTION - SINCRONIZAÇÃO AUTOMÁTICA DE CONTAGEM
 * 
 * Esta função sincroniza automaticamente as contagens de estoque
 * do Google Sheets para o sistema Zykor.
 * 
 * Executada automaticamente via cron job às 18h todos os dias.
 * 
 * MULTI-BAR: Suporta múltiplos bares através do parâmetro bar_id
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuração padrão (fallback)
const DEFAULT_API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';

interface SheetsConfig {
  spreadsheet_id: string;
  aba_insumos: string;
  api_key: string;
}

interface ContagemData {
  estoque_fechado: number;
  estoque_flutuante: number | null;
  pedido: number;
}

interface InsumoSheet {
  codigo: string;
  nome: string;
  categoria: string;
  preco?: number;
  contagens: Record<string, ContagemData>;
}

/**
 * Converte data DD/MM/YYYY para YYYY-MM-DD
 */
function converterData(dataStr: string): string | null {
  if (!dataStr || !dataStr.includes('/')) return null;
  
  const partes = dataStr.split('/');
  if (partes.length !== 3) return null;
  
  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/**
 * Busca dados do Google Sheets para uma data específica
 */
async function buscarContagemData(data: string, config: SheetsConfig): Promise<InsumoSheet[]> {
  try {
    // Buscar estrutura da planilha (500 linhas conforme planilha real)
    const abaInsumos = config.aba_insumos || 'INSUMOS';
    const range = `${abaInsumos}!A1:ZZZ500`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheet_id}/values/${encodeURIComponent(range)}?key=${config.api_key}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao acessar planilha: ${response.status}`);
    }
    
    const data_response = await response.json();
    const linhas = data_response.values || [];
    
    if (linhas.length < 7) {
      throw new Error('Planilha sem dados suficientes');
    }
    
    // Linha 4 (índice 3) = datas
    const linhaDatas = linhas[3] || [];
    
    // Encontrar coluna da data solicitada
    let colunaData = -1;
    
    for (let i = 0; i < linhaDatas.length; i++) {
      const valor = linhaDatas[i];
      if (valor && valor.includes('/')) {
        const dataFormatada = converterData(valor);
        if (dataFormatada === data) {
          colunaData = i;
          break;
        }
      }
    }
    
    if (colunaData === -1) {
      console.log(`⚠️ Data ${data} não encontrada na planilha`);
      return [];
    }
    
    console.log(`✅ Data ${data} encontrada na coluna ${colunaData}`);
    
    // Processar insumos (a partir da linha 7, índice 6)
    const insumos: InsumoSheet[] = [];
    
    for (let i = 6; i < linhas.length; i++) {
      const linha = linhas[i];
      
      if (!linha || linha.length < 7) continue;
      
      const preco = parseFloat(linha[0]?.toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0; // Coluna A (PREÇO)
      const codigo = linha[3]?.toString().trim(); // Coluna D
      const nome = linha[6]?.toString().trim();   // Coluna G
      const categoria = linha[4]?.toString().trim(); // Coluna E
      
      if (!codigo || !nome) continue;
      
      // Buscar dados de contagem
      // 🔧 CORRIGIDO: Tratar 0 como valor válido, não como null
      const valorFechado = linha[colunaData]?.toString().replace(',', '.').trim();
      const valorFlutuante = linha[colunaData + 1]?.toString().replace(',', '.').trim();
      const valorPedido = linha[colunaData + 2]?.toString().replace(',', '.').trim();
      
      const estoqueFechado = valorFechado ? parseFloat(valorFechado) : 0;
      const estoqueFlutuante = valorFlutuante ? parseFloat(valorFlutuante) : 0;
      const pedido = valorPedido ? parseFloat(valorPedido) : 0;
      
      // 🔧 CORRIGIDO: Calcular total = fechado + flutuante
      const estoqueTotal = (isNaN(estoqueFechado) ? 0 : estoqueFechado) + (isNaN(estoqueFlutuante) ? 0 : estoqueFlutuante);
      
      // Só adiciona se tiver estoque (fechado OU flutuante > 0)
      if (estoqueTotal > 0) {
        insumos.push({
          codigo,
          nome,
          categoria,
          preco,  // ✅ Preço da planilha (coluna A)
          contagens: {
            [data]: {
              estoque_fechado: isNaN(estoqueFechado) ? 0 : estoqueFechado,
              estoque_flutuante: isNaN(estoqueFlutuante) ? 0 : estoqueFlutuante,
              pedido: isNaN(pedido) ? 0 : pedido,
            },
          },
        });
      }
    }
    
    console.log(`✅ ${insumos.length} insumos com contagem para ${data}`);
    
    return insumos;
    
  } catch (error) {
    console.error('❌ Erro ao buscar contagem:', error);
    throw error;
  }
}

/**
 * Busca configuração do Google Sheets do banco de dados
 */
async function buscarConfigSheets(supabase: any, barId: number): Promise<SheetsConfig | null> {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('configuracoes')
    .eq('bar_id', barId)
    .eq('sistema', 'google_sheets')
    .eq('ativo', true)
    .single();

  if (error || !data) {
    console.error(`❌ Configuração Google Sheets não encontrada para bar_id ${barId}`);
    return null;
  }

  const config = data.configuracoes as any;
  return {
    spreadsheet_id: config.spreadsheet_id,
    aba_insumos: config.aba_insumos || 'INSUMOS',
    api_key: config.api_key || DEFAULT_API_KEY,
  };
}

/**
 * Handler principal
 */
serve(async (req) => {
  // Configurar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('🚀 Iniciando sincronização de contagem...');
    
    // Verificar autenticação - aceitar SERVICE_ROLE_KEY ou cronSecret
    const authHeader = req.headers.get('authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Ler body para obter cronSecret e bar_id (se houver)
    const requestBody = await req.text();
    const bodyData = requestBody ? JSON.parse(requestBody) : {};
    const { cronSecret, bar_id: bodyBarId } = bodyData;
    
    if (authHeader && authHeader.includes(serviceRoleKey || '')) {
      console.log('✅ Acesso autorizado via SERVICE_ROLE_KEY');
    } else if (cronSecret === 'pgcron_contagem' || cronSecret === 'manual_test') {
      console.log('✅ Acesso autorizado via cronSecret');
    } else if (!authHeader && !cronSecret) {
      // Permitir chamadas sem auth do pg_cron
      console.log('✅ Acesso autorizado - assumindo pg_cron');
    } else {
      return new Response(
        JSON.stringify({ error: 'Acesso não autorizado' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verificar se é um cron job ou requisição manual
    const url = new URL(req.url);
    const dataParam = url.searchParams.get('data');
    const barIdParam = url.searchParams.get('bar_id');
    
    // Bar ID (parâmetro URL > body > default 3)
    const BAR_ID = parseInt(barIdParam || bodyBarId || '3');
    
    // Data para processar (hoje por padrão)
    const hoje = new Date();
    const dataProcessar = dataParam || hoje.toISOString().split('T')[0];
    
    console.log(`📅 Processando data: ${dataProcessar}`);
    console.log(`🏪 Bar ID: ${BAR_ID}`);
    
    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar configuração do Google Sheets para este bar
    const sheetsConfig = await buscarConfigSheets(supabase, BAR_ID);
    
    if (!sheetsConfig) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Configuração Google Sheets não encontrada para bar_id ${BAR_ID}` 
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`📊 Planilha: ${sheetsConfig.spreadsheet_id}`);
    console.log(`📑 Aba: ${sheetsConfig.aba_insumos}`);
    
    // Buscar contagens do Google Sheets
    const insumosSheet = await buscarContagemData(dataProcessar, sheetsConfig);
    
    console.log(`📊 Planilha: ${insumosSheet.length} insumos com contagem`);
    
    // Buscar TODOS os insumos ativos do sistema
    const { data: insumosSistema, error: errorInsumos } = await supabase
      .from('insumos')
      .select('id, codigo, nome, tipo_local, categoria, unidade_medida, custo_unitario')
      .eq('bar_id', BAR_ID)
      .eq('ativo', true);
    
    if (errorInsumos) {
      throw new Error(`Erro ao buscar insumos: ${errorInsumos.message}`);
    }
    
    console.log(`✅ ${insumosSistema?.length || 0} insumos ativos no sistema`);
    
    // Criar mapa de código -> contagem da planilha
    const mapaContagensSheet = new Map();
    insumosSheet.forEach((insumo: InsumoSheet) => {
      mapaContagensSheet.set(insumo.codigo, insumo);
    });
    
    // Estatísticas
    const stats = {
      total: 0,
      sucesso: 0,
      erro: 0,
      zerados: 0,
      naoEncontrados: [] as string[],
    };
    
    // Processar TODOS os insumos do sistema (mesmo os zerados)
    for (const insumoSistema of insumosSistema || []) {
      stats.total++;
      
      // Buscar contagem da planilha (pode não existir = zerado)
      const insumoSheet = mapaContagensSheet.get(insumoSistema.codigo);
      
      let estoqueFechado = 0;
      let estoqueFlutuante = 0;
      let pedido = 0;
      let custoUnitario = insumoSistema.custo_unitario || 0;
      
      if (insumoSheet) {
        const contagemData = insumoSheet.contagens[dataProcessar];
        if (contagemData) {
          estoqueFechado = contagemData.estoque_fechado || 0;
          estoqueFlutuante = contagemData.estoque_flutuante || 0;
          pedido = contagemData.pedido || 0;
        }
        // 🔧 SEMPRE usar preço da planilha se disponível (congelar preço no momento da contagem)
        if (insumoSheet.preco && insumoSheet.preco > 0) {
          custoUnitario = insumoSheet.preco;
        }
      } else {
        stats.zerados++;
      }
      
      // 🔧 Log para debug de preços
      if (insumoSheet && insumoSheet.preco && insumoSheet.preco !== custoUnitario) {
        console.log(`💰 ${insumoSistema.codigo}: Preço planilha R$ ${insumoSheet.preco} | Sistema R$ ${insumoSistema.custo_unitario}`);
      }
      
      // Buscar estoque_final do dia anterior para estoque_inicial
      const dataAnterior = new Date(dataProcessar);
      dataAnterior.setDate(dataAnterior.getDate() - 1);
      const dataAnteriorStr = dataAnterior.toISOString().split('T')[0];
      
      const { data: contagemAnterior } = await supabase
        .from('contagem_estoque_insumos')
        .select('estoque_final')
        .eq('bar_id', BAR_ID)
        .eq('insumo_id', insumoSistema.id)
        .eq('data_contagem', dataAnteriorStr)
        .single();
      
      const estoque_inicial = contagemAnterior?.estoque_final || null;
      
      // Verificar se já existe contagem
      const { data: contagemExistente } = await supabase
        .from('contagem_estoque_insumos')
        .select('id')
        .eq('bar_id', BAR_ID)
        .eq('data_contagem', dataProcessar)
        .eq('insumo_id', insumoSistema.id)
        .single();
      
      // 🔧 Calcular estoque total (fechado + flutuante)
      const estoqueFinal = estoqueFechado + estoqueFlutuante;
      
      // 🔧 Log para itens com estoque flutuante significativo
      if (estoqueFlutuante > 0 && estoqueFechado > 0) {
        console.log(`📦 ${insumoSistema.codigo}: ${estoqueFechado} + ${estoqueFlutuante} = ${estoqueFinal}`);
      }
      
      const payload = {
        bar_id: BAR_ID,
        data_contagem: dataProcessar,
        insumo_id: insumoSistema.id,
        insumo_codigo: insumoSistema.codigo,
        insumo_nome: insumoSistema.nome,
        estoque_inicial,
        estoque_final: estoqueFinal,  // ✅ Fechado + Flutuante (ou zero se não tem)
        quantidade_pedido: pedido,
        tipo_local: insumoSistema.tipo_local,
        categoria: insumoSistema.categoria,
        unidade_medida: insumoSistema.unidade_medida,
        custo_unitario: custoUnitario,  // ✅ Preço da planilha ou do sistema
        observacoes: insumoSheet ? 'Importado do Google Sheets' : 'Insumo sem contagem (zerado)',
        usuario_contagem: 'Sistema Automático',
        updated_at: new Date().toISOString(),
      };
      
      if (contagemExistente) {
        // Atualizar
        const { error } = await supabase
          .from('contagem_estoque_insumos')
          .update(payload)
          .eq('id', contagemExistente.id);
        
        if (error) {
          console.error(`❌ Erro ao atualizar ${insumoSistema.codigo}:`, error.message);
          stats.erro++;
        } else {
          stats.sucesso++;
        }
      } else {
        // Inserir
        const { error } = await supabase
          .from('contagem_estoque_insumos')
          .insert([payload]);
        
        if (error) {
          console.error(`❌ Erro ao inserir ${insumoSistema.codigo}:`, error.message);
          stats.erro++;
        } else {
          stats.sucesso++;
        }
      }
    }
    
    console.log('\n📊 Resumo:');
    console.log(`   📦 Total insumos: ${stats.total}`);
    console.log(`   ✅ Sucesso: ${stats.sucesso}`);
    console.log(`   ⚠️  Zerados (sem contagem): ${stats.zerados}`);
    console.log(`   ❌ Erro: ${stats.erro}`);
    
    // Enviar notificação no Discord se houver erros
    if (stats.erro > 0) {
      const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_CONTAGEM');
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `⚠️ **Sync Contagem ${dataProcessar}**\n📦 Total: ${stats.total}\n✅ Sucesso: ${stats.sucesso}\n⚠️ Zerados: ${stats.zerados}\n❌ Erro: ${stats.erro}`,
          }),
        }).catch(() => {});
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          total: stats.total,
          sucesso: stats.sucesso,
          zerados: stats.zerados,
          erro: stats.erro,
        },
        message: `Sincronização concluída: ${stats.sucesso}/${stats.total} insumos importados`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

