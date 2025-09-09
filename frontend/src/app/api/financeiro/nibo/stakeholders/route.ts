import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NiboStakeholderRequest {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  type: 'fornecedor' | 'socio' | 'funcionario';
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  pixKey?: string;
  pixKeyType?: number;
}

interface NiboStakeholderResponse {
  id: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  type: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  pixKey?: string;
  pixKeyType?: number;
}

// Configurações do NIBO (em produção viriam de variáveis de ambiente)
const NIBO_CONFIG = {
  BASE_URL: 'https://api.nibo.com.br/empresas/v1',
  API_TOKEN: process.env.NIBO_API_TOKEN,
};

export async function POST(request: NextRequest) {
  try {
    // Debug: verificar se o token está sendo lido
    console.log('🔍 Debug NIBO_API_TOKEN:', {
      exists: !!process.env.NIBO_API_TOKEN,
      length: process.env.NIBO_API_TOKEN?.length || 0,
      firstChars: process.env.NIBO_API_TOKEN?.substring(0, 10) || 'N/A'
    });

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

    const body: NiboStakeholderRequest = await request.json();
    const { name, document, email, phone, type, address } = body;

    // Validações básicas
    if (!name || !document) {
      return NextResponse.json(
        { success: false, error: 'Nome e documento são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo
    if (!['fornecedor', 'socio', 'funcionario'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo deve ser fornecedor, socio ou funcionario',
        },
        { status: 400 }
      );
    }

    // Criar stakeholder no NIBO
    const niboResponse = await createStakeholderInNibo(body);

    return NextResponse.json({
      success: true,
      data: niboResponse,
      message: 'Stakeholder criado com sucesso no NIBO',
    });
  } catch (error) {
    console.error('Erro ao criar stakeholder no NIBO:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const document = searchParams.get('document');

    // Buscar apenas na base local por enquanto
    if (query || document) {
      const searchTerm = query || document || '';

      // Remover formatação para busca consistente
      const searchTermLimpo = searchTerm.replace(/\D/g, '');

      console.log('Buscando stakeholder:', {
        original: searchTerm,
        limpo: searchTermLimpo,
      });

      // 1. Buscar por CPF/CNPJ exato (sem formatação)
      let { data: localData, error: localError } = await supabase
        .from('nibo_stakeholders')
        .select('*')
        .eq('documento_numero', searchTermLimpo)
        .eq('ativo', true);

      if (localError) {
        console.error('Erro na consulta local:', localError);
        return NextResponse.json(
          { success: false, error: 'Erro na consulta local' },
          { status: 500 }
        );
      }

      // 2. Se não encontrar, buscar por nome parcial
      if ((!localData || localData.length === 0) && searchTerm.length > 2) {
        const { data: nomeData, error: nomeError } = await supabase
          .from('nibo_stakeholders')
          .select('*')
          .ilike('nome', `%${searchTerm}%`)
          .eq('ativo', true)
          .limit(10);
        if (!nomeError && nomeData) {
          localData = nomeData;
        }
      }

      if (localData && localData.length > 0) {
        console.log('Stakeholders encontrados:', localData.length);
        const stakeholders = localData.map(stakeholder => ({
          id: stakeholder.nibo_id,
          name: stakeholder.nome,
          document: stakeholder.documento_numero || '',
          email: stakeholder.email || '',
          phone: stakeholder.telefone || '',
          type:
            stakeholder.tipo === 'Supplier'
              ? 'fornecedor'
              : stakeholder.tipo === 'Customer'
                ? 'fornecedor' // Mapear Customer para fornecedor para compatibilidade com agendamentos
                : stakeholder.tipo === 'Partner'
                  ? 'socio'
                  : 'fornecedor',
          address: stakeholder.endereco || {},
          pixKey: stakeholder.pix_chave || '',
          pixKeyType: stakeholder.pix_tipo || null,
        }));

        return NextResponse.json({
          success: true,
          data: stakeholders,
          total: stakeholders.length,
          source: 'local',
        });
      }
    }

    // Se não encontrou, retornar vazio
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      source: 'local',
    });
  } catch (error) {
    console.error('Erro ao buscar stakeholders:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para criar stakeholder no NIBO
async function createStakeholderInNibo(
  stakeholder: NiboStakeholderRequest
): Promise<NiboStakeholderResponse> {
  const headers = {
    accept: 'application/json',
    apitoken: NIBO_CONFIG.API_TOKEN!,
    'content-type': 'application/json',
  };

  // Mapear tipo para endpoint correto do NIBO
  let endpoint = '';
  switch (stakeholder.type) {
    case 'fornecedor':
      endpoint = 'suppliers';
      break;
    case 'socio':
      endpoint = 'partners';
      break;
    case 'funcionario':
      endpoint = 'employees';
      break;
    default:
      throw new Error('Tipo de stakeholder inválido');
  }

  // Preparar payload para o NIBO
  const niboPayload: any = {
    name: stakeholder.name,
    document: {
      number: stakeholder.document,
      type: stakeholder.document.length === 11 ? 'CPF' : 'CNPJ',
    },
    communication: {
      email: stakeholder.email,
      phone: stakeholder.phone,
    },
    address: stakeholder.address,
  };

  // Adicionar dados de PIX se fornecidos
  if (stakeholder.pixKey && stakeholder.pixKeyType) {
    niboPayload.bankAccountInformation = {
      pixKey: stakeholder.pixKey,
      pixKeyType: stakeholder.pixKeyType,
    };
  }

  const response = await fetch(`${NIBO_CONFIG.BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(niboPayload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error_description ||
        `Erro ${response.status} ao criar stakeholder`
    );
  }

  const data = await response.json();

  // Salvar no banco local
  const { error: dbError } = await supabase.from('nibo_stakeholders').insert({
    nibo_id: data.id,
    bar_id: 1, // TODO: Pegar do contexto do usuário
    nome: data.name,
    documento_numero: data.document?.number || stakeholder.document,
    documento_tipo:
      data.document?.type ||
      (stakeholder.document.length === 11 ? 'CPF' : 'CNPJ'),
    email: data.communication?.email || stakeholder.email,
    telefone: data.communication?.phone || stakeholder.phone,
    endereco: data.address || {},
    informacoes_bancarias: data.bankAccountInformation || {},
    tipo: stakeholder.type,
    pix_chave: stakeholder.pixKey || data.bankAccountInformation?.pixKey,
    pix_tipo: stakeholder.pixKeyType || data.bankAccountInformation?.pixKeyType,
  });

  if (dbError) {
    console.error('Erro ao salvar stakeholder no banco local:', dbError);
    // Não falhar a operação se der erro no banco local
  }

  return {
    id: data.id,
    name: data.name,
    document: data.document?.number || stakeholder.document,
    email: data.communication?.email || stakeholder.email,
    phone: data.communication?.phone || stakeholder.phone,
    type: stakeholder.type,
    address: data.address,
    pixKey: stakeholder.pixKey || data.bankAccountInformation?.pixKey,
    pixKeyType:
      stakeholder.pixKeyType || data.bankAccountInformation?.pixKeyType,
  };
}

// Função para buscar stakeholders no NIBO
async function getStakeholdersFromNibo(params: {
  query?: string | null;
  type?: string | null;
  document?: string | null;
}): Promise<NiboStakeholderResponse[]> {
  const headers = {
    accept: 'application/json',
    apitoken: NIBO_CONFIG.API_TOKEN!,
  };

  // Buscar em todos os tipos de stakeholders
  const allStakeholders: NiboStakeholderResponse[] = [];

  try {
    // Buscar fornecedores
    if (!params.type || params.type === 'fornecedor') {
      const suppliers = await searchStakeholdersByType(
        'suppliers',
        params,
        headers
      );
      allStakeholders.push(
        ...suppliers.map(s => ({ ...s, type: 'fornecedor' }))
      );
    }

    // Buscar sócios
    if (!params.type || params.type === 'socio') {
      const partners = await searchStakeholdersByType(
        'partners',
        params,
        headers
      );
      allStakeholders.push(...partners.map(s => ({ ...s, type: 'socio' })));
    }

    // Buscar funcionários
    if (!params.type || params.type === 'funcionario') {
      const employees = await searchStakeholdersByType(
        'employees',
        params,
        headers
      );
      allStakeholders.push(
        ...employees.map(s => ({ ...s, type: 'funcionario' }))
      );
    }

    return allStakeholders;
  } catch (error) {
    console.error('Erro ao buscar stakeholders:', error);
    return [];
  }
}

// Função auxiliar para buscar stakeholders por tipo
async function searchStakeholdersByType(
  type: string,
  params: { query?: string | null; document?: string | null },
  headers: Record<string, string>
): Promise<any[]> {
  let url = `${NIBO_CONFIG.BASE_URL}/${type}`;
  const searchParams = new URLSearchParams();

  if (params.query) {
    searchParams.append('q', params.query);
  }

  if (params.document) {
    searchParams.append('document', params.document);
  }

  if (searchParams.toString()) {
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const stakeholders = data.data || data || [];

  // Mapear dados de PIX para cada stakeholder
  return stakeholders.map((stakeholder: any) => ({
    id: stakeholder.id,
    name: stakeholder.name,
    document: stakeholder.document?.number || '',
    email: stakeholder.communication?.email || '',
    phone: stakeholder.communication?.phone || '',
    address: stakeholder.address || {},
    pixKey: stakeholder.bankAccountInformation?.pixKey || '',
    pixKeyType: stakeholder.bankAccountInformation?.pixKeyType || null,
  }));
}
