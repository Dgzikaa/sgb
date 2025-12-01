/**
 * 📊 EDGE FUNCTION - SINCRONIZAÇÃO RETROATIVA DE CONTAGEM
 * 
 * Esta função sincroniza contagens de estoque de um período passado
 * do Google Sheets para o sistema Zykor.
 * 
 * Uso: Importar histórico completo de contagens
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
 * Gerar array de datas entre duas datas
 */
function gerarArrayDatas(dataInicio: string, dataFim: string): string[] {
  const datas: string[] = [];
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T00:00:00');
  
  let dataAtual = new Date(inicio);
  
  while (dataAtual <= fim) {
    datas.push(dataAtual.toISOString().split('T')[0]);
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  
  return datas;
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
    console.log('🚀 Iniciando sincronização RETROATIVA de contagem...');
    
    // Verificar autenticação
    const authHeader = req.headers.get('authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const requestBody = await req.text();
    const { cronSecret, data_inicio, data_fim } = requestBody ? JSON.parse(requestBody) : {};
    
    if (!authHeader?.includes(serviceRoleKey || '') && cronSecret !== 'manual_retroativo') {
      return new Response(
        JSON.stringify({ error: 'Acesso não autorizado' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validar datas
    if (!data_inicio || !data_fim) {
      return new Response(
        JSON.stringify({ 
          error: 'data_inicio e data_fim são obrigatórios',
          exemplo: {
            data_inicio: '2025-02-01',
            data_fim: '2025-11-30'
          }
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`📅 Período: ${data_inicio} até ${data_fim}`);
    
    // Gerar array de datas
    const datas = gerarArrayDatas(data_inicio, data_fim);
    console.log(`📊 Total de datas a processar: ${datas.length}`);
    
    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar todos os insumos do sistema UMA VEZ
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
    
    // Estatísticas gerais
    const statsGerais = {
      total_datas: datas.length,
      datas_processadas: 0,
      datas_sem_dados: 0,
      total_insumos_importados: 0,
      erros: 0,
    };
    
    // Processar cada data
    for (const data of datas) {
      try {
        console.log(`\n📅 Processando ${data}...`);
        
        // Buscar contagens do Google Sheets para esta data
        const insumosSheet = await buscarContagemData(data);
        
        if (insumosSheet.length === 0) {
          console.log(`⚠️ Sem dados para ${data}`);
          statsGerais.datas_sem_dados++;
          statsGerais.datas_processadas++;
          continue;
        }
        
        console.log(`✅ ${insumosSheet.length} insumos encontrados para ${data}`);
        
        let importadosNaData = 0;
        
        // Processar cada insumo desta data
        for (const insumoSheet of insumosSheet) {
          const insumoSistema = mapaInsumos.get(insumoSheet.codigo);
          
          if (!insumoSistema) {
            continue; // Ignorar insumos não cadastrados
          }
          
          const contagemData = insumoSheet.contagens[data];
          if (!contagemData) continue;
          
          // Buscar estoque_final do dia anterior para estoque_inicial
          const dataAnterior = new Date(data + 'T00:00:00');
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
          
          const payload = {
            bar_id: BAR_ID,
            data_contagem: data,
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
            observacoes: 'Importado retroativamente do Google Sheets',
            usuario_contagem: 'Sistema Retroativo',
            updated_at: new Date().toISOString(),
          };
          
          const { error } = await supabase
            .from('contagem_estoque_insumos')
            .insert([payload]);
          
          if (error) {
            console.error(`❌ Erro ao inserir ${insumoSheet.codigo} em ${data}:`, error.message);
            statsGerais.erros++;
          } else {
            importadosNaData++;
          }
        }
        
        console.log(`✅ ${importadosNaData} insumos importados para ${data}`);
        statsGerais.total_insumos_importados += importadosNaData;
        statsGerais.datas_processadas++;
        
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erro ao processar data ${data}:`, error);
        statsGerais.erros++;
        statsGerais.datas_processadas++;
      }
    }
    
    console.log('\n📊 RESUMO FINAL:');
    console.log(`   📅 Datas processadas: ${statsGerais.datas_processadas}/${statsGerais.total_datas}`);
    console.log(`   ✅ Total de insumos importados: ${statsGerais.total_insumos_importados}`);
    console.log(`   ⚠️  Datas sem dados: ${statsGerais.datas_sem_dados}`);
    console.log(`   ❌ Erros: ${statsGerais.erros}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: statsGerais,
        message: `Sincronização retroativa concluída: ${data_inicio} a ${data_fim}`,
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

