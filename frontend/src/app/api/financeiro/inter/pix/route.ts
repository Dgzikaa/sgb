import { NextRequest, NextResponse } from 'next/server';
import { getInterCredentials } from '@/lib/api-credentials';
import { getUserAuth } from '@/lib/auth-helper';
import { createClient } from '@supabase/supabase-js';
import { getInterAccessToken } from '@/lib/inter/getAccessToken';
import { realizarPagamentoPixInter } from '@/lib/inter/pixPayment';

interface PagamentoInter {
  valor: string;
  descricao: string;
  destinatario: string;
  chave: string;
  data_pagamento: string;
}

interface InterResponse {
  codigoSolicitacao: string;
  status: string;
  message?: string;
}

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body: PagamentoInter = await request.json();
    const { valor, descricao, destinatario, chave, data_pagamento } = body;

    // Obter dados do usuário autenticado
    const userAuth = await getUserAuth(request);
    if (!userAuth) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const barId = userAuth.bar_id.toString();

    // Validações básicas
    if (!valor || !descricao || !destinatario || !chave) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    console.log('🧪 INICIANDO PAGAMENTO PIX INTER');
    console.log('📋 Dados recebidos:', {
      valor,
      descricao,
      destinatario,
      chave,
      barId,
    });

    // Buscar credenciais do Inter para este bar
    const credenciais = await getInterCredentials(barId);
    if (!credenciais) {
      console.log('❌ Credenciais não encontradas para bar_id:', barId);
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciais do Inter não configuradas para este bar',
        },
        { status: 400 }
      );
    }

    console.log('✅ Credenciais encontradas:', {
      client_id: credenciais.client_id.substring(0, 8) + '...',
      conta_corrente: credenciais.conta_corrente,
    });

    console.log('✅ Credenciais encontradas:', {
      client_id: credenciais.client_id.substring(0, 8) + '...',
      conta_corrente: credenciais.conta_corrente,
    });

    // Obter access token com mTLS usando função da lib
    const token = await getInterAccessToken(
      credenciais.client_id,
      credenciais.client_secret,
      'pagamento-pix.write'
    );
    if (!token) {
      console.log('❌ Falha ao obter token de acesso');
      return NextResponse.json(
        { success: false, error: 'Erro ao obter token de acesso' },
        { status: 500 }
      );
    }

    console.log('✅ Token obtido com sucesso:', token.substring(0, 20) + '...');
    console.log('✅ Token completo:', token);

    // Identificar tipo de chave PIX
    const tipoChave = identificarTipoChave(chave);
    if (!tipoChave) {
      console.log('❌ Tipo de chave PIX não identificado:', chave);
      return NextResponse.json(
        { success: false, error: 'Tipo de chave PIX não identificado' },
        { status: 400 }
      );
    }

    console.log('✅ Tipo de chave identificado:', tipoChave);

    // REALIZAR PAGAMENTO REAL
    console.log('💸 REALIZANDO PAGAMENTO REAL NO INTER');
    console.log('📤 Dados sendo enviados para o Inter:');
    console.log('   - Valor:', valor);
    console.log('   - Descrição:', descricao);
    console.log('   - Destinatário:', destinatario);
    console.log('   - Chave:', tipoChave.chave);
    console.log('   - Conta Corrente:', credenciais.conta_corrente);
    console.log('   - Token:', token.substring(0, 20) + '...');

    // Realizar pagamento PIX real usando nova função
    const resultadoPagamento = await realizarPagamentoPixInter({
      token,
      contaCorrente: credenciais.conta_corrente, // Enviar conta completa
      valor: parseFloat(valor),
      descricao,
      chave: tipoChave.chave,
    });

    if (!resultadoPagamento.success) {
      console.log('❌ Erro no pagamento:', resultadoPagamento.error);
      return NextResponse.json(
        { success: false, error: resultadoPagamento.error },
        { status: 500 }
      );
    }

    // Verificar se o pagamento foi aprovado
    const isAprovado = resultadoPagamento.data?.tipoRetorno === 'APROVACAO';
    const status = isAprovado ? 'APROVADO' : 'ENVIADO_PARA_APROVACAO';
    const message = isAprovado
      ? 'Pagamento PIX aprovado com sucesso'
      : 'Pagamento PIX enviado para aprovação';

    console.log(
      `✅ Pagamento PIX ${isAprovado ? 'aprovado' : 'enviado para aprovação'}!`
    );

    // Salvar pagamento na tabela pix_enviados
    const { data: pixData, error: pixError } = await supabase
      .from('pix_enviados')
      .insert({
        txid:
          resultadoPagamento.data?.codigoSolicitacao || `inter_${Date.now()}`,
        valor: parseFloat(valor),
        beneficiario: {
          nome: destinatario,
          chave: tipoChave.chave,
          tipo: tipoChave.tipo,
        },
        data_envio: new Date().toISOString(),
        status: isAprovado ? 'APROVADO' : 'ENVIADO',
        bar_id: parseInt(barId),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (pixError) {
      console.error('❌ Erro ao salvar PIX:', pixError);
    } else {
      console.log('✅ PIX salvo na tabela:', pixData);
    }

    // Enviar notificação para Discord
    try {
      await enviarNotificacaoDiscord({
        valor: parseFloat(valor),
        descricao: descricao || 'Pagamento PIX',
        destinatario: destinatario,
        chave: tipoChave.chave,
        codigoSolicitacao:
          resultadoPagamento.data?.codigoSolicitacao || `inter_${Date.now()}`,
        status: status,
        barId: barId,
      });
      console.log('✅ Notificação Discord enviada com sucesso');
    } catch (discordError) {
      console.log('⚠️ Erro ao enviar notificação Discord:', discordError);
      // Não falhar o pagamento se o Discord der erro
    }

    return NextResponse.json({
      success: true,
      data: resultadoPagamento.data,
      message: message,
      status: status,
      logs: [
        '✅ Credenciais carregadas da tabela api_credentials',
        '✅ Token obtido via mTLS com certificados PEM',
        '✅ Tipo de chave PIX identificado',
        '✅ Validações de dados passaram',
        `✅ Pagamento PIX ${isAprovado ? 'aprovado' : 'enviado para aprovação'} no Inter`,
      ],
    });
  } catch (error) {
    console.error('❌ Erro ao processar pagamento Inter:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para enviar notificação para Discord
async function enviarNotificacaoDiscord(params: {
  valor: number;
  descricao: string;
  destinatario: string;
  chave: string;
  codigoSolicitacao: string;
  status: string;
  barId: string;
}) {
  try {
    const {
      valor,
      descricao,
      destinatario,
      chave,
      codigoSolicitacao,
      status,
      barId,
    } = params;

    console.log('🔍 Buscando webhook Discord para bar_id:', barId);

    // Buscar webhook do Discord da tabela api_credentials
    const { data: credenciaisDiscord, error } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('bar_id', barId)
      .eq('sistema', 'inter')
      .single();

    console.log('📋 Resultado da busca webhook:', {
      error: error?.message,
      configuracoes: credenciaisDiscord?.configuracoes,
    });

    if (error || !credenciaisDiscord?.configuracoes?.webhook_url) {
      console.log('⚠️ Webhook do Discord não encontrado nas configurações');
      console.log('❌ Erro:', error?.message);
      console.log('📋 Configurações:', credenciaisDiscord?.configuracoes);
      return false;
    }

    const webhookUrl = credenciaisDiscord.configuracoes.webhook_url;
    console.log('✅ Webhook encontrado:', webhookUrl);

    const embed = {
      title: '📋 Novo Pagamento PIX Agendado',
      color: 0x0099ff, // Azul para agendamento
      fields: [
        {
          name: 'Valor',
          value: `R$ ${valor.toFixed(2)}`,
          inline: true,
        },
        {
          name: 'Destinatário',
          value: destinatario,
          inline: true,
        },
        {
          name: 'Chave PIX',
          value: chave,
          inline: true,
        },
        {
          name: 'Descrição',
          value: descricao,
          inline: false,
        },
        {
          name: 'Código de Solicitação',
          value: codigoSolicitacao,
          inline: true,
        },
        {
          name: 'Status',
          value: '⏳ Aguardando Aprovação do Gestor',
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SGB - Sistema de Gestão de Bares',
      },
    };

    const payload = {
      embeds: [embed],
    };

    console.log('📤 Enviando notificação para Discord...');
    console.log('🔗 Webhook URL:', webhookUrl);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));

    // Enviar diretamente para o webhook do Discord
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Status da resposta Discord:', response.status);
    console.log(
      '📡 Headers da resposta Discord:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro no Discord:', errorText);
      throw new Error(
        `Discord webhook error: ${response.status} - ${errorText}`
      );
    }

    console.log('✅ Notificação enviada para Discord via webhook');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error);
    throw error;
  }
}

