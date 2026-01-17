/**
 * Edge Function: Sincronizar CMV do Google Sheets
 * 
 * Busca os dados de CMV diretamente da aba "CMV Semanal" do Google Sheets
 * e atualiza a tabela cmv_semanal no Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuração da planilha
const SPREADSHEET_ID = '1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8';
const API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';
const BAR_ID = 3; // Ordinário Bar

/**
 * Converter valor monetário BR para número
 */
function parseMonetario(valor: string | null | undefined): number {
  if (!valor) return 0;
  
  let str = valor.toString().trim();
  
  // Verificar se é valor zerado ou vazio
  if (str === '' || str === '-' || str === 'R$ -' || str === 'R$  -   ' || str.includes('#REF')) {
    return 0;
  }
  
  // Verificar se é negativo (entre parênteses)
  const isNegativo = str.includes('(') && str.includes(')');
  
  // Remove "R$", parênteses, espaços e caracteres especiais
  const limpo = str
    .replace(/R\$/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\s/g, '')
    .replace(/\u00A0/g, '') // Non-breaking space
    .replace(/\./g, '')     // Remove pontos de milhar
    .replace(',', '.');     // Converte vírgula decimal para ponto
  
  const num = parseFloat(limpo);
  if (isNaN(num)) return 0;
  
  return isNegativo ? -num : num;
}

/**
 * Converter percentual BR para número
 */
