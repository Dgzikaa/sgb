import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NiboScheduleRequest {
  stakeholderId: string;
  dueDate: string;
  scheduleDate: string;
  categoria_id: string;
  centro_custo_id: string;
  categories: Array<{
    description: string;
    reference?: string;
  }>;
  accrualDate?: string;
  value: number;
  costCenterValueType?: number; // 0 para valor, 1 para percentagem
  costCenters?: Array<{
    id: string;
    value: number;
  }>;
  description?: string;
  reference?: string;
  isFlagged?: boolean;
  recurrence?: {
    instalment?: Array<{
      dueDate: string;
      value: number;
    }>;
  };
}

// Interface baseada na documentação oficial do NIBO
interface NiboPaymentSchedule {
  stakeholderId: string;
  dueDate: string;
  scheduleDate: string;
  categories: Array<{
    categoryId: string;
    value: number;
    description?: string;
  }>;
  costCenters?: Array<{
    costCenterId: string;
    value?: string;
    percent?: string;
  }>;
  costCenterValueType?: number; // 0 para valor, 1 para percentagem
  accrualDate?: string;
  description?: string;
  reference?: string;
  isFlagged?: boolean;
}

interface NiboScheduleResponse {
  id: string;
  stakeholderId: string;
  dueDate: string;
  scheduleDate: string;
  status: 'pending' | 'approved' | 'rejected';
  value: number;
  categories: Array<{
    categoryId: string;
    value: number;
    description?: string;
  }>;
  accrualDate?: string;
  description?: string;
  reference?: string;
  isFlagged?: boolean;
}

// Configurações do NIBO
const NIBO_CONFIG = {
  BASE_URL: 'https://api.nibo.com.br/empresas/v1',
  API_TOKEN: process.env.NIBO_API_TOKEN,
};

