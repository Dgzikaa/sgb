import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const { email, senha, headless = true, forcar_processamento = false } = await request.json();

    if (!email || !senha) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email e senha são obrigatórios' 
      }, { status: 400 });
    }

    // Criar arquivo temporário com credenciais
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const credentialsFile = path.join(tempDir, `credentials_v3_${Date.now()}.json`);
    fs.writeFileSync(credentialsFile, JSON.stringify({ email, senha }));

    // Localizar script Python V3
    const possiblePaths = [
      path.join(process.cwd(), 'backend', 'scripts', 'contahub', 'contahub_playwright_2fa_v3.py'),
      path.join(process.cwd(), '..', 'backend', 'scripts', 'contahub', 'contahub_playwright_2fa_v3.py'),
      'F:\\SGB_V2\\backend\\scripts\\contahub\\contahub_playwright_2fa_v3.py', // Caminho absoluto
    ];

    let scriptPath = '';
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        scriptPath = testPath;
        break;
      }
    }

    if (!scriptPath) {
      fs.unlinkSync(credentialsFile);
      return NextResponse.json({ 
        success: false, 
        error: 'Script Python V3 não encontrado',
        paths_tested: possiblePaths
      }, { status: 500 });
    }

    console.log('🐍 Executando script V3 Robusto:', scriptPath);

    // Preparar argumentos
    const args = [
      scriptPath,
      '--credenciais-arquivo', credentialsFile,
      '--periodo', '365'
    ];

    if (headless) {
      args.push('--headless');
    }

    // Executar script
    const pythonProcess = spawn('python', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.dirname(scriptPath)
    });

    let stdout = '';
    let stderr = '';
    let jsonResult: any = null;

    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log('STDOUT V3:', output);
      
      // Tentar extrair JSON do output
      try {
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
            const parsed = JSON.parse(line.trim());
            if (parsed.success !== undefined) {
              jsonResult = parsed;
            }
          }
        }
      } catch (e) {
        // Ignorar erros de parsing
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error('STDERR V3:', output);
    });

    // Aguardar conclusão
    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    // Cleanup
    try {
      fs.unlinkSync(credentialsFile);
    } catch (e) {
      console.warn('Erro ao remover arquivo temporário:', e);
    }

    if (exitCode !== 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro na execução do script V3',
        stdout,
        stderr,
        exitCode
      }, { status: 500 });
    }

    // Processar resultado JSON
    if (jsonResult && jsonResult.success) {
      try {
        console.log('📊 Processando dados V3 coletados...');
        
        // Verificar se temos dados para inserir
        if (jsonResult.dados && jsonResult.dados.arquivo_json) {
          const jsonFilePath = jsonResult.dados.arquivo_json;
          
          if (fs.existsSync(jsonFilePath)) {
            const dadosJson = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
            
            console.log(`📋 Dados V3 lidos: ${dadosJson.length} registros`);
            
            // 1. DELETAR todos os dados existentes da tabela contaazul
            console.log('🗑️ Limpando tabela contaazul...');
            const { error: deleteError } = await supabase
              .from('contaazul')
              .delete()
              .neq('id', ''); // Deleta todos os registros
            
            if (deleteError) {
              console.error('❌ Erro ao limpar tabela contaazul:', deleteError);
              return NextResponse.json({
                success: false,
                error: 'Erro ao limpar dados antigos',
                details: deleteError.message
              }, { status: 500 });
            }
            
            console.log('✅ Tabela contaazul limpa com sucesso');
            
                        // 2. PREPARAR dados para inserção direta na tabela contaazul
            const agora = new Date().toISOString();
            const dadosContaAzul = dadosJson.map((registro: any, index: number) => {
              // Extrair valor corretamente do Excel
              let valorStr = registro['Valor (R$)'] || '0';
              if (typeof valorStr === 'string') {
                valorStr = valorStr.replace(/[R$\s]/g, '').replace(',', '.');
              }
              let valorNumerico = parseFloat(valorStr) || 0;
              
              // Converter data de competência (DD/MM/YYYY -> YYYY-MM-DD)
              let dataCompetencia = agora.split('T')[0]; // Default hoje se não conseguir converter
              const dataOriginal = registro['Data de competência'];
              if (dataOriginal && typeof dataOriginal === 'string') {
                const partes = dataOriginal.split('/');
                if (partes.length === 3 && partes[0] && partes[1] && partes[2]) {
                  const dia = partes[0].padStart(2, '0');
                  const mes = partes[1].padStart(2, '0');
                  const ano = partes[2];
                  dataCompetencia = `${ano}-${mes}-${dia}`;
                }
              }
              
              // Determinar tipo baseado no valor (positivo = receita, negativo = despesa)
              let tipoMovimento = valorNumerico >= 0 ? 'receita' : 'despesa';
              
              // Nome do cliente/fornecedor (verificar se existe)
              const clienteFornecedor = registro['Nome do fornecedor/cliente'] || registro['nome_fornecedor_cliente'] || '';
              
              // Observações completas
              let observacoes = '';
              if (registro['Observações']) {
                observacoes += registro['Observações'];
              }
              
              // Adicionar número de parcelas se > 1
              const numeroParcelas = registro['Número de parcelas'];
              if (numeroParcelas && numeroParcelas !== '1' && numeroParcelas !== 1) {
                observacoes += observacoes ? ` | Parcelas: ${numeroParcelas}` : `Parcelas: ${numeroParcelas}`;
              }
              
              // Adicionar recorrência se existir
              if (registro['Recorrência']) {
                observacoes += observacoes ? ` | Recorrência: ${registro['Recorrência']}` : `Recorrência: ${registro['Recorrência']}`;
              }
              
              // Adicionar identificador do fornecedor/cliente se existir
              if (registro['Identificador do fornecedor/cliente']) {
                observacoes += observacoes ? ` | ID: ${registro['Identificador do fornecedor/cliente']}` : `ID: ${registro['Identificador do fornecedor/cliente']}`;
              }
              
              return {
                id: `ca_${Date.now()}_${index}`, // ID único
                bar_id: 3, // Ordinário Bar
                descricao: registro['Descrição'] || '',
                valor: valorNumerico,
                categoria: registro['Categoria 1'] || '',
                centro_custo: registro['Centro de Custo 1'] || registro['centro_custo'] || '',
                data_competencia: dataCompetencia,
                data_vencimento: null, // ContaAzul não fornece data vencimento neste relatório
                status: 'processado',
                tipo: tipoMovimento,
                cliente_fornecedor: clienteFornecedor,
                documento: registro['Código referência'] || '',
                forma_pagamento: registro['Tipo do lançamento'] || registro['tipo_lancamento'] || '',
                observacoes: observacoes,
                dados_originais: registro, // Dados brutos completos do Excel
                sincronizado_em: agora
              };
            });
            
            // Log dos primeiros registros mapeados para debug  
            console.log('📋 Exemplo de dados mapeados:');
            console.log('Original:', JSON.stringify(dadosJson[0], null, 2));
            console.log('Mapeado:', JSON.stringify(dadosContaAzul[0], null, 2));
            
            // 3. INSERIR dados na tabela contaazul
            const { data: insertResult, error: insertError } = await supabase
              .from('contaazul')
              .insert(dadosContaAzul);
            
            if (insertError) {
              console.error('❌ Erro ao inserir dados V3 na tabela contaazul:', insertError);
              return NextResponse.json({
                success: false,
                error: 'Erro ao inserir dados na tabela contaazul',
                details: insertError.message,
                dados_coletados: jsonResult
              }, { status: 500 });
            }
            
            console.log('✅ Dados V3 inseridos na tabela contaazul com sucesso');
            
            // Dados inseridos diretamente na tabela final - não precisa de processamento adicional
            console.log('📈 Dados prontos para uso imediato na tabela contaazul');
            
            return NextResponse.json({
              success: true,
              message: 'Dados V3 coletados e processados com sucesso',
              versao: 'v3_final_robusta',
              dados: {
                ...jsonResult.dados,
                registros_inseridos: dadosContaAzul.length,
                tabela_usada: 'contaazul',
                melhorias_v3: [
                  'Sistema de retry automático',
                  'Capturas de tela em erros', 
                  'Logs compatíveis com Windows',
                  'Serialização JSON corrigida',
                  'Performance otimizada'
                ]
              }
            });
          }
        }
        
        // Se não temos arquivo JSON, retornar resultado básico
        return NextResponse.json({
          success: true,
          message: 'Coleta V3 realizada com sucesso',
          versao: 'v3_final_robusta',
          dados: jsonResult.dados
        });
        
      } catch (processError) {
        console.error('❌ Erro ao processar dados V3:', processError);
        return NextResponse.json({
          success: false,
          error: 'Erro ao processar dados coletados V3',
          details: processError instanceof Error ? processError.message : String(processError),
          dados_brutos: jsonResult
        }, { status: 500 });
      }
    }

    // Fallback se não temos JSON result
    return NextResponse.json({ 
      success: false,
      error: 'Nenhum resultado JSON encontrado no script V3',
      stdout,
      stderr
    }, { status: 500 });

  } catch (error) {
    console.error('❌ Erro na API V3:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor V3',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Endpoint para verificar status e versões
export async function GET() {
  try {
    // Verificar script V3
    const scriptPath = 'F:\\SGB_V2\\backend\\scripts\\contahub\\contahub_playwright_2fa_v3.py';
    const scriptExists = fs.existsSync(scriptPath);
    
    // Verificar tabelas
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%contaazul%');

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao verificar tabelas',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      versao: 'v3_final_robusta',
      script_v3_disponivel: scriptExists,
      script_path: scriptPath,
      tabelas_contaazul: tables?.map(t => t.table_name) || [],
      melhorias_v3: [
        'Unicode/emojis compatível com Windows PowerShell',
        'DateTime JSON serialization corrigido',
        'Sistema de retry automático com 3 tentativas',
        'Screenshots automáticos em erros',
        'Logs detalhados e organizados',
        'Timeouts inteligentes e adaptativos',
        'Performance otimizada (1min 5s)',
        'Capturas de debugging completas'
      ],
      status: 'API V3 funcionando - Sistema Robusto Completo'
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno V3',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 