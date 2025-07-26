import { NextRequest, NextResponse } from 'next/server';

// Este seria o projeto do Supabase conectado via MCP
const SUPABASE_PROJECT_ID = "uqtgsvujwcbymjmvkjhy";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (query.includes('eventos')) {
      // Em produção real, isso faria uma chamada MCP
      // Por enquanto, vou simular o retorno baseado nos dados reais que inserimos
      
      // Simular alguns dados reais que inserimos
      const eventosReais = [
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
          id: 8,
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
          id: 11,
          bar_id: 3,
          nome: 'DJs - Hugo drop + convidados (DJ)',
          data_evento: '2025-02-15',
          artista: 'DJ Hugo Drop',
          genero: 'DJ',
          dia_semana: 'SÁBADO',
          semana: 7,
          observacoes: '',
          tipo_evento: 'DJs - Hugo drop + convidados (DJ)',
          status: 'confirmado',
          hora_inicio: null,
          hora_fim: null,
          capacidade_maxima: null
        },
        {
          id: 12,
          bar_id: 3,
          nome: 'Pagode do Ordi',
          data_evento: '2025-02-16',
          artista: '12 por 8',
          genero: 'Pagode',
          dia_semana: 'DOMINGO',
          semana: 7,
          observacoes: '',
          tipo_evento: 'Pagode do Ordi',
          status: 'confirmado',
          hora_inicio: null,
          hora_fim: null,
          capacidade_maxima: null
        },
        {
          id: 62,
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
        },
        {
          id: 65,
          bar_id: 3,
          nome: 'STZ',
          data_evento: '2025-08-03',
          artista: 'Legado do samba',
          genero: 'Samba',
          dia_semana: 'DOMINGO',
          semana: 31,
          observacoes: 'Label própria',
          tipo_evento: 'STZ',
          status: 'confirmado',
          hora_inicio: null,
          hora_fim: null,
          capacidade_maxima: null
        },
        {
          id: 70,
          bar_id: 3,
          nome: 'Quintal do Pagode',
          data_evento: '2025-08-07',
          artista: 'Stephanie',
          genero: 'Pagode',
          dia_semana: 'QUINTA',
          semana: 32,
          observacoes: '',
          tipo_evento: 'Quintal do Pagode',
          status: 'confirmado',
          hora_inicio: null,
          hora_fim: null,
          capacidade_maxima: null
        }
      ];
      
      return NextResponse.json(eventosReais);
    }
    
    return NextResponse.json([]);
  } catch (error) {
    console.error('Erro na query:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 