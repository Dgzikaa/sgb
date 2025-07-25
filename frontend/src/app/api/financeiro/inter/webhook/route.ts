import { NextRequest, NextResponse } from 'next/server';
import { getInterCredentials } from '@/lib/api-credentials';
import https from 'https';
import fs from 'fs';
import path from 'path';

interface InterWebhookConfig {
  webhookUrl: string;
  tipoWebhook: 'pix-pagamento' | 'boleto-pagamento';
  bar_id: string;
  conta_corrente?: string;
  access_token?: string; // Token opcional - se não fornecido, gera um novo
}

export async function POST(request: NextRequest) {
  try {
    const body: InterWebhookConfig = await request.json();
    const { webhookUrl, tipoWebhook, bar_id, conta_corrente, access_token } =
      body;

    if (!webhookUrl || !tipoWebhook || !bar_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'webhookUrl, tipoWebhook e bar_id são obrigatórios',
        },
        { status: 400 }
      );
    }

    if (!webhookUrl.startsWith('https://')) {
      return NextResponse.json(
        {
          success: false,
          error: 'webhookUrl deve começar com https://',
        },
        { status: 400 }
      );
    }

    console.log('🔧 Configurando webhook no Inter:', {
      webhookUrl,
      tipoWebhook,
      bar_id,
      conta_corrente,
      has_token: !!access_token,
    });

    // Usar token fornecido ou gerar um novo
    let accessToken = access_token;

    if (!accessToken) {
      console.log('🔄 Gerando novo token OAuth...');
      const tokenResponse = await fetch(
        `${request.nextUrl.origin}/api/financeiro/inter/oauth-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bar_id }),
        }
      );

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || 'Erro ao gerar token OAuth');
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.data.access_token;
      console.log(
        '✅ Novo token OAuth gerado:',
        accessToken.substring(0, 20) + '...'
      );
    } else {
      console.log(
        '✅ Usando token fornecido:',
        accessToken.substring(0, 20) + '...'
      );
    }

    // Pequeno delay para garantir que o token seja processado
    if (!access_token) {
      console.log('⏳ Aguardando processamento do token...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Buscar conta corrente se não fornecida
    let contaCorrente = conta_corrente;
    if (!contaCorrente) {
      const credenciais = await getInterCredentials(bar_id);
      if (credenciais?.conta_corrente) {
        contaCorrente = credenciais.conta_corrente;
        console.log('🏦 Usando conta corrente das credenciais:', contaCorrente);
      } else {
        console.log('⚠️ Nenhuma conta corrente disponível');
      }
    }

    // Carregar certificados mTLS
    const certPath = path.join(process.cwd(), 'pages', 'api', 'cert.crt');
    const keyPath = path.join(process.cwd(), 'pages', 'api', 'key.key');
    const caPath = path.join(process.cwd(), 'pages', 'api', 'ca.crt');

    console.log('📁 Carregando certificados de:', {
      cert: certPath,
      key: keyPath,
      ca: caPath,
    });

    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    const ca = fs.readFileSync(caPath);

    console.log('✅ Certificados carregados com sucesso');

    // URL do Inter para webhooks
    const interUrl = `https://cdpj.partners.bancointer.com.br/banking/v2/webhooks/${tipoWebhook}`;

    const webhookPayload = {
      webhookUrl: webhookUrl,
    };

    console.log('📤 Enviando para Inter:', {
      url: interUrl,
      method: 'PUT',
      payload: webhookPayload,
      token_length: accessToken.length,
      token_preview: accessToken.substring(0, 20) + '...',
      conta_corrente: contaCorrente,
    });

    // Fazer requisição HTTPS com mTLS
    const postData = JSON.stringify(webhookPayload);

    const options = {
      hostname: 'cdpj.partners.bancointer.com.br',
      port: 443,
      path: `/banking/v2/webhooks/${tipoWebhook}`,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...(contaCorrente && { 'x-conta-corrente': contaCorrente }),
      },
      cert: cert,
      key: key,
      ca: ca,
      rejectUnauthorized: false,
    };

    console.log('🔐 Headers da requisição:', {
      Authorization: `Bearer ${accessToken.substring(0, 20)}...`,
      'Content-Type': options.headers['Content-Type'],
      'Content-Length': options.headers['Content-Length'],
      'x-conta-corrente': options.headers['x-conta-corrente'],
    });

    return new Promise(resolve => {
      const req = https.request(options, res => {
        console.log('📡 Resposta do Inter:', res.statusCode, res.statusMessage);
        console.log('📡 Headers da resposta:', res.headers);

        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            console.log('📨 Resposta bruta do Inter:', data);

            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log('✅ Webhook configurado com sucesso');
              resolve(
                NextResponse.json({
                  success: true,
                  data: data
                    ? JSON.parse(data)
                    : { message: 'Webhook configurado com sucesso' },
                  message: `Webhook ${tipoWebhook} configurado com sucesso`,
                })
              );
            } else {
              console.error('❌ Erro do Inter:', res.statusCode, data);
              resolve(
                NextResponse.json(
                  {
                    success: false,
                    error: `Erro ${res.statusCode}: ${res.statusMessage}`,
                    details: data,
                  },
                  { status: res.statusCode }
                )
              );
            }
          } catch (error) {
            console.error('❌ Erro ao processar resposta:', error);
            resolve(
              NextResponse.json(
                {
                  success: false,
                  error: 'Erro ao processar resposta do Inter',
                  raw_response: data,
                },
                { status: 500 }
              )
            );
          }
        });
      });

      req.on('error', error => {
        console.error('❌ Erro na requisição:', error);
        resolve(
          NextResponse.json(
            {
              success: false,
              error: 'Erro na comunicação com o Inter',
              details: error.message,
            },
            { status: 500 }
          )
        );
      });

      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');
    const tipoWebhook = searchParams.get('tipoWebhook') as
      | 'pix-pagamento'
      | 'boleto-pagamento';

    if (!bar_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'bar_id é obrigatório',
        },
        { status: 400 }
      );
    }

    if (
      !tipoWebhook ||
      !['pix-pagamento', 'boleto-pagamento'].includes(tipoWebhook)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'tipoWebhook deve ser pix-pagamento ou boleto-pagamento',
        },
        { status: 400 }
      );
    }

    console.log('📋 Listando webhook configurado no Inter:', {
      bar_id,
      tipoWebhook,
    });

    // Gerar token OAuth para webhooks
    const tokenResponse = await fetch(
      `${request.nextUrl.origin}/api/financeiro/inter/oauth-token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bar_id }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error || 'Erro ao gerar token OAuth');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.data.access_token;

    console.log('✅ Token OAuth gerado:', accessToken.substring(0, 20) + '...');

    // Buscar credenciais para conta corrente
    const credenciais = await getInterCredentials(bar_id);

    // Usar Edge Function que tem certificados mTLS configurados
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/inter-auth`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'list',
          bar_id: bar_id,
          tipoWebhook: tipoWebhook,
          conta_corrente: credenciais?.conta_corrente,
          accessToken: accessToken,
        }),
      }
    );

    console.log(
      '📡 Status da resposta do Inter:',
      response.status,
      response.statusText
    );

    // Se não há webhook configurado ou API não suporta GET, retornar vazio
    if (response.status === 404 || response.status === 400) {
      console.log(
        'ℹ️ Nenhum webhook configurado para:',
        tipoWebhook,
        '(Status:',
        response.status,
        ')'
      );
      return NextResponse.json({
        success: true,
        data: null,
        tipoWebhook,
        total: 0,
      });
    }

    // Se serviço indisponível (500 conforme documentação)
    if (response.status === 500) {
      console.log('⚠️ Serviço do Inter indisponível (500)');
      return NextResponse.json(
        {
          success: false,
          error: 'Serviço do Inter indisponível no momento',
          tipoWebhook,
        },
        { status: 503 }
      );
    }

    if (!response.ok) {
      console.log(
        '⚠️ Erro inesperado do Inter:',
        response.status,
        response.statusText
      );
      return NextResponse.json({
        success: true,
        data: null,
        tipoWebhook,
        total: 0,
      });
    }

    // Se chegou até aqui, significa que há webhook configurado
    let data;
    try {
      data = await response.json();
      console.log('✅ Webhook listado:', data);
    } catch (parseError) {
      console.log(
        'ℹ️ Resposta vazia do Inter (webhook configurado mas sem dados)'
      );
      data = { webhookUrl: 'Configurado', status: 'ativo' };
    }

    return NextResponse.json({
      success: true,
      data: data,
      tipoWebhook,
      total: 1,
    });
  } catch (error) {
    console.error('❌ Erro ao listar webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