function parsePercentual(valor: string | null | undefined): number {
  if (!valor) return 0;
  const limpo = valor.toString()
    .replace('%', '')
    .replace(',', '.');
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

/**
 * Converter data DD/MM/YYYY para YYYY-MM-DD
 */
function converterData(dataStr: string | null | undefined): string | null {
  if (!dataStr) return null;
  
  const str = dataStr.toString().trim();
  if (!str.includes('/')) return null;
  
  const partes = str.split('/');
  if (partes.length !== 3) return null;
  
  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/**
 * Buscar dados do Google Sheets
 */
async function buscarDadosSheets(range: string): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao acessar planilha: ${response.status}`);
  }
  const data = await response.json();
  return data.values || [];
}

/**
 * Encontrar coluna da semana na planilha
 */
function encontrarColunaSemana(cabecalho: string[], semana: number): number {
  const semanaStr = `Semana ${semana.toString().padStart(2, '0')}`;
  const semanaStr2 = `Semana ${semana}`;
  
  for (let i = 0; i < cabecalho.length; i++) {
    if (cabecalho[i] === semanaStr || cabecalho[i] === semanaStr2) {
      return i;
    }
  }
  return -1;
}

/**
 * Processar dados de uma semana
 */
async function processarSemana(linhas: any[][], colunaIdx: number, semana: number, ano: number) {
  // Estrutura da planilha CMV Semanal:
  // Linha 1: Cabeçalho (Semana XX)
  // Linha 2: Data início (de)
  // Linha 3: Data fim (a)
  // Linha 4: Estoque Inicial
  // Linha 5: Compras
  // Linha 6: Estoque Final
  // Linha 7: Consumo Sócios
  // Linha 8: Consumo Benefícios
  // Linha 9: Consumo ADM
  // Linha 10: Consumo RH
  // Linha 11: Consumo Artista
  // Linha 12: Outros Ajustes
  // Linha 13: Ajuste Bonificações
  // Linha 14: CMV Real (R$)
  // Linha 15: Faturamento CMVível
  // Linha 16: CMV Limpo (%)
  // Linha 17: CMV Teórico (%)
  // Linha 18: Gap
  // Linha 19: Faturamento Total
  // Linha 20: CMV Real (%)
  
  const getValor = (linhaIdx: number) => {
    if (linhaIdx >= linhas.length) return null;
    const linha = linhas[linhaIdx];
    if (!linha || colunaIdx >= linha.length) return null;
    return linha[colunaIdx];
  };

  // Buscar valores da coluna
  const dataInicio = converterData(getValor(1)); // Linha 2 (DD/MM/YYYY -> YYYY-MM-DD)
  const dataFim = converterData(getValor(2)); // Linha 3 (DD/MM/YYYY -> YYYY-MM-DD)
  const estoqueInicial = parseMonetario(getValor(3)); // Linha 4
  const compras = parseMonetario(getValor(4)); // Linha 5
  const estoqueFinal = parseMonetario(getValor(5)); // Linha 6
  const consumoSocios = parseMonetario(getValor(6)); // Linha 7
  const consumoBeneficios = parseMonetario(getValor(7)); // Linha 8
  const consumoAdm = parseMonetario(getValor(8)); // Linha 9
  const consumoRh = parseMonetario(getValor(9)); // Linha 10
  const consumoArtista = parseMonetario(getValor(10)); // Linha 11
  const outrosAjustes = parseMonetario(getValor(11)); // Linha 12
  const ajusteBonificacoes = parseMonetario(getValor(12)); // Linha 13
  const cmvReal = parseMonetario(getValor(13)); // Linha 14
  const faturamentoCmvivel = parseMonetario(getValor(14)); // Linha 15
  const cmvLimpoPercent = parsePercentual(getValor(15)); // Linha 16
  const cmvTeoricoPercent = parsePercentual(getValor(16)); // Linha 17
  const faturamentoTotal = parseMonetario(getValor(18)); // Linha 19

  // Calcular Gap
  const gap = cmvLimpoPercent - cmvTeoricoPercent;

  return {
    bar_id: BAR_ID,
    ano,
    semana,
    data_inicio: dataInicio,
    data_fim: dataFim,
    estoque_inicial: estoqueInicial,
    compras_periodo: compras,
    estoque_final: estoqueFinal,
    consumo_socios: consumoSocios,
    consumo_beneficios: consumoBeneficios,
    consumo_adm: consumoAdm,
    consumo_rh: consumoRh,
    consumo_artista: consumoArtista,
    outros_ajustes: outrosAjustes,
    ajuste_bonificacoes: ajusteBonificacoes,
    cmv_real: cmvReal,
    faturamento_cmvivel: faturamentoCmvivel,
    cmv_limpo_percentual: cmvLimpoPercent,
    cmv_teorico_percentual: cmvTeoricoPercent,
    gap: gap,
    faturamento_bruto: faturamentoTotal,
    updated_at: new Date().toISOString()
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔄 Sincronizando CMV do Google Sheets...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parâmetros opcionais
    const body = await req.json().catch(() => ({}));
    const semanaEspecifica = body.semana; // Opcional: processar apenas uma semana
    const anoEspecifico = body.ano || new Date().getFullYear();

    // Buscar dados da aba CMV Semanal (range amplo para pegar todas as semanas)
    console.log('📊 Buscando dados da aba CMV Semanal...');
    const linhas = await buscarDadosSheets("'CMV Semanal'!A1:DZ25");
    
    if (linhas.length < 15) {
      throw new Error('Planilha com dados insuficientes');
    }

    const cabecalho = linhas[0];
    console.log(`📋 Colunas encontradas: ${cabecalho.length}`);

    const resultados: any[] = [];
    const semanasProcessadas: number[] = [];

    // Processar cada semana encontrada
    for (let i = 1; i < cabecalho.length; i++) {
      const col = cabecalho[i];
      if (!col || !col.toString().includes('Semana')) continue;
      
      // Extrair número da semana
      const match = col.toString().match(/Semana\s*(\d+)/i);
      if (!match) continue;
      
      const semana = parseInt(match[1]);
      
      // Se especificou uma semana, processar apenas ela
      if (semanaEspecifica && semana !== semanaEspecifica) continue;

      // Determinar ano baseado na data
      const dataInicio = linhas[1]?.[i];
      let ano = anoEspecifico;
      if (dataInicio && dataInicio.includes('/')) {
        const partes = dataInicio.split('/');
        if (partes.length === 3) {
          ano = parseInt(partes[2]);
        }
      }

      try {
        const dados = await processarSemana(linhas, i, semana, ano);
        
        // Só salvar se tiver CMV real válido (diferente de zero)
        // Valores negativos também são válidos (significa estoque aumentou)
        if (dados.cmv_real !== 0) {
          // Upsert no banco
          const { error } = await supabase
            .from('cmv_semanal')
            .upsert(dados, { onConflict: 'bar_id,ano,semana' });

          if (error) {
            console.error(`❌ Erro semana ${semana}:`, error.message);
            resultados.push({ semana, ano, success: false, error: error.message });
          } else {
            console.log(`✅ Semana ${semana}/${ano}: CMV R$ ${dados.cmv_real.toFixed(2)} | ${dados.cmv_limpo_percentual.toFixed(1)}%`);
            resultados.push({ semana, ano, success: true, cmv_real: dados.cmv_real, cmv_limpo: dados.cmv_limpo_percentual });
            semanasProcessadas.push(semana);
          }
        }
      } catch (err: any) {
        console.error(`❌ Erro ao processar semana ${semana}:`, err.message);
        resultados.push({ semana, success: false, error: err.message });
      }
    }

    console.log(`\n✅ Sincronização concluída: ${semanasProcessadas.length} semanas processadas`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${semanasProcessadas.length} semanas sincronizadas do Google Sheets`,
        semanas: semanasProcessadas,
        resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