// Função para identificar tipo de chave PIX (melhorada como no Python)
function identificarTipoChave(
  chave: string
): { tipo: string; chave: string } | null {
  if (!chave) return null;

  const chaveOriginal = chave;
  const chaveLimpa = chave.trim();

  console.log(`🔍 Analisando chave: '${chaveOriginal}' -> '${chaveLimpa}'`);

  // Email (mais específico)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (emailRegex.test(chaveLimpa)) {
    console.log(`✅ Identificado como EMAIL: ${chaveLimpa}`);
    return { tipo: 'EMAIL', chave: chaveLimpa.toLowerCase() };
  }

  // Remover formatação para análise numérica
  const chaveNumerica = chaveLimpa.replace(/\D/g, '');

  // Verificar se é telefone internacional
  let telefoneInternacional = false;
  if (chaveNumerica.startsWith('55') && chaveNumerica.length >= 12) {
    telefoneInternacional = true;
  }

  console.log(
    `🧹 Chave limpa: '${chaveNumerica}' (tamanho: ${chaveNumerica.length})`
  );

  // CNPJ (14 dígitos)
  if (chaveNumerica.length === 14) {
    if (validarCNPJ(chaveNumerica)) {
      console.log(`✅ Identificado como CNPJ válido: ${chaveNumerica}`);
      return { tipo: 'CNPJ', chave: chaveNumerica };
    } else {
      console.log(
        `⚠️ CNPJ inválido detectado: ${chaveOriginal} -> ${chaveNumerica}`
      );
      return { tipo: 'CNPJ', chave: chaveNumerica }; // Retorna mesmo se inválido
    }
  }

  // CPF (11 dígitos)
  if (chaveNumerica.length === 11) {
    if (validarCPF(chaveNumerica)) {
      console.log(`✅ Identificado como CPF válido: ${chaveNumerica}`);
      return { tipo: 'CPF', chave: chaveNumerica };
    } else {
      console.log(
        `⚠️ CPF inválido detectado: ${chaveOriginal} -> ${chaveNumerica}`
      );
      return { tipo: 'CPF', chave: chaveNumerica }; // Retorna mesmo se inválido
    }
  }

  // Telefone (10 ou 11 dígitos)
  if (
    chaveNumerica.length === 10 ||
    chaveNumerica.length === 11 ||
    telefoneInternacional
  ) {
    let telefone = chaveNumerica;

    // Remover código do país se presente
    if (telefone.startsWith('55') && telefone.length >= 12) {
      telefone = telefone.slice(2);
    }

    // Validar formato brasileiro
    if (telefone.length === 11) {
      const ddd = telefone.slice(0, 2);
      if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99 && telefone[2] === '9') {
        console.log(
          `✅ Identificado como TELEFONE CELULAR válido: ${telefone}`
        );
        return { tipo: 'TELEFONE', chave: `+55${telefone}` };
      }
    } else if (telefone.length === 10) {
      const ddd = telefone.slice(0, 2);
      if (parseInt(ddd) >= 11 && parseInt(ddd) <= 99) {
        console.log(`✅ Identificado como TELEFONE FIXO válido: ${telefone}`);
        return { tipo: 'TELEFONE', chave: `+55${telefone}` };
      }
    }

    console.log(
      `⚠️ Telefone com formato suspeito: ${chaveOriginal} -> ${telefone}`
    );
    return { tipo: 'TELEFONE', chave: `+55${telefone}` }; // Retorna mesmo se formato suspeito
  }

  // Chave aleatória (UUID)
  if (chaveLimpa.length >= 32 || chaveLimpa.includes('-')) {
    console.log(`✅ Identificado como CHAVE ALEATÓRIA: ${chaveLimpa}`);
    return { tipo: 'ALEATORIA', chave: chaveLimpa };
  }

  // Caso não consiga identificar claramente
  console.log(
    `⚠️ Tipo de chave não identificado: ${chaveOriginal} -> ${chaveNumerica}`
  );

  // Inferir baseado no tamanho
  if (chaveNumerica.length > 14) {
    console.log(`📝 Inferindo como CHAVE ALEATÓRIA por tamanho`);
    return { tipo: 'ALEATORIA', chave: chaveLimpa };
  } else if (chaveNumerica.length > 11) {
    console.log(`📝 Inferindo como CNPJ por tamanho`);
    return { tipo: 'CNPJ', chave: chaveNumerica };
  } else if (chaveNumerica.length > 10) {
    console.log(`📝 Inferindo como CPF por tamanho`);
    return { tipo: 'CPF', chave: chaveNumerica };
  } else {
    console.log(`📝 Inferindo como TELEFONE por tamanho`);
    return { tipo: 'TELEFONE', chave: `+55${chaveNumerica}` };
  }
}

// Função para validar CPF
function validarCPF(cpf: string): boolean {
  if (cpf.length !== 11 || cpf === cpf[0].repeat(11)) {
    return false;
  }

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  if (parseInt(cpf[9]) !== digito1) {
    return false;
  }

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  return parseInt(cpf[10]) === digito2;
}

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14 || cnpj === cnpj[0].repeat(14)) {
    return false;
  }

  // Primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj[i]) * pesos1[i];
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  if (parseInt(cnpj[12]) !== digito1) {
    return false;
  }

  // Segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj[i]) * pesos2[i];
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  return parseInt(cnpj[13]) === digito2;
}
