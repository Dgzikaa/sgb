import { NextRequest, NextResponse } from 'next/server';
import { getInterCredentials } from '@/lib/api-credentials';
import { getInterAccessToken } from '@/lib/inter/getAccessToken';
import https from 'https';
import { getInterCertificates } from '@/lib/inter/certificates';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { barId, tipoWebhook = 'pix-pagamento' } = body;

    if (!barId) {
      return NextResponse.json(
        {
          success: false,
          error: 'barId é obrigatório',
        },
        { status: 400 }
      );
    }

    console.log('🔧 Configurando webhook Inter:', { barId, tipoWebhook });

    // Buscar credenciais do Inter
    const credenciais = await getInterCredentials(barId);
    if (!credenciais) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciais do Inter não encontradas',
        },
        { status: 400 }
      );
    }

    // Obter token de acesso
    const token = await getInterAccessToken(
      credenciais.client_id,
      credenciais.client_secret,
      'webhook-banking.write'
    );

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao obter token de acesso',
        },
        { status: 500 }
      );
    }

    // URL do nosso webhook (deve ser HTTPS)
    const webhookUrl = `https://${request.headers.get('host')}/api/webhook/inter/pix`;

    console.log('🔗 URL do webhook:', webhookUrl);

    // Carregar certificados mTLS
    const { cert, key } = getInterCertificates();

    // Preparar payload para o Inter
    const payload = {
      webhookUrl: webhookUrl,
    };

    const postData = JSON.stringify(payload);

    // Configurar requisição HTTPS com mTLS
    const options = {
      hostname: 'cdpj.partners.bancointer.com.br',
      port: 443,
      path: `/banking/v2/webhooks/${tipoWebhook}`,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-conta-corrente': credenciais.conta_corrente,
      },
      cert: cert,
      key: key,
    };

    console.log('📤 Enviando configuração para Inter:', {
      url: `https://cdpj.partners.bancointer.com.br/banking/v2/webhooks/${tipoWebhook}`,
      webhookUrl: webhookUrl,
      conta_corrente: credenciais.conta_corrente,
    });

    // Fazer requisição HTTPS
    const response = await new Promise<{ statusCode: number; body: string }>(
      (resolve, reject) => {
        const request = https.request(options, response => {
          console.log('📡 Status da resposta:', response.statusCode);
          console.log('📡 Headers da resposta:', response.headers);

          let body = '';
          response.on('data', chunk => (body += chunk));
          response.on('end', () => {
            console.log('📡 Corpo da resposta:', body);
            resolve({
              statusCode: response.statusCode || 500,
              body,
            });
          });
        });

        request.on('error', error => {
          console.error('❌ Erro na requisição:', error);
          reject(error);
        });

        request.write(postData);
        request.end();
      }
    );

    if (response.statusCode === 204) {
      console.log('✅ Webhook configurado com sucesso');
      return NextResponse.json({
        success: true,
        message: `Webhook ${tipoWebhook} configurado com sucesso`,
        webhookUrl: webhookUrl,
        data: {
          tipoWebhook,
          webhookUrl,
          conta_corrente: credenciais.conta_corrente,
        },
      });
    } else {
      console.error('❌ Erro ao configurar webhook:', response.body);
      return NextResponse.json(
        {
          success: false,
          error: `Erro ${response.statusCode}: ${response.body}`,
        },
        { status: response.statusCode }
      );
    }
  } catch (error: any) {
    console.error('❌ Erro ao configurar webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
