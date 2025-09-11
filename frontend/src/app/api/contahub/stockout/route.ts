import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ContaHubCredentials {
  username: string;
  password: string;
  base_url: string;
}

async function getContaHubCredentials(barId: number): Promise<ContaHubCredentials> {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('username, password, base_url')
    .eq('sistema', 'contahub')
    .eq('bar_id', barId)
    .eq('ativo', true)
    .single();

  if (error || !data) {
    throw new Error('Credenciais do ContaHub não encontradas');
  }

  return data;
}

async function fetchContaHubStockout(
  credentials: ContaHubCredentials,
  date: string,
  timestamp: string
): Promise<any> {
  const url = `${credentials.base_url}/rest/contahub.cmds.QueryCmd/execQuery/1757616291032`;
  
  const params = new URLSearchParams({
    qry: '7', // Query ID para stockout
    d0: date, // Data início
    d1: date, // Data fim (mesmo dia)
    meio: '',
    emp: '3768', // ID da empresa
    nfe: '1',
    timestamp: timestamp
  });

  console.log(`🔍 Buscando dados de stockout do ContaHub para ${date} às ${timestamp}`);
  
  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'User-Agent': 'SGB-Stockout-Monitor/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Erro na API ContaHub: ${response.status} - ${response.statusText}`);
  }

  return await response.json();
}

async function saveStockoutData(barId: number, date: string, hour: string, data: any[]): Promise<number> {
  const records = data.map(item => ({
    bar_id: barId,
    data_consulta: date,
    hora_consulta: hour,
    vd: item.vd,
    trn: item.trn,
    dt_gerencial: item.dt_gerencial,
    hr_lancamento: item.hr_lancamento,
    hr_transacao: item.hr_transacao,
    dt_transacao: item.dt_transacao,
    mesa: item.mesa,
    cli: item.cli,
    cliente: item.cliente,
    vr_pagamentos: item.$vr_pagamentos || item.vr_pagamentos,
    pag: item.pag,
    valor: item.$valor || item.valor,
    liquido: item.$liquido || item.liquido,
    tipo: item.tipo,
    meio: item.meio,
    cartao: item.cartao,
    autorizacao: item.autorizacao,
    usr_abriu: item.usr_abriu,
    usr_lancou: item.usr_lancou,
    pos: item.pos,
    raw_data: item
  }));

  const { error } = await supabase
    .from('contahub_stockout')
    .upsert(records, {
      onConflict: 'bar_id,data_consulta,hora_consulta,vd,trn',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Erro ao salvar dados de stockout:', error);
    throw new Error(`Erro ao salvar dados: ${error.message}`);
  }

  return records.length;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const hour = searchParams.get('hour') || '20:00:00';
    const barId = parseInt(searchParams.get('bar_id') || '3');

    console.log(`🔄 Iniciando coleta de stockout para ${date} às ${hour}`);

    // Buscar credenciais do ContaHub
    const credentials = await getContaHubCredentials(barId);

    // Criar timestamp para 20h do horário de Brasília
    const targetDateTime = new Date(`${date}T${hour}-03:00`);
    const timestamp = Math.floor(targetDateTime.getTime() / 1000).toString();

    // Buscar dados do ContaHub
    const stockoutData = await fetchContaHubStockout(credentials, date, timestamp);

    if (!stockoutData || !stockoutData.list) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum dado encontrado para o período especificado',
        data: {
          date,
          hour,
          records_found: 0,
          records_saved: 0
        }
      });
    }

    // Salvar dados no banco
    const recordsSaved = await saveStockoutData(barId, date, hour, stockoutData.list);

    console.log(`✅ Stockout coletado: ${stockoutData.list.length} registros encontrados, ${recordsSaved} salvos`);

    return NextResponse.json({
      success: true,
      message: `Dados de stockout coletados com sucesso para ${date}`,
      data: {
        date,
        hour,
        timestamp,
        records_found: stockoutData.list.length,
        records_saved: recordsSaved,
        sample_data: stockoutData.list.slice(0, 3) // Primeiros 3 registros como amostra
      }
    });

  } catch (error) {
    console.error('❌ Erro na coleta de stockout:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, hour = '20:00:00', bar_id = 3 } = body;

    if (!date) {
      return NextResponse.json({
        success: false,
        error: 'Data é obrigatória'
      }, { status: 400 });
    }

    console.log(`🔄 Coleta manual de stockout para ${date} às ${hour}`);

    // Buscar credenciais do ContaHub
    const credentials = await getContaHubCredentials(bar_id);

    // Criar timestamp para o horário especificado
    const targetDateTime = new Date(`${date}T${hour}-03:00`);
    const timestamp = Math.floor(targetDateTime.getTime() / 1000).toString();

    // Buscar dados do ContaHub
    const stockoutData = await fetchContaHubStockout(credentials, date, timestamp);

    if (!stockoutData || !stockoutData.list) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum dado encontrado para o período especificado',
        data: {
          date,
          hour,
          records_found: 0,
          records_saved: 0
        }
      });
    }

    // Salvar dados no banco
    const recordsSaved = await saveStockoutData(bar_id, date, hour, stockoutData.list);

    console.log(`✅ Stockout manual coletado: ${stockoutData.list.length} registros encontrados, ${recordsSaved} salvos`);

    return NextResponse.json({
      success: true,
      message: `Dados de stockout coletados manualmente para ${date}`,
      data: {
        date,
        hour,
        timestamp,
        records_found: stockoutData.list.length,
        records_saved: recordsSaved,
        sample_data: stockoutData.list.slice(0, 5) // Primeiros 5 registros como amostra
      }
    });

  } catch (error) {
    console.error('❌ Erro na coleta manual de stockout:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
