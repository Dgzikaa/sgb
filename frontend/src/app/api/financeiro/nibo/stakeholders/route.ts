import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const NIBO_BASE_URL = 'https://api.nibo.com.br/empresas/v1';

// Buscar credenciais do NIBO para um bar
async function getNiboCredentials(barId: number = 3) {
  const { data: credencial, error } = await supabase
    .from('api_credentials')
    .select('api_token, empresa_id')
    .eq('sistema', 'nibo')
    .eq('bar_id', barId)
    .eq('ativo', true)
    .single();

  if (error || !credencial?.api_token) {
    return null;
  }

  return credencial;
}

// GET - Buscar stakeholders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q'); // Busca por CPF/CNPJ ou nome
    const barId = parseInt(searchParams.get('bar_id') || '3');

    console.log(`[NIBO-STAKEHOLDERS] Buscando stakeholders, q=${query}, bar_id=${barId}`);

    const credencial = await getNiboCredentials(barId);
    
    if (!credencial) {
      // Fallback: buscar na tabela local nibo_stakeholders
      console.log('[NIBO-STAKEHOLDERS] Sem credenciais, buscando no banco local');
      
      let dbQuery = supabase
        .from('nibo_stakeholders')
        .select('*')
        .eq('bar_id', barId);
      
      if (query) {
        dbQuery = dbQuery.or(`documento_numero.ilike.%${query}%,nome.ilike.%${query}%`);
      }
      
      const { data, error } = await dbQuery.limit(50);
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: data || [],
        source: 'database'
      });
    }

    // Buscar na API do NIBO
    let niboUrl = `${NIBO_BASE_URL}/stakeholders?apitoken=${credencial.api_token}`;
    
    if (query) {
      // NIBO usa $filter para busca
      niboUrl += `&$filter=contains(document,'${query}') or contains(name,'${query}')`;
    }
    
    niboUrl += '&$top=50';

    const response = await fetch(niboUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'apitoken': credencial.api_token
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NIBO-STAKEHOLDERS] Erro na API NIBO:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Erro NIBO: ${response.status}` },
        { status: response.status }
      );
    }

    const niboData = await response.json();
    const stakeholders = niboData.items || niboData || [];

    // Formatar resposta
    const formattedData = stakeholders.map((s: any) => ({
      id: s.id || s.stakeholderId,
      name: s.name,
      document: s.document,
      email: s.email,
      phone: s.phone,
      type: s.type || 'fornecedor',
      pixKey: s.pixKey || s.pix?.key,
      pixKeyType: s.pixKeyType || s.pix?.type
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'nibo_api'
    });

  } catch (error) {
    console.error('[NIBO-STAKEHOLDERS] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar stakeholders' },
      { status: 500 }
    );
  }
}

// POST - Criar stakeholder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, document, type = 'fornecedor', bar_id = 3, pixKey, pixKeyType = 3 } = body;

    console.log(`[NIBO-STAKEHOLDERS] Criando stakeholder: ${name}, doc=${document}`);

    if (!name || !document) {
      return NextResponse.json(
        { success: false, error: 'Nome e documento são obrigatórios' },
        { status: 400 }
      );
    }

    const credencial = await getNiboCredentials(bar_id);
    
    if (!credencial) {
      return NextResponse.json(
        { success: false, error: 'Credenciais NIBO não encontradas para este bar' },
        { status: 400 }
      );
    }

    // Preparar payload para NIBO
    const stakeholderPayload: any = {
      name,
      document: document.replace(/\D/g, ''), // Remover formatação
      type: type === 'fornecedor' ? 'Supplier' : type === 'socio' ? 'Partner' : 'Employee'
    };

    // Adicionar chave PIX se fornecida
    if (pixKey) {
      stakeholderPayload.pix = {
        key: pixKey,
        type: pixKeyType // 1=Email, 2=Telefone, 3=CPF/CNPJ, 4=Aleatória
      };
    }

    const response = await fetch(`${NIBO_BASE_URL}/stakeholders?apitoken=${credencial.api_token}`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'apitoken': credencial.api_token
      },
      body: JSON.stringify(stakeholderPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NIBO-STAKEHOLDERS] Erro ao criar:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `Erro NIBO: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const niboData = await response.json();

    // Também salvar no banco local para cache
    await supabase.from('nibo_stakeholders').upsert({
      nibo_id: niboData.id,
      bar_id,
      nome: name,
      documento_numero: document.replace(/\D/g, ''),
      documento_tipo: document.replace(/\D/g, '').length <= 11 ? 'CPF' : 'CNPJ',
      tipo: type,
      pix_chave: pixKey,
      pix_tipo: pixKeyType === 1 ? 'email' : pixKeyType === 2 ? 'telefone' : pixKeyType === 3 ? 'cpf_cnpj' : 'aleatoria',
      ativo: true,
      atualizado_em: new Date().toISOString()
    }, {
      onConflict: 'nibo_id'
    });

    return NextResponse.json({
      success: true,
      data: {
        id: niboData.id,
        name,
        document,
        type,
        pixKey
      }
    });

  } catch (error) {
    console.error('[NIBO-STAKEHOLDERS] Erro ao criar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao criar stakeholder' },
      { status: 500 }
    );
  }
}
