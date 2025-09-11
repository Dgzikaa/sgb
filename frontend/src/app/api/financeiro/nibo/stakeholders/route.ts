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
  bar_id?: number;
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

    // Buscar SEMPRE no NIBO primeiro
    if (query || document) {
      const searchTerm = query || document || '';
      const searchTermLimpo = searchTerm.replace(/\D/g, '');

      console.log('🔍 Buscando stakeholder no NIBO:', {
        original: searchTerm,
        limpo: searchTermLimpo,
      });

      // 1. BUSCAR NO NIBO por documento e chave PIX
      console.log('🔍 Buscando no NIBO por documento:', searchTermLimpo);
      const niboStakeholders = await getStakeholdersFromNibo({
        document: searchTermLimpo,
        query: searchTerm.length > 2 ? searchTerm : null
      });

      // 2. Se não encontrou por documento, buscar por chave PIX
      if ((!niboStakeholders || niboStakeholders.length === 0) && searchTermLimpo.length >= 11) {
        console.log('🔍 Buscando no NIBO por chave PIX:', searchTermLimpo);
        const pixStakeholders = await searchStakeholdersByPixKey(searchTermLimpo);
        if (pixStakeholders && pixStakeholders.length > 0) {
          console.log('✅ Encontrado por chave PIX:', pixStakeholders.length);
          
          // Sincronizar com banco local
          for (const stakeholder of pixStakeholders) {
            await syncStakeholderToLocal(stakeholder);
          }

          return NextResponse.json({
            success: true,
            data: pixStakeholders,
            total: pixStakeholders.length,
            source: 'nibo-pix',
          });
        }
      }

      if (niboStakeholders && niboStakeholders.length > 0) {
        console.log('✅ Stakeholders encontrados no NIBO:', niboStakeholders.length);
        
        // Sincronizar com banco local (upsert)
        for (const stakeholder of niboStakeholders) {
          await syncStakeholderToLocal(stakeholder);
        }

        return NextResponse.json({
          success: true,
          data: niboStakeholders,
          total: niboStakeholders.length,
          source: 'nibo',
        });
      }

      console.log('❌ Nenhum stakeholder encontrado no NIBO');
    }

    // Se não encontrou, retornar vazio
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      source: 'nibo',
    });
  } catch (error) {
    console.error('❌ Erro ao buscar stakeholders no NIBO:', error);
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
    console.error('❌ Erro ao criar stakeholder no NIBO:', errorData);
    
    // Se o erro é de chave PIX duplicada, tentar buscar o stakeholder existente
    if (errorData.message && errorData.message.includes('chave PIX')) {
      console.log('🔍 Chave PIX já existe, tentando buscar stakeholder existente...');
      
      // Buscar por chave PIX
      if (stakeholder.pixKey) {
        const existingStakeholders = await searchStakeholdersByPixKey(stakeholder.pixKey);
        if (existingStakeholders && existingStakeholders.length > 0) {
          console.log('✅ Stakeholder encontrado por chave PIX:', existingStakeholders[0].id);
          
          // Sincronizar com banco local
          await syncStakeholderToLocal(existingStakeholders[0]);
          
          return existingStakeholders[0];
        }
      }
    }
    
    throw new Error(
      errorData.error_description ||
        errorData.message ||
        `Erro ${response.status} ao criar stakeholder`
    );
  }

  const data = await response.json();
  console.log('🔍 Resposta completa do NIBO ao criar stakeholder:', JSON.stringify(data, null, 2));

  // Verificar se o ID foi retornado
  if (!data.id) {
    console.error('❌ ERRO: Stakeholder criado no NIBO mas ID não retornado!');
    console.error('Resposta do NIBO:', data);
    throw new Error('Stakeholder criado no NIBO mas ID não foi retornado');
  }

  // Salvar no banco local
  const { error: dbError } = await supabase.from('nibo_stakeholders').insert({
    nibo_id: data.id,
    bar_id: 3, // Bar ID fixo
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

// Função para sincronizar stakeholder do NIBO para banco local
async function syncStakeholderToLocal(stakeholder: NiboStakeholderResponse): Promise<void> {
  try {
    const { error } = await supabase
      .from('nibo_stakeholders')
      .upsert({
        nibo_id: stakeholder.id,
        bar_id: 3, // Bar ID fixo
        nome: stakeholder.name,
        documento_numero: stakeholder.document,
        documento_tipo: stakeholder.document.length === 11 ? 'CPF' : 'CNPJ',
        email: stakeholder.email || null,
        telefone: stakeholder.phone || null,
        endereco: stakeholder.address || {},
        informacoes_bancarias: {},
        tipo: stakeholder.type === 'fornecedor' ? 'Supplier' : 
              stakeholder.type === 'socio' ? 'Partner' : 'Employee',
        pix_chave: stakeholder.pixKey || null,
        pix_tipo: stakeholder.pixKeyType || null,
        ativo: true,
        atualizado_em: new Date().toISOString(),
        usuario_atualizacao: 'Sistema - Sync NIBO'
      }, {
        onConflict: 'nibo_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('❌ Erro ao sincronizar stakeholder local:', error);
    } else {
      console.log('✅ Stakeholder sincronizado:', stakeholder.id);
    }
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
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
    console.error('❌ Erro ao buscar stakeholders no NIBO:', error);
    return [];
  }
}

// Função para buscar stakeholder por chave PIX
async function searchStakeholdersByPixKey(pixKey: string): Promise<NiboStakeholderResponse[]> {
  const headers = {
    accept: 'application/json',
    apitoken: NIBO_CONFIG.API_TOKEN!,
  };

  console.log('🔍 Buscando stakeholder por chave PIX:', pixKey);

  try {
    // Buscar em fornecedores por chave PIX
    const response = await fetch(`${NIBO_CONFIG.BASE_URL}/suppliers?pixKey=${pixKey}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.log('❌ Erro na busca por PIX:', response.status);
      return [];
    }

    const data = await response.json();
    console.log('🔍 Resposta busca PIX:', JSON.stringify(data, null, 2));
    
    let stakeholders = [] as any[];
    if (Array.isArray(data)) {
      stakeholders = data;
    } else if (data.data && Array.isArray(data.data)) {
      stakeholders = data.data;
    } else if (data && typeof data === 'object' && data.id) {
      stakeholders = [data];
    }

    return stakeholders.map((stakeholder: any) => ({
      id: stakeholder.id,
      name: stakeholder.name,
      document: stakeholder.document?.number || '',
      email: stakeholder.communication?.email || '',
      phone: stakeholder.communication?.phone || '',
      type: 'fornecedor',
      address: stakeholder.address || {},
      pixKey: stakeholder.bankAccountInformation?.pixKey || pixKey,
      pixKeyType: stakeholder.bankAccountInformation?.pixKeyType || null,
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar por chave PIX:', error);
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
  console.log('🔍 Resposta da API NIBO para tipo', type, ':', JSON.stringify(data, null, 2));
  
  let stakeholders = [] as any[];
  if (Array.isArray(data)) {
    stakeholders = data;
  } else if (data.data && Array.isArray(data.data)) {
    stakeholders = data.data;
  } else if (data && typeof data === 'object') {
    stakeholders = [data];
  }

  console.log('📋 Stakeholders processados:', stakeholders.length);

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
