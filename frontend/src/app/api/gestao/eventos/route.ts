import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Para desenvolvimento, vou simular dados reais da tabela eventos
    // Em produção, isso deve conectar com MCP Supabase
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/supabase/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'SELECT * FROM eventos WHERE bar_id = 3 ORDER BY data_evento ASC'
      })
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      throw new Error('Erro ao buscar eventos');
    }
  } catch (error) {
    console.error('Erro ao carregar eventos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Calcular dia da semana
    const data = new Date(body.data_evento);
    const diasSemana = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
    body.dia_semana = diasSemana[data.getDay()];
    
    // Adicionar dados padrão
    body.bar_id = 3;
    body.status = 'confirmado';
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/supabase/insert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table: 'eventos',
        data: body
      })
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      throw new Error('Erro ao inserir evento');
    }
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
