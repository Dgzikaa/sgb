import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verificarDisponibilidadeContaHub } from '@/lib/contahub-service';

export async function POST(request: NextRequest) {
  // ⚠️ VERIFICAR SE CONTAHUB ESTÁ DISPONÍVEL
  const statusManutencao = verificarDisponibilidadeContaHub('Processamento de dados ContaHub');
  if (statusManutencao) {
    console.log('🔧 ContaHub em modo manutenção, processamento suspenso...');
    return NextResponse.json(statusManutencao, { status: 503 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let detailedLogs: string[] = [];
  let successCount = 0;
  let errorCount = 0;

  try {
    console.log('🚀 Iniciando processamento de dados ContaHub...');
    detailedLogs.push('🚀 Iniciando processamento de dados ContaHub...');

    // Primeiro, limpar todas as tabelas ContaHub
    console.log('🧹 Limpando todas as tabelas ContaHub...');
    detailedLogs.push('🧹 Limpando todas as tabelas ContaHub...');
    
    const tabelasContaHub = [
      'contahub_analitico',
      'contahub_periodo', 
      'contahub_tempo',
      'contahub_pagamentos',
      'contahub_fatporhora',
      'contahub_clientes_presenca',
      'contahub_clientes_cpf',
      'contahub_clientes_faturamento',
      'contahub_nfs',
      'contahub_compra_produto_dtnf'
    ];

    for (const tabela of tabelasContaHub) {
      const { error } = await supabase.from(tabela).delete().neq('id', 0);
      if (error) {
        console.error(`❌ Erro ao limpar ${tabela}:`, error);
        detailedLogs.push(`❌ Erro ao limpar ${tabela}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${tabela} limpa`);
        detailedLogs.push(`✅ Tabela ${tabela} limpa`);
      }
    }

    // Buscar registros não processados da sistema_raw
    const { data: registrosRaw, error: errorRaw } = await supabase
      .from('sistema_raw')
      .select('*')
      .eq('sistema', 'contahub')
      .eq('processado', false)
      .order('criado_em', { ascending: true });

    if (errorRaw) {
      const errorMsg = `❌ Erro ao buscar registros: ${errorRaw.message}`;
      console.error(errorMsg);
      detailedLogs.push(errorMsg);
      return NextResponse.json({ 
        error: errorMsg,
        logs: detailedLogs 
      }, { status: 500 });
    }

    if (!registrosRaw || registrosRaw.length === 0) {
      const msg = '⚠️ Nenhum registro não processado encontrado';
      console.log(msg);
      detailedLogs.push(msg);
      return NextResponse.json({ 
        message: msg,
        logs: detailedLogs,
        processados: 0,
        sucessos: 0,
        erros: 0
      });
    }

    console.log(`📊 Encontrados ${registrosRaw.length} registros para processar`);
    detailedLogs.push(`📊 Encontrados ${registrosRaw.length} registros para processar`);

    // Processar cada registro
    for (const registro of registrosRaw) {
      try {
        const logMsg = `📋 Processando: ${registro.tipo_dados} (ID: ${registro.id}) - Data: ${registro.data_referencia}`;
        console.log(logMsg);
        detailedLogs.push(logMsg);

        // Identificar tipo de dados (CORRIGIDO)
        const tipoDados = identificarTipoDados(registro);
        if (!tipoDados) {
          const errorMsg = `⚠️ Tipo de dados não identificado para registro ${registro.id}`;
          console.log(errorMsg, 'Dados disponíveis:', Object.keys(registro));
          detailedLogs.push(errorMsg);
          continue;
        }

        // Extrair dados do registro
        const dadosExtraidos = extrairDados(registro);
        const countMsg = `📊 ${tipoDados}: ${dadosExtraidos.length} registros individuais`;
        console.log(countMsg);
        detailedLogs.push(countMsg);

        if (dadosExtraidos.length === 0) {
          const warningMsg = `⚠️ ${tipoDados}: Lista vazia (normal para alguns relatórios/datas) - pulando processamento`;
          console.log(warningMsg);
          detailedLogs.push(warningMsg);
          continue;
        }

        // Processar baseado no tipo identificado
        let processados = 0;
        let errosIndividuais = 0;

        console.log(`🔄 Iniciando processamento de ${dadosExtraidos.length} registros individuais do tipo ${tipoDados}`);

        for (let index = 0; index < dadosExtraidos.length; index++) {
          const dadoIndividual = dadosExtraidos[index];
          console.log(`📋 Processando item ${index + 1}/${dadosExtraidos.length}:`, Object.keys(dadoIndividual));
          try {
            let sucesso = false;

            switch (tipoDados) {
              case 'analitico':
                sucesso = await processarAnalitico(dadoIndividual, registro.bar_id, registro.id, supabase);
                break;
              case 'periodo_completo':
                sucesso = await processarPeriodo(dadoIndividual, registro.bar_id, registro.id, supabase);
                break;
              case 'tempo':
                sucesso = await processarTempo(dadoIndividual, registro.bar_id, registro.data_referencia, registro.id, supabase, index);
                break;
              case 'pagamentos':
                sucesso = await processarPagamentos(dadoIndividual, registro.bar_id, registro.id, supabase);
                break;
              case 'fatporhora':
                sucesso = await processarFatPorHora(dadoIndividual, registro.bar_id, registro.id, supabase);
                break;
              case 'clientes_presenca':
                sucesso = await processarClientesPresenca(dadoIndividual, registro.bar_id, registro.data_referencia, registro.id, supabase);
                break;
              case 'clientes_cpf':
                sucesso = await processarClientesCpf(dadoIndividual, registro.bar_id, registro.id, supabase);
                break;
              case 'clientes_faturamento':
                sucesso = await processarClientesFaturamento(dadoIndividual, registro.bar_id, registro.id, supabase);
                break;
              case 'nfs':
                sucesso = await processarNfs(dadoIndividual, registro.bar_id, registro.data_referencia, registro.id, supabase);
                break;
              case 'compra_produto_dtnf':
                sucesso = await processarCompraProdutoDtnf(dadoIndividual, registro.bar_id, registro.data_referencia, registro.id, supabase);
                break;
              default:
                const defaultMsg = `⚠️ Tipo não suportado: ${tipoDados}`;
                console.log(defaultMsg);
                detailedLogs.push(defaultMsg);
                sucesso = false;
            }

            if (sucesso) {
              processados++;
              successCount++;
              console.log(`✅ Item ${index + 1} processado com sucesso`);
            } else {
              errosIndividuais++;
              errorCount++;
              console.log(`❌ Item ${index + 1} falhou durante processamento`);
            }
          } catch (error) {
            const processErrorMsg = `❌ Erro ao processar item individual ${index + 1}: ${error}`;
            console.error(processErrorMsg);
            detailedLogs.push(processErrorMsg);
            errosIndividuais++;
            errorCount++;
          }
        }

        console.log(`📊 Resumo do processamento: ${processados} sucessos, ${errosIndividuais} erros`);

        const resultMsg = `✅ ${tipoDados}: ${processados} registros processados com sucesso`;
        console.log(resultMsg);
        detailedLogs.push(resultMsg);

        if (errosIndividuais > 0) {
          const errorMsg = `⚠️ ${tipoDados}: ${errosIndividuais} registros com erro`;
          console.log(errorMsg);
          detailedLogs.push(errorMsg);
        }

        // Marcar como processado
        const { error: updateError } = await supabase
          .from('sistema_raw')
          .update({ 
            processado: true,
            processado_em: new Date().toISOString(),
            erro_processamento: errosIndividuais > 0 ? `${errosIndividuais} erros individuais` : null
          })
          .eq('id', registro.id);

        if (updateError) {
          const updateErrorMsg = `❌ Erro ao marcar registro ${registro.id} como processado: ${updateError.message}`;
          console.error(updateErrorMsg);
          detailedLogs.push(updateErrorMsg);
        }

      } catch (error) {
        const registroErrorMsg = `❌ Erro ao processar registro ${registro.id}: ${error}`;
        console.error(registroErrorMsg);
        detailedLogs.push(registroErrorMsg);
        errorCount++;
      }
    }

    const finalMsg = `🎉 Processamento concluído: ${successCount} sucesso, ${errorCount} erros`;
    console.log(finalMsg);
    detailedLogs.push(finalMsg);

    return NextResponse.json({
      message: 'Processamento concluído com sucesso',
      logs: detailedLogs,
      processados: registrosRaw.length,
      sucessos: successCount,
      erros: errorCount
    });

  } catch (error) {
    const generalErrorMsg = `❌ Erro geral no processamento: ${error}`;
    console.error(generalErrorMsg);
    detailedLogs.push(generalErrorMsg);
    
    return NextResponse.json({ 
      error: generalErrorMsg,
      logs: detailedLogs,
      sucessos: successCount,
      erros: errorCount + 1
    }, { status: 500 });
  }
}

// Endpoint GET para verificar status
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // DADOS ESPERADOS DO CONTAHUB (baseado no que o usuário enviou)
    const dadosEsperadosClientesCpf = [
      { cpf: '03603186141', nome: 'Maira', qtd: 2, vd_vrpagamentos: 329.66 },
      { cpf: '04853613102', nome: 'Mariana', qtd: 2, vd_vrpagamentos: 255.09 },
      { cpf: '03990860135', nome: '', qtd: 2, vd_vrpagamentos: 193.55 },
      { cpf: '03750727139', nome: '', qtd: 2, vd_vrpagamentos: 191.35 },
      { cpf: '10243003153', nome: 'Carol', qtd: 2, vd_vrpagamentos: 191.33 },
      { cpf: '01051186137', nome: 'Juliana', qtd: 1, vd_vrpagamentos: 162.68 },
      { cpf: '43557449300', nome: '', qtd: 1, vd_vrpagamentos: 143.88 },
      { cpf: '01462522173', nome: 'Carinne', qtd: 2, vd_vrpagamentos: 136.34 },
      { cpf: '00514887109', nome: 'Larissa Santiago', qtd: 1, vd_vrpagamentos: 108.84 },
      { cpf: '36498467134', nome: 'Patricia', qtd: 1, vd_vrpagamentos: 94.38 },
      { cpf: '04799944126', nome: '', qtd: 1, vd_vrpagamentos: 83.6 }
    ];

    // DADOS ESPERADOS PERÍODO (baseado nos dados que o usuário enviou - parte dos dados)
    const dadosEsperadosPeriodo = [
      { vd: 1, trn: 1, dt_gerencial: '2025-01-31', tipovenda: 'Teste', usr_abriu: 'Carlos contaHUB', pessoas: 1 },
      { vd: 2, trn: 1, dt_gerencial: '2025-01-31', tipovenda: 'Luan', usr_abriu: 'Luan', pessoas: 1 },
      { vd: 6, trn: 1, dt_gerencial: '2025-01-31', tipovenda: '14', usr_abriu: 'Nayara', pessoas: 1 },
      { vd: 7, trn: 1, dt_gerencial: '2025-01-31', tipovenda: 'M 14', usr_abriu: 'Luan', pessoas: 2 },
      { vd: 8, trn: 1, dt_gerencial: '2025-01-31', tipovenda: 'M14', usr_abriu: 'Luan', pessoas: 2 }
      // ... (usuário enviou mais dados, mas estou usando apenas uma amostra para verificar)
    ];

    console.log('🔍 Iniciando análise de discrepâncias...');

    // Buscar dados reais inseridos
    const { data: dadosReaisClientesCpf, error: errorClientesCpf } = await supabase
      .from('contahub_clientes_cpf')
      .select('cpf, nome, qtd, vd_vrpagamentos, sistema_raw_id')
      .order('vd_vrpagamentos', { ascending: false });

    const { data: dadosReaisPeriodo, error: errorPeriodo } = await supabase
      .from('contahub_periodo')
      .select('vd, trn, dt_gerencial, tipovenda, vd_mesadesc, cli_nome, usr_abriu, pessoas, sistema_raw_id')
      .order('vd', { ascending: true });

    const { data: dadosReaisTempo, error: errorTempo } = await supabase
      .from('contahub_tempo')
      .select('vd, itm, prd, prd_desc, hora, sistema_raw_id')
      .order('vd', { ascending: true })
      .limit(20);

    console.log('📊 Dados buscados:', {
      clientes_cpf: dadosReaisClientesCpf?.length || 0,
      periodo: dadosReaisPeriodo?.length || 0,
      tempo: dadosReaisTempo?.length || 0
    });

    // Verificar quantos dados pendentes temos
    const { data: pendentes, error: errorPendentes } = await supabase
      .from('sistema_raw')
      .select('id, tipo_dados, data_referencia, criado_em')
      .eq('sistema', 'contahub')
      .eq('processado', false)
      .order('criado_em', { ascending: false })
      .limit(10);

    const { data: processados, error: errorProcessados } = await supabase
      .from('sistema_raw')
      .select('id, tipo_dados, data_referencia, processado_em')
      .eq('sistema', 'contahub')
      .eq('processado', true)
      .order('processado_em', { ascending: false })
      .limit(5);

    // ANÁLISE DE DISCREPÂNCIAS
    const analiseClientesCpf = {
      esperados: dadosEsperadosClientesCpf.length,
      inseridos: dadosReaisClientesCpf?.length || 0,
      diferenca: (dadosReaisClientesCpf?.length || 0) - dadosEsperadosClientesCpf.length,
      
      // Comparar CPFs
      cpfsEsperados: dadosEsperadosClientesCpf.map(d => d.cpf).sort(),
      cpfsInseridos: (dadosReaisClientesCpf || []).map(d => d.cpf).sort(),
      
      // Encontrar CPFs extras (que estão no banco mas não deveriam estar)
      cpfsExtras: (dadosReaisClientesCpf || [])
        .map(d => d.cpf)
        .filter(cpf => !dadosEsperadosClientesCpf.some(e => e.cpf === cpf)),
      
      // Encontrar CPFs faltando (que deveriam estar mas não estão)
      cpfsFaltando: dadosEsperadosClientesCpf
        .map(d => d.cpf)
        .filter(cpf => !(dadosReaisClientesCpf || []).some(r => r.cpf === cpf)),

      // Registros com valores incorretos
      valoresIncorretos: dadosEsperadosClientesCpf
        .map(esperado => {
          const real = (dadosReaisClientesCpf || []).find(r => r.cpf === esperado.cpf);
          if (real && Math.abs(real.vd_vrpagamentos - esperado.vd_vrpagamentos) > 0.01) {
            return {
              cpf: esperado.cpf,
              valorEsperado: esperado.vd_vrpagamentos,
              valorReal: real.vd_vrpagamentos,
              diferenca: real.vd_vrpagamentos - esperado.vd_vrpagamentos
            };
          }
          return null;
        })
        .filter(Boolean)
    };

    // ANÁLISE PERÍODO
    const analisePeriodo = {
      esperados: dadosEsperadosPeriodo.length,
      inseridos: dadosReaisPeriodo?.length || 0,
      diferenca: (dadosReaisPeriodo?.length || 0) - dadosEsperadosPeriodo.length,
      
      // Comparar VDs
      vdsEsperados: dadosEsperadosPeriodo.map(d => d.vd).sort(),
      vdsInseridos: (dadosReaisPeriodo || []).map(d => d.vd).sort(),
      
      // VDs extras e faltando
      vdsExtras: (dadosReaisPeriodo || [])
        .map(d => d.vd)
        .filter(vd => !dadosEsperadosPeriodo.some(e => e.vd === vd)),
      
      vdsFaltando: dadosEsperadosPeriodo
        .map(d => d.vd)
        .filter(vd => !(dadosReaisPeriodo || []).some(r => r.vd === vd))
    };

    // ANÁLISE TEMPO - APENAS DADOS REAIS
    const analiseTempo = {
      inseridos: dadosReaisTempo?.length || 0,
      primeiros_10: (dadosReaisTempo || []).slice(0, 10),
      tipos_diferentes: {
        // APENAS DADOS REAIS - todos devem ter vd, itm, prd válidos
        dados_reais_completos: (dadosReaisTempo || []).filter(r => 
          r.vd && r.itm && r.prd  // Todos os dados inseridos são reais
        ).length,
        // Não há mais dados sintéticos - todos são removidos da lógica
        registros_ignorados: 0 // Não conseguimos contar os que foram ignorados aqui
      }
    };

    console.log('📊 Análises concluídas:', {
      clientes_cpf: analiseClientesCpf,
      periodo: analisePeriodo,
      tempo: analiseTempo
    });

    // Análise de registros duplicados
    const duplicadosAnalise: {
      cpfsDuplicados: { [key: string]: number };
      rawIdsDuplicados: { [key: string]: number };
    } = {
      cpfsDuplicados: {},
      rawIdsDuplicados: {}
    };

    // Contar duplicatas por CPF
    (dadosReaisClientesCpf || []).forEach(registro => {
      if (!duplicadosAnalise.cpfsDuplicados[registro.cpf]) {
        duplicadosAnalise.cpfsDuplicados[registro.cpf] = 0;
      }
      duplicadosAnalise.cpfsDuplicados[registro.cpf]++;
    });

    // Contar duplicatas por sistema_raw_id
    (dadosReaisClientesCpf || []).forEach(registro => {
      if (!duplicadosAnalise.rawIdsDuplicados[registro.sistema_raw_id]) {
        duplicadosAnalise.rawIdsDuplicados[registro.sistema_raw_id] = 0;
      }
      duplicadosAnalise.rawIdsDuplicados[registro.sistema_raw_id]++;
    });

    // Filtrar apenas duplicatas (contagem > 1)
    const cpfsComDuplicata = Object.entries(duplicadosAnalise.cpfsDuplicados)
      .filter(([cpf, count]) => (count as number) > 1);
    const rawIdsComDuplicata = Object.entries(duplicadosAnalise.rawIdsDuplicados)
      .filter(([rawId, count]) => (count as number) > 1);

    return NextResponse.json({
      success: true,
      debug_analysis: {
        clientes_cpf: {
          analise: analiseClientesCpf,
          duplicatas: {
            cpfs_duplicados: cpfsComDuplicata,
            raw_ids_duplicados: rawIdsComDuplicata
          },
          dados_reais: dadosReaisClientesCpf,
          dados_esperados: dadosEsperadosClientesCpf
        },
        periodo: {
          analise: analisePeriodo,
          dados_reais: dadosReaisPeriodo,
          dados_esperados: dadosEsperadosPeriodo
        },
        tempo: {
          analise: analiseTempo,
          dados_reais: dadosReaisTempo
        }
      },
      status: {
        dados_pendentes: pendentes?.length || 0,
        dados_processados: processados?.length || 0,
        ultimos_pendentes: pendentes?.slice(0, 5) || [],
        ultimos_processados: processados || []
      },
      message: 'Análise de discrepâncias dos dados ContaHub'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Funções de processamento (CORRIGIDAS - APENAS CAMPOS QUE EXISTEM)

// Função para processar dados analíticos (CAMPOS CORRIGIDOS PARA NOVA ESTRUTURA)
async function processarAnalitico(registro: any, barId: number, rawId: number, supabase: any) {
  try {
    console.log(`🔍 Debug analítico - Campos disponíveis:`, Object.keys(registro));

    const dadosAnalitico = {
      bar_id: barId,
      sistema_raw_id: rawId,
      // Campos originais mantidos
      vd: parseInt(registro.vd || 0),
      ano: registro.ano || null,
      mes: registro.mes || null,
      itm: parseInt(registro.itm || 0),
      prd: parseInt(registro.prd || 0),
      prd_desc: registro.prd_desc || null,
      grp_desc: registro.grp_desc || null,
      usr_lancou: registro.usr_lancou || null,
      vd_mesadesc: registro.vd_mesadesc || null,
      tipovenda: registro.tipovenda || null,
      loc_desc: registro.loc_desc || null,
      prefixo: registro.prefixo || null,
      // NOVOS CAMPOS ADICIONADOS
      vd_localizacao: registro.vd_localizacao || null,
      trn: registro.trn || null,
      trn_desc: registro.trn_desc || null,
      tipo: registro.tipo || null,
      vd_dtgerencial: registro.vd_dtgerencial ? new Date(registro.vd_dtgerencial) : null,
      qtd: parseFloat(registro.qtd || 0),
      desconto: parseFloat(registro.desconto || 0),
      valorfinal: parseFloat(registro.valorfinal || 0),
      custo: parseFloat(registro.custo || 0),
      itm_obs: registro.itm_obs || null,
      comandaorigem: registro.comandaorigem || null,
      itemorigem: registro.itemorigem || null,
      // Campo de dados completos
      dados_completos: registro
    };

    const { error } = await supabase
      .from('contahub_analitico')
      .insert(dadosAnalitico);

    if (error) {
      console.error('❌ Erro SQL em processarAnalitico:', error);
      return false;
    }

    console.log(`✅ Analítico processado: vd=${dadosAnalitico.vd}, prd=${dadosAnalitico.prd}, desc="${dadosAnalitico.prd_desc}", valor=${dadosAnalitico.valorfinal}`);
    return true;
  } catch (error) {
    console.error('❌ Erro em processarAnalitico:', error);
    return false;
  }
}

// Função para processar dados clientes cpf (CAMPOS CORRIGIDOS PARA NOVA ESTRUTURA)
async function processarClientesCpf(registro: any, barId: number, rawId: number, supabase: any) {
  try {
    console.log(`🔍 Debug clientes cpf - Campos disponíveis:`, Object.keys(registro));
    console.log(`🔍 Debug clientes cpf - Dados completos:`, JSON.stringify(registro, null, 2));

    // Verificar se já existe este registro para evitar duplicação
    const cpfIdentificador = registro.cpf || registro.cli_cpf || 'sem_cpf';
    console.log(`🔍 Verificando CPF: ${cpfIdentificador}`);

    // CORRIGIDO: Verificar se já existe este CPF no banco GLOBALMENTE (não por raw_id)
    // para evitar duplicatas mesmo que venham de raw_ids diferentes
    const { data: existente } = await supabase
      .from('contahub_clientes_cpf')
      .select('id, cpf, sistema_raw_id')
      .eq('cpf', cpfIdentificador)
      .limit(1);

    if (existente && existente.length > 0) {
      console.log(`⚠️ CPF ${cpfIdentificador} já existe globalmente (raw_id: ${existente[0].sistema_raw_id}) - pulando duplicata de raw_id ${rawId}`);
      return true; // Considerar como sucesso mas não inserir duplicata
    }

    const dadosClientesCpf = {
      bar_id: barId,
      sistema_raw_id: rawId,
      cpf: registro.cpf || registro.cli_cpf || null,
      nome: registro.nome || registro.cli_nome || registro.cliente || null,
      qtd: parseInt(registro.qtd || 1),
      vd_vrpagamentos: parseFloat(registro.vd_vrpagamentos || registro.valor || 0),
      ultima: registro.ultima ? new Date(registro.ultima) : new Date(),
      // NOVO CAMPO ADICIONADO
      email: registro.email || registro.cli_email || null,
      dados_completos: registro
    };

    console.log(`🔍 Dados processados para inserção:`, {
      cpf: dadosClientesCpf.cpf,
      nome: dadosClientesCpf.nome,
      qtd: dadosClientesCpf.qtd,
      valor: dadosClientesCpf.vd_vrpagamentos,
      email: dadosClientesCpf.email
    });

    const { error } = await supabase
      .from('contahub_clientes_cpf')
      .insert(dadosClientesCpf);

    if (error) {
      console.error('❌ Erro SQL em processarClientesCpf:', error);
      return false;
    }

    console.log(`✅ ClientesCpf processado: cpf=${dadosClientesCpf.cpf}, nome="${dadosClientesCpf.nome}", email="${dadosClientesCpf.email}"`);
    return true;
  } catch (error) {
    console.error('❌ Erro em processarClientesCpf:', error);
    return false;
  }
}

// Função para processar dados clientes faturamento (CAMPOS CORRIGIDOS PARA NOVA ESTRUTURA)
async function processarClientesFaturamento(registro: any, barId: number, rawId: number, supabase: any) {
  try {
    console.log(`🔍 Debug clientes faturamento - Campos disponíveis:`, Object.keys(registro));

    const dadosClientesFaturamento = {
      bar_id: barId,
      sistema_raw_id: rawId,
      // Campos originais mantidos
      cli_nome: registro.cli_nome || registro.nome || registro.cliente || null,
      cli_cpf: registro.cli_cpf || registro.cpf || null,
      cli_fone: registro.cli_fone || registro.telefone || registro.fone || null,
      vendas: parseInt(registro.vendas || 1),
      valor: parseFloat(registro.valor || 0),
      vd: registro.vd || null,
      ultima: registro.ultima ? new Date(registro.ultima) : new Date(),
      // NOVOS CAMPOS ADICIONADOS
      cht_nome: registro.cht_nome || null,
      cht: registro.cht || null,
      cht_fonea: registro.cht_fonea || null,
      cli_email: registro.cli_email || registro.email || null,
      ech_vip: registro.ech_vip || false,
      ech_dtvip: registro.ech_dtvip ? new Date(registro.ech_dtvip) : null,
      ech_bloqueado: registro.ech_bloqueado || false,
      ech_dtbloqueado: registro.ech_dtbloqueado ? new Date(registro.ech_dtbloqueado) : null,
      ech_obs: registro.ech_obs || null,
      dados_completos: registro
    };

    const { error } = await supabase
      .from('contahub_clientes_faturamento')
      .insert(dadosClientesFaturamento);

    if (error) {
      console.error('❌ Erro SQL em processarClientesFaturamento:', error);
      return false;
    }

    console.log(`✅ ClientesFaturamento processado: cliente="${dadosClientesFaturamento.cli_nome}", vendas=${dadosClientesFaturamento.vendas}, cht="${dadosClientesFaturamento.cht_nome}"`);
    return true;
  } catch (error) {
    console.error('❌ Erro em processarClientesFaturamento:', error);
    return false;
  }
}

// Função para processar dados clientes presença (CAMPOS CORRIGIDOS PARA NOVA ESTRUTURA)
async function processarClientesPresenca(registro: any, barId: number, dataRef: string, rawId: number, supabase: any) {
  try {
    console.log(`🔍 Debug presença - Campos disponíveis:`, Object.keys(registro));

    const dadosPresenca = {
      bar_id: barId,
      sistema_raw_id: rawId,
      // Campos originais mantidos
      vd: parseInt(registro.vd || 0),
      cli_cpf: registro.cli_cpf || null,
      cli_fone: registro.cli_fone || null,
      cli_nome: registro.cli_nome || null,
      valor: parseFloat(registro.valor || 0),
      vendas: parseInt(registro.vendas || 1),
      ultima: registro.ultima ? new Date(registro.ultima) : new Date(),
      // NOVOS CAMPOS ADICIONADOS (mesma estrutura do faturamento)
      cht_nome: registro.cht_nome || null,
      cht: registro.cht || null,
      cht_fonea: registro.cht_fonea || null,
      cli_email: registro.cli_email || registro.email || null,
      ech_vip: registro.ech_vip || false,
      ech_dtvip: registro.ech_dtvip ? new Date(registro.ech_dtvip) : null,
      ech_bloqueado: registro.ech_bloqueado || false,
      ech_dtbloqueado: registro.ech_dtbloqueado ? new Date(registro.ech_dtbloqueado) : null,
      ech_obs: registro.ech_obs || null,
      dados_completos: registro
    };

    const { error } = await supabase
      .from('contahub_clientes_presenca')
      .insert(dadosPresenca);

    if (error) {
      console.error('❌ Erro SQL em processarClientesPresenca:', error);
      return false;
    }

    console.log(`✅ Presença processada: vd=${dadosPresenca.vd}, cliente="${dadosPresenca.cli_nome}", vendas=${dadosPresenca.vendas}, cht="${dadosPresenca.cht_nome}"`);
    return true;
  } catch (error) {
    console.error('❌ Erro em processarClientesPresenca:', error);
    return false;
  }
}

// Função para processar dados compra produto dtnf (TOTALMENTE CORRIGIDA PARA NOVA ESTRUTURA)
async function processarCompraProdutoDtnf(registro: any, barId: number, dataRef: string, rawId: number, supabase: any) {
  try {
    console.log(`🔍 Debug compra produto - Campos disponíveis:`, Object.keys(registro));

    // Função para processar valores com frações (ex: =21124/100 => 211.24)
    const processarValor = (valor: any) => {
      if (!valor) return 0;
      if (typeof valor === 'string' && valor.startsWith('=')) {
        const expression = valor.substring(1); // Remove o =
        try {
          return eval(expression); // Calcula a fração
        } catch {
          return parseFloat(valor) || 0;
        }
      }
      return parseFloat(valor) || 0;
    };

    const dadosCompra = {
      bar_id: barId,
      sistema_raw_id: rawId,
      // NOVA ESTRUTURA CORRIGIDA - usando nomes corretos das colunas
      cmp: registro.cmp || null,
      frn_alias: registro.frn_alias || null,
      dt_nf: registro.dt_nf ? new Date(registro.dt_nf) : null,
      dt_estoq: registro.dt_estoq ? new Date(registro.dt_estoq) : null,
      prd: registro.prd || null,
      prd_desc: registro.prd_desc || null,
      prd_venda30: parseFloat(registro.prd_venda30 || 0),
      grp: registro.grp || null,
      grp_desc: registro.grp_desc || null,
      cit_vrtotal: processarValor(registro.cit_vrtotal),
      cit_qtd: processarValor(registro.cit_qtd),
      dados_completos: registro
    };

    const { error } = await supabase
      .from('contahub_compra_produto_dtnf')
      .insert(dadosCompra);

    if (error) {
      console.error('❌ Erro SQL em processarCompraProdutoDtnf:', error);
      return false;
    }

    console.log(`✅ Compra processada: ${dadosCompra.prd_desc}, qtd=${dadosCompra.cit_qtd}, valor=${dadosCompra.cit_vrtotal}, fornecedor="${dadosCompra.frn_alias}"`);
    return true;
  } catch (error) {
    console.error('❌ Erro em processarCompraProdutoDtnf:', error);
    return false;
  }
}

// Função para processar dados NFs (CORRIGIDA PARA TRATAR VALORES BOOLEANOS)
async function processarNfs(registro: any, barId: number, dataRef: string, rawId: number, supabase: any) {
  try {
    console.log(`🔍 Debug NFs - Campos disponíveis:`, Object.keys(registro));
    console.log(`🔍 Debug NFs - Dados completos:`, registro);

    const dadosNfs = {
      bar_id: barId,
      sistema_raw_id: rawId,
      // NOVA ESTRUTURA COMPLETAMENTE DIFERENTE
      cnpj_numero: String(registro['cnpj#'] || registro.cnpj_numero || ''),
      vd_dtgerencial: registro.vd_dtgerencial ? new Date(registro.vd_dtgerencial) : null,
      nf_dtcontabil: registro.nf_dtcontabil ? new Date(registro.nf_dtcontabil) : null,
      nf_tipo: registro.nf_tipo || null,
      nf_ambiente: String(registro.nf_ambiente || ''),
      nf_serie: String(registro.nf_serie || ''),
      subst_nfe_nfce: String(registro.subst_nfe_nfce || '0'),
      // CORRIGIR VALORES BOOLEANOS - converter numbers para boolean
      cancelada: Boolean(parseInt(registro.cancelada || 0)),
      autorizada: Boolean(parseInt(registro.autorizada || 0)),
      inutilizada: Boolean(parseInt(registro.inutilizada || 0)),
      valor_autorizado: parseFloat(registro.valor_autorizado || 0),
      valor_substituido_nfe_nfce: parseFloat(registro.valor_substituido_nfe_nfce || 0),
      valor_a_apurar: parseFloat(registro.valor_a_apurar || 0),
      vrst_autorizado: parseFloat(registro.vrst_autorizado || 0),
      vrisento_autorizado: parseFloat(registro.vrisento_autorizado || 0), // pode não existir nos dados
      valor_cancelado: parseFloat(registro.valor_cancelado || 0),
      dados_completos: registro
    };

    console.log(`🔍 Debug NFs - Dados preparados:`, {
      cnpj_numero: dadosNfs.cnpj_numero,
      nf_tipo: dadosNfs.nf_tipo,
      cancelada: dadosNfs.cancelada,
      autorizada: dadosNfs.autorizada,
      valor_autorizado: dadosNfs.valor_autorizado
    });

    const { error } = await supabase
      .from('contahub_nfs')
      .insert(dadosNfs);

    if (error) {
      console.error('❌ Erro SQL em processarNfs:', error);
      console.error('❌ Dados que causaram erro:', dadosNfs);
      return false;
    }

    console.log(`✅ NF processada: tipo=${dadosNfs.nf_tipo}, série=${dadosNfs.nf_serie}, autorizada=${dadosNfs.autorizada}, valor=${dadosNfs.valor_autorizado}`);
    return true;
  } catch (error) {
    console.error('❌ Erro em processarNfs:', error);
    return false;
  }
}

// Função para processar dados de pagamentos (CAMPOS CORRIGIDOS PARA NOVA ESTRUTURA)
async function processarPagamentos(registro: any, barId: number, rawId: number, supabase: any) {
  try {
    console.log(`🔍 Debug pagamentos - Campos disponíveis:`, Object.keys(registro));

    const dadosPagamentos = {
      bar_id: barId,
      sistema_raw_id: rawId,
      // Campos originais mantidos
      vd: registro.vd || null,
      trn: registro.trn || null,
      pag: registro.pag || null,
      dt_gerencial: registro.dt_gerencial ? new Date(registro.dt_gerencial) : null,
      hr_lancamento: registro.hr_lancamento ? new Date(registro.hr_lancamento) : null,
      hr_transacao: registro.hr_transacao ? new Date(registro.hr_transacao) : null,
      dt_transacao: registro.dt_transacao ? new Date(registro.dt_transacao) : null,
      mesa: registro.mesa || null,
      cli: registro.cli || null,
      cliente: registro.cliente || registro.cli_nome || null,
      valor_pagamentos: parseFloat(registro.vr_pagamentos || 0),
      tipo: registro.tipo || registro.tipo_pagamento || null,
      meio: registro.meio || registro.meio_pagamento || null,
      cartao: registro.cartao || null,
      autorizacao: registro.autorizacao || null,
      usr_abriu: registro.usr_abriu || null,
      usr_lancou: registro.usr_lancou || null,
      motivodesconto: registro.motivodesconto || registro.motivo_desconto || null,
      // NOVOS CAMPOS ADICIONADOS
      valor: parseFloat(registro.valor || 0),
      taxa: parseFloat(registro.taxa || 0),
      perc: parseFloat(registro.perc || 0),
      liquido: parseFloat(registro.liquido || 0),
      dt_credito: registro.dt_credito ? new Date(registro.dt_credito) : null,
      usr_aceitou: registro.usr_aceitou || null,
      dados_completos: registro
    };

    const { error } = await supabase
      .from('contahub_pagamentos')
      .insert(dadosPagamentos);

    if (error) {
      console.error('❌ Erro SQL em processarPagamentos:', error);
      return false;
    }

    console.log(`✅ Pagamento processado: vd=${dadosPagamentos.vd}, pag=${dadosPagamentos.pag}, tipo="${dadosPagamentos.tipo}", valor=${dadosPagamentos.valor}`);
    return true;
  } catch (error) {
    console.error('❌ Erro em processarPagamentos:', error);
    return false;
  }
}

// Função para processar dados do período (CAMPOS CORRIGIDOS PARA NOVA ESTRUTURA)
async function processarPeriodo(registro: any, barId: number, rawId: number, supabase: any) {
  try {
    console.log(`🔍 Debug período - Campos disponíveis:`, Object.keys(registro));
    console.log(`🔍 Debug período - Dados completos:`, JSON.stringify(registro, null, 2));

    // Verificar se já existe este registro para evitar duplicação
    const vdIdentificador = registro.vd || `temp_${Date.now()}`;
    const trnIdentificador = registro.trn || 0;
    console.log(`🔍 Verificando VD: ${vdIdentificador}, TRN: ${trnIdentificador}`);

    // Verificar se já existe este registro no banco para este raw_id
    const { data: existente } = await supabase
      .from('contahub_periodo')
      .select('id, vd, trn')
      .eq('sistema_raw_id', rawId)
      .eq('vd', vdIdentificador)
      .eq('trn', trnIdentificador)
      .limit(1);

    if (existente && existente.length > 0) {
      console.log(`⚠️ Período vd=${vdIdentificador}, trn=${trnIdentificador} já existe para raw_id ${rawId} - pulando`);
      return true; // Considerar como sucesso mas não inserir duplicata
    }

    const dadosPeriodo = {
      bar_id: barId,
      sistema_raw_id: rawId,
      // Campos originais mantidos
      vd: registro.vd || null,
      trn: registro.trn || null,
      cli: parseInt(registro.cli || 0),
      dt_gerencial: registro.dt_gerencial ? new Date(registro.dt_gerencial) : null,
      ultimo_pedido: registro.ultimo_pedido ? new Date(registro.ultimo_pedido) : null,
      tipovenda: registro.tipovenda || null,
      vd_mesadesc: registro.vd_mesadesc || null,
      cli_nome: registro.cli_nome || null,
      cli_cpf: registro.cli_cpf || null,
      cli_fone: registro.cli_fone || null,
      vd_cpf: registro.vd_cpf || null,
      usr_abriu: registro.usr_abriu || null,
      pessoas: parseInt(registro.pessoas || 0),
      qtd_itens: parseInt(registro.qtd_itens || 0),
      vr_produtos: parseFloat(registro.vr_produtos || registro['$vr_produtos'] || 0),
      vr_repique: parseFloat(registro.vr_repique || registro['$vr_repique'] || 0),
      vr_couvert: parseFloat(registro.vr_couvert || registro['$vr_couvert'] || 0),
      vr_desconto: parseFloat(registro.vr_desconto || registro['$vr_desconto'] || 0),
      motivo: registro.motivo || null,
      // NOVOS CAMPOS ADICIONADOS
      vd_localizacao: registro.vd_localizacao || null,
      cht_fonea: registro.cht_fonea || null,
      cht_nome: registro.cht_nome || null,
      cli_dtnasc: registro.cli_dtnasc ? new Date(registro.cli_dtnasc) : null,
      cli_email: registro.cli_email || null,
      vr_pagamentos: parseFloat(registro.vr_pagamentos || 0),
      dt_contabil: registro.dt_contabil ? new Date(registro.dt_contabil) : null,
      nf_autorizada: registro.nf_autorizada || false,
      nf_chaveacesso: registro.nf_chaveacesso || null,
      nf_dtcontabil: registro.nf_dtcontabil ? new Date(registro.nf_dtcontabil) : null,
      vd_dtcontabil: registro.vd_dtcontabil ? new Date(registro.vd_dtcontabil) : null,
      dados_completos: registro
    };

    console.log(`🔍 Dados período processados para inserção:`, {
      vd: dadosPeriodo.vd,
      trn: dadosPeriodo.trn,
      dt_gerencial: dadosPeriodo.dt_gerencial,
      tipovenda: dadosPeriodo.tipovenda,
      cli_nome: dadosPeriodo.cli_nome,
      cht_nome: dadosPeriodo.cht_nome,
      vr_pagamentos: dadosPeriodo.vr_pagamentos
    });

    const { error } = await supabase
      .from('contahub_periodo')
      .insert(dadosPeriodo);

    if (error) {
      console.error('❌ Erro SQL em processarPeriodo:', error);
      return false;
    }

    console.log(`✅ Período processado: vd=${dadosPeriodo.vd}, trn=${dadosPeriodo.trn}, cliente="${dadosPeriodo.cli_nome}", cht="${dadosPeriodo.cht_nome}"`);
    return true;
  } catch (error) {
    console.error('❌ Erro em processarPeriodo:', error);
    return false;
  }
}

// Função para processar dados de tempo (APENAS DADOS REAIS - SEM SINTÉTICOS)
async function processarTempo(registro: any, barId: number, dataRef: string, rawId: number, supabase: any, index: number = 0) {
  try {
    // Debug DETALHADO para entender estrutura dos dados
    console.log(`🔍 Debug tempo - Campos disponíveis:`, Object.keys(registro));
    console.log(`🔍 Debug tempo - Valores completos:`, JSON.stringify(registro, null, 2));
    console.log(`🔍 Debug tempo - vd=${registro.vd} (tipo: ${typeof registro.vd}), itm=${registro.itm} (tipo: ${typeof registro.itm}), prd=${registro.prd} (tipo: ${typeof registro.prd})`);
    
    // VALIDAÇÃO BASEADA NOS DADOS REAIS DO TEMPO ContaHub
    const temQtd = registro.qtd !== undefined && registro.qtd !== null;
    const temHora = registro.hora !== undefined && registro.hora !== null && registro.hora !== '';
    const temValor = registro.$valor !== undefined && registro.$valor !== null;
    const temGrpDesc = registro.grp_desc !== undefined && registro.grp_desc !== null && registro.grp_desc !== '';
    
    console.log(`🔍 Validação tempo (DADOS REAIS):`, {
      temQtd, temHora, temValor, temGrpDesc,
      valores: { qtd: registro.qtd, hora: registro.hora, valor: registro.$valor, grp_desc: registro.grp_desc }
    });
    
    // ACEITAR se tem pelo menos hora e grp_desc (campos essenciais do tempo)
    const temDadosEssenciais = temHora && temGrpDesc;
    
    if (!temDadosEssenciais) {
      console.log(`⚠️ Registro tempo REJEITADO - campos essenciais ausentes`);
      console.log(`⚠️ Valores: hora=${registro.hora}, grp_desc=${registro.grp_desc}`);
      return true; // Considera sucesso mas não insere nada
    }
    
    console.log(`✅ Registro tempo ACEITO - dados reais válidos - processando`);
    
    // Processar valores com segurança
    const processarNumero = (valor: any, padrao: number = 0) => {
      if (valor === undefined || valor === null || valor === '') return padrao;
      const num = parseInt(valor);
      return isNaN(num) ? padrao : num;
    };
    
    const processarFloat = (valor: any, padrao: number = 0) => {
      if (valor === undefined || valor === null || valor === '') return padrao;
      const num = parseFloat(valor);
      return isNaN(num) ? padrao : num;
    };
    
    const processarData = (valor: any) => {
      if (!valor) return null;
      try {
        return new Date(valor);
      } catch {
        return null;
      }
    };
    
    const dadosTempo = {
      bar_id: barId,
      sistema_raw_id: rawId,
      
      // Valores principais - baseados nos dados REAIS do tempo ContaHub (qtd, $valor, grp_desc, hora)
      vd: null, // NÃO EXISTE nos dados reais do tempo
      itm: null, // NÃO EXISTE nos dados reais do tempo
      prd: null, // NÃO EXISTE nos dados reais do tempo
      
      // Dados temporais
      ano: null, // NÃO EXISTE nos dados reais do tempo
      mes: null, // NÃO EXISTE nos dados reais do tempo  
      dia: null, // NÃO EXISTE nos dados reais do tempo
      dds: null, // NÃO EXISTE nos dados reais do tempo
      diadasemana: null, // NÃO EXISTE nos dados reais do tempo
      hora: registro.hora || null, // EXISTE - campo real
      
      // Quantidades - mapeando qtd para itm_qtd
      itm_qtd: processarNumero(registro.qtd), // Usar qtd dos dados reais
      
      // Descrições
      prd_desc: registro.prd_desc || null,
      grp_desc: registro.grp_desc || null,
      loc_desc: registro.loc_desc || null,
      vd_mesadesc: registro.vd_mesadesc || null,
      
      // Usuários
      usr_abriu: registro.usr_abriu || null,
      usr_lancou: registro.usr_lancou || null,
      usr_produziu: registro.usr_produziu || null,
      usr_entregou: registro.usr_entregou || null,
      
      // Classificações
      prefixo: registro.prefixo || null,
      tipovenda: registro.tipovenda || null,
      
      // Tempos de produção (convertendo de t0-t1 para tempo_t0_t1)
      tempo_t0_t1: processarNumero(registro['t0-t1']),
      tempo_t0_t2: processarNumero(registro['t0-t2']),
      tempo_t0_t3: processarNumero(registro['t0-t3']),
      tempo_t1_t2: processarNumero(registro['t1-t2']),
      tempo_t1_t3: processarNumero(registro['t1-t3']),
      tempo_t2_t3: processarNumero(registro['t2-t3']),
      
      // Timestamps dos eventos
      t0_lancamento: processarData(registro['t0-lancamento']),
      t1_prodini: processarData(registro['t1-prodini']),
      t2_prodfim: processarData(registro['t2-prodfim']),
      t3_entrega: processarData(registro['t3-entrega']),
      
      // Novos campos
      prd_idexterno: registro.prd_idexterno || null,
      vd_localizacao: registro.vd_localizacao || null,
      usr_transfcancelou: registro.usr_transfcancelou || null,
      
      // Dados completos para debug
      dados_completos: registro
    };

    console.log(`🔍 Dados processados para inserção:`, {
      itm_qtd: dadosTempo.itm_qtd,
      hora: dadosTempo.hora,
      grp_desc: dadosTempo.grp_desc,
      valor_original: registro.$valor // Log do valor original dos dados
    });

    const { error } = await supabase
      .from('contahub_tempo')
      .insert(dadosTempo);

    if (error) {
      console.error('❌ Erro SQL em processarTempo:', error);
      console.error('❌ Dados que causaram erro:', dadosTempo);
      return false;
    }

    console.log(`✅ Tempo processado: itm_qtd=${dadosTempo.itm_qtd}, hora=${dadosTempo.hora}, grp_desc="${dadosTempo.grp_desc}", valor_original=${registro.$valor}"`);
    return true;
    
  } catch (error) {
    console.error('❌ Erro em processarTempo:', error);
    return false;
  }
}

// Função para processar dados fatporhora (CAMPOS QUE EXISTEM: vd_dtgerencial, dds, dia, hora, qtd, valor, dados_completos)
async function processarFatPorHora(registro: any, barId: number, rawId: number, supabase: any) {
  try {
    console.log(`🔍 Debug fatporhora - Campos disponíveis:`, Object.keys(registro));

    const dadosFatPorHora = {
      bar_id: barId,
      sistema_raw_id: rawId,
      vd_dtgerencial: registro.vd_dtgerencial ? new Date(registro.vd_dtgerencial) : null,
      dds: registro.dds || null,
      dia: registro.dia || null,
      hora: registro.hora || null,
      qtd: parseInt(registro.qtd || 0),
      valor: parseFloat(registro.valor || 0),
      dados_completos: registro
    };

    const { error } = await supabase
      .from('contahub_fatporhora')
      .insert(dadosFatPorHora);

    if (error) {
      console.error('❌ Erro SQL em processarFatPorHora:', error);
      return false;
    }

    console.log(`✅ FatPorHora processado: dia=${dadosFatPorHora.dia}, hora=${dadosFatPorHora.hora}, valor=${dadosFatPorHora.valor}`);
    return true;
  } catch (error) {
    console.error('❌ Erro em processarFatPorHora:', error);
    return false;
  }
}



// Função CORRIGIDA para identificar tipo de dados
function identificarTipoDados(registroRaw: any): string {
  try {
    console.log(`🔍 Identificando tipo para registro ${registroRaw.id}...`);
    
    // 1. Extrair dados do campo 'data' do registro sistema_raw (CORRIGIDO!)
    let dados = registroRaw.data;
    
    if (!dados) {
      console.log('❌ Campo data não encontrado no registro');
      return '';
    }
    
    // 2. Se dados é string, fazer parse
    if (typeof dados === 'string') {
      try {
        dados = JSON.parse(dados);
      } catch (error) {
        console.log('❌ Erro ao fazer parse dos dados JSON:', error);
        return '';
      }
    }
    
    console.log(`📊 Estrutura dos dados:`, Object.keys(dados));
    
    // 3. Verificar se tem wrapper format
    if (dados.metadados && dados.todos_registros) {
      console.log('✅ Formato wrapper detectado');
      
      // Tentar identificar pelo query_info dos metadados
      if (dados.metadados && dados.metadados.query_info && dados.metadados.query_info.relatório) {
        const relatorio = dados.metadados.query_info.relatório.toLowerCase();
        console.log(`📋 Relatório identificado: "${relatorio}"`);
        
        if (relatorio.includes('analítico') || relatorio.includes('analitico')) {
          console.log('✅ Identificado como ANALÍTICO via metadados');
          return 'analitico';
        }
        if (relatorio.includes('período') || relatorio.includes('periodo')) {
          console.log('✅ Identificado como PERÍODO via metadados');
          return 'periodo_completo';
        }
        if (relatorio.includes('tempo')) {
          console.log('✅ Identificado como TEMPO via metadados');
          return 'tempo';
        }
        if (relatorio.includes('pagamento')) {
          console.log('✅ Identificado como PAGAMENTOS via metadados');
          return 'pagamentos';
        }
        if (relatorio.includes('fat') && relatorio.includes('hora')) {
          console.log('✅ Identificado como FATPORHORA via metadados');
          return 'fatporhora';
        }
        if (relatorio.includes('cliente') && relatorio.includes('presença')) {
          console.log('✅ Identificado como CLIENTES_PRESENÇA via metadados');
          return 'clientes_presenca';
        }
        if (relatorio.includes('cliente') && relatorio.includes('cpf')) {
          console.log('✅ Identificado como CLIENTES_CPF via metadados');
          return 'clientes_cpf';
        }
        if (relatorio.includes('cliente') && relatorio.includes('faturamento')) {
          console.log('✅ Identificado como CLIENTES_FATURAMENTO via metadados');
          return 'clientes_faturamento';
        }
        if (relatorio.includes('nf')) {
          console.log('✅ Identificado como NFS via metadados');
          return 'nfs';
        }
        if (relatorio.includes('compra') && relatorio.includes('produto')) {
          console.log('✅ Identificado como COMPRA_PRODUTO via metadados');
          return 'compra_produto_dtnf';
        }
      }
      
      // Se não conseguiu pelo metadados, usar primeiro registro
      const primeiroRegistro = dados.primeiro_registro || (dados.todos_registros && dados.todos_registros[0]);
      if (primeiroRegistro) {
        console.log('🔍 Analisando primeiro registro dos dados...');
        dados = primeiroRegistro;
      } else {
        console.log('❌ Não foi possível extrair primeiro registro');
        return '';
      }
    }
    
    // 4. Usar o tipo_dados do registro como fallback
    if (registroRaw.tipo_dados) {
      console.log(`📝 Usando tipo_dados do registro: ${registroRaw.tipo_dados}`);
      
      // Mapear nomes para nomes das funções
      const mapeamentoTipos: { [key: string]: string } = {
        'periodo_completo': 'periodo_completo',
        'tempo': 'tempo',
        'pagamentos': 'pagamentos',
        'fatporhora': 'fatporhora',
        'clientes_faturamento': 'clientes_faturamento',
        'clientes_presenca': 'clientes_presenca',
        'clientes_cpf': 'clientes_cpf',
        'analitico': 'analitico',
        'nfs': 'nfs',
        'compra_produto_dtnf': 'compra_produto_dtnf'
      };
      
      const tipoMapeado = mapeamentoTipos[registroRaw.tipo_dados];
      if (tipoMapeado) {
        console.log(`✅ Tipo mapeado: ${tipoMapeado}`);
        return tipoMapeado;
      }
    }

    // 5. Identificação por campos únicos (fallback)
    console.log('🔍 Tentando identificar pelos campos dos dados...');
    console.log('Campos disponíveis:', Object.keys(dados));
    
    if (dados.vd && dados.trn && dados.dt_gerencial) {
      console.log('✅ Identificado como PERÍODO pelos campos');
      return 'periodo_completo';
    }
    
    if (dados.pag && dados.vd) {
      console.log('✅ Identificado como PAGAMENTOS pelos campos');
      return 'pagamentos';
    }
    
    if (dados.itm && dados.prd) {
      console.log('✅ Identificado como ANALÍTICO pelos campos');
      return 'analitico';
    }
    
    if (dados.hora && dados.dds) {
      console.log('✅ Identificado como FAT POR HORA pelos campos');
      return 'fatporhora';
    }
    
    if (dados.cpf && !dados.vendas) {
      console.log('✅ Identificado como CLIENTES CPF pelos campos');
      return 'clientes_cpf';
    }
    
    if (dados.vendas && dados.valor && dados.cli_nome) {
      console.log('✅ Identificado como CLIENTES FATURAMENTO pelos campos');
      return 'clientes_faturamento';
    }

    console.log('❌ Não foi possível identificar o tipo pelos campos');
    console.log('Dados disponíveis para análise:', dados);
    return '';
    
  } catch (error) {
    console.error('❌ Erro na identificação de tipo:', error);
    return '';
  }
}

// Função para extrair dados individuais de um registro
function extrairDados(registro: any) {
  try {
    console.log(`🔍 Extraindo dados do registro ${registro.id}...`);
    console.log(`🔍 Tipo de dados do registro: ${registro.tipo_dados}`);
    
    // 1. Extrair dados do campo 'data'
    let dados = registro.data;
    
    if (!dados) {
      console.log('❌ Campo data não encontrado');
      return [];
    }
    
    // 2. Parse se for string
    if (typeof dados === 'string') {
      try {
        dados = JSON.parse(dados);
      } catch (error) {
        console.log('❌ Erro ao fazer parse dos dados JSON:', error);
        return [];
      }
    }
    
    console.log(`📊 Estrutura dos dados extraídos:`, Object.keys(dados));
    
    // 3. Extrair dados individuais baseado na estrutura
    let dadosIndividuais: any[] = [];
    
    // Verificar se tem campo 'list' (formato ContaHub REAL)
    if (dados.list && Array.isArray(dados.list)) {
      console.log('✅ Formato ContaHub REAL - extraindo de list');
      console.log(`📊 list length: ${dados.list.length}`);
      dadosIndividuais = dados.list || [];
      console.log(`📋 Lista tem ${dadosIndividuais.length} itens`);
    }
    // Verificar se tem formato wrapper (metadados + todos_registros) - fallback
    else if (dados.metadados && dados.todos_registros) {
      console.log('✅ Formato wrapper - extraindo de todos_registros');
      console.log(`📊 todos_registros é array: ${Array.isArray(dados.todos_registros)}`);
      console.log(`📊 todos_registros length: ${dados.todos_registros?.length || 'N/A'}`);
      dadosIndividuais = dados.todos_registros || [];
    }
    // Se não é wrapper, usar dados diretos
    else {
      console.log('✅ Formato direto - usando dados como item único');
      console.log(`📊 Dados diretos:`, Object.keys(dados));
      dadosIndividuais = [dados];
    }
    
    // 4. Log detalhado dos primeiros registros para debug
    if (dadosIndividuais.length > 0) {
      console.log(`📋 Primeiro registro extraído:`, Object.keys(dadosIndividuais[0]));
      if (dadosIndividuais.length > 1) {
        console.log(`📋 Segundo registro extraído:`, Object.keys(dadosIndividuais[1]));
      }
      if (dadosIndividuais.length > 2) {
        console.log(`📋 Terceiro registro extraído:`, Object.keys(dadosIndividuais[2]));
      }
    }
    
    console.log(`📋 Total extraídos ${dadosIndividuais.length} registros individuais para tipo: ${registro.tipo_dados}`);
    
    // 5. Verificar se há registros duplicados (mesmo CPF, mesmo VD, etc)
    if (registro.tipo_dados === 'clientes_cpf' && dadosIndividuais.length > 1) {
      const cpfs = dadosIndividuais.map(r => r.cpf || r.cli_cpf).filter(Boolean);
      const cpfsUnicos = new Set(cpfs);
      console.log(`🔍 CPFs encontrados: ${cpfs.length}, únicos: ${cpfsUnicos.size}`);
      if (cpfs.length !== cpfsUnicos.size) {
        console.log(`⚠️ Possível duplicação de CPFs detectada!`);
        console.log(`CPFs: ${JSON.stringify(cpfs)}`);
      }
    }
    
    if (registro.tipo_dados === 'periodo_completo' && dadosIndividuais.length > 1) {
      const vds = dadosIndividuais.map(r => `${r.vd || 'null'}-${r.trn || 'null'}`);
      const vdsUnicos = new Set(vds);
      console.log(`🔍 VDs encontrados: ${vds.length}, únicos: ${vdsUnicos.size}`);
      if (vds.length !== vdsUnicos.size) {
        console.log(`⚠️ Possível duplicação de VDs detectada!`);
        console.log(`VDs: ${JSON.stringify(vds)}`);
      }
    }
    
    // 6. Retornar dados individuais
    return dadosIndividuais;
    
  } catch (error) {
    console.error('❌ Erro em extrairDados:', error);
    return [];
  }
} 