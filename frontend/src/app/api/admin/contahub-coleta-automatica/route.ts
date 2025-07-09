import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { dataInicio, dataFim } = await request.json();
    
    // Validar datas
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const hoje = new Date();
    
    if (inicio > hoje) {
      return NextResponse.json({ 
        error: 'Data de início não pode ser no futuro' 
      }, { status: 400 });
    }

    if (fim < inicio) {
      return NextResponse.json({ 
        error: 'Data fim deve ser maior que data início' 
      }, { status: 400 });
    }

    const logs: string[] = [];
    const resultados: any[] = [];
    let sucessosTotais = 0;
    let errosTotais = 0;
    let diasProcessados = 0;
    
    // Loop dia por dia
    const dataAtual = new Date(inicio);
    
    while (dataAtual <= fim) {
      const dataStr = dataAtual.toISOString().split('T')[0];
      
      try {
        logs.push(`🗓️ Processando dia: ${dataStr}`);
        
        // Executar coleta + processamento em uma única chamada para este dia
        logs.push(`📥 Executando coleta e processamento completo para ${dataStr}...`);
        const response = await fetch(`${request.url.replace('/contahub-coleta-automatica', '/contahub-historico-completo')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            dataInicio: dataStr,
            dataFim: dataStr
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          logs.push(`❌ Erro no dia ${dataStr}: ${result.error}`);
          errosTotais++;
          
          // Continuar para o próximo dia
          dataAtual.setDate(dataAtual.getDate() + 1);
          continue;
        }
        
        logs.push(`✅ Dia ${dataStr} concluído: ${result.resumo?.sucessos_totais || 0} sucessos, ${result.resumo?.erros_totais || 0} erros`);
        sucessosTotais += result.resumo?.sucessos_totais || 0;
        errosTotais += result.resumo?.erros_totais || 0;
        
        resultados.push({
          data: dataStr,
          resultado_completo: result,
          status: response.ok ? 'sucesso' : 'erro'
        });
        
        diasProcessados++;
        logs.push(`📊 Resumo ${dataStr}: ${diasProcessados} dias processados`);
        
      } catch (error) {
        logs.push(`💥 Erro crítico em ${dataStr}: ${error}`);
        errosTotais++;
      }
      
      // Delay entre dias para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Próximo dia
      dataAtual.setDate(dataAtual.getDate() + 1);
      
      // Checkpoint a cada 10 dias
      if (diasProcessados % 10 === 0) {
        logs.push(`🔄 Checkpoint: ${diasProcessados} dias processados, ${sucessosTotais} sucessos, ${errosTotais} erros`);
      }
    }
    
    const resumoFinal = {
      periodo: `${dataInicio} até ${dataFim}`,
      dias_processados: diasProcessados,
      sucessos_totais: sucessosTotais,
      erros_totais: errosTotais,
      taxa_sucesso: sucessosTotais > 0 ? ((sucessosTotais / (sucessosTotais + errosTotais)) * 100).toFixed(2) + '%' : '0%'
    };
    
    logs.push(`🏁 CONCLUÍDO! ${JSON.stringify(resumoFinal)}`);
    
    return NextResponse.json({
      success: true,
      resumo: resumoFinal,
      logs,
      resultados_detalhados: resultados
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de Coleta Automatizada ContaHub',
    uso: 'POST com { "dataInicio": "2025-02-05", "dataFim": "2025-07-05" }',
    info: 'Processa dados dia por dia automaticamente'
  });
} 