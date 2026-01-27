import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * 🔄 Edge Function - Sincronização Automática de Insumos e Receitas
 * 
 * Sincroniza insumos e receitas do Google Sheets para o Supabase
 * - Detecta automaticamente alterações
 * - Salva histórico com versionamento
 * - Só atualiza se houver mudanças
 * 
 * Chamado automaticamente via pg_cron diariamente
 */

// PLANILHA_ID será buscado do banco de dados por bar_id
// BAR_ID será passado como parâmetro obrigatório

interface InsumoSheet {
  codigo: string;
  nome: string;
  categoria: string;
  tipo_local: string;
  unidade_medida: string;
  custo_unitario: number;
  observacoes?: string;
}

interface ReceitaSheet {
  codigo: string;
  nome: string;
  categoria: string;
  tipo_local: string;
  rendimento_esperado: number;
  observacoes?: string;
  insumos: Array<{
    codigo: string;
    quantidade: number;
    is_chefe: boolean;
  }>;
}

/**
 * Buscar dados do Google Sheets
 */
async function buscarDadosSheets(): Promise<{ insumos: InsumoSheet[]; receitas: ReceitaSheet[] }> {
  console.log('📊 Buscando dados do Google Sheets...');
  
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
  if (!GOOGLE_API_KEY) {
    throw new Error('GOOGLE_SHEETS_API_KEY não configurada');
  }

  // Buscar insumos
  const insumosUrl = `https://sheets.googleapis.com/v4/spreadsheets/${PLANILHA_ID}/values/Insumos!A2:G?key=${GOOGLE_API_KEY}`;
  const insumosResponse = await fetch(insumosUrl);
  const insumosData = await insumosResponse.json();
  
  const insumos: InsumoSheet[] = (insumosData.values || []).map((row: any[]) => ({
    codigo: row[0]?.trim() || '',
    nome: row[1]?.trim() || '',
    categoria: row[2]?.trim() || 'cozinha',
    tipo_local: row[3]?.trim() || 'cozinha',
    unidade_medida: row[4]?.trim() || 'g',
    custo_unitario: parseFloat(row[5] || '0'),
    observacoes: row[6]?.trim() || '',
  })).filter(i => i.codigo && i.nome);

  // Buscar receitas
  const receitasUrl = `https://sheets.googleapis.com/v4/spreadsheets/${PLANILHA_ID}/values/Receitas!A2:F?key=${GOOGLE_API_KEY}`;
  const receitasResponse = await fetch(receitasUrl);
  const receitasData = await receitasResponse.json();
  
  // Buscar insumos das receitas
  const receitasInsumosUrl = `https://sheets.googleapis.com/v4/spreadsheets/${PLANILHA_ID}/values/Receitas_Insumos!A2:D?key=${GOOGLE_API_KEY}`;
  const receitasInsumosResponse = await fetch(receitasInsumosUrl);
  const receitasInsumosData = await receitasInsumosResponse.json();
  
  const receitas: ReceitaSheet[] = (receitasData.values || []).map((row: any[]) => {
    const codigo = row[0]?.trim() || '';
    const insumos = (receitasInsumosData.values || [])
      .filter((r: any[]) => r[0]?.trim() === codigo)
      .map((r: any[]) => ({
        codigo: r[1]?.trim() || '',
        quantidade: parseFloat(r[2] || '0'),
        is_chefe: r[3]?.toLowerCase() === 'sim',
      }));
    
    return {
      codigo,
      nome: row[1]?.trim() || '',
      categoria: row[2]?.trim() || '',
      tipo_local: row[3]?.trim() || 'cozinha',
      rendimento_esperado: parseFloat(row[4] || '1'),
      observacoes: row[5]?.trim() || '',
      insumos,
    };
  }).filter(r => r.codigo && r.nome);

  console.log(`✅ Sheets: ${insumos.length} insumos, ${receitas.length} receitas`);
  
  return { insumos, receitas };
}

/**
 * Gerar versão automática
 */
async function gerarVersao(supabase: any): Promise<string> {
  const hoje = new Date().toISOString().split('T')[0];
  
  // Verificar quantas versões já existem hoje
  const { data, error } = await supabase
    .from('insumos_historico')
    .select('versao')
    .like('versao', `${hoje}-%`)
    .order('versao', { ascending: false })
    .limit(1);
  
  if (error) {
    console.warn('Erro ao buscar versões:', error);
    return `${hoje}-v1`;
  }
  
  if (!data || data.length === 0) {
    return `${hoje}-v1`;
  }
  
  // Extrair número da versão
  const ultimaVersao = data[0].versao;
  const match = ultimaVersao.match(/-v(\d+)$/);
  const numeroVersao = match ? parseInt(match[1]) + 1 : 1;
  
  return `${hoje}-v${numeroVersao}`;
}

/**
 * Comparar e detectar mudanças
 */
function detectarMudancasInsumos(atual: any[], sheets: InsumoSheet[]): boolean {
  if (atual.length !== sheets.length) return true;
  
  const atualMap = new Map(atual.map(i => [i.codigo, i]));
  
  for (const insumo of sheets) {
    const existente = atualMap.get(insumo.codigo);
    if (!existente) return true;
    
    if (
      existente.nome !== insumo.nome ||
      existente.custo_unitario !== insumo.custo_unitario ||
      existente.categoria !== insumo.categoria ||
      existente.tipo_local !== insumo.tipo_local ||
      existente.unidade_medida !== insumo.unidade_medida
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Sincronizar insumos
 */
async function sincronizarInsumos(
  supabase: any, 
  insumos: InsumoSheet[], 
  versao: string
): Promise<{ atualizados: number; novos: number }> {
  console.log('\n📦 Sincronizando insumos...');
  
  let atualizados = 0;
  let novos = 0;
  
  for (const insumo of insumos) {
    // Verificar se existe
    const { data: existente } = await supabase
      .from('insumos')
      .select('*')
      .eq('bar_id', BAR_ID)
      .eq('codigo', insumo.codigo)
      .single();
    
    if (existente) {
      // Salvar histórico
      await supabase.from('insumos_historico').insert({
        insumo_id: existente.id,
        bar_id: BAR_ID,
        codigo: existente.codigo,
        nome: existente.nome,
        categoria: existente.categoria,
        tipo_local: existente.tipo_local,
        unidade_medida: existente.unidade_medida,
        custo_unitario: existente.custo_unitario,
        observacoes: existente.observacoes,
        versao,
        origem: 'sheets_sync',
        data_snapshot: new Date().toISOString(),
      });
      
      // Atualizar
      await supabase
        .from('insumos')
        .update({
          nome: insumo.nome,
          categoria: insumo.categoria,
          tipo_local: insumo.tipo_local,
          unidade_medida: insumo.unidade_medida,
          custo_unitario: insumo.custo_unitario,
          observacoes: insumo.observacoes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existente.id);
      
      atualizados++;
    } else {
      // Criar novo
      const { data: novo } = await supabase
        .from('insumos')
        .insert({
          bar_id: BAR_ID,
          codigo: insumo.codigo,
          nome: insumo.nome,
          categoria: insumo.categoria,
          tipo_local: insumo.tipo_local,
          unidade_medida: insumo.unidade_medida,
          custo_unitario: insumo.custo_unitario,
          observacoes: insumo.observacoes,
          ativo: true,
        })
        .select()
        .single();
      
      if (novo) {
        // Salvar histórico do novo
        await supabase.from('insumos_historico').insert({
          insumo_id: novo.id,
          bar_id: BAR_ID,
          codigo: novo.codigo,
          nome: novo.nome,
          categoria: novo.categoria,
          tipo_local: novo.tipo_local,
          unidade_medida: novo.unidade_medida,
          custo_unitario: novo.custo_unitario,
          observacoes: novo.observacoes,
          versao,
          origem: 'sheets_sync',
          data_snapshot: new Date().toISOString(),
        });
        
        novos++;
      }
    }
  }
  
  console.log(`✅ Insumos: ${atualizados} atualizados, ${novos} novos`);
  return { atualizados, novos };
}

/**
 * Sincronizar receitas
 */
async function sincronizarReceitas(
  supabase: any,
  receitas: ReceitaSheet[],
  versao: string
): Promise<{ atualizadas: number; novas: number }> {
  console.log('\n👨‍🍳 Sincronizando receitas...');
  
  let atualizadas = 0;
  let novas = 0;
  
  for (const receita of receitas) {
    // Verificar se existe
    const { data: existente } = await supabase
      .from('receitas')
      .select('*')
      .eq('bar_id', BAR_ID)
      .eq('receita_codigo', receita.codigo)
      .single();
    
    if (existente) {
      // Buscar insumos atuais
      const { data: insumosAtuais } = await supabase
        .from('receitas_insumos')
        .select('*')
        .eq('receita_id', existente.id);
      
      // Salvar histórico
      await supabase.from('receitas_historico').insert({
        receita_id: existente.id,
        bar_id: BAR_ID,
        receita_codigo: existente.receita_codigo,
        receita_nome: existente.receita_nome,
        receita_categoria: existente.receita_categoria,
        tipo_local: existente.tipo_local,
        rendimento_esperado: existente.rendimento_esperado,
        insumos: insumosAtuais || [],
        versao,
        origem: 'sheets_sync',
        data_snapshot: new Date().toISOString(),
      });
      
      // Atualizar receita
      await supabase
        .from('receitas')
        .update({
          receita_nome: receita.nome,
          receita_categoria: receita.categoria,
          tipo_local: receita.tipo_local,
          rendimento_esperado: receita.rendimento_esperado,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existente.id);
      
      // Atualizar insumos
      await supabase
        .from('receitas_insumos')
        .delete()
        .eq('receita_id', existente.id);
      
      for (const insumo of receita.insumos) {
        const { data: insumoDb } = await supabase
          .from('insumos')
          .select('id')
          .eq('bar_id', BAR_ID)
          .eq('codigo', insumo.codigo)
          .single();
        
        if (insumoDb) {
          await supabase.from('receitas_insumos').insert({
            receita_id: existente.id,
            insumo_id: insumoDb.id,
            quantidade_necessaria: insumo.quantidade,
            is_chefe: insumo.is_chefe,
          });
        }
      }
      
      atualizadas++;
    } else {
      // Criar nova receita
      const { data: nova } = await supabase
        .from('receitas')
        .insert({
          bar_id: BAR_ID,
          receita_codigo: receita.codigo,
          receita_nome: receita.nome,
          receita_categoria: receita.categoria,
          tipo_local: receita.tipo_local,
          rendimento_esperado: receita.rendimento_esperado,
          ativo: true,
        })
        .select()
        .single();
      
      if (nova) {
        // Adicionar insumos
        for (const insumo of receita.insumos) {
          const { data: insumoDb } = await supabase
            .from('insumos')
            .select('id')
            .eq('bar_id', BAR_ID)
            .eq('codigo', insumo.codigo)
            .single();
          
          if (insumoDb) {
            await supabase.from('receitas_insumos').insert({
              receita_id: nova.id,
              insumo_id: insumoDb.id,
              quantidade_necessaria: insumo.quantidade,
              is_chefe: insumo.is_chefe,
            });
          }
        }
        
        // Salvar histórico
        const { data: insumosNovos } = await supabase
          .from('receitas_insumos')
          .select('*')
          .eq('receita_id', nova.id);
        
        await supabase.from('receitas_historico').insert({
          receita_id: nova.id,
          bar_id: BAR_ID,
          receita_codigo: nova.receita_codigo,
          receita_nome: nova.receita_nome,
          receita_categoria: nova.receita_categoria,
          tipo_local: nova.tipo_local,
          rendimento_esperado: nova.rendimento_esperado,
          insumos: insumosNovos || [],
          versao,
          origem: 'sheets_sync',
          data_snapshot: new Date().toISOString(),
        });
        
        novas++;
      }
    }
  }
  
  console.log(`✅ Receitas: ${atualizadas} atualizadas, ${novas} novas`);
  return { atualizadas, novas };
}

/**
 * Handler principal
 */
serve(async (req) => {
  // CORS
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
    console.log('🚀 Iniciando sincronização de insumos e receitas...');
    
    // Autenticação
    const authHeader = req.headers.get('authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    const requestBody = await req.text().catch(() => '{}');
    const { cronSecret } = JSON.parse(requestBody || '{}');
    
    const isAuthorized = 
      (authHeader && authHeader.includes(serviceRoleKey || '')) ||
      cronSecret === 'pgcron_insumos_receitas' ||
      cronSecret === 'manual_test';
    
    if (!isAuthorized && authHeader && !authHeader.includes('anon')) {
      return new Response(
        JSON.stringify({ error: 'Acesso não autorizado' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Inicializar Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar dados do Sheets
    const { insumos, receitas } = await buscarDadosSheets();
    
    if (insumos.length === 0 && receitas.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum dado encontrado no Sheets',
          timestamp: new Date().toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verificar se há mudanças
    const { data: insumosAtuais } = await supabase
      .from('insumos')
      .select('*')
      .eq('bar_id', BAR_ID)
      .eq('ativo', true);
    
    const temMudancas = detectarMudancasInsumos(insumosAtuais || [], insumos);
    
    if (!temMudancas && insumosAtuais && insumosAtuais.length === insumos.length) {
      console.log('✅ Nenhuma mudança detectada - sync não necessário');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhuma alteração detectada',
          timestamp: new Date().toISOString(),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Gerar versão
    const versao = await gerarVersao(supabase);
    console.log(`📌 Versão: ${versao}`);
    
    // Sincronizar
    const resultInsumos = await sincronizarInsumos(supabase, insumos, versao);
    const resultReceitas = await sincronizarReceitas(supabase, receitas, versao);
    
    // Registrar log de sync
    await supabase.from('sync_logs').insert({
      tipo: 'insumos_receitas',
      versao,
      origem: 'sheets',
      status: 'sucesso',
      detalhes: {
        insumos: resultInsumos,
        receitas: resultReceitas,
      },
      timestamp: new Date().toISOString(),
    });
    
    return new Response(
      JSON.stringify({
        success: true,
        versao,
        insumos: resultInsumos,
        receitas: resultReceitas,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

