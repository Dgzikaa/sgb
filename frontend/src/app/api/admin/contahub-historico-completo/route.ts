import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getAdminClient } from '@/lib/supabase-admin';

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

    console.log(`🤖 Iniciando coleta histórica completa: ${dataInicio} até ${dataFim}`);
    
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
        logs.push(`🗓️ === Processando: ${dataStr} ===`);
        console.log(`🗓️ Processando dia: ${dataStr}`);
        
        // 1. Coleta de dados para este dia específico
        logs.push(`📥 Iniciando coleta para ${dataStr}...`);
        
        const resultadoColeta = await executarColetaParaDia(dataStr);
        let resultadoProcessamento: any = { erro: 'Não executado' };
        
        if (resultadoColeta.sucesso) {
          logs.push(`✅ Coleta ${dataStr}: ${resultadoColeta.relatorios_salvos} relatórios salvos`);
          
          // 2. Processar dados coletados
          logs.push(`⚙️ Processando dados de ${dataStr}...`);
          
          resultadoProcessamento = await processarDadosDoDia(dataStr);
          
          if (resultadoProcessamento.sucesso) {
            logs.push(`✅ Processamento ${dataStr}: ${resultadoProcessamento.sucessos} sucessos, ${resultadoProcessamento.erros} erros`);
            sucessosTotais += resultadoProcessamento.sucessos || 0;
            errosTotais += resultadoProcessamento.erros || 0;
          } else {
            logs.push(`❌ Erro no processamento ${dataStr}: ${resultadoProcessamento.erro}`);
            errosTotais++;
          }
          
        } else {
          logs.push(`❌ Erro na coleta ${dataStr}: ${resultadoColeta.erro}`);
          errosTotais++;
        }
        
        resultados.push({
          data: dataStr,
          coleta: resultadoColeta,
          processamento: resultadoProcessamento,
          status: resultadoColeta.sucesso ? 'sucesso' : 'erro'
        });
        
        diasProcessados++;
        
      } catch (error) {
        logs.push(`💥 Erro crítico em ${dataStr}: ${error}`);
        errosTotais++;
        console.error(`Erro crítico em ${dataStr}:`, error);
      }
      
      // Delay entre dias para não sobrecarregar a API ContaHub
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Próximo dia
      dataAtual.setDate(dataAtual.getDate() + 1);
      
      // Checkpoint a cada 10 dias
      if (diasProcessados % 10 === 0) {
        logs.push(`🔄 Checkpoint: ${diasProcessados} dias processados, ${sucessosTotais} sucessos, ${errosTotais} erros`);
        console.log(`🔄 Checkpoint: ${diasProcessados} dias processados`);
      }
    }
    
    const resumoFinal = {
      periodo: `${dataInicio} até ${dataFim}`,
      dias_processados: diasProcessados,
      sucessos_totais: sucessosTotais,
      erros_totais: errosTotais,
      taxa_sucesso: sucessosTotais > 0 ? ((sucessosTotais / (sucessosTotais + errosTotais)) * 100).toFixed(2) + '%' : '0%'
    };
    
    logs.push(`🏁 HISTÓRICO COMPLETO! ${JSON.stringify(resumoFinal)}`);
    console.log('🏁 Coleta histórica finalizada:', resumoFinal);
    
    return NextResponse.json({
      success: true,
      resumo: resumoFinal,
      logs,
      resultados_detalhados: resultados
    });
    
  } catch (error) {
    console.error('💥 Erro na API de histórico:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Função para executar coleta para um dia específico
async function executarColetaParaDia(data: string) {
  try {
    console.log(`📥 Coletando dados para ${data}...`);
    
    // Verificar se o script existe
    const scriptPath = path.join(process.cwd(), '..', 'backend', 'scripts', 'contahub', 'contahub_playwright_2fa.py');
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script não encontrado: ${scriptPath}`);
    }
    
    // Usar arquivo de credenciais existente
    const credentialsFile = path.join(process.cwd(), '..', 'backend', 'scripts', 'contahub', 'test_credentials.json');
    
    if (!fs.existsSync(credentialsFile)) {
      throw new Error(`Arquivo de credenciais não encontrado: ${credentialsFile}`);
    }
    
    return new Promise<any>((resolve) => {
      // Preparar argumentos corretos para o script Python
      const args = [
        scriptPath,
        '--credenciais-arquivo', credentialsFile,
        '--periodo', data, // Usar a data específica como período
        '--headless'
      ];
      
      console.log('🚀 Executando:', 'python', args.join(' '));
      
      const pythonProcess = spawn('python', args, {
        cwd: path.dirname(scriptPath),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      });
      
      let stdout = '';
      let stderr = '';
      
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Tentar extrair número de relatórios do output
          const match = stdout.match(/(\d+)\s*relatórios?\s*salvos?/i);
          const relatoriosSalvos = match ? parseInt(match[1]) : 0;
          
          resolve({
            sucesso: true,
            relatorios_salvos: relatoriosSalvos,
            output: stdout,
            data: data
          });
        } else {
          resolve({
            sucesso: false,
            erro: `Python script falhou com código ${code}. Stderr: ${stderr}`,
            output: stdout,
            data: data
          });
        }
      });
      
      pythonProcess.on('error', (error) => {
        resolve({
          sucesso: false,
          erro: `Erro ao executar Python: ${error.message}`,
          data: data
        });
      });
    });
    
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : String(error),
      data: data
    };
  }
}

// Função para processar dados de um dia específico
async function processarDadosDoDia(data: string) {
  try {
    console.log(`⚙️ Processando dados de ${data}...`);
    
    const supabase = await getAdminClient();
    
    // Verificar se há dados para processar desta data
    const { data: dadosRaw, error: errorRaw } = await supabase
      .from('sistema_raw')
      .select('*')
      .eq('sistema', 'contahub')
      .eq('bar_id', 3)
      .eq('data_referencia', data)
      .eq('processado', false);
    
    if (errorRaw) {
      throw new Error(`Erro ao buscar dados: ${errorRaw.message}`);
    }
    
    if (!dadosRaw || dadosRaw.length === 0) {
      return {
        sucesso: true,
        sucessos: 0,
        erros: 0,
        mensagem: `Nenhum dado para processar em ${data}`
      };
    }
    
    console.log(`📊 Encontrados ${dadosRaw.length} registros para processar em ${data}`);
    
    // Chamar a API de processamento via fetch
    const response = await fetch('http://localhost:3001/api/admin/contahub-processar-raw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_especifica: data })
    });
    
    if (!response.ok) {
      throw new Error(`API de processamento falhou: ${response.status}`);
    }
    
    const resultado = await response.json();
    
    return {
      sucesso: true,
      sucessos: resultado.sucessos || 0,
      erros: resultado.erros || 0,
      detalhes: resultado
    };
    
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de Coleta Histórica Completa ContaHub',
    uso: 'POST com { "dataInicio": "2025-02-05", "dataFim": "2025-07-05" }',
    info: 'Executa coleta + processamento dia por dia para períodos longos',
    diferenca: 'Usa script Python direto, não limitado a 5 dias'
  });
} 