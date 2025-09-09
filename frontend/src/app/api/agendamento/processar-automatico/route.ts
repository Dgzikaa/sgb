import { NextRequest, NextResponse } from 'next/server';

// Configurações das contas (baseado no código Python)
const CONFIGS = {
  'Ordinário': {
    CLIENT_ID: "82b467b4-1b13-4e7d-b9b9-1d4a189d8261",
    CLIENT_SECRET: "a6332693-b9b6-443c-b75a-d1004b64e901",
    CONTA_CORRENTE: "400516462",
  },
  'Deboche': {
    CLIENT_ID: "de908775-6f1a-4358-91bf-2c881518f1b8",
    CLIENT_SECRET: "1a12ef7d-59cc-45b7-927f-54954ed1e062",
    CONTA_CORRENTE: "101196318",
  },
};

// Funções de validação (convertidas do Python)
function validarCpf(cpf: string): boolean {
  if (cpf.length !== 11 || cpf === cpf[0].repeat(11)) {
    return false;
  }
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }
  const d1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (parseInt(cpf[9]) !== d1) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }
  const d2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return parseInt(cpf[10]) === d2;
}

function validarCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14 || cnpj === cnpj[0].repeat(14)) {
    return false;
  }
  
  const pesos1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpj[i]) * pesos1[i];
  }
  const d1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (parseInt(cnpj[12]) !== d1) return false;
  
  const pesos2 = [6, ...pesos1];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpj[i]) * pesos2[i];
  }
  const d2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return parseInt(cnpj[13]) === d2;
}

function validarTelefoneCelular(num: string): boolean {
  const n = num.replace(/\D/g, '');
  return n.length === 11 && n[2] === '9' && parseInt(n.slice(0, 2)) >= 11 && parseInt(n.slice(0, 2)) <= 99;
}

function limparValor(valor: string): number {
  return parseFloat(valor.replace(/R\$/, '').replace(/\./g, '').replace(',', '.').trim());
}

function identificarTipoChave(chave: string): { tipo: string | null; chaveFormatada: string } {
  if (!chave) return { tipo: null, chaveFormatada: chave };
  
  const chaveClean = chave.trim();
  
  // Email
  if (chaveClean.includes('@') && /^[\w\.-]+@[\w\.-]+\.\w{2,4}$/.test(chaveClean)) {
    return { tipo: 'EMAIL', chaveFormatada: chaveClean.toLowerCase() };
  }
  
  const digits = chaveClean.replace(/\D/g, '');
  
  // CPF
  if (digits.length === 11 && validarCpf(digits)) {
    return { tipo: 'CPF', chaveFormatada: digits };
  }
  
  // CNPJ
  if (digits.length === 14 && validarCnpj(digits)) {
    return { tipo: 'CNPJ', chaveFormatada: digits };
  }
  
  // Telefone
  if (validarTelefoneCelular(digits)) {
    return { tipo: 'TELEFONE', chaveFormatada: `+55${digits}` };
  }
  
  // Chave aleatória
  if (chaveClean.length >= 32 || chaveClean.includes('-')) {
    return { tipo: 'ALEATORIA', chaveFormatada: chaveClean };
  }
  
  return { tipo: null, chaveFormatada: chave };
}

// Função para obter token do Inter
async function obterAccessToken(config: any, conta: string, bar_id: number): Promise<string> {
  const body = new URLSearchParams({
    client_id: config.CLIENT_ID,
    client_secret: config.CLIENT_SECRET,
    scope: 'pagamento-pix.write',
    grant_type: 'client_credentials'
  });

  // Nota: Em produção, você precisará configurar os certificados SSL
  // Por enquanto, vamos simular o processo
    console.log('🔑 Obtendo token Inter para:', {
      conta,
      bar_id,
      conta_corrente: config.CONTA_CORRENTE
    });
  
  // Simulação - em produção, fazer request real para o Inter
  return 'token_simulado_' + Date.now();
}

