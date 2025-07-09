import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('🔍 Descobrindo campos reais das tabelas ContaHub...');
    
    const resultados: any = {};

    // Usar um bar_id que existe (3 = Ordinário Bar)
    const BAR_ID_VALIDO = 3;

    // Campos base que sempre devem existir
    const camposBase = ['bar_id', 'sistema_raw_id'];

    // Definir campos de teste para cada tabela baseado no mapeamento atual
    const camposTeste = {
      // Tabelas que deram erro - precisamos testar os campos
      contahub_tempo: {
        bar_id: 999,
        sistema_raw_id: 999,
        vd: 1,
        itm: 1,
        prd: 1,
        ano: '2025',
        mes: '2025-01',
        dia: '2025-01-31',
        dds: 'segunda',
        diadasemana: 'segunda',
        hora: '12:00',
        itm_qtd: 1,
        prd_desc: 'teste',
        grp_desc: 'teste',
        loc_desc: 'teste',
        vd_mesadesc: 'teste',
        vd_localizacao: 'teste',
        prd_idexterno: 'teste',
        usr_abriu: 'teste',
        usr_lancou: 'teste',
        usr_produziu: 'teste',
        usr_entregou: 'teste',
        usr_transfcancelou: 'teste',
        prefixo: 'teste',
        tipovenda: 'teste',
        tempo_t0_t1: 1,
        tempo_t0_t2: 1,
        tempo_t0_t3: 1,
        tempo_t1_t2: 1,
        tempo_t1_t3: 1,
        tempo_t2_t3: 1,
        t0_lancamento: new Date(),
        t1_prodini: new Date(),
        t2_prodfim: new Date(),
        t3_entrega: new Date(),
        dados_completos: {}
      },

      contahub_clientes_presenca: {
        bar_id: 999,
        sistema_raw_id: 999,
        cpf: '12345678901',
        nome: 'teste',
        vendas: 1,
        ultima_visita: new Date(),
        dados_completos: {}
      },

      contahub_nfs: {
        bar_id: 999,
        sistema_raw_id: 999,
        numero_nf: 'teste',
        chave_acesso: 'teste',
        valor_total: 0,
        dados_completos: {}
      },

      contahub_compra_produto_dtnf: {
        bar_id: 999,
        sistema_raw_id: 999,
        produto: 'teste',
        valor: 0,
        dados_completos: {}
      },



      contahub_analitico: {
        bar_id: 999,
        sistema_raw_id: 999,
        vd: 1,
        itm: 1,
        prd: 1,
        ano: '2025',
        mes: '2025-01',
        vd_mesadesc: 'teste',
        prd_desc: 'teste',
        grp_desc: 'teste',
        loc_desc: 'teste',
        prefixo: 'teste',
        tipovenda: 'teste',
        usr_lancou: 'teste',
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
        mesa: 'teste',
        cli: 1,
        cliente: 'teste',
        tipo: 'teste',
        meio: 'teste',
        cartao: 'teste',
        autorizacao: 'teste',
        usr_abriu: 'teste',
        usr_lancou: 'teste',
        motivodesconto: 'teste',
        dados_completos: {}
      },

      contahub_clientes_cpf: {
        bar_id: 999,
        sistema_raw_id: 999,
        cpf: '12345678901',
        nome: 'Teste',
        qtd: 1,
        vd_vrpagamentos: 0,
        ultima: new Date(),
        dados_completos: {}
      },

      contahub_clientes_faturamento: {
        bar_id: 999,
        sistema_raw_id: 999,
        cli_nome: 'teste',
        cli_cpf: '12345678901',
        cli_fone: '61999999999',
        vendas: 1,
        valor: 0,
        vd: 1,
        ultima: new Date(),
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
        ultimo_pedido: new Date(),
        tipovenda: 'teste',
        vd_mesadesc: 'teste',
        cli_nome: 'teste',
        cli_cpf: '12345678901',
        cli_fone: '61999999999',
        vd_cpf: '12345678901',
        usr_abriu: 'teste',
        pessoas: 1,
        qtd_itens: 1,
        vr_produtos: 0,
        vr_repique: 0,
        vr_couvert: 0,
        vr_desconto: 0,
        motivo: 'teste',
        dados_completos: {}
      }
    };

    for (const [tabela, dadosModelo] of Object.entries(camposTeste)) {
      console.log(`🧪 Testando tabela: ${tabela}`);
      
      const camposExistentes: string[] = [...camposBase];
      const camposInexistentes: string[] = [];
      const campos = Object.keys(dadosModelo);

      // Testar cada campo individualmente
      for (const campo of campos) {
        try {
          const dadosTeste: any = {
            bar_id: BAR_ID_VALIDO,
            sistema_raw_id: 999999
          };

          // Adicionar apenas este campo específico
          if (campo === 'cpf' || campo === 'cli_cpf' || campo === 'vd_cpf') {
            dadosTeste[campo] = '12345678901';
          } else if (campo.includes('email')) {
            dadosTeste[campo] = 'teste@teste.com';
          } else if (campo.includes('dt_') || campo.includes('data') || campo === 'ultima' || campo === 'ultimo_pedido') {
            dadosTeste[campo] = new Date().toISOString();
          } else if (campo.includes('hr_')) {
            dadosTeste[campo] = new Date().toISOString();
          } else if (campo.includes('vr_') || campo.includes('valor') || campo === 'qtd' || campo === 'vendas' || campo === 'pessoas' || campo === 'qtd_itens') {
            dadosTeste[campo] = 0;
          } else if (campo === 'dados_completos') {
            dadosTeste[campo] = {};
          } else {
            dadosTeste[campo] = 'teste';
          }

          const { data, error } = await supabase
            .from(tabela)
            .insert(dadosTeste)
            .select() as { data: any[] | null, error: any };

          if (error) {
            // Se o erro é sobre este campo específico, ele não existe
            if (error.message.includes(`'${campo}'`) && error.code === 'PGRST204') {
              camposInexistentes.push(campo);
            } else {
              // Outros erros podem significar que o campo existe mas tem constraint
              camposExistentes.push(campo);
              
              // Tentar deletar se inseriu
              if (data && data.length > 0) {
                await supabase
                  .from(tabela)
                  .delete()
                  .eq('sistema_raw_id', 999999);
              }
            }
          } else {
            // Sucesso - campo existe
            camposExistentes.push(campo);
            
            // Deletar registro de teste
            if (data && data.length > 0) {
              await supabase
                .from(tabela)
                .delete()
                .eq('sistema_raw_id', 999999);
            }
          }

        } catch (error) {
          console.error(`Erro testando campo ${campo} em ${tabela}:`, error);
          camposInexistentes.push(campo);
        }
      }

      resultados[tabela] = {
        campos_existentes: camposExistentes,
        campos_inexistentes: camposInexistentes,
        total_existentes: camposExistentes.length,
        total_inexistentes: camposInexistentes.length,
        percentual_sucesso: Math.round((camposExistentes.length / (camposExistentes.length + camposInexistentes.length)) * 100)
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Descoberta de campos concluída',
      resultados,
      total_tabelas: Object.keys(camposTeste).length
    });

  } catch (error) {
    console.error('❌ Erro na descoberta de campos:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 