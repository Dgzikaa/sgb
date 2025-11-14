/**
 * Script de Transição: Sincronização de Insumos e Receitas com Histórico
 * 
 * Este script:
 * 1. Puxa dados do Google Sheets
 * 2. Atualiza insumos e receitas no Supabase
 * 3. Salva histórico com versionamento
 * 
 * USO:
 * node exemplo_teste/sync-insumos-receitas-historico.js
 * 
 * IMPORTANTE: 
 * - Sempre salva uma versão antes de atualizar
 * - Mantém histórico completo de alterações
 * - Gera versão automática no formato: YYYY-MM-DD-vN
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuração Google Sheets
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const PLANILHA_ID = '1-BQfRTCa9U_NkRvF8Ksu5aAQYxwcNCbGfRAj_8YwvJ8';
const BAR_ID = 3;

const jwt = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});

/**
 * Gera versão automática baseada na data e contagem do dia
 */
async function gerarVersao() {
  const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Buscar última versão do dia
  const { data: ultimaVersao } = await supabase
    .from('insumos_historico')
    .select('versao')
    .like('versao', `${hoje}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (ultimaVersao) {
    // Extrair número da versão e incrementar
    const match = ultimaVersao.versao.match(/v(\d+)$/);
    const numero = match ? parseInt(match[1]) + 1 : 1;
    return `${hoje}-v${numero}`;
  }

  return `${hoje}-v1`;
}

/**
 * Salva histórico de um insumo
 */
async function salvarHistoricoInsumo(insumo, versao, origem = 'sheets') {
  const historico = {
    insumo_id: insumo.id,
    bar_id: insumo.bar_id,
    codigo: insumo.codigo,
    nome: insumo.nome,
    categoria: insumo.categoria,
    tipo_local: insumo.tipo_local,
    unidade_medida: insumo.unidade_medida,
    custo_unitario: insumo.custo_unitario,
    observacoes: insumo.observacoes,
    versao,
    origem,
    data_atualizacao: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('insumos_historico')
    .insert(historico);

  if (error) {
    console.error(`❌ Erro ao salvar histórico do insumo ${insumo.codigo}:`, error);
  }
}

/**
 * Salva histórico de uma receita
 */
async function salvarHistoricoReceita(receita, insumos, versao, origem = 'sheets') {
  const historico = {
    receita_id: receita.id,
    bar_id: receita.bar_id,
    receita_codigo: receita.receita_codigo,
    receita_nome: receita.receita_nome,
    receita_categoria: receita.receita_categoria,
    tipo_local: receita.tipo_local,
    rendimento_esperado: receita.rendimento_esperado,
    observacoes: receita.observacoes,
    insumo_chefe_id: receita.insumo_chefe_id,
    insumos: insumos, // Array de insumos
    versao,
    origem,
    data_atualizacao: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('receitas_historico')
    .insert(historico);

  if (error) {
    console.error(`❌ Erro ao salvar histórico da receita ${receita.receita_codigo}:`, error);
  }
}

/**
 * Sincroniza insumos do Google Sheets
 */
async function sincronizarInsumos(versao) {
  console.log('\n📦 Sincronizando Insumos...');
  
  const doc = new GoogleSpreadsheet(PLANILHA_ID, jwt);
  await doc.loadInfo();
  
  const sheetInsumos = doc.sheetsByTitle['Insumos'];
  if (!sheetInsumos) {
    console.error('❌ Aba "Insumos" não encontrada');
    return;
  }

  const rows = await sheetInsumos.getRows();
  let insumosAtualizados = 0;
  let insumosNovos = 0;

  for (const row of rows) {
    const codigo = row.get('Código')?.trim();
    const nome = row.get('Nome')?.trim();
    const categoria = row.get('Categoria')?.trim() || 'cozinha';
    const tipoLocal = row.get('Tipo Local')?.trim() || 'cozinha';
    const unidadeMedida = row.get('Unidade')?.trim() || 'g';
    const custoUnitario = parseFloat(row.get('Custo Unitário') || '0');
    const observacoes = row.get('Observações')?.trim() || '';

    if (!codigo || !nome) continue;

    // Verificar se insumo existe
    const { data: insumoExistente } = await supabase
      .from('insumos')
      .select('*')
      .eq('bar_id', BAR_ID)
      .eq('codigo', codigo)
      .single();

    if (insumoExistente) {
      // Salvar histórico antes de atualizar
      await salvarHistoricoInsumo(insumoExistente, versao, 'sheets');

      // Atualizar insumo
      const { error } = await supabase
        .from('insumos')
        .update({
          nome,
          categoria,
          tipo_local: tipoLocal,
          unidade_medida: unidadeMedida,
          custo_unitario: custoUnitario,
          observacoes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', insumoExistente.id);

      if (!error) {
        insumosAtualizados++;
        console.log(`✅ Atualizado: ${codigo} - ${nome}`);
      }
    } else {
      // Criar novo insumo
      const { data: novoInsumo, error } = await supabase
        .from('insumos')
        .insert({
          bar_id: BAR_ID,
          codigo,
          nome,
          categoria,
          tipo_local: tipoLocal,
          unidade_medida: unidadeMedida,
          custo_unitario: custoUnitario,
          observacoes,
          ativo: true,
        })
        .select()
        .single();

      if (!error && novoInsumo) {
        // Salvar primeiro histórico
        await salvarHistoricoInsumo(novoInsumo, versao, 'sheets');
        insumosNovos++;
        console.log(`🆕 Criado: ${codigo} - ${nome}`);
      }
    }
  }

  console.log(`\n📦 Insumos: ${insumosAtualizados} atualizados, ${insumosNovos} novos`);
}

/**
 * Sincroniza receitas do Google Sheets
 */
async function sincronizarReceitas(versao) {
  console.log('\n👨‍🍳 Sincronizando Receitas...');
  
  const doc = new GoogleSpreadsheet(PLANILHA_ID, jwt);
  await doc.loadInfo();
  
  const sheetReceitas = doc.sheetsByTitle['Receitas'];
  const sheetReceitasInsumos = doc.sheetsByTitle['Receitas_Insumos'];
  
  if (!sheetReceitas || !sheetReceitasInsumos) {
    console.error('❌ Abas de receitas não encontradas');
    return;
  }

  const rowsReceitas = await sheetReceitas.getRows();
  const rowsInsumos = await sheetReceitasInsumos.getRows();
  
  let receitasAtualizadas = 0;
  let receitasNovas = 0;

  for (const row of rowsReceitas) {
    const receitaCodigo = row.get('Código')?.trim();
    const receitaNome = row.get('Nome')?.trim();
    const receitaCategoria = row.get('Categoria')?.trim() || '';
    const tipoLocal = row.get('Tipo Local')?.trim() || 'cozinha';
    const rendimentoEsperado = parseFloat(row.get('Rendimento Esperado') || '1');
    const observacoes = row.get('Observações')?.trim() || '';

    if (!receitaCodigo || !receitaNome) continue;

    // Buscar insumos da receita
    const insumosReceita = rowsInsumos
      .filter(r => r.get('Receita Código')?.trim() === receitaCodigo)
      .map(r => ({
        codigo: r.get('Insumo Código')?.trim(),
        quantidade: parseFloat(r.get('Quantidade') || '0'),
        is_chefe: r.get('É Chefe')?.toLowerCase() === 'sim',
      }));

    // Verificar se receita existe
    const { data: receitaExistente } = await supabase
      .from('receitas')
      .select('*')
      .eq('bar_id', BAR_ID)
      .eq('receita_codigo', receitaCodigo)
      .single();

    if (receitaExistente) {
      // Buscar insumos atuais para histórico
      const { data: insumosAtuais } = await supabase
        .from('receitas_insumos')
        .select('*')
        .eq('receita_id', receitaExistente.id);

      // Salvar histórico antes de atualizar
      await salvarHistoricoReceita(receitaExistente, insumosAtuais, versao, 'sheets');

      // Atualizar receita
      const { error } = await supabase
        .from('receitas')
        .update({
          receita_nome: receitaNome,
          receita_categoria: receitaCategoria,
          tipo_local: tipoLocal,
          rendimento_esperado: rendimentoEsperado,
          observacoes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', receitaExistente.id);

      if (!error) {
        // Atualizar insumos da receita (deletar e recriar)
        await supabase
          .from('receitas_insumos')
          .delete()
          .eq('receita_id', receitaExistente.id);

        for (const insumoData of insumosReceita) {
          const { data: insumo } = await supabase
            .from('insumos')
            .select('id')
            .eq('bar_id', BAR_ID)
            .eq('codigo', insumoData.codigo)
            .single();

          if (insumo) {
            await supabase
              .from('receitas_insumos')
              .insert({
                receita_id: receitaExistente.id,
                insumo_id: insumo.id,
                quantidade_necessaria: insumoData.quantidade,
                is_chefe: insumoData.is_chefe,
              });
          }
        }

        receitasAtualizadas++;
        console.log(`✅ Atualizada: ${receitaCodigo} - ${receitaNome}`);
      }
    } else {
      // Criar nova receita
      const { data: novaReceita, error } = await supabase
        .from('receitas')
        .insert({
          bar_id: BAR_ID,
          receita_codigo: receitaCodigo,
          receita_nome: receitaNome,
          receita_categoria: receitaCategoria,
          tipo_local: tipoLocal,
          rendimento_esperado: rendimentoEsperado,
          observacoes,
          ativo: true,
        })
        .select()
        .single();

      if (!error && novaReceita) {
        // Adicionar insumos
        const insumosAdicionados = [];
        for (const insumoData of insumosReceita) {
          const { data: insumo } = await supabase
            .from('insumos')
            .select('id, codigo, nome')
            .eq('bar_id', BAR_ID)
            .eq('codigo', insumoData.codigo)
            .single();

          if (insumo) {
            await supabase
              .from('receitas_insumos')
              .insert({
                receita_id: novaReceita.id,
                insumo_id: insumo.id,
                quantidade_necessaria: insumoData.quantidade,
                is_chefe: insumoData.is_chefe,
              });
            
            insumosAdicionados.push({
              insumo_id: insumo.id,
              codigo: insumo.codigo,
              quantidade: insumoData.quantidade,
              is_chefe: insumoData.is_chefe,
            });
          }
        }

        // Salvar primeiro histórico
        await salvarHistoricoReceita(novaReceita, insumosAdicionados, versao, 'sheets');
        receitasNovas++;
        console.log(`🆕 Criada: ${receitaCodigo} - ${receitaNome}`);
      }
    }
  }

  console.log(`\n👨‍🍳 Receitas: ${receitasAtualizadas} atualizadas, ${receitasNovas} novas`);
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando sincronização com histórico...\n');
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  
  try {
    // Gerar versão automática
    const versao = await gerarVersao();
    console.log(`📌 Versão: ${versao}\n`);

    // Sincronizar insumos
    await sincronizarInsumos(versao);

    // Sincronizar receitas
    await sincronizarReceitas(versao);

    console.log('\n✅ Sincronização concluída com sucesso!');
    console.log(`📝 Histórico salvo na versão: ${versao}`);
    
    // Mostrar resumo do histórico
    const { count: totalHistoricoInsumos } = await supabase
      .from('insumos_historico')
      .select('*', { count: 'exact', head: true })
      .eq('versao', versao);

    const { count: totalHistoricoReceitas } = await supabase
      .from('receitas_historico')
      .select('*', { count: 'exact', head: true })
      .eq('versao', versao);

    console.log(`\n📊 Resumo do Histórico:`);
    console.log(`   - Insumos salvos: ${totalHistoricoInsumos || 0}`);
    console.log(`   - Receitas salvas: ${totalHistoricoReceitas || 0}`);

  } catch (error) {
    console.error('\n❌ Erro na sincronização:', error);
    process.exit(1);
  }
}

main();

