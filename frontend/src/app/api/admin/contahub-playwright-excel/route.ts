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
    const { email, senha, headless = true } = await request.json();

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

    const credentialsFile = path.join(tempDir, `credentials_${Date.now()}.json`);
    fs.writeFileSync(credentialsFile, JSON.stringify({ email, senha }));

    // Localizar script Python (atualizado para nova estrutura)
    const possiblePaths = [
      path.join(process.cwd(), 'backend', 'scripts', 'contahub', 'contahub_playwright_2fa.py'),
      path.join(process.cwd(), '..', 'backend', 'scripts', 'contahub', 'contahub_playwright_2fa.py'),
      path.join(__dirname, '..', '..', '..', '..', '..', 'backend', 'scripts', 'contahub', 'contahub_playwright_2fa.py'),
      'F:\\SGB_V2\\backend\\scripts\\contahub\\contahub_playwright_2fa.py', // Caminho absoluto conhecido
    ];

    let scriptPath = '';
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        scriptPath = testPath;
        break;
      }
    }

    if (!scriptPath) {
      // Cleanup
      fs.unlinkSync(credentialsFile);
      return NextResponse.json({ 
        success: false, 
        error: 'Script Python não encontrado',
        paths_tested: possiblePaths
      }, { status: 500 });
    }

    console.log('🐍 Executando script Python:', scriptPath);

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
      console.log('STDOUT:', output);
      
      // Tentar extrair JSON do output
      try {
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
            jsonResult = JSON.parse(line.trim());
          }
        }
      } catch (e) {
        // Ignorar erros de parsing
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error('STDERR:', output);
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
        error: 'Erro na execução do script',
        stdout,
        stderr,
        exitCode
      }, { status: 500 });
    }

    // Se temos resultado JSON, processar dados
    if (jsonResult && jsonResult.success) {
      try {
        console.log('📊 Processando dados coletados...');
        
        // Verificar se temos dados para inserir
        if (jsonResult.dados && jsonResult.dados.arquivo_json) {
          // Ler arquivo JSON gerado
          const jsonFilePath = jsonResult.dados.arquivo_json;
          
          if (fs.existsSync(jsonFilePath)) {
            const dadosJson = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
            
            console.log(`📋 Dados lidos: ${dadosJson.length} registros`);
            
            // Preparar dados para inserção na tabela raw
            const dadosRaw = dadosJson.map((registro: any) => ({
              data_coleta: new Date().toISOString(),
              fonte: 'contaazul_playwright_excel',
              dados_brutos: registro,
              metadados: {
                metodo: 'playwright_excel_download',
                arquivo_original: jsonResult.dados.arquivo_excel,
                total_registros: dadosJson.length,
                colunas: jsonResult.dados.colunas
              }
            }));
            
            // Inserir na tabela raw (assumindo que existe uma tabela contaazul_raw)
            const { data: insertResult, error: insertError } = await supabase
              .from('contaazul_raw')
              .insert(dadosRaw);
            
            if (insertError) {
              console.error('❌ Erro ao inserir dados raw:', insertError);
              return NextResponse.json({
                success: false,
                error: 'Erro ao inserir dados no banco',
                details: insertError.message,
                dados_coletados: jsonResult
              }, { status: 500 });
            }
            
            console.log('✅ Dados inseridos na tabela raw');
            
            // Tentar acionar trigger de processamento (se existir)
            try {
              const { data: triggerResult, error: triggerError } = await supabase
                .rpc('processar_dados_contaazul_raw');
              
              if (triggerError) {
                console.warn('⚠️ Trigger de processamento não executado:', triggerError);
              } else {
                console.log('🔄 Trigger de processamento executado');
              }
            } catch (triggerErr) {
              console.warn('⚠️ Trigger de processamento não disponível');
            }
            
            return NextResponse.json({
              success: true,
              message: 'Dados coletados e processados com sucesso',
              dados: {
                ...jsonResult.dados,
                registros_inseridos: dadosRaw.length,
                tabela_raw: 'contaazul_raw'
              }
            });
          }
        }
        
        // Se não temos arquivo JSON, retornar resultado básico
        return NextResponse.json({
          success: true,
          message: 'Coleta realizada com sucesso',
          dados: jsonResult.dados
        });
        
      } catch (processError) {
        console.error('❌ Erro ao processar dados:', processError);
        return NextResponse.json({
          success: false,
          error: 'Erro ao processar dados coletados',
          details: processError instanceof Error ? processError.message : String(processError),
          dados_brutos: jsonResult
        }, { status: 500 });
      }
    }

    // Fallback se não temos JSON result
    return NextResponse.json({ 
      success: false,
      error: 'Nenhum resultado JSON encontrado',
      stdout,
      stderr
    }, { status: 500 });

  } catch (error) {
    console.error('❌ Erro na API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Endpoint para verificar status das tabelas
export async function GET() {
  try {
    // Verificar se tabela raw existe
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
      tabelas_contaazul: tables?.map(t => t.table_name) || [],
      status: 'API funcionando'
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 