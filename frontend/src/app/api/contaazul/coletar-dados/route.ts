import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando COLETA RÁPIDA dos dados ContaAzul...');
    
    const { bar_id } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar credenciais do banco
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials || !credentials.access_token) {
      return NextResponse.json(
        { success: false, message: 'Token de acesso não disponível. Reconecte a integração.' },
        { status: 400 }
      );
    }

    // Verificar se o token não expirou
    const tokenValid = credentials.expires_at ? new Date(credentials.expires_at) > new Date() : false;
    if (!tokenValid) {
      return NextResponse.json(
        { success: false, message: 'Token expirado. Renove o token ou reconecte a integração.' },
        { status: 400 }
      );
    }

    const access_token = credentials.access_token;
    let totalColetado = 0;
    let totalErros = 0;

    try {
      // 1. COLETAR RECEITAS (JSON bruto)
      console.log('💰 Coletando receitas...');
      const receitasResult = await coletarDadosBrutos(
        access_token, 
        parseInt(bar_id), 
        'receitas',
        'https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber/buscar'
      );
      totalColetado += receitasResult.coletados;
      totalErros += receitasResult.erros;

      // 2. COLETAR DESPESAS (JSON bruto)
      console.log('💸 Coletando despesas...');
      const despesasResult = await coletarDadosBrutos(
        access_token, 
        parseInt(bar_id), 
        'despesas',
        'https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar'
      );
      totalColetado += despesasResult.coletados;
      totalErros += despesasResult.erros;

      // 3. COLETAR CATEGORIAS (JSON bruto)
      console.log('📋 Coletando categorias...');
      const categoriasResult = await coletarDadosBrutos(
        access_token, 
        parseInt(bar_id), 
        'categorias',
        'https://api-v2.contaazul.com/v1/categorias'
      );
      totalColetado += categoriasResult.coletados;
      totalErros += categoriasResult.erros;

      // 4. COLETAR CONTAS FINANCEIRAS (JSON bruto)
      console.log('🏦 Coletando contas financeiras...');
      const contasResult = await coletarDadosBrutos(
        access_token, 
        parseInt(bar_id), 
        'contas',
        'https://api-v2.contaazul.com/v1/conta-financeira'
      );
      totalColetado += contasResult.coletados;
      totalErros += contasResult.erros;

      console.log(`✅ Coleta concluída! ${totalColetado} páginas coletadas, ${totalErros} erros`);

      return NextResponse.json({
        success: true,
        message: 'Coleta de dados brutos concluída com sucesso',
        detalhes: {
          total_paginas_coletadas: totalColetado,
          total_erros: totalErros,
          receitas: receitasResult,
          despesas: despesasResult,
          categorias: categoriasResult,
          contas: contasResult,
          proximo_passo: 'Execute o processamento dos dados coletados'
        }
      });

    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('❌ Erro na coleta de dados:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro na coleta de dados',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// Função para coletar dados brutos por tipo
async function coletarDadosBrutos(
  accessToken: string, 
  barId: number, 
  tipoDados: string,
  baseEndpoint: string
) {
  let coletados = 0;
  let erros = 0;
  let pagina = 1;
  const maxPaginas = 50; // Muito maior porque só salva JSON
  const itensPorPagina = 500; // Máximo possível

  console.log(`📥 Coletando ${tipoDados}...`);

  // Para endpoints que não usam paginação
  if (tipoDados === 'categorias' || tipoDados === 'contas') {
    try {
      const response = await fetch(baseEndpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const dadosBrutos = await response.json();
        
        // Salvar JSON bruto no banco
        await supabase
          .from('contaazul_raw_data')
          .upsert({
            bar_id: barId,
            tipo_dados: tipoDados,
            endpoint: baseEndpoint,
            pagina: 1,
            total_itens: Array.isArray(dadosBrutos) ? dadosBrutos.length : (dadosBrutos.itens?.length || 1),
            dados_brutos: dadosBrutos
          }, {
            onConflict: 'bar_id,tipo_dados,endpoint,pagina'
          });

        coletados = 1;
        console.log(`✅ ${tipoDados}: 1 página coletada`);
      } else {
        console.error(`❌ Erro ao coletar ${tipoDados}:`, response.status);
        erros = 1;
      }
    } catch (error) {
      console.error(`❌ Erro ao coletar ${tipoDados}:`, error);
      erros = 1;
    }

    return { coletados, erros };
  }

  // Para endpoints com paginação (receitas e despesas)
  while (pagina <= maxPaginas) {
    try {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        tamanho_pagina: itensPorPagina.toString(),
        data_vencimento_de: '2024-01-01',
        data_vencimento_ate: '2027-01-01'
      });

      const response = await fetch(`${baseEndpoint}?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`❌ Erro ao coletar ${tipoDados} página ${pagina}:`, response.status);
        erros++;
        break;
      }

      const dadosBrutos = await response.json();
      const itens = dadosBrutos.itens || [];

      if (itens.length === 0) {
        console.log(`✅ ${tipoDados}: Todas as páginas coletadas (${coletados} páginas)`);
        break;
      }

      // APENAS SALVAR JSON BRUTO - SEM PROCESSAMENTO
      await supabase
        .from('contaazul_raw_data')
        .upsert({
          bar_id: barId,
          tipo_dados: tipoDados,
          endpoint: baseEndpoint,
          pagina: pagina,
          total_itens: itens.length,
          dados_brutos: dadosBrutos
        }, {
          onConflict: 'bar_id,tipo_dados,endpoint,pagina'
        });

      coletados++;
      console.log(`📥 ${tipoDados} página ${pagina}: ${itens.length} itens coletados (total: ${coletados} páginas)`);
      
      // Se retornou menos que o tamanho da página, chegamos ao fim
      if (itens.length < itensPorPagina) {
        console.log(`✅ ${tipoDados}: Coleta finalizada (${coletados} páginas)`);
        break;
      }
      
      pagina++;
    } catch (error) {
      console.error(`❌ Erro na página ${pagina} de ${tipoDados}:`, error);
      erros++;
      break;
    }
  }

  return { coletados, erros };
} 