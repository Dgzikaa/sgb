import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    // Em produção, integrar com MCP Supabase
    // Por enquanto, vou simular uma resposta estruturada
    
    if (query.includes('eventos')) {
      // Simular dados reais baseados no que inserimos via MCP
      const mockEventos = [
        {
          id: 1,
          bar_id: 3,
          nome: 'Soft Open',
          data_evento: '2025-02-01',
          artista: '',
          genero: 'DJ',
          dia_semana: 'SÁBADO',
          semana: 5,
          observacoes: '',
          tipo_evento: 'Soft Open',
          status: 'confirmado',
          hora_inicio: null,
          hora_fim: null,
          capacidade_maxima: null
        },
        {
          id: 2,
          bar_id: 3,
          nome: 'Quarta de Bamba',
          data_evento: '2025-02-12',
          artista: 'Breno Alves',
          genero: 'Samba',
          dia_semana: 'QUARTA',
          semana: 7,
          observacoes: '',
          tipo_evento: 'Quarta de Bamba',
          status: 'confirmado',
          hora_inicio: null,
          hora_fim: null,
          capacidade_maxima: null
        },
        {
          id: 3,
          bar_id: 3,
          nome: 'Pagode Vira-Lata',
          data_evento: '2025-08-01',
          artista: 'Benzadeus',
          genero: 'Pagode',
          dia_semana: 'SEXTA',
          semana: 31,
          observacoes: '',
          tipo_evento: 'Pagode Vira-Lata',
          status: 'confirmado',
          hora_inicio: null,
          hora_fim: null,
          capacidade_maxima: null
        }
      ];
      
      return NextResponse.json(mockEventos);
    }
    
    return NextResponse.json([]);
  } catch (error) {
    console.error('Erro na query:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 