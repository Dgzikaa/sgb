import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Em produção, isso seria uma integração real via MCP Supabase
    // Por enquanto, vou retornar dados que representam o que temos na base real
    
    const eventosReais = [
      // Fevereiro 2025
      {
        id: 1,
        nome: 'Soft Open',
        data_evento: '2025-02-01',
        artista: '',
        genero: 'DJ',
        dia_semana: 'SÁBADO',
        tipo_evento: 'Soft Open',
        status: 'confirmado'
      },
      {
        id: 2,
        nome: 'Soft Open',
        data_evento: '2025-02-04',
        artista: '',
        genero: 'DJ',
        dia_semana: 'TERÇA',
        tipo_evento: 'Soft Open',
        status: 'confirmado'
      },
      {
        id: 3,
        nome: 'Soft Open',
        data_evento: '2025-02-05',
        artista: 'Breno Alves',
        genero: 'Samba',
        dia_semana: 'QUARTA',
        tipo_evento: 'Soft Open',
        status: 'confirmado'
      },
      {
        id: 4,
        nome: 'Soft Open',
        data_evento: '2025-02-06',
        artista: 'DJ Umiranda',
        genero: 'DJ',
        dia_semana: 'QUINTA',
        tipo_evento: 'Soft Open',
        status: 'confirmado'
      },
      {
        id: 5,
        nome: 'Soft Open',
        data_evento: '2025-02-07',
        artista: '',
        genero: 'Samba',
        dia_semana: 'SEXTA',
        tipo_evento: 'Soft Open',
        status: 'confirmado'
      },
      {
        id: 6,
        nome: 'Soft Open',
        data_evento: '2025-02-08',
        artista: '',
        genero: 'DJ',
        dia_semana: 'SÁBADO',
        tipo_evento: 'Soft Open',
        status: 'confirmado'
      },
      {
        id: 7,
        nome: 'Soft Open',
        data_evento: '2025-02-11',
        artista: '',
        genero: 'DJ',
        dia_semana: 'TERÇA',
        tipo_evento: 'Soft Open',
        status: 'confirmado'
      },
      {
        id: 8,
        nome: 'Quarta de Bamba',
        data_evento: '2025-02-12',
        artista: 'Breno Alves',
        genero: 'Samba',
        dia_semana: 'QUARTA',
        tipo_evento: 'Quarta de Bamba',
        status: 'confirmado'
      },
      {
        id: 9,
        nome: 'Black music',
        data_evento: '2025-02-13',
        artista: '',
        genero: 'DJ',
        dia_semana: 'QUINTA',
        tipo_evento: 'Black music',
        status: 'confirmado'
      },
      {
        id: 10,
        nome: 'Samba das Dez',
        data_evento: '2025-02-14',
        artista: '',
        genero: 'Samba',
        dia_semana: 'SEXTA',
        tipo_evento: 'Samba das Dez',
        status: 'confirmado'
      },
      {
        id: 11,
        nome: 'DJs - Hugo drop + convidados (DJ)',
        data_evento: '2025-02-15',
        artista: 'DJ Hugo Drop',
        genero: 'DJ',
        dia_semana: 'SÁBADO',
        tipo_evento: 'DJs - Hugo drop + convidados (DJ)',
        status: 'confirmado'
      },
      {
        id: 12,
        nome: 'Pagode do Ordi',
        data_evento: '2025-02-16',
        artista: '12 por 8',
        genero: 'Pagode',
        dia_semana: 'DOMINGO',
        tipo_evento: 'Pagode do Ordi',
        status: 'confirmado'
      },
      {
        id: 13,
        nome: 'Caramelo Jazz Night',
        data_evento: '2025-02-18',
        artista: '',
        genero: 'Jazz',
        dia_semana: 'TERÇA',
        tipo_evento: 'Caramelo Jazz Night',
        status: 'confirmado'
      },
      {
        id: 14,
        nome: 'Quarta de Bamba',
        data_evento: '2025-02-19',
        artista: 'Breno Alves',
        genero: 'Samba',
        dia_semana: 'QUARTA',
        tipo_evento: 'Quarta de Bamba',
        status: 'confirmado'
      },
      {
        id: 15,
        nome: 'Discolate',
        data_evento: '2025-02-20',
        artista: '',
        genero: 'DJ',
        dia_semana: 'QUINTA',
        tipo_evento: 'Discolate',
        status: 'confirmado'
      },
      // Julho 2025 (mais próximo da data atual)
      {
        id: 41,
        nome: 'Jet - Segunda da Resenha',
        data_evento: '2025-07-07',
        artista: '',
        genero: 'Samba',
        dia_semana: 'SEGUNDA',
        tipo_evento: 'Jet - Segunda da Resenha',
        status: 'confirmado'
      },
      {
        id: 42,
        nome: 'Quarta de Bamba',
        data_evento: '2025-07-09',
        artista: 'Breno Alves',
        genero: 'Pagode',
        dia_semana: 'QUARTA',
        tipo_evento: 'Quarta de Bamba',
        status: 'confirmado'
      },
      {
        id: 43,
        nome: 'Pagode Sem Querer',
        data_evento: '2025-07-10',
        artista: 'Sem Querer',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Pagode Sem Querer',
        status: 'confirmado'
      },
      {
        id: 44,
        nome: 'Pagode Vira-Lata',
        data_evento: '2025-07-11',
        artista: 'Benzadeus',
        genero: 'Pagode',
        dia_semana: 'SEXTA',
        tipo_evento: 'Pagode Vira-Lata',
        status: 'confirmado'
      },
      {
        id: 45,
        nome: 'Sambadona e Reconvexa',
        data_evento: '2025-07-12',
        artista: '',
        genero: 'Samba',
        dia_semana: 'SÁBADO',
        tipo_evento: 'Sambadona e Reconvexa',
        status: 'confirmado',
        observacoes: 'Label própria'
      },
      // Agosto 2025
      {
        id: 62,
        nome: 'Pagode Vira-Lata',
        data_evento: '2025-08-01',
        artista: 'Benzadeus',
        genero: 'Pagode',
        dia_semana: 'SEXTA',
        tipo_evento: 'Pagode Vira-Lata',
        status: 'confirmado'
      },
      {
        id: 63,
        nome: 'Samba Rainha',
        data_evento: '2025-08-02',
        artista: '',
        genero: 'Samba',
        dia_semana: 'SÁBADO',
        tipo_evento: 'Samba Rainha',
        status: 'confirmado'
      },
      {
        id: 64,
        nome: 'STZ',
        data_evento: '2025-08-03',
        artista: 'Legado do samba',
        genero: 'Samba',
        dia_semana: 'DOMINGO',
        tipo_evento: 'STZ',
        status: 'confirmado',
        observacoes: 'Label própria'
      },
      {
        id: 65,
        nome: 'Jet - Segunda da Resenha',
        data_evento: '2025-08-04',
        artista: '',
        genero: 'Samba',
        dia_semana: 'SEGUNDA',
        tipo_evento: 'Jet - Segunda da Resenha',
        status: 'confirmado'
      },
      {
        id: 66,
        nome: 'Quarta de Bamba',
        data_evento: '2025-08-06',
        artista: 'Breno Alves',
        genero: 'Samba',
        dia_semana: 'QUARTA',
        tipo_evento: 'Quarta de Bamba',
        status: 'confirmado'
      },
      {
        id: 67,
        nome: 'Quintal do Pagode',
        data_evento: '2025-08-07',
        artista: 'Stephanie',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Quintal do Pagode',
        status: 'confirmado'
      },
      {
        id: 68,
        nome: 'Pagode Vira-Lata',
        data_evento: '2025-08-08',
        artista: 'Benzadeus',
        genero: 'Pagode',
        dia_semana: 'SEXTA',
        tipo_evento: 'Pagode Vira-Lata',
        status: 'confirmado'
      },
      {
        id: 69,
        nome: 'Sambadona',
        data_evento: '2025-08-09',
        artista: '',
        genero: 'Samba',
        dia_semana: 'SÁBADO',
        tipo_evento: 'Sambadona',
        status: 'confirmado'
      },
      {
        id: 70,
        nome: 'Uma Mesa e um Pagode',
        data_evento: '2025-08-10',
        artista: '12 por 8',
        genero: 'Pagode',
        dia_semana: 'DOMINGO',
        tipo_evento: 'Uma Mesa e um Pagode',
        status: 'confirmado'
      }
    ];

    return NextResponse.json(eventosReais);
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
    
    // Em produção, isso seria uma inserção real via MCP
    // Por enquanto, simular sucesso
    const novoEvento = {
      id: Math.floor(Math.random() * 10000) + 100,
      ...body
    };

    return NextResponse.json(novoEvento);
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
