import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('🧪 Testando campos específicos das tabelas ContaHub...');
    
    const resultados: any = {};

    // Definir campos de teste para cada tabela baseado no mapeamento atual
    const camposTeste = {
      contahub_analitico: {
        bar_id: 999,
        sistema_raw_id: 999,
        vd: 1,
        itm: 1,
        prd: 1,
        trn: 1,
        ano: '2025',
        mes: '2025-01',
        vd_dtgerencial: new Date(),
        vd_mesadesc: 'teste',
        vd_localizacao: 'teste',
        trn_desc: 'teste',
        prd_desc: 'teste',
        grp_desc: 'teste',
        loc_desc: 'teste',
        prefixo: 'teste',
        tipo: 'teste',
        tipovenda: 'teste',
        qtd: 1,
        desconto: 0,
        valorfinal: 0,
        custo: 0,
        usr_lancou: 'teste',
        itm_obs: 'teste',
        comandaorigem: 'teste',
        itemorigem: 'teste',
        dados_completos: {}
      },
      
      contahub_pagamentos: {
        bar_id: 999,
        sistema_raw_id: 999,
        vd: 1,
        trn: 1,
        pag: 1,
        dt_gerencial: new Date(),
        hr_lancamento: new Date(),
        hr_transacao: new Date(),
        dt_transacao: new Date(),
        dt_credito: new Date(),
        mesa: 'teste',
        cli: 1,
        cliente: 'teste',
        vr_pagamentos: 0,
        valor: 0,
        taxa: 0,
        perc: 0,
        liquido: 0,
        tipo: 'teste',
        meio: 'teste',
        cartao: 'teste',
        autorizacao: 'teste',
        usr_abriu: 'teste',
        usr_lancou: 'teste',
        usr_aceitou: 'teste',
        motivodesconto: 'teste',
        dados_completos: {}
      },

      contahub_clientes_cpf: {
        bar_id: 999,
        sistema_raw_id: 999,
        cpf: '12345678901',
        email: 'teste@teste.com',
        nome: 'Teste',
        qtd: 1,
        vd_vrpagamentos: 0,
        ultima: new Date(),
        dados_completos: {}
      },

      contahub_clientes_faturamento: {
        bar_id: 999,
        sistema_raw_id: 999,
        cht_nome: 'teste',
        cht: 'teste',
        cht_fonea: 'teste',
        cli_nome: 'teste',
        cli_cpf: '12345678901',
        cli_email: 'teste@teste.com',
        cli_fone: '61999999999',
        vendas: 1,
        valor: 0,
        vd: 1,
        ultima: new Date(),
        ech_vip: 'teste',
        ech_dtvip: new Date(),
        ech_bloqueado: 'teste',
        ech_dtbloqueado: new Date(),
        ech_obs: 'teste',
        dados_completos: {}
      },

      contahub_fatporhora: {
        bar_id: 999,
        sistema_raw_id: 999,
        vd_dtgerencial: new Date(),
        dds: 'teste',
        dia: 'teste',
        hora: 'teste',
        qtd: 1,
        valor: 0,
        dados_completos: {}
      },

      contahub_periodo: {
        bar_id: 999,
        sistema_raw_id: 999,
        vd: 1,
        trn: 1,
        cli: 1,
        dt_gerencial: new Date(),
        dt_contabil: new Date(),
        ultimo_pedido: new Date(),
        nf_dtcontabil: new Date(),
        vd_dtcontabil: new Date(),
        tipovenda: 'teste',
        vd_mesadesc: 'teste',
        vd_localizacao: 'teste',
        cht_fonea: 'teste',
        cht_nome: 'teste',
        cli_nome: 'teste',
        cli_cpf: '12345678901',
        cli_dtnasc: new Date(),
        cli_email: 'teste@teste.com',
        cli_fone: '61999999999',
        vd_cpf: '12345678901',
        usr_abriu: 'teste',
        pessoas: 1,
        qtd_itens: 1,
        vr_pagamentos: 0,
        vr_produtos: 0,
        vr_repique: 0,
        vr_couvert: 0,
        vr_desconto: 0,
        motivo: 'teste',
        nf_autorizada: 'teste',
        nf_chaveacesso: 'teste',
        dados_completos: {}
      }
    };

    for (const [tabela, campos] of Object.entries(camposTeste)) {
      try {
        console.log(`🧪 Testando campos da tabela: ${tabela}`);
        
        // Tentar inserir registro de teste
        const { data, error } = await supabase
          .from(tabela)
          .insert(campos)
          .select();

        if (error) {
          resultados[tabela] = {
            status: 'erro_insert',
            erro: error.message,
            detalhes: error,
            campos_testados: Object.keys(campos),
            total_campos: Object.keys(campos).length
          };
        } else {
          // Se funcionou, deletar o registro de teste
          if (data && data.length > 0) {
            await supabase
              .from(tabela)
              .delete()
              .eq('bar_id', 999);
          }
          
          resultados[tabela] = {
            status: 'sucesso',
            campos_aceitos: Object.keys(campos),
            total_campos: Object.keys(campos).length,
            observacao: 'Todos os campos foram aceitos'
          };
        }
      } catch (error) {
        resultados[tabela] = {
          status: 'erro_catch',
          erro: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Teste de campos concluído',
      resultados,
      total_tabelas: Object.keys(camposTeste).length,
      resumo: {
        tabelas_com_sucesso: Object.values(resultados).filter((r: any) => r.status === 'sucesso').length,
        tabelas_com_erro: Object.values(resultados).filter((r: any) => r.status !== 'sucesso').length
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste de campos:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 