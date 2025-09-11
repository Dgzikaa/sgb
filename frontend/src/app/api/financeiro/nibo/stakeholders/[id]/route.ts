import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configurações do NIBO
const NIBO_CONFIG = {
  BASE_URL: 'https://api.nibo.com.br/empresas/v1',
  API_TOKEN: process.env.NIBO_API_TOKEN,
};

interface UpdateStakeholderRequest {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  pixKey?: string;
  pixKeyType?: number;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateStakeholderRequest = await request.json();

    console.log('Atualizando stakeholder:', { id, body });

    // Validações básicas
    if (!body.name || !body.document) {
      return NextResponse.json(
        { success: false, error: 'Nome e documento são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar stakeholder no banco local primeiro
    const { data: localStakeholder, error: localError } = await supabase
      .from('nibo_stakeholders')
      .select('*')
      .eq('nibo_id', id)
      .single();

    if (localError || !localStakeholder) {
      console.error('Stakeholder não encontrado:', localError);
      return NextResponse.json(
        { success: false, error: 'Stakeholder não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar no banco local
    const updateData: any = {};
    
    if (body.name) updateData.nome = body.name;
    if (body.document) updateData.documento_numero = body.document.replace(/\D/g, '');
    if (body.email) updateData.email = body.email;
    if (body.phone) updateData.telefone = body.phone;
    if (body.pixKey) updateData.pix_chave = body.pixKey;
    if (body.pixKeyType !== undefined) updateData.pix_tipo = body.pixKeyType;

    const { data: updatedStakeholder, error: updateError } = await supabase
      .from('nibo_stakeholders')
      .update(updateData)
      .eq('nibo_id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar stakeholder:', updateError);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar stakeholder' },
        { status: 500 }
      );
    }

    // Tentar atualizar no NIBO também (se o token estiver configurado)
    if (NIBO_CONFIG.API_TOKEN) {
      try {
        await updateStakeholderInNibo(id, body, localStakeholder.tipo);
      } catch (niboError) {
        console.warn('Erro ao atualizar no NIBO (continuando):', niboError);
        // Não falhar a operação se der erro no NIBO
      }
    }

    // Retornar dados atualizados
    const responseData = {
      id: updatedStakeholder.nibo_id,
      name: updatedStakeholder.nome,
      document: updatedStakeholder.documento_numero,
      email: updatedStakeholder.email || '',
      phone: updatedStakeholder.telefone || '',
      type: updatedStakeholder.tipo,
      pixKey: updatedStakeholder.pix_chave || '',
      pixKeyType: updatedStakeholder.pix_tipo || null,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Stakeholder atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar stakeholder:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Buscar stakeholder no banco local
    const { data: localStakeholder, error: localError } = await supabase
      .from('nibo_stakeholders')
      .select('*')
      .eq('nibo_id', id)
      .single();

    if (localError || !localStakeholder) {
      return NextResponse.json(
        { success: false, error: 'Stakeholder não encontrado' },
        { status: 404 }
      );
    }

    const responseData = {
      id: localStakeholder.nibo_id,
      name: localStakeholder.nome,
      document: localStakeholder.documento_numero,
      email: localStakeholder.email || '',
      phone: localStakeholder.telefone || '',
      type: localStakeholder.tipo,
      pixKey: localStakeholder.pix_chave || '',
      pixKeyType: localStakeholder.pix_tipo || null,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Erro ao buscar stakeholder:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para atualizar stakeholder no NIBO
async function updateStakeholderInNibo(
  id: string,
  updates: UpdateStakeholderRequest,
  type: string
): Promise<void> {
  const headers = {
    accept: 'application/json',
    apitoken: NIBO_CONFIG.API_TOKEN!,
    'content-type': 'application/json',
  };

  // Mapear tipo para endpoint correto do NIBO
  let endpoint = '';
  switch (type) {
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
      endpoint = 'suppliers'; // Fallback
  }

  // Preparar payload para o NIBO
  const niboPayload: any = {};

  if (updates.name) niboPayload.name = updates.name;
  
  if (updates.document) {
    niboPayload.document = {
      number: updates.document,
      type: updates.document.length === 11 ? 'CPF' : 'CNPJ',
    };
  }

  if (updates.email || updates.phone) {
    niboPayload.communication = {};
    if (updates.email) niboPayload.communication.email = updates.email;
    if (updates.phone) niboPayload.communication.phone = updates.phone;
  }

  // Adicionar dados de PIX se fornecidos
  if (updates.pixKey && updates.pixKeyType !== undefined) {
    niboPayload.bankAccountInformation = {
      pixKey: updates.pixKey,
      pixKeyType: updates.pixKeyType,
    };
  }

  const response = await fetch(`${NIBO_CONFIG.BASE_URL}/${endpoint}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(niboPayload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error_description ||
        `Erro ${response.status} ao atualizar stakeholder`
    );
  }
}