import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getAdminClient } from '@/lib/supabase-admin';
import { verificarDisponibilidadeContaHub } from '@/lib/contahub-service';

export async function POST(request: NextRequest) {
  try {
    // ⚠️ VERIFICAR SE CONTAHUB ESTÁ DISPONÍVEL
    const statusManutencao = verificarDisponibilidadeContaHub('Teste ContaHub');
    if (statusManutencao) {
      console.log('🔧 ContaHub em modo manutenção, retornando status...');
      return NextResponse.json(statusManutencao, { status: 503 });
    }

    const { 
      limpar_dados_antes = true, 
      data_inicio = '2025-01-31', 
      data_fim = '2025-02-04' 
    } = await request.json();

    console.log('🧪 Iniciando teste ContaHub - Período Customizado');
    console.log(`📅 Período: ${data_inicio} até ${data_fim}`);
    console.log(`🗑️ Limpar dados antes: ${limpar_dados_antes ? 'SIM' : 'NÃO'}`);
    
    // Verificar variáveis de ambiente
    console.log('🔍 Verificando configurações...');
    console.log(`📧 CONTAHUB_EMAIL: ${process.env.CONTAHUB_EMAIL ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
    console.log(`🔑 CONTAHUB_PASSWORD: ${process.env.CONTAHUB_PASSWORD ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
    console.log(`🔐 SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);

    // 1. Limpar dados do ContaHub se solicitado
    if (limpar_dados_antes) {
      const supabase = await getAdminClient();
      
      console.log('🗑️ Limpando dados do ContaHub...');
      
      // 🧹 PRIMEIRO: Limpar tabela sistema_raw de dados do ContaHub
      console.log('🧹 Limpando sistema_raw de dados do ContaHub...');
      try {
        // Verificar quantos registros existem ANTES da limpeza
        const { data: beforeCount, error: beforeError } = await supabase
          .from('sistema_raw')
          .select('id', { count: 'exact', head: true })
          .eq('sistema', 'contahub')
          .eq('bar_id', 3);
          
        console.log(`📊 Registros antes da limpeza: ${beforeCount || 0}`);
        
        // Fazer a limpeza usando uma abordagem mais direta
        const { error: rawError } = await supabase
          .from('sistema_raw')
          .delete()
          .eq('sistema', 'contahub')
          .eq('bar_id', 3);
          
        if (rawError) {
          console.warn(`⚠️ Erro ao limpar sistema_raw: ${rawError.message}`);
        } else {
          // Verificar quantos registros restaram APÓS a limpeza
          const { data: afterCount, error: afterError } = await supabase
            .from('sistema_raw')
            .select('id', { count: 'exact', head: true })
            .eq('sistema', 'contahub')
            .eq('bar_id', 3);
            
          const removidos = (beforeCount || 0) - (afterCount || 0);
          console.log(`✅ sistema_raw limpa (${removidos} registros ContaHub removidos)`);
          console.log(`📊 Registros após limpeza: ${afterCount || 0}`);
        }
      } catch (err) {
        console.warn(`⚠️ Erro ao limpar sistema_raw: ${err}`);
      }
      
      // Limpar tabelas específicas do ContaHub que já existem
      const tabelasContaHub = [
        'contahub_analitico',
        'contahub_periodo', 
        'contahub_fatporhora',
        'contahub_pagamentos',
        'contahub_tempo',
        'contahub_nfs',
        'contahub_clientes_cpf',
        'contahub_clientes_faturamento',
        'contahub_clientes_presenca',
        'contahub_compra_produto_dtnf'
      ];

      for (const tabela of tabelasContaHub) {
        try {
          const { error, count } = await supabase
            .from(tabela)
            .delete()
            .neq('id', 0); // Condição para selecionar todas as linhas
          
          if (error) {
            if (error.code === 'PGRST106') {
              console.log(`ℹ️ Tabela ${tabela} não existe, pulando...`);
            } else {
              console.warn(`⚠️ Erro ao limpar ${tabela}: ${error.message}`);
            }
          } else {
            console.log(`✅ Tabela ${tabela} limpa (${count || 0} registros)`);
          }
        } catch (err) {
          console.warn(`⚠️ Erro ao limpar ${tabela}: ${err}`);
        }
      }
    }

    // 2. Executar script de teste
    const scriptPath = path.join(process.cwd(), '..', 'backend', 'scripts', 'contahub', 'teste_5_dias_janeiro.js');
    
    console.log('📁 Script path:', scriptPath);
    console.log('📁 Script existe:', fs.existsSync(scriptPath));
    console.log('📁 Working directory:', process.cwd());
    
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({
        success: false,
        error: 'Script de teste não encontrado',
        scriptPath,
        workingDir: process.cwd(),
        pathExists: fs.existsSync(scriptPath)
      }, { status: 500 });
    }

    console.log('🚀 Executando script de teste...');
    console.log('🌍 Variáveis de ambiente disponíveis:');
    console.log('  - CONTAHUB_EMAIL:', process.env.CONTAHUB_EMAIL ? 'DEFINIDO' : 'INDEFINIDO');
    console.log('  - CONTAHUB_PASSWORD:', process.env.CONTAHUB_PASSWORD ? 'DEFINIDO' : 'INDEFINIDO');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINIDO' : 'INDEFINIDO');

    // Executar script
    return new Promise<NextResponse>((resolve) => {
      console.log('🔧 Iniciando spawn do processo node...');
      console.log('🔧 Working dir para spawn:', path.dirname(scriptPath));
      
      const nodeProcess = spawn('node', [scriptPath, data_inicio, data_fim], {
        cwd: path.dirname(scriptPath),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Garantir que as variáveis estão disponíveis (com fallbacks para desenvolvimento local)
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTU5NDQzMiwiZXhwIjoyMDUxMTcwNDMyfQ.lsE6HfVtq8TJFjZ5o9p3FqGGTANpOSFV6WUP8fZ-4ho',
          CONTAHUB_EMAIL: process.env.CONTAHUB_EMAIL || 'digao@3768',
          CONTAHUB_PASSWORD: process.env.CONTAHUB_PASSWORD || 'Geladeira@001'
        }
      });
      
      console.log('🔧 Processo node criado, PID:', nodeProcess.pid);

      let stdout = '';
      let stderr = '';
      let resultado: any = null;

      nodeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log('📊 STDOUT:', output);
        
        // Tentar extrair resultado JSON do output
        try {
          const lines = output.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('{') && trimmed.includes('"sucesso"')) {
              try {
                resultado = JSON.parse(trimmed);
                break;
              } catch (e) {
                continue;
              }
            }
          }
        } catch (e) {
          // Ignorar erros de parsing
        }
      });

      nodeProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error('⚠️ STDERR:', output);
      });

      nodeProcess.on('close', (code) => {
        console.log(`🏁 Script finalizado com código: ${code}`);
        console.log(`📝 STDOUT length: ${stdout.length}`);
        console.log(`⚠️ STDERR length: ${stderr.length}`);

        const logs = stdout.split('\n').filter(line => line.trim());
        const errors = stderr.split('\n').filter(line => line.trim());
        
        // Sempre retornar os logs, mesmo em caso de erro
        const response: any = {
          success: code === 0 || resultado !== null,
          message: code === 0 ? 'Teste executado' : `Script terminou com código ${code}`,
          resultado: resultado,
          logs: {
            output: logs,
            errors: errors
          },
          debug: {
            exit_code: code,
            stdout_length: stdout.length,
            stderr_length: stderr.length,
            resultado_encontrado: resultado !== null
          }
        };

        if (code === 0 || resultado) {
          // Extrair estatísticas do resultado JSON se disponível
          let stats;
          if (resultado) {
            stats = {
              totalRegistros: resultado.relatorios_salvos || 0,
              camposIdentificados: resultado.queries_processadas || 0,
              datasTestadas: resultado.datas_processadas || 0,
              tempoTotal: resultado.tempo_total || 0,
              totalEsperado: resultado.total_esperado || 0,
              erros: resultado.erros || 0,
              sucessos: resultado.relatorios_salvos || 0
            };
          } else {
            // Fallback: extrair dos logs se JSON não disponível
            stats = extrairEstatisticasDoLog(logs);
          }
          response.estatisticas = stats;
          resolve(NextResponse.json(response));
        } else {
          response.error = `Script falhou com código ${code}`;
          // Incluir os primeiros erros no erro principal
          if (errors.length > 0) {
            response.error += `. Primeiro erro: ${errors[0]}`;
          }
          resolve(NextResponse.json(response, { status: 500 }));
        }
      });

      nodeProcess.on('error', (error) => {
        console.error('💥 Erro ao executar script:', error);
        console.error('💥 Erro stack:', error.stack);
        console.error('💥 Tipo do erro:', error.name);
        resolve(NextResponse.json({
          success: false,
          error: `Erro ao executar script: ${error.message}`,
          errorType: error.name,
          errorStack: error.stack,
          debug: {
            scriptPath,
            workingDir: path.dirname(scriptPath),
            nodeVersion: process.version
          }
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('💥 Erro na API:', error);
    console.error('💥 Stack trace:', error instanceof Error ? error.stack : 'Não disponível');
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
      debug: {
        cwd: process.cwd(),
        nodeVersion: process.version,
        platform: process.platform
      }
    }, { status: 500 });
  }
}

// Função auxiliar para extrair estatísticas dos logs
function extrairEstatisticasDoLog(logs: string[]) {
  const stats = {
    totalRegistros: 0,
    camposIdentificados: 0,
    datasTestadas: 0,
    tempoTotal: 0,
    datasComDados: [] as string[],
    erros: [] as string[]
  };

  logs.forEach(line => {
    // Extrair números dos logs
    if (line.includes('Total de registros:')) {
      const match = line.match(/(\d+)/);
      if (match) stats.totalRegistros = parseInt(match[1]);
    }
    
    if (line.includes('Campos únicos identificados:')) {
      const match = line.match(/(\d+)/);
      if (match) stats.camposIdentificados = parseInt(match[1]);
    }
    
    if (line.includes('Datas testadas:')) {
      const match = line.match(/(\d+)/);
      if (match) stats.datasTestadas = parseInt(match[1]);
    }
    
    if (line.includes('Tempo total:')) {
      const match = line.match(/([\d.]+)\s*segundos/);
      if (match) stats.tempoTotal = parseFloat(match[1]);
    }
    
    // Extrair datas com dados
    if (line.includes('✅') && line.includes('2025-')) {
      const match = line.match(/✅ (2025-\d{2}-\d{2})/);
      if (match) stats.datasComDados.push(match[1]);
    }
    
    // Extrair erros
    if (line.includes('❌')) {
      stats.erros.push(line);
    }
  });

  return stats;
}

// Endpoint GET para verificar status
export async function GET() {
  try {
    const supabase = await getAdminClient();
    
    // ⚠️ VERIFICAR STATUS DO CONTAHUB
    const statusContaHub = verificarDisponibilidadeContaHub('Status ContaHub');
    const contahubManutencao = !!statusContaHub;
    
    const status: any = {
      contahub_disponivel: !contahubManutencao,
      contahub_status: contahubManutencao ? statusContaHub : { disponivel: true, message: 'ContaHub operacional' },
      script_existe: fs.existsSync(path.join(process.cwd(), 'backend', 'scripts', 'contahub', 'teste_5_dias_janeiro.js')),
      sistema_raw: {},
      tabelas_contahub: {}
    };
    
    // 🔍 Verificar dados na sistema_raw
    try {
      const { data: rawData, error: rawError } = await supabase
        .from('sistema_raw')
        .select('id, sistema, tipo_dados, data_referencia, processado, criado_em')
        .eq('sistema', 'contahub')
        .eq('bar_id', 3)
        .order('criado_em', { ascending: false })
        .limit(5);
        
      if (rawError) {
        status.sistema_raw = { erro: rawError.message };
      } else {
        const totalContahub = await supabase
          .from('sistema_raw')
          .select('id', { count: 'exact', head: true })
          .eq('sistema', 'contahub')
          .eq('bar_id', 3);
          
        const naoProcessados = await supabase
          .from('sistema_raw')
          .select('id', { count: 'exact', head: true })
          .eq('sistema', 'contahub')
          .eq('bar_id', 3)
          .eq('processado', false);
          
        status.sistema_raw = {
          existe: true,
          total_registros: totalContahub.count || 0,
          nao_processados: naoProcessados.count || 0,
          processados: (totalContahub.count || 0) - (naoProcessados.count || 0),
          ultimos_registros: rawData || []
        };
      }
    } catch (err) {
      status.sistema_raw = { erro: `Erro: ${err}` };
    }
    
         // Verificar dados nas tabelas específicas do ContaHub (usando colunas corretas)
     const tabelasContaHub = [
       { nome: 'contahub_analitico', select: 'id, dia, valor_total, criado_em', orderBy: 'criado_em' },
       { nome: 'contahub_periodo', select: 'id, dt_gerencial, vr_produtos, criado_em', orderBy: 'criado_em' },
       { nome: 'contahub_fatporhora', select: 'id, vd_dtgerencial, hora, valor, criado_em', orderBy: 'criado_em' },
       { nome: 'contahub_pagamentos', select: 'id, dt_gerencial, valor_pagamentos, criado_em', orderBy: 'criado_em' },
       { nome: 'contahub_tempo', select: 'id, dia, tempo_t0_t3, criado_em', orderBy: 'criado_em' },
       { nome: 'contahub_nfs', select: 'id, data_emissao, valor_total, criado_em', orderBy: 'criado_em' },
       { nome: 'contahub_clientes_cpf', select: 'id, ultima, vd_vrpagamentos, criado_em', orderBy: 'criado_em' }
     ];

    for (const { nome, select, orderBy } of tabelasContaHub) {
      try {
        const { data, error } = await supabase
          .from(nome)
          .select(select)
          .order(orderBy, { ascending: false })
          .limit(3);
          
        if (error) {
          if (error.code === 'PGRST106') {
            status.tabelas_contahub[nome] = { existe: false, registros: 0 };
          } else {
            status.tabelas_contahub[nome] = { erro: error.message };
          }
        } else {
          status.tabelas_contahub[nome] = {
            existe: true,
            registros: data?.length || 0,
            ultimos_dados: data || []
          };
        }
      } catch (err) {
        status.tabelas_contahub[nome] = { erro: `Erro: ${err}` };
      }
    }

    return NextResponse.json({
      success: true,
      status,
      message: 'API pronta para executar teste com tabelas ContaHub específicas'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 