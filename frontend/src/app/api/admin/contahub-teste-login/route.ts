import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verificarDisponibilidadeContaHub } from '@/lib/contahub-service';

export async function POST(request: NextRequest) {
  try {
    // ⚠️ VERIFICAR SE CONTAHUB ESTÁ DISPONÍVEL
    const statusManutencao = verificarDisponibilidadeContaHub('Teste de login ContaHub');
    if (statusManutencao) {
      console.log('🔧 ContaHub em modo manutenção, teste de login suspenso...');
      return NextResponse.json(statusManutencao, { status: 503 });
    }

    console.log('🧪 Teste simples de login ContaHub');

    // Verificar variáveis de ambiente
    const email = process.env.CONTAHUB_EMAIL;
    const senha = process.env.CONTAHUB_PASSWORD;
    
    console.log(`📧 Email configurado: ${email ? 'SIM' : 'NÃO'}`);
    console.log(`🔑 Senha configurada: ${senha ? 'SIM' : 'NÃO'}`);
    
    if (!email || !senha) {
      return NextResponse.json({
        success: false,
        error: 'Credenciais do ContaHub não configuradas',
        details: {
          email_set: !!email,
          password_set: !!senha
        }
      }, { status: 400 });
    }

    // Fazer login
    const passwordSha1 = crypto.createHash('sha1').update(senha).digest('hex');
    
    const loginData = new URLSearchParams({
      "usr_email": email,
      "usr_password_sha1": passwordSha1
    });

    console.log('🔐 Tentando login no ContaHub...');
    console.log(`📧 Email: ${email}`);
    console.log(`🔒 Password SHA1: ${passwordSha1.substring(0, 8)}...`);

    const response = await fetch('https://sp.contahub.com/rest/contahub.cmds.UsuarioCmd/login/17421701611337?emp=0', {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: loginData.toString()
    });

    console.log(`📡 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, [...response.headers.entries()]);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Response body: ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Login falhou com status ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }, { status: 500 });
    }

    const setCookieHeaders = response.headers.get('set-cookie');
    const responseText = await response.text();
    
    console.log(`🍪 Cookies recebidos: ${setCookieHeaders ? 'SIM' : 'NÃO'}`);
    console.log(`📝 Response body: ${responseText.substring(0, 200)}...`);

    if (!setCookieHeaders) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum cookie recebido do ContaHub',
        details: {
          response_body: responseText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }, { status: 500 });
    }

    // Testar uma query simples
    console.log('🔍 Testando query simples...');
    
    const queryUrl = 'https://sp.contahub.com/rest/contahub.cmds.QueryCmd/execQuery/1749412571993?qry=5&d0=2025-02-01&d1=2025-02-01&emp=3768&nfe=1';
    
    const queryResponse = await fetch(queryUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Cookie": setCookieHeaders,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    console.log(`📊 Query status: ${queryResponse.status}`);
    
    if (!queryResponse.ok) {
      const queryErrorText = await queryResponse.text();
      console.log(`❌ Query error: ${queryErrorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Query falhou com status ${queryResponse.status}`,
        login_ok: true,
        details: {
          query_status: queryResponse.status,
          query_error: queryErrorText,
          query_url: queryUrl
        }
      }, { status: 500 });
    }

    const queryText = await queryResponse.text();
    let queryData;
    
    try {
      queryData = JSON.parse(queryText);
    } catch (parseError) {
      console.log(`❌ JSON parse error: ${parseError}`);
      
      return NextResponse.json({
        success: false,
        error: 'Erro ao fazer parse do JSON da resposta',
        login_ok: true,
        query_ok: true,
        details: {
          parse_error: parseError instanceof Error ? parseError.message : String(parseError),
          response_preview: queryText.substring(0, 500)
        }
      }, { status: 500 });
    }

    const registros = queryData?.list || [];
    console.log(`📋 Registros encontrados: ${registros.length}`);

    return NextResponse.json({
      success: true,
      message: 'Login e query do ContaHub funcionando!',
      data: {
        login_ok: true,
        query_ok: true,
        registros_encontrados: registros.length,
        exemplo_registro: registros[0] || null,
        campos_exemplo: registros[0] ? Object.keys(registros[0]) : [],
        query_url: queryUrl
      }
    });

  } catch (error) {
    console.error('💥 Erro no teste:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno no teste',
      details: {
        error_message: error instanceof Error ? error.message : String(error),
        error_stack: error instanceof Error ? error.stack : null
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Endpoint de teste de login ContaHub',
    info: 'Use POST para executar o teste'
  });
} 