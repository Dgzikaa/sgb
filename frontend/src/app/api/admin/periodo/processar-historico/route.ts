import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';
import crypto from 'crypto'

// Helper function to calculate SHA-1
function sha1(input: string): string {
  return crypto.createHash('sha1').update(input).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { 
      data_inicio = '01.01.2025', 
      data_fim = '07.06.2025',
      intervalo_dias = 5,
      bar_id = 1,
      delay_entre_lotes = 2000 // 2 segundos entre lotes
    } = await request.json()

    console.log('ðŸ—ï¸ PROCESSAMENTO HISTÃ“RICO PERÃODO COM CLIENTES');
    console.log(`ðŸ“… PerÃ­odo: ${data_inicio} â†’ ${data_fim}`);
    console.log(`â±ï¸ Intervalo: ${intervalo_dias} dias`);
    console.log(`ðŸª Bar ID: ${bar_id}`)

    // Converter datas para Date
    const parseData = (dataStr: string): Date => {
      const [dia, mes, ano] = dataStr.split('.');
      return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    }

    const dataInicio = parseData(data_inicio);
    const dataFim = parseData(data_fim)

    // Gerar lotes
    const lotes = [];
    let dataAtual = new Date(dataInicio)

    while (dataAtual <= dataFim) {
      const inicioLote = new Date(dataAtual);
      const fimLote = new Date(dataAtual);
      fimLote.setDate(fimLote.getDate() + intervalo_dias - 1);
      
      // NÃ£o passar do limite final
      if (fimLote > dataFim) {
        fimLote.setTime(dataFim.getTime());
      }

      const formatarData = (data: Date): string => {
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}.${mes}.${ano}`;
      }

      lotes.push({
        inicio: formatarData(inicioLote),
        fim: formatarData(fimLote),
        periodo: `${formatarData(inicioLote)} â†’ ${formatarData(fimLote)}`
      })

      // PrÃ³ximo lote
      dataAtual.setDate(dataAtual.getDate() + intervalo_dias);
    }

    console.log(`ðŸ“¦ ${lotes.length} lotes gerados`)

    // Processar lotes
    const resultados = [];
    let totalInseridos = 0;
    let totalIgnorados = 0;
    let totalProcessados = 0;
    let totalComCliente = 0

    // LOGIN CONTAHUB (usando secrets do sistema)
    const contahub_email = process.env.CONTAHUB_EMAIL;
    const contahub_senha = process.env.CONTAHUB_PASSWORD;
    
    if (!contahub_email || !contahub_senha) {
      throw new Error('CONTAHUB_EMAIL e CONTAHUB_PASSWORD devem estar configurados nos secrets do sistema');
    }
    
    const passwordSha1Hex = sha1(contahub_senha)

    const loginData = new URLSearchParams({
      "usr_email": contahub_email,
      "usr_password_sha1": passwordSha1Hex
    })

    const loginResponse = await fetch("https://sp.contahub.com/rest/contahub.cmds.UsuarioCmd/login/17421701611337?emp=0", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: loginData.toString()
    })

    if (!loginResponse.ok) {
      throw new Error(`Login ContaHub failed: ${loginResponse.status}`);
    }

    const setCookieHeaders = loginResponse.headers.get('set-cookie');
    if (!setCookieHeaders) {
      throw new Error('No cookies received from ContaHub');
    }

    console.log('âœ… Login ContaHub OK')

    for (let i = 0; i < lotes.length; i++) {
      const lote = lotes[i];
      
      console.log(`\nðŸ”„ Processando lote ${i + 1}/${lotes.length}: ${lote.periodo}`)

      try {
        // Converter datas para formato ContaHub (YYYY-MM-DD)
        const start_date = lote.inicio.split('.').reverse().join('-');
        const end_date = lote.fim.split('.').reverse().join('-');
        const emp_id = bar_id === 1 ? "3768" : "3691";
        
        // Query ContaHub diretamente (Query 5)
        const query_url = `https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/1749412571993?qry=5&d0=${start_date}&d1=${end_date}&emp=${emp_id}&nfe=1`;
        
        console.log(`ðŸ”— ${query_url}`)

        const response = await fetch(query_url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Cookie": setCookieHeaders,
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          }
        })

        if (!response.ok) {
          throw new Error(`ContaHub query failed: ${response.status}`);
        }

        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`JSON parse error: ${parseError}`);
        }

        let records = [];
        if (data && data.list && Array.isArray(data.list)) {
          records = data.list;
        }

        console.log(`ðŸ“Š ${records.length} records found`);
        
        // Se nÃ£o hÃ¡ registros, pular
        if (records.length === 0) {
          resultados.push({
            lote: i + 1,
            periodo: lote.periodo,
            status: 'sucesso',
            inseridos: 0,
            ignorados: 0,
            processados: 0,
            com_cliente: 0
          });
          continue;
        }

        // SUPABASE CONNECTION (usar as env vars do Next.js)
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        // PROCESS RECORDS
        let inserted = 0, skipped = 0, registros_com_cliente = 0

        for (let j = 0; j < records.length; j++) {
          const record = records[j];
          
          try {
            // Extract basic fields
            const dt_gerencial = record.data || start_date;
            const vd = parseInt(String(record.numero || record.vd || '0'), 10);
            
            // Check for existing record
            const { data: existing, error: checkError } = await supabase
              .from('periodo')
              .select('id')
              .eq('bar_id', bar_id)
              .eq('dt_gerencial', dt_gerencial)
              .eq('vd', vd)
              .single()

            if (checkError && checkError.code !== 'PGRST116') {
              console.log(`âŒ Check error: ${checkError.message}`);
              continue;
            }

            if (existing) {
              skipped++;
              continue;
            }

            // Create periodo record mapping to existing table structure
            const periodoRecord = {
              bar_id,
              dt_gerencial: dt_gerencial,
              vd: vd,
              trn: parseInt(String(record.trn || '0'), 10),
              dia_da_semana: String(record.dia_da_semana || ''),
              semana: parseInt(String(record.semana || '0'), 10),
              tipovenda: String(record.tipovenda || ''),
              vd_mesadesc: String(record.vd_mesadesc || ''),
              vd_localizacao: String(record.vd_localizacao || ''),
              usr_abriu: String(record.usr_abriu || ''),
              pessoas: parseInt(String(record.pessoas || record.qt_pessoas || '0'), 10),
              qtd_itens: parseInt(String(record.qtd_itens || '0'), 10),
              vr_pagamentos: parseFloat(String(record.vr_pagamentos || record.vd_liquido || '0')),
              vr_produtos: parseFloat(String(record.vr_produtos || record.vd_bruto || '0')),
              vr_repique: parseFloat(String(record.vr_repique || '0')),
              vr_couvert: parseFloat(String(record.vr_couvert || '0')),
              vr_desconto: parseFloat(String(record.vr_desconto || record.vd_desconto || '0')),
              motivo: String(record.motivo || ''),
              dt_contabil: record.dt_contabil || dt_gerencial,
              ultimo_pedido: record.ultimo_pedido || null,
              vd_cpf: String(record.vd_cpf || ''),
              nf_autorizada: Boolean(record.nf_autorizada),
              nf_chaveacesso: String(record.nf_chaveacesso || ''),
              nf_dtcontabil: record.nf_dtcontabil || null,
              vd_dtcontabil: record.vd_dtcontabil || dt_gerencial,
              origem: 'contahub',
              // Novos campos de cliente
              cli_nome: String(record.cli_nome || ''),
              cli_email: String(record.cli_email || ''),
              cli_dtnasc: record.cli_dtnasc || null,
              cli_telefone: String(record.cli_telefone || ''),
              cli_endereco: String(record.cli_endereco || '')
            }

            // Count records with client info
            if (periodoRecord.cli_nome) {
              registros_com_cliente++;
            }

            const { data: insertResult, error: insertError } = await supabase
              .from('periodo')
              .insert(periodoRecord)
              .select('id')
              .single()

            if (insertError) {
              console.error(`âŒ Insert error:`, insertError);
              continue;
            }

            inserted++

          } catch (recordError) {
            console.error(`âŒ Record error:`, recordError);
            continue;
          }
        }

        totalInseridos += inserted;
        totalIgnorados += skipped;
        totalProcessados += records.length;
        totalComCliente += registros_com_cliente

        resultados.push({
          lote: i + 1,
          periodo: lote.periodo,
          status: 'sucesso',
          inseridos: inserted,
          ignorados: skipped,
          processados: records.length,
          com_cliente: registros_com_cliente
        })

        console.log(`âœ… Lote ${i + 1}: ${inserted} inseridos, ${registros_com_cliente} com cliente`)

      } catch (error) {
        console.error(`âŒ Erro no lote ${i + 1}:`, error);
        resultados.push({
          lote: i + 1,
          periodo: lote.periodo,
          status: 'erro',
          erro: error instanceof Error ? error.message : String(error),
          inseridos: 0,
          ignorados: 0,
          processados: 0,
          com_cliente: 0
        });
      }

      // Delay entre lotes para nÃ£o sobrecarregar
      if (i < lotes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay_entre_lotes));
      }
    }

    console.log('\nðŸ“Š RESUMO FINAL:');
    console.log(`ðŸ† Total inseridos: ${totalInseridos}`);
    console.log(`â­ï¸ Total ignorados: ${totalIgnorados}`);
    console.log(`ðŸ“‹ Total processados: ${totalProcessados}`);
    console.log(`ðŸ‘¥ Total com cliente: ${totalComCliente}`)

    // Calcular percentual de clientes identificados
    const percentualClientes = totalProcessados > 0 
      ? ((totalComCliente / totalProcessados) * 100).toFixed(1)
      : '0.0'

    return NextResponse.json({
      success: true,
      message: `Processamento histÃ³rico concluÃ­do: ${totalInseridos} registros inseridos`,
      result: {
        inserted: totalInseridos,
        skipped: totalIgnorados,
        total_processed: totalProcessados,
        registros_com_cliente: totalComCliente
      },
      resumo: {
        periodo: `${data_inicio} â†’ ${data_fim}`,
        lotes_processados: lotes.length,
        total_inseridos: totalInseridos,
        total_ignorados: totalIgnorados,
        total_processados: totalProcessados,
        total_com_cliente: totalComCliente,
        percentual_clientes: `${percentualClientes}%`,
        sucesso: resultados.filter((r: any) => r.status === 'sucesso').length,
        erros: resultados.filter((r: any) => r.status === 'erro').length
      },
      detalhes: resultados
    })

  } catch (error) {
    console.error('ðŸ’¥ Erro crÃ­tico:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