export async function POST(request: NextRequest) {
  try {
    // Validar se o token do NIBO está configurado
    if (!NIBO_CONFIG.API_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Token do NIBO não configurado. Configure NIBO_API_TOKEN no Vercel.',
        },
        { status: 500 }
      );
    }

    const body: NiboScheduleRequest = await request.json();
    const {
      stakeholderId,
      dueDate,
      scheduleDate,
      categoria_id,
      centro_custo_id,
      categories,
      accrualDate,
      value,
    } = body;

    // Validações básicas
    if (
      !stakeholderId ||
      !dueDate ||
      !scheduleDate ||
      !categoria_id ||
      !centro_custo_id ||
      !categories ||
      categories.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    // Buscar categoria para validar tipo
    const categoriaValidacao = await getCategoriaById(categoria_id.toString());

    if (!categoriaValidacao) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 400 }
      );
    }

    // Validar valor baseado no tipo da categoria
    if (!value || value === 0) {
      return NextResponse.json(
        { success: false, error: 'Valor deve ser diferente de zero' },
        { status: 400 }
      );
    }

    // Validar se o valor está correto para o tipo da categoria
    if (categoriaValidacao.tipo === 'in' && value < 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Para categoria de entrada (${categoriaValidacao.nome}), o valor deve ser positivo. Valor atual: ${value}`,
          suggestion: `Use valor positivo: ${Math.abs(value)}`,
        },
        { status: 400 }
      );
    }

    if (categoriaValidacao.tipo === 'out' && value > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Para categoria de saída (${categoriaValidacao.nome}), o valor deve ser negativo. Valor atual: ${value}`,
          suggestion: `Use valor negativo: -${value}`,
        },
        { status: 400 }
      );
    }

    // Validar datas
    const dueDateObj = new Date(dueDate);
    const scheduleDateObj = new Date(scheduleDate);

    if (isNaN(dueDateObj.getTime()) || isNaN(scheduleDateObj.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Datas inválidas' },
        { status: 400 }
      );
    }

    // Validar se categoria e centro de custo existem
    const categoria = await getCategoriaById(categoria_id);
    if (!categoria) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 400 }
      );
    }

    const centroCusto = await getCentroCustoById(centro_custo_id);
    if (!centroCusto) {
      return NextResponse.json(
        { success: false, error: 'Centro de custo não encontrado' },
        { status: 400 }
      );
    }

    // Validar stakeholder antes de criar agendamento
    console.log('Validando stakeholder:', stakeholderId);
    const stakeholderValidation = await validateStakeholder(stakeholderId);
    if (!stakeholderValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Stakeholder is not compatible: ${stakeholderValidation.reason}`,
          stakeholder: stakeholderValidation.stakeholder
        },
        { status: 400 }
      );
    }

    // Verificar se stakeholder existe no NIBO e criar se necessário
    console.log('Verificando se stakeholder existe no NIBO...');
    const stakeholderNiboCheck = await ensureStakeholderExistsInNibo(stakeholderValidation.stakeholder);
    if (!stakeholderNiboCheck.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Erro ao verificar/criar stakeholder no NIBO: ${stakeholderNiboCheck.error}`,
          stakeholder: stakeholderValidation.stakeholder
        },
        { status: 500 }
      );
    }

    // Criar agendamento no NIBO
    const niboResponse = await createScheduleInNibo(body);

    // Enviar notificação para Discord
    try {
      await enviarNotificacaoDiscord({
        valor: body.value,
        descricao: body.description || 'Agendamento NIBO',
        destinatario: 'NIBO',
        chave: 'N/A',
        codigoSolicitacao: niboResponse.id,
        status: 'AGENDADO',
        barId: '3', // TODO: Pegar do contexto
      });
    } catch (discordError) {
      console.error('Erro ao enviar notificação Discord:', discordError);
      // Não falhar o agendamento por erro no Discord
    }

    return NextResponse.json({
      success: true,
      data: niboResponse,
      message: 'Agendamento criado com sucesso no NIBO',
    });
  } catch (error) {
    console.error('Erro ao criar agendamento no NIBO:', error);

    let errorMessage = 'Erro interno do servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stakeholderId = searchParams.get('stakeholderId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Buscar agendamentos no NIBO
    const schedules = await getSchedulesFromNibo({
      stakeholderId,
      status,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      data: schedules,
      total: schedules.length,
    });
  } catch (error) {
    console.error('Erro ao buscar agendamentos no NIBO:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para criar agendamento no NIBO
async function createScheduleInNibo(
  schedule: NiboScheduleRequest
): Promise<NiboScheduleResponse> {
  try {
    console.log('Iniciando criação de agendamento no NIBO:', schedule);

    const headers = {
      accept: 'application/json',
      apitoken: NIBO_CONFIG.API_TOKEN!,
      'content-type': 'application/json',
    };

    // Buscar dados da categoria e centro de custo (já validados no POST)
    console.log('Buscando categoria:', schedule.categoria_id);
    const categoria = await getCategoriaById(schedule.categoria_id);
    console.log('Categoria encontrada:', categoria);
    console.log(
      'Tipo da categoria:',
      categoria?.tipo,
      '- Valor será:',
      categoria?.tipo === 'in' ? 'POSITIVO (entrada)' : 'NEGATIVO (saída)'
    );

    console.log('Buscando centro de custo:', schedule.centro_custo_id);
    const centroCusto = await getCentroCustoById(schedule.centro_custo_id);
    console.log('Centro de custo encontrado:', centroCusto);

    // Validar novamente (segurança extra)
    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }

    if (!centroCusto) {
      throw new Error('Centro de custo não encontrado');
    }

    // Determinar o endpoint baseado no tipo da categoria
    const isCredit = categoria?.tipo === 'in';
    const endpoint = isCredit ? '/schedules/credit' : '/schedules/debit';
    const url = `${NIBO_CONFIG.BASE_URL}${endpoint}`;

    console.log(
      `Usando endpoint: ${endpoint} (${isCredit ? 'CRÉDITO' : 'DÉBITO'})`
    );

    // Montar payload seguindo a documentação oficial do NIBO
    const niboPayload: NiboPaymentSchedule = {
      stakeholderId: schedule.stakeholderId,
      dueDate: schedule.dueDate,
      scheduleDate: schedule.scheduleDate,
      categories: [
        {
          categoryId:
            categoria?.nibo_id ||
            categoria?.id?.toString() ||
            schedule.categoria_id,
          value: Math.abs(schedule.value), // Sempre positivo, o endpoint determina se é crédito ou débito
          description: categoria?.nome || 'Categoria não encontrada',
        },
      ],
      costCenters: centroCusto
        ? [
            {
              costCenterId: centroCusto.nibo_id || centroCusto.id.toString(),
              value: Math.abs(schedule.value).toString(), // Sempre positivo
            },
          ]
        : undefined,
      costCenterValueType: 0, // 0 para valor fixo
      accrualDate: schedule.accrualDate,
      description:
        schedule.description ||
        schedule.categories?.[0]?.description ||
        'Pagamento PIX',
      reference: schedule.reference,
      isFlagged: schedule.isFlagged || false,
    };

    console.log(
      'Payload para NIBO (formato oficial):',
      JSON.stringify(niboPayload, null, 2)
    );
    console.log('Payload para NIBO (formato oficial):', niboPayload);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(niboPayload),
    });

    console.log('Resposta do NIBO:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `Erro ${response.status} ao criar agendamento`;
      try {
        const errorData = await response.json();
        console.error('Erro detalhado do NIBO:', errorData);
        errorMessage =
          errorData.error_description ||
          errorData.message ||
          errorData.error ||
          errorMessage;
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta de erro:', parseError);
        const errorText = await response.text();
        console.error('Resposta de erro como texto:', errorText);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Agendamento criado com sucesso:', data);
    return data;
  } catch (error) {
    console.error('Erro detalhado na criação do agendamento:', error);
    throw error;
  }
}

// Função para buscar agendamentos no NIBO
async function getSchedulesFromNibo(params: {
  stakeholderId?: string | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<NiboScheduleResponse[]> {
  const headers = {
    accept: 'application/json',
    apitoken: NIBO_CONFIG.API_TOKEN!,
  };

  let url = `${NIBO_CONFIG.BASE_URL}/schedules/debit`;
  const searchParams = new URLSearchParams();

  if (params.stakeholderId) {
    searchParams.append('stakeholderId', params.stakeholderId);
  }

  if (params.status) {
    searchParams.append('status', params.status);
  }

  if (params.startDate) {
    searchParams.append('startDate', params.startDate);
  }

  if (params.endDate) {
    searchParams.append('endDate', params.endDate);
  }

  if (searchParams.toString()) {
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error_description ||
        `Erro ${response.status} ao buscar agendamentos`
    );
  }

  const data = await response.json();
  return data.data || data;
}

// Função para buscar categoria por ID
async function getCategoriaById(categoriaId: string) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Converter para número se possível
    const id = parseInt(categoriaId);
    if (isNaN(id)) {
      console.error('ID da categoria inválido:', categoriaId);
      return null;
    }

    const { data, error } = await supabase
      .from('nibo_categorias')
      .select('id, nome, descricao, tipo, nibo_id')
      .eq('id', id)
      .eq('ativo', true)
      .single();

    if (error) {
      console.error('Erro ao buscar categoria:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return null;
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
      title: '📋 Novo Agendamento NIBO',
      color: 0x00ff00, // Verde para NIBO
      fields: [
        {
          name: 'Valor',
          value: `R$ ${valor.toFixed(2)}`,
          inline: true,
        },
        {
          name: 'Descrição',
          value: descricao,
          inline: true,
        },
        {
          name: 'Código de Solicitação',
          value: codigoSolicitacao,
          inline: true,
        },
        {
          name: 'Status',
          value: '✅ Agendado no NIBO',
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

    // Enviar diretamente para o webhook do Discord
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Status da resposta Discord:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro no Discord:', errorText);
      return false;
    }

    console.log('✅ Notificação enviada para Discord com sucesso!');
    return true;
  } catch (error: any) {
    console.error('❌ Erro ao enviar notificação Discord:', error);
    return false;
  }
}

// Função para buscar centro de custo por ID
async function getCentroCustoById(centroCustoId: string) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Converter para número se possível
    const id = parseInt(centroCustoId);
    if (isNaN(id)) {
      console.error('ID do centro de custo inválido:', centroCustoId);
      return null;
    }

    const { data, error } = await supabase
      .from('nibo_centros_custo')
      .select('id, nome, descricao, nibo_id')
      .eq('id', id)
      .eq('ativo', true)
      .single();

    if (error) {
      console.error('Erro ao buscar centro de custo:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar centro de custo:', error);
    return null;
  }
}

// Função para validar se o stakeholder é compatível com agendamentos
async function validateStakeholder(stakeholderId: string): Promise<{
  isValid: boolean;
  reason?: string;
  stakeholder?: any;
}> {
  try {
    console.log('Validando stakeholder ID:', stakeholderId);

    // Buscar stakeholder no banco local
    const { data: localStakeholder, error: localError } = await supabase
      .from('nibo_stakeholders')
      .select('*')
      .eq('nibo_id', stakeholderId)
      .single();

    if (localError || !localStakeholder) {
      console.log('Stakeholder não encontrado no banco local:', localError?.message);
      return {
        isValid: false,
        reason: 'Stakeholder não encontrado no banco local',
        stakeholder: null
      };
    }

    console.log('Stakeholder encontrado:', {
      id: localStakeholder.nibo_id,
      nome: localStakeholder.nome,
      tipo: localStakeholder.tipo,
      documento: localStakeholder.documento_numero
    });

    // Verificar se o tipo é válido para agendamentos
    // No NIBO: Supplier, Customer e Partner podem ser usados para agendamentos
    const tiposValidos = ['fornecedor', 'socio', 'funcionario', 'Supplier', 'Customer', 'Partner'];
    if (!tiposValidos.includes(localStakeholder.tipo)) {
      return {
        isValid: false,
        reason: `Tipo de stakeholder '${localStakeholder.tipo}' não é válido para agendamentos. Tipos válidos: ${tiposValidos.join(', ')}`,
        stakeholder: localStakeholder
      };
    }

    // Se for Customer, converter para Supplier para compatibilidade com agendamentos de débito
    if (localStakeholder.tipo === 'Customer') {
      console.log('Convertendo stakeholder Customer para Supplier para compatibilidade');
      await supabase
        .from('nibo_stakeholders')
        .update({ 
          tipo: 'Supplier',
          atualizado_em: new Date().toISOString(),
          usuario_atualizacao: 'Sistema - Conversão automática'
        })
        .eq('nibo_id', stakeholderId);
    }

    // Verificar se tem documento válido
    if (!localStakeholder.documento_numero || localStakeholder.documento_numero.length < 11) {
      return {
        isValid: false,
        reason: 'Stakeholder não possui documento válido',
        stakeholder: localStakeholder
      };
    }

    // Verificar se não está marcado como deletado
    if (localStakeholder.deletado) {
      return {
        isValid: false,
        reason: 'Stakeholder está marcado como deletado',
        stakeholder: localStakeholder
      };
    }

    console.log('Stakeholder validado com sucesso');
    return {
      isValid: true,
      stakeholder: localStakeholder
    };

  } catch (error) {
    console.error('Erro ao validar stakeholder:', error);
    return {
      isValid: false,
      reason: `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      stakeholder: null
    };
  }
}

// Função para garantir que o stakeholder existe no NIBO
async function ensureStakeholderExistsInNibo(localStakeholder: any): Promise<{
  success: boolean;
  error?: string;
  stakeholder?: any;
}> {
  try {
    console.log('Verificando stakeholder no NIBO:', localStakeholder.nibo_id);

    if (!NIBO_CONFIG.API_TOKEN) {
      return {
        success: false,
        error: 'Token do NIBO não configurado'
      };
    }

    const headers = {
      accept: 'application/json',
      apitoken: NIBO_CONFIG.API_TOKEN!,
    };

    // Tentar buscar o stakeholder no NIBO usando diferentes endpoints
    const endpoints = ['suppliers', 'customers', 'partners'];
    let stakeholderExists = false;
    let stakeholderData = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`Buscando stakeholder no endpoint: ${endpoint}`);
        const response = await fetch(`${NIBO_CONFIG.BASE_URL}/${endpoint}/${localStakeholder.nibo_id}`, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          stakeholderData = await response.json();
          stakeholderExists = true;
          console.log(`Stakeholder encontrado no NIBO como ${endpoint}:`, stakeholderData.id);
          break;
        } else if (response.status === 404) {
          console.log(`Stakeholder não encontrado em ${endpoint}`);
        } else {
          console.log(`Erro ao buscar em ${endpoint}:`, response.status);
        }
      } catch (error) {
        console.log(`Erro na busca em ${endpoint}:`, error);
      }
    }

    if (stakeholderExists) {
      console.log('Stakeholder existe no NIBO, prosseguindo...');
      return {
        success: true,
        stakeholder: stakeholderData
      };
    }

    // Se não existe, criar no NIBO
    console.log('Stakeholder não existe no NIBO, criando...');
    const createResult = await createStakeholderInNibo(localStakeholder);
    
    return {
      success: true,
      stakeholder: createResult
    };

  } catch (error) {
    console.error('Erro ao verificar/criar stakeholder no NIBO:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função para criar stakeholder no NIBO baseado nos dados locais
async function createStakeholderInNibo(localStakeholder: any): Promise<any> {
  console.log('Criando stakeholder no NIBO:', localStakeholder);

  const headers = {
    accept: 'application/json',
    apitoken: NIBO_CONFIG.API_TOKEN!,
    'content-type': 'application/json',
  };

  // Determinar endpoint baseado no tipo
  let endpoint = 'suppliers'; // Padrão para fornecedor
  if (localStakeholder.tipo === 'Partner') {
    endpoint = 'partners';
  } else if (localStakeholder.tipo === 'Employee') {
    endpoint = 'employees';
  }

  // Preparar payload
  const niboPayload = {
    name: localStakeholder.nome,
    document: {
      number: localStakeholder.documento_numero,
      type: localStakeholder.documento_numero.length === 11 ? 'CPF' : 'CNPJ',
    },
    communication: {
      email: localStakeholder.email || '',
      phone: localStakeholder.telefone || '',
    },
    address: localStakeholder.endereco || {},
  };

  // Adicionar dados de PIX se existirem
  if (localStakeholder.pix_chave) {
    niboPayload.bankAccountInformation = {
      pixKey: localStakeholder.pix_chave,
      pixKeyType: localStakeholder.pix_tipo || 3,
    };
  }

  console.log('Payload para criação no NIBO:', JSON.stringify(niboPayload, null, 2));

  const response = await fetch(`${NIBO_CONFIG.BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(niboPayload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Erro ao criar stakeholder no NIBO:', errorData);
    throw new Error(
      errorData.error_description ||
        errorData.message ||
        `Erro ${response.status} ao criar stakeholder`
    );
  }

  const createdStakeholder = await response.json();
  console.log('Stakeholder criado no NIBO com sucesso:', createdStakeholder.id);

  // Atualizar o nibo_id no banco local se for diferente
  if (createdStakeholder.id !== localStakeholder.nibo_id) {
    console.log('Atualizando nibo_id no banco local:', createdStakeholder.id);
    await supabase
      .from('nibo_stakeholders')
      .update({ 
        nibo_id: createdStakeholder.id,
        atualizado_em: new Date().toISOString(),
        usuario_atualizacao: 'Sistema - Sincronização NIBO'
      })
      .eq('id', localStakeholder.id);
  }

  return createdStakeholder;
}
