import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { createClient } from '@supabase/supabase-js';

// Funá§á£o utilitá¡ria para pegar a Service Account do env
function getGoogleServiceAccount() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON ná£o definida');
  return typeof json === 'string' ? JSON.parse(json) : json;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Ler variá¡veis de ambiente
    const serviceAccount = getGoogleServiceAccount();
    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 2. Inicializar Google Sheets
    // ID da planilha fornecida
    const doc = new GoogleSpreadsheet('1klPn-uVLKeoJ9UA9TkiSYqa7sV7NdUdDEELdgd1q4b8');
    await doc.useServiceAccountAuth({
      client_email: serviceAccount.client_email,
      private_key: serviceAccount.private_key,
    });
    await doc.loadInfo();

    // 3. Ler as abas corretas
    // Abas: 'Base - Preparos - CMV' (insumos) e 'Lista - Preparos' (receitas)
    const insumosSheet = doc.sheetsByTitle['Base - Preparos - CMV'];
    const receitasSheet = doc.sheetsByTitle['Lista - Preparos'];
    if (!insumosSheet || !receitasSheet) {
      throw new Error('Ná£o foi possá­vel localizar as abas "Base - Preparos - CMV" ou "Lista - Preparos" na planilha.');
    }

    const insumosRows = await insumosSheet.getRows();
    const receitasRows = await receitasSheet.getRows();

    // 4. Transformar dados em arrays de objetos
    // Ajuste os campos conforme as colunas reais das abas
    const insumos = insumosRows.map((row: any) => ({
      codigo: row['Cá³digo'] || row['codigo'],
      nome: row['Nome'] || row['nome'],
      unidade: row['Unidade'] || row['unidade'],
      custo_unitario: row['Custo Unitá¡rio'] || row['custo_unitario'],
      grupo: row['Grupo'] || row['grupo'],
      // ...adicione outros campos conforme necessá¡rio
    }));

    const receitas = receitasRows.map((row: any) => ({
      codigo: row['Cá³digo'] || row['codigo'],
      nome: row['Nome'] || row['nome'],
      rendimento: row['Rendimento'] || row['rendimento'],
      unidade: row['Unidade'] || row['unidade'],
      // ...adicione outros campos conforme necessá¡rio
    }));

    // 5. Inicializar Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 6. Upsert insumos
    const { data: insumosData, error: insumosError } = await supabase
      .from('insumos')
      .upsert(insumos, { onConflict: 'codigo' });

    // 7. Upsert receitas
    const { data: receitasData, error: receitasError } = await supabase
      .from('receitas')
      .upsert(receitas, { onConflict: 'codigo' });

    // 8. Retornar log detalhado
    return NextResponse.json({
      ok: true,
      insumos: { count: insumos.length, error: insumosError },
      receitas: { count: receitas.length, error: receitasError },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
