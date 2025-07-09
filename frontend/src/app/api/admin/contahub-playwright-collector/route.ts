import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const { email, senha, periodo = 30, headless = true } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar arquivo temporário com credenciais
    const tempCredentials = {
      email,
      senha
    };

    const scriptsDir = path.join(process.cwd(), 'backend', 'scripts');
    const credentialsFile = path.join(scriptsDir, 'temp_credenciais_api.json');
    
    fs.writeFileSync(credentialsFile, JSON.stringify(tempCredentials, null, 2));

    // Buscar script Python
    const scriptPaths = [
      path.join(scriptsDir, 'contahub', 'contahub_playwright_2fa.py'),
      path.join(process.cwd(), 'backend', 'scripts', 'contahub', 'contahub_playwright_2fa.py'),
      path.join(process.cwd(), 'contahub_playwright_2fa.py')
    ];

    let scriptPath = '';
    for (const p of scriptPaths) {
      if (fs.existsSync(p)) {
        scriptPath = p;
        break;
      }
    }

    if (!scriptPath) {
      return NextResponse.json(
        { success: false, error: 'Script Python não encontrado' },
        { status: 500 }
      );
    }

    // Preparar argumentos
    const args = [
      scriptPath,
      '--credenciais-arquivo', credentialsFile,
      '--periodo', periodo.toString()
    ];

    if (headless) {
      args.push('--headless');
    }

    console.log('🚀 Executando:', 'python', args.join(' '));

    // Executar script Python
    return new Promise<NextResponse>((resolve) => {
      const python = spawn('python', args, {
        cwd: scriptsDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log('📊 STDOUT:', output);
      });

      python.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.log('⚠️ STDERR:', output);
      });

      python.on('close', (code) => {
        console.log(`🏁 Processo finalizado com código: ${code}`);

        // Limpar arquivo temporário
        try {
          if (fs.existsSync(credentialsFile)) {
            fs.unlinkSync(credentialsFile);
          }
        } catch (e) {
          console.warn('⚠️ Erro ao limpar arquivo temporário:', e);
        }

        if (code === 0) {
          // Tentar parsear resultado JSON do stdout
          try {
            const lines = stdout.split('\n');
            let jsonResult = null;

            // Procurar linha com JSON válido
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('{') && trimmed.includes('"success"')) {
                try {
                  jsonResult = JSON.parse(trimmed);
                  break;
                } catch (e) {
                  continue;
                }
              }
            }

            if (jsonResult) {
              resolve(NextResponse.json({
                success: true,
                dados: jsonResult,
                logs: {
                  stdout: stdout.split('\n').filter(line => line.trim()),
                  stderr: stderr.split('\n').filter(line => line.trim())
                }
              }));
            } else {
              resolve(NextResponse.json({
                success: true,
                message: 'Script executado com sucesso',
                logs: {
                  stdout: stdout.split('\n').filter(line => line.trim()),
                  stderr: stderr.split('\n').filter(line => line.trim())
                }
              }));
            }
          } catch (e) {
            resolve(NextResponse.json({
              success: false,
              error: 'Erro ao processar resultado',
              logs: {
                stdout: stdout.split('\n').filter(line => line.trim()),
                stderr: stderr.split('\n').filter(line => line.trim())
              }
            }, { status: 500 }));
          }
        } else {
          resolve(NextResponse.json({
            success: false,
            error: `Script falhou com código ${code}`,
            logs: {
              stdout: stdout.split('\n').filter(line => line.trim()),
              stderr: stderr.split('\n').filter(line => line.trim())
            }
          }, { status: 500 }));
        }
      });

      python.on('error', (error) => {
        console.error('💥 Erro ao executar Python:', error);
        resolve(NextResponse.json(
          { success: false, error: `Erro ao executar Python: ${error.message}` },
          { status: 500 }
        ));
      });
    });

  } catch (error) {
    console.error('💥 Erro na API:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 