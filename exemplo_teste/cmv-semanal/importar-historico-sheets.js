/**
 * Script para importar dados históricos de CMV Semanal do Google Sheets
 * 
 * Planilha: https://docs.google.com/spreadsheets/d/1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8/edit
 * Aba: CMV Semanal
 * 
 * Importa semanas 4 até 45 (2025) como dados históricos
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuração do Google Sheets
const SPREADSHEET_ID = '1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8';
const SHEET_NAME = 'CMV Semanal';

// Configuração da Service Account
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../../google-service-account.json');

/**
 * Autenticar com Google Sheets API
 */
async function autenticarGoogleSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  
  return sheets;
}

/**
 * Buscar dados da planilha
 */
async function buscarDadosSheets() {
  console.log('📊 Buscando dados do Google Sheets...');
  
  const sheets = await autenticarGoogleSheets();
  
  // Buscar dados da aba CMV Semanal
  // Colunas: AK até AR (Semana 39 até Semana 46)
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!AK1:AR250`, // Pegar várias linhas para garantir
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0) {
    throw new Error('Nenhum dado encontrado na planilha');
  }

  return rows;
}

/**
 * Converter letra de coluna para índice
 */
function colunaParaIndice(letra) {
  const colunas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return colunas.indexOf(letra);
}

/**
 * Parsear dados da planilha
 */
function parsearDados(rows) {
  console.log('🔍 Parseando dados da planilha...');
  
  // Primeira linha tem os headers (Semana X)
  const headers = rows[0];
  
  // Segunda linha tem as datas de início
  const datasInicio = rows[1];
  
  // Terceira linha tem as datas de fim
  const datasFim = rows[2];
  
  // Encontrar linhas importantes
  const linhas = {
    estoque_inicial: null,
    compras: null,
    estoque_final: null,
    consumo_socios: null,
    consumo_beneficios: null,
    consumo_adm: null,
    consumo_rh: null,
    consumo_artista: null,
    outros_ajustes: null,
    ajuste_bonificacoes: null,
    cmv_real: null,
    faturamento_cmvivel: null,
    cmv_limpo_percentual: null,
    cmv_teorico_percentual: null,
    gap: null,
    estoque_final_cozinha: null,
    estoque_final_bebidas: null,
    estoque_final_drinks: null,
    compras_cozinha: null,
    compras_bebidas: null,
    compras_drinks: null,
  };

  // Mapear linhas (baseado na estrutura da planilha)
  rows.forEach((row, idx) => {
    const primeiraColuna = row[0]?.toString().toLowerCase() || '';
    
    if (primeiraColuna.includes('estoque inicial')) linhas.estoque_inicial = idx;
    if (primeiraColuna.includes('compras')) linhas.compras = idx;
    if (primeiraColuna.includes('estoque final')) linhas.estoque_final = idx;
    if (primeiraColuna.includes('consumo sócios')) linhas.consumo_socios = idx;
    if (primeiraColuna.includes('consumo benefícios')) linhas.consumo_beneficios = idx;
    if (primeiraColuna.includes('consumo adm')) linhas.consumo_adm = idx;
    if (primeiraColuna.includes('consumo rh')) linhas.consumo_rh = idx;
    if (primeiraColuna.includes('consumo artista')) linhas.consumo_artista = idx;
    if (primeiraColuna.includes('outros ajustes')) linhas.outros_ajustes = idx;
    if (primeiraColuna.includes('ajuste bonificações')) linhas.ajuste_bonificacoes = idx;
    if (primeiraColuna.includes('cmv real')) linhas.cmv_real = idx;
    if (primeiraColuna.includes('faturamento cmvível')) linhas.faturamento_cmvivel = idx;
    if (primeiraColuna.includes('cmv limpo')) linhas.cmv_limpo_percentual = idx;
    if (primeiraColuna.includes('cmv teórico')) linhas.cmv_teorico_percentual = idx;
    if (primeiraColuna.includes('gap') && !primeiraColuna.includes('cmv')) linhas.gap = idx;
    
    // Estoque final detalhado
    if (primeiraColuna.includes('cozinha') && idx > 20) linhas.estoque_final_cozinha = idx;
    if (primeiraColuna.includes('bebidas + tabacaria')) linhas.estoque_final_bebidas = idx;
    if (primeiraColuna.includes('drinks') && idx > 20) linhas.estoque_final_drinks = idx;
    
    // Compras detalhadas
    if (primeiraColuna.includes('compras') && primeiraColuna.includes('cozinha')) linhas.compras_cozinha = idx;
    if (primeiraColuna.includes('compras') && primeiraColuna.includes('bebidas')) linhas.compras_bebidas = idx;
    if (primeiraColuna.includes('compras') && primeiraColuna.includes('drinks')) linhas.compras_drinks = idx;
  });

  console.log('📋 Linhas identificadas:', linhas);

  // Extrair dados de cada semana
  const semanas = [];
  
  headers.forEach((header, colIdx) => {
    if (!header || !header.toString().startsWith('Semana')) return;
    
    // Extrair número da semana
    const match = header.match(/Semana (\d+)/);
    if (!match) return;
    
    const numeroSemana = parseInt(match[1]);
    
    // Pular semanas fora do range 4-45
    if (numeroSemana < 4 || numeroSemana > 45) return;
    
    const dataInicio = datasInicio[colIdx];
    const dataFim = datasFim[colIdx];
    
    if (!dataInicio || !dataFim) return;

    // Função helper para pegar valor da célula
    const getValor = (linha) => {
      if (linha === null) return 0;
      const celula = rows[linha]?.[colIdx];
      if (!celula) return 0;
      
      // Remover "R$" e converter para número
      const valor = celula.toString()
        .replace('R$', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();
      
      return parseFloat(valor) || 0;
    };

    const semana = {
      bar_id: 3, // Ordinário (hardcoded)
      ano: 2025,
      semana: numeroSemana,
      data_inicio: converterData(dataInicio),
      data_fim: converterData(dataFim),
      
      // Vendas (deixar em branco - será preenchido pelo script automático)
      vendas_brutas: 0,
      vendas_liquidas: 0,
      
      // Estoque e Compras
      estoque_inicial: getValor(linhas.estoque_inicial),
      compras_periodo: getValor(linhas.compras),
      estoque_final: getValor(linhas.estoque_final),
      
      // Consumos
      consumo_socios: getValor(linhas.consumo_socios),
      consumo_beneficios: getValor(linhas.consumo_beneficios),
      consumo_adm: getValor(linhas.consumo_adm),
      consumo_rh: getValor(linhas.consumo_rh),
      consumo_artista: getValor(linhas.consumo_artista),
      outros_ajustes: getValor(linhas.outros_ajustes),
      ajuste_bonificacoes: getValor(linhas.ajuste_bonificacoes),
      
      // Cálculos
      cmv_real: getValor(linhas.cmv_real),
      faturamento_cmvivel: getValor(linhas.faturamento_cmvivel),
      cmv_limpo_percentual: getValor(linhas.cmv_limpo_percentual),
      cmv_teorico_percentual: getValor(linhas.cmv_teorico_percentual),
      gap: getValor(linhas.gap),
      
      // Estoque final detalhado
      estoque_final_cozinha: getValor(linhas.estoque_final_cozinha),
      estoque_final_bebidas: getValor(linhas.estoque_final_bebidas),
      estoque_final_drinks: getValor(linhas.estoque_final_drinks),
      
      // Compras detalhadas
      compras_custo_comida: getValor(linhas.compras_cozinha),
      compras_custo_bebidas: getValor(linhas.compras_bebidas),
      compras_custo_drinks: getValor(linhas.compras_drinks),
      compras_custo_outros: 0,
      
      // Contas especiais (deixar zerado - será preenchido pelo script automático)
      total_consumo_socios: 0,
      mesa_beneficios_cliente: 0,
      mesa_banda_dj: 0,
      chegadeira: 0,
      mesa_adm_casa: 0,
      mesa_rh: 0,
      
      // Categorias legado
      cmv_bebidas: 0,
      cmv_alimentos: 0,
      cmv_descartaveis: 0,
      cmv_outros: 0,
      
      // Metadados
      status: 'fechado',
      responsavel: 'Importação Histórica',
      observacoes: 'Dados importados da planilha Google Sheets'
    };

    semanas.push(semana);
  });

  return semanas;
}

/**
 * Converter data do formato dd/mm/yyyy para yyyy-mm-dd
 */
function converterData(dataStr) {
  if (!dataStr) return null;
  
  const partes = dataStr.toString().split('/');
  if (partes.length !== 3) return null;
  
  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/**
 * Inserir semanas no banco de dados
 */
async function inserirSemanas(semanas) {
  console.log(`\n💾 Inserindo ${semanas.length} semanas no banco de dados...\n`);
  
  let sucesso = 0;
  let erros = 0;

  for (const semana of semanas) {
    try {
      console.log(`📅 Importando Semana ${semana.semana} (${semana.data_inicio} até ${semana.data_fim})`);
      
      const { data, error } = await supabase
        .from('cmv_semanal')
        .upsert(semana, {
          onConflict: 'bar_id,ano,semana'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro na semana ${semana.semana}:`, error.message);
        erros++;
      } else {
        console.log(`✅ Semana ${semana.semana} importada com sucesso`);
        console.log(`   - CMV Real: R$ ${semana.cmv_real.toFixed(2)}`);
        console.log(`   - CMV Limpo: ${semana.cmv_limpo_percentual.toFixed(2)}%`);
        console.log(`   - Gap: ${semana.gap.toFixed(2)}%\n`);
        sucesso++;
      }
    } catch (err) {
      console.error(`❌ Erro ao processar semana ${semana.semana}:`, err.message);
      erros++;
    }
  }

  console.log('\n📊 Resumo da Importação:');
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📦 Total: ${semanas.length}`);
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('🚀 Iniciando importação de CMV Semanal histórico...\n');
    
    // 1. Buscar dados do Google Sheets
    const rows = await buscarDadosSheets();
    
    // 2. Parsear dados
    const semanas = parsearDados(rows);
    
    console.log(`\n📋 ${semanas.length} semanas encontradas para importar\n`);
    
    // 3. Inserir no banco de dados
    await inserirSemanas(semanas);
    
    console.log('\n✅ Importação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na importação:', error);
    process.exit(1);
  }
}

main();

