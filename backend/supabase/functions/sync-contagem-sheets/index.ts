/**
 * 📊 EDGE FUNCTION - SINCRONIZAÇÃO AUTOMÁTICA DE CONTAGEM
 * 
 * Esta função sincroniza automaticamente as contagens de estoque
 * do Google Sheets para o sistema Zykor.
 * 
 * Executada automaticamente via cron job às 18h todos os dias.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SPREADSHEET_ID = '1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8';
const API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';
const BAR_ID = 3;

interface ContagemData {
  estoque_fechado: number;
  estoque_flutuante: number | null;
  pedido: number;
}

interface InsumoSheet {
  codigo: string;
  nome: string;
  categoria: string;
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
async function buscarContagemData(data: string): Promise<InsumoSheet[]> {
  try {
    // Buscar estrutura da planilha
    const range = 'INSUMOS!A1:ZZZ200';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    
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
      
      const codigo = linha[3]?.toString().trim(); // Coluna D
      const nome = linha[6]?.toString().trim();   // Coluna G
      const categoria = linha[4]?.toString().trim(); // Coluna E
      
      if (!codigo || !nome) continue;
      
      // Buscar dados de contagem
      const estoqueFechado = parseFloat(linha[colunaData]) || null;
      const estoqueFlutuante = parseFloat(linha[colunaData + 1]) || null;
      const pedido = parseFloat(linha[colunaData + 2]) || null;
      
      // Só adiciona se tiver estoque fechado
      if (estoqueFechado !== null && estoqueFechado > 0) {
        insumos.push({
          codigo,
          nome,
          categoria,
          contagens: {
            [data]: {
              estoque_fechado: estoqueFechado,
              estoque_flutuante: estoqueFlutuante,
              pedido: pedido || 0,
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
    
    // Ler body para obter cronSecret (se houver)
    const requestBody = await req.text();
    const { cronSecret } = requestBody ? JSON.parse(requestBody) : {};
    
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
    
    // Data para processar (hoje por padrão)
    const hoje = new Date();
    const dataProcessar = dataParam || hoje.toISOString().split('T')[0];
    
    console.log(`📅 Processando data: ${dataProcessar}`);
    
    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar contagens do Google Sheets
    const insumosSheet = await buscarContagemData(dataProcessar);
    
    if (insumosSheet.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Nenhuma contagem encontrada para ${dataProcessar}`,
          imported: 0,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Buscar todos os insumos do sistema
    const { data: insumosSistema, error: errorInsumos } = await supabase
      .from('insumos')
      .select('id, codigo, nome, tipo_local, unidade_medida, custo_unitario')
      .eq('ativo', true);
    
    if (errorInsumos) {
      throw new Error(`Erro ao buscar insumos: ${errorInsumos.message}`);
    }
    
    // Criar mapa de código -> insumo
    const mapaInsumos = new Map();
    insumosSistema?.forEach((insumo: any) => {
      mapaInsumos.set(insumo.codigo, insumo);
    });
    
    console.log(`✅ ${mapaInsumos.size} insumos carregados do sistema`);
    
    // Estatísticas
    const stats = {
      total: 0,
      sucesso: 0,
      erro: 0,
      naoEncontrados: [] as string[],
    };
    
    // Processar cada insumo
    for (const insumoSheet of insumosSheet) {
      const insumoSistema = mapaInsumos.get(insumoSheet.codigo);
      
      if (!insumoSistema) {
        stats.naoEncontrados.push(insumoSheet.codigo);
        continue;
      }
      
      const contagemData = insumoSheet.contagens[dataProcessar];
      if (!contagemData) continue;
      
      stats.total++;
      
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
      
      const payload = {
        bar_id: BAR_ID,
        data_contagem: dataProcessar,
        insumo_id: insumoSistema.id,
        insumo_codigo: insumoSistema.codigo,
        insumo_nome: insumoSistema.nome,
        estoque_inicial,
        estoque_final: contagemData.estoque_fechado,
        quantidade_pedido: contagemData.pedido || 0,
        tipo_local: insumoSistema.tipo_local,
        categoria: insumoSistema.categoria || insumoSheet.categoria,
        unidade_medida: insumoSistema.unidade_medida,
        custo_unitario: insumoSistema.custo_unitario || 0,
        observacoes: 'Importado do Google Sheets (Cron)',
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
          console.error(`❌ Erro ao atualizar ${insumoSheet.codigo}:`, error.message);
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
          console.error(`❌ Erro ao inserir ${insumoSheet.codigo}:`, error.message);
          stats.erro++;
        } else {
          stats.sucesso++;
        }
      }
    }
    
    console.log('\n📊 Resumo:');
    console.log(`   ✅ Sucesso: ${stats.sucesso}`);
    console.log(`   ❌ Erro: ${stats.erro}`);
    console.log(`   ⚠️  Não encontrados: ${stats.naoEncontrados.length}`);
    
    // Enviar notificação no Discord se houver erros
    if (stats.erro > 0 || stats.naoEncontrados.length > 0) {
      const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_CONTAGEM');
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `⚠️ **Sync Contagem ${dataProcessar}**\n✅ Sucesso: ${stats.sucesso}\n❌ Erro: ${stats.erro}\n⚠️ Não encontrados: ${stats.naoEncontrados.length}`,
          }),
        }).catch(() => {});
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: stats,
        message: `Sincronização concluída para ${dataProcessar}`,
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