// Função para enviar PIX
async function enviarPix(config: any, token: string, payload: any): Promise<{ success: boolean; codigoSolicitacao?: string; error?: string }> {
  console.log('💸 Enviando PIX:', payload);
  
  // Simulação - em produção, fazer request real para o Inter
  // const response = await fetch('https://cdpj.partners.bancointer.com.br/banking/v2/pix', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${token}`,
  //     'Content-Type': 'application/json',
  //     'x-conta-corrente': config.CONTA_CORRENTE,
  //   },
  //   body: JSON.stringify(payload)
  // });
  
  // Simulação de sucesso (80% de chance)
  const sucesso = Math.random() > 0.2;
  
  if (sucesso) {
    return {
      success: true,
      codigoSolicitacao: `PIX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } else {
    return {
      success: false,
      error: 'Erro simulado na API Inter'
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      conta, 
      chave_pix, 
      nome_beneficiario, 
      valor, 
      descricao, 
      data_pagamento, 
      data_competencia,
      categoria_id,
      centro_custo_id 
    } = await request.json();

    console.log('🔍 Dados recebidos na API:', {
      conta: conta + ' (tipo: ' + typeof conta + ')',
      chave_pix: chave_pix + ' (tipo: ' + typeof chave_pix + ')',
      nome_beneficiario: nome_beneficiario + ' (tipo: ' + typeof nome_beneficiario + ')',
      valor: valor + ' (tipo: ' + typeof valor + ')',
      categoria_id: categoria_id + ' (tipo: ' + typeof categoria_id + ')',
      centro_custo_id: centro_custo_id + ' (tipo: ' + typeof centro_custo_id + ')',
    });

    console.log('🔍 Validação individual de campos:', {
      conta_ok: !!conta,
      chave_pix_ok: !!chave_pix,
      nome_beneficiario_ok: !!nome_beneficiario,
      valor_ok: !!valor,
      categoria_id_ok: !!categoria_id,
      centro_custo_id_ok: !!centro_custo_id,
    });

    // Validar dados de entrada
    if (!conta || !chave_pix || !nome_beneficiario || !valor || !categoria_id || !centro_custo_id) {
      console.log('❌ Validação falhou - campos faltando:', {
        conta: !conta ? 'FALTANDO' : 'OK',
        chave_pix: !chave_pix ? 'FALTANDO' : 'OK',
        nome_beneficiario: !nome_beneficiario ? 'FALTANDO' : 'OK',
        valor: !valor ? 'FALTANDO' : 'OK',
        categoria_id: !categoria_id ? 'FALTANDO' : 'OK',
        centro_custo_id: !centro_custo_id ? 'FALTANDO' : 'OK',
      });
      return NextResponse.json({
        success: false,
        error: 'Dados obrigatórios faltando (conta, chave_pix, nome_beneficiario, valor, categoria_id, centro_custo_id)'
      }, { status: 400 });
    }

    if (!CONFIGS[conta as keyof typeof CONFIGS]) {
      return NextResponse.json({
        success: false,
        error: 'Conta não configurada'
      }, { status: 400 });
    }

    const config = CONFIGS[conta as keyof typeof CONFIGS];
    
    // Mapear conta para bar_id
    const barIdMap = {
      'Ordinário': 3,
      'Deboche': 4
    };
    const bar_id = barIdMap[conta as keyof typeof barIdMap];

    // Processar chave PIX
    const { tipo, chaveFormatada } = identificarTipoChave(chave_pix);
    
    console.log('🔍 Debug chave PIX:', {
      chave_original: chave_pix,
      chave_limpa: chave_pix.replace(/\D/g, ''),
      tipo_identificado: tipo,
      chave_formatada: chaveFormatada
    });
    
    if (!tipo) {
      return NextResponse.json({
        success: false,
        error: `Chave PIX inválida: ${chave_pix} (${chave_pix.replace(/\D/g, '')})`
      }, { status: 400 });
    }

    // Processar valor
    let valorNumerico: number;
    try {
      valorNumerico = limparValor(valor);
      if (valorNumerico <= 0) {
        throw new Error('Valor deve ser maior que zero');
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Valor inválido'
      }, { status: 400 });
    }

    // Processar datas
    let dataPagamentoFormatada = '';
    let dataCompetenciaFormatada = '';
    
    if (data_pagamento) {
      try {
        const [dia, mes, ano] = data_pagamento.split('/');
        dataPagamentoFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      } catch (error) {
        dataPagamentoFormatada = new Date().toISOString().split('T')[0];
      }
    } else {
      dataPagamentoFormatada = new Date().toISOString().split('T')[0];
    }

    if (data_competencia) {
      try {
        const [dia, mes, ano] = data_competencia.split('/');
        dataCompetenciaFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      } catch (error) {
        dataCompetenciaFormatada = dataPagamentoFormatada; // Usar data de pagamento como fallback
      }
    } else {
      dataCompetenciaFormatada = dataPagamentoFormatada;
    }

    // 1. PRIMEIRO: Buscar/Criar stakeholder no NIBO
    console.log('🔍 Verificando stakeholder no NIBO...');
    let stakeholderId: string | null = null;
    
    try {
      // Buscar stakeholder existente por CPF/CNPJ
      const cpfCnpj = chaveFormatada;
      const stakeholderResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/financeiro/nibo/stakeholders?q=${cpfCnpj}`);
      const stakeholderData = await stakeholderResponse.json();

      if (stakeholderData.success && stakeholderData.data.length > 0) {
        stakeholderId = stakeholderData.data[0].id;
        console.log('✅ Stakeholder encontrado:', stakeholderId);
      } else {
        // Criar novo stakeholder
        console.log('📝 Criando novo stakeholder...');
        const novoStakeholder = {
          name: nome_beneficiario,
          document: cpfCnpj,
          type: 'fornecedor' as const,
        };

        const createResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/financeiro/nibo/stakeholders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(novoStakeholder),
        });

        const createData = await createResponse.json();
        if (createData.success) {
          stakeholderId = createData.data.id;
          console.log('✅ Stakeholder criado:', stakeholderId);
        } else {
          throw new Error(`Erro ao criar stakeholder: ${createData.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar/criar stakeholder:', error);
      return NextResponse.json({
        success: false,
        error: `Erro ao verificar/criar stakeholder no NIBO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }, { status: 500 });
    }

    // 2. SEGUNDO: Criar agendamento no NIBO
    console.log('📅 Criando agendamento no NIBO...');
    let niboAgendamentoId: string | null = null;
    
    try {
      // Usar a mesma estrutura do botão "Agendar no NIBO" funcional
      const agendamento = {
        stakeholderId: stakeholderId,
        dueDate: dataPagamentoFormatada,
        scheduleDate: dataPagamentoFormatada,
        categoria_id: categoria_id || '',
        centro_custo_id: centro_custo_id || '',
        categories: [{ description: descricao || 'Pagamento PIX' }],
        accrualDate: dataCompetenciaFormatada,
        value: valorNumerico,
        description: descricao || `Pagamento PIX para ${nome_beneficiario}`,
        reference: `PIX_${Date.now()}`,
      };

      console.log('📋 Payload para NIBO:', agendamento);
      console.log('🔍 Validação de campos obrigatórios:', {
        stakeholderId: !!stakeholderId,
        dueDate: !!dataPagamentoFormatada,
        scheduleDate: !!dataPagamentoFormatada,
        categoria_id: !!categoria_id,
        centro_custo_id: !!centro_custo_id,
        categories: !!agendamento.categories && agendamento.categories.length > 0,
        value: !!valorNumerico
      });

      const niboResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/financeiro/nibo/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agendamento)
      });

      if (!niboResponse.ok) {
        const errorText = await niboResponse.text();
        throw new Error(`Erro HTTP ${niboResponse.status}: ${errorText}`);
      }

      const niboResult = await niboResponse.json();
      niboAgendamentoId = niboResult.data?.id || niboResult.id;
      
      console.log('✅ Agendamento NIBO criado com sucesso:', niboAgendamentoId);
      
    } catch (error) {
      console.error('❌ Erro ao criar agendamento NIBO:', error);
      return NextResponse.json({
        success: false,
        error: `Erro ao criar agendamento no NIBO: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }, { status: 500 });
    }

    // 3. TERCEIRO: Obter token do Inter
    const token = await obterAccessToken(config, conta, bar_id);

    // 4. QUARTO: Preparar payload para o PIX
    const payload = {
      valor: valorNumerico.toString(),
      descricao: descricao || `Pagamento para ${nome_beneficiario}`,
      dataPagamento: dataPagamentoFormatada,
      destinatario: {
        tipo: 'CHAVE',
        chave: chaveFormatada
      }
    };

    // Tentar enviar PIX
    let resultado = await enviarPix(config, token, payload);

    // Se falhou e é 11 dígitos, tentar como telefone também
    if (!resultado.success && chave_pix.replace(/\D/g, '').length === 11) {
      console.log('🔄 Tentando como telefone...');
      const payloadTelefone = {
        ...payload,
        destinatario: {
          tipo: 'CHAVE',
          chave: `+55${chave_pix.replace(/\D/g, '')}`
        }
      };
      resultado = await enviarPix(config, token, payloadTelefone);
    }

    if (resultado.success) {
      return NextResponse.json({
        success: true,
        codigoSolicitacao: resultado.codigoSolicitacao,
        niboAgendamentoId,
        message: `Agendamento NIBO criado e PIX enviado com sucesso para ${nome_beneficiario}`,
        detalhes: {
          bar_id,
          conta,
          agendamento_nibo: niboAgendamentoId,
          codigo_pix: resultado.codigoSolicitacao,
          data_pagamento: dataPagamentoFormatada,
          data_competencia: dataCompetenciaFormatada,
          valor: valorNumerico
        }
      });
    } else {
      // Se o PIX falhou, idealmente deveria reverter o agendamento NIBO
      console.error('❌ PIX falhou, mas agendamento NIBO já foi criado:', niboAgendamentoId);
      return NextResponse.json({
        success: false,
        error: `Agendamento NIBO criado (${niboAgendamentoId}), mas PIX falhou: ${resultado.error || 'Erro desconhecido'}`
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Erro na API de processamento automático:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
