import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Buscar um token válido na tabela api_credentials
    const { data: contaAzulData } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single();

    if (!contaAzulData?.access_token) {
      return NextResponse.json({ error: 'Token ContaAzul não encontrado. Configure a integração em /configuracoes' }, { status: 400 });
    }

    // Verificar se token não expirou
    if (contaAzulData.expires_at && new Date(contaAzulData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token ContaAzul expirado. Renove em /configuracoes' }, { status: 400 });
    }

    console.log('🔍 Investigando campos não documentados...');

    // Buscar algumas parcelas do banco de dados salvas
    const { data: parcelas } = await supabase
      .from('contaazul_visao_competencia')
      .select('id_parcela, evento_id')
      .not('id_parcela', 'is', null)
      .limit(5);

    if (!parcelas || parcelas.length === 0) {
      return NextResponse.json({ error: 'Nenhuma parcela encontrada no banco' }, { status: 404 });
    }

    const resultados = [];

    for (const parcela of parcelas) {
      try {
        console.log(`📋 Testando parcela: ${parcela.id_parcela}`);

        // Fazer requisição para a parcela
        const response = await fetch(`https://api-v2.contaazul.com/v1/financeiro/eventos-financeiros/parcelas/${parcela.id_parcela}`, {
          headers: {
            'Authorization': `Bearer ${contaAzulData.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const parcelaData = await response.json();
          
          // Verificar se existe rateio na resposta
          const resultado = {
            id_parcela: parcela.id_parcela,
            evento_id: parcela.evento_id,
            status: response.status,
            // Verificar campos relacionados a rateio
            tem_rateio: !!parcelaData.rateio,
            tem_evento_rateio: !!parcelaData.evento?.rateio,
            tem_categorias: !!parcelaData.categorias,
            tem_centros_custo: !!parcelaData.centros_custo,
            // Todos os campos de primeiro nível
            campos_primeiro_nivel: Object.keys(parcelaData),
            // Campos do evento (se existir)
            campos_evento: parcelaData.evento ? Object.keys(parcelaData.evento) : [],
            // Amostra da estrutura completa (apenas os primeiros níveis)
            estrutura_completa: JSON.stringify(parcelaData, null, 2).substring(0, 2000) + '...'
          };

          resultados.push(resultado);
        } else {
          resultados.push({
            id_parcela: parcela.id_parcela,
            erro: `HTTP ${response.status}: ${response.statusText}`,
          });
        }
              } catch (error) {
          resultados.push({
            id_parcela: parcela.id_parcela,
            erro: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
    }

    return NextResponse.json({
      investigacao: 'Campos não documentados na API ContaAzul',
      documentacao_inconsistencia: {
        problema: 'Campo rateio presente na CRIAÇÃO mas não documentado na RECUPERAÇÃO',
        eventofin_request: 'Tem campo rateio documentado',
        parcela_response: 'NÃO tem campo rateio documentado',
      },
      resultados,
      total_testado: resultados.length,
    });

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 