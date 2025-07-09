import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando debug específico das queries problemáticas');
    
    // Criar script temporário de debug
    const debugScript = `
const crypto = require('crypto');

console.log('🔍 DEBUG QUERIES ESPECÍFICAS');

const LOGIN_CONFIG = {
  email: process.env.CONTAHUB_EMAIL || 'digao@3768',
  senha: process.env.CONTAHUB_PASSWORD || 'Geladeira@001',
  base_url: 'https://sp.contahub.com',
  empresa_id_bar1: '3768'
};

// Queries que estão dando erro 500
const QUERIES_PROBLEMA = [
  { id: 7, nome: 'pagamentos', descricao: 'Formas de Pagamento' },
  { id: 93, nome: 'clientes_faturamento', descricao: 'Melhores Clientes (Faturamento)' },
  { id: 94, nome: 'clientes_presenca', descricao: 'Melhores Clientes (Presença)' },
  { id: 77, nome: 'analitico', descricao: 'Relatório Analítico' },
  { id: 20, nome: 'compra_produto_dtnf', descricao: 'Compras por Produto (por DtNF)' }
];

// Função para fazer login
async function fazerLogin() {
  const crypto = require('crypto');
  const passwordSha1 = crypto.createHash('sha1').update(LOGIN_CONFIG.senha).digest('hex');
  
  const loginData = new URLSearchParams({
    "usr_email": LOGIN_CONFIG.email,
    "usr_password_sha1": passwordSha1
  });

  console.log('🔐 Fazendo login...');
  
  const response = await fetch(\`\${LOGIN_CONFIG.base_url}/rest/contahub.cmds.UsuarioCmd/login/17421701611337?emp=0\`, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: loginData.toString()
  });

  if (!response.ok) {
    throw new Error(\`Login failed: \${response.status}\`);
  }

  console.log('✅ Login realizado');
  return response.headers.get('set-cookie');
}

// Função para testar uma query específica
async function testarQuery(query, cookies) {
  const data = '2025-02-01'; // Data que sabemos ter dados
  const timestamp = Date.now();
  const queryUrl = \`\${LOGIN_CONFIG.base_url}/rest/contahub.cmds.QueryCmd/execQuery/\${timestamp}?qry=\${query.id}&d0=\${data}&d1=\${data}&emp=\${LOGIN_CONFIG.empresa_id_bar1}&nfe=1&limit=10\`;
  
  console.log(\`\\n🧪 === TESTANDO QUERY \${query.id}: \${query.descricao} ===\`);
  console.log(\`📋 URL: \${queryUrl}\`);
  
  try {
    const response = await fetch(queryUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cookie": cookies,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    console.log(\`📊 Status: \${response.status} \${response.statusText}\`);
    console.log(\`📋 Headers:\`);
    for (const [key, value] of response.headers.entries()) {
      console.log(\`   \${key}: \${value}\`);
    }

    const responseText = await response.text();
    console.log(\`📄 Response size: \${responseText.length} chars\`);
    console.log(\`📄 Response preview: \${responseText.substring(0, 500)}...\`);

    if (!response.ok) {
      return {
        query: query.id,
        status: response.status,
        sucesso: false,
        erro: \`HTTP \${response.status}: \${response.statusText}\`,
        response_preview: responseText.substring(0, 500)
      };
    }

    let dados;
    try {
      dados = JSON.parse(responseText);
      const registros = dados?.list || [];
      
      console.log(\`✅ Query \${query.id} OK - \${registros.length} registros\`);
      
      return {
        query: query.id,
        status: response.status,
        sucesso: true,
        total_registros: registros.length,
        estrutura: Object.keys(dados),
        primeiro_registro: registros[0] || null
      };
      
    } catch (parseError) {
      console.log(\`❌ Erro de parsing JSON: \${parseError.message}\`);
      return {
        query: query.id,
        status: response.status,
        sucesso: false,
        erro: \`JSON Parse Error: \${parseError.message}\`,
        response_preview: responseText.substring(0, 500)
      };
    }
    
  } catch (error) {
    console.log(\`💥 Erro de rede: \${error.message}\`);
    return {
      query: query.id,
      sucesso: false,
      erro: \`Network Error: \${error.message}\`
    };
  }
}

// Função principal
async function executarDebug() {
  try {
    const cookies = await fazerLogin();
    const resultados = [];
    
    for (const query of QUERIES_PROBLEMA) {
      const resultado = await testarQuery(query, cookies);
      resultados.push(resultado);
      
      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\\n' + '='.repeat(50));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(50));
    
    resultados.forEach(r => {
      const status = r.sucesso ? '✅' : '❌';
      console.log(\`\${status} Query \${r.query}: \${r.sucesso ? \`\${r.total_registros} registros\` : r.erro}\`);
    });
    
    console.log('\\n📊 RESULTADO JSON:');
    console.log(JSON.stringify({ sucesso: true, resultados }));
    
  } catch (error) {
    console.error('💥 Erro no debug:', error);
    console.log(JSON.stringify({ sucesso: false, erro: error.message }));
  }
}

// Executar
executarDebug().catch(console.error);
`;

    // Salvar script temporário
    const tempDir = path.join(process.cwd(), '..', 'backend', 'scripts', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempScriptPath = path.join(tempDir, 'debug_queries.js');
    fs.writeFileSync(tempScriptPath, debugScript);
    
    console.log('📁 Script de debug criado:', tempScriptPath);

    // Executar script de debug
    return new Promise<NextResponse>((resolve) => {
      const nodeProcess = spawn('node', [tempScriptPath], {
        cwd: path.dirname(tempScriptPath),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
          CONTAHUB_EMAIL: process.env.CONTAHUB_EMAIL,
          CONTAHUB_PASSWORD: process.env.CONTAHUB_PASSWORD
        }
      });

      let stdout = '';
      let stderr = '';
      let resultado: any = null;

      nodeProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log('📊 DEBUG:', output);
        
        // Tentar extrair resultado JSON
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
          // Ignorar
        }
      });

      nodeProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error('⚠️ DEBUG STDERR:', output);
      });

      nodeProcess.on('close', (code) => {
        // Limpar arquivo temporário
        try {
          fs.unlinkSync(tempScriptPath);
        } catch (e) {
          console.warn('⚠️ Não foi possível remover arquivo temporário');
        }

        const logs = stdout.split('\n').filter(line => line.trim());
        const errors = stderr.split('\n').filter(line => line.trim());

        resolve(NextResponse.json({
          success: code === 0 || resultado !== null,
          message: 'Debug das queries concluído',
          resultado,
          logs: {
            output: logs,
            errors: errors
          },
          debug: {
            exit_code: code,
            resultado_encontrado: resultado !== null
          }
        }));
      });

      nodeProcess.on('error', (error) => {
        // Limpar arquivo temporário
        try {
          fs.unlinkSync(tempScriptPath);
        } catch (e) {
          // Ignorar
        }

        resolve(NextResponse.json({
          success: false,
          error: `Erro ao executar debug: ${error.message}`,
          debug: { error: error.message }
        }, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('💥 Erro na API de debug:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno no debug',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de debug para queries problemáticas (7, 93, 94, 77, 20)',
    endpoint: 'POST para executar debug'
  });
} 