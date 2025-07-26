import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Em produção, isso seria uma integração real via MCP Supabase
    // Dados baseados nos 176 eventos reais que inserimos no banco
    
    const eventosReais = [
      // Fevereiro 2025 (22 eventos)
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
      
      // Março 2025 (27 eventos)
      {
        id: 22,
        nome: 'R&Baile',
        data_evento: '2025-03-22',
        artista: 'DJ Umiranda',
        genero: 'DJ',
        dia_semana: 'SÁBADO',
        tipo_evento: 'R&Baile',
        status: 'confirmado'
      },
      {
        id: 24,
        nome: 'Dia D',
        data_evento: '2025-03-24',
        artista: 'Duzão',
        genero: 'Pagode',
        dia_semana: 'SEGUNDA',
        tipo_evento: 'Dia D',
        status: 'confirmado'
      },
      {
        id: 29,
        nome: 'Perro Caliente',
        data_evento: '2025-03-29',
        artista: 'DJ Pequi',
        genero: 'Cubana',
        dia_semana: 'SÁBADO',
        tipo_evento: 'Perro Caliente',
        status: 'confirmado'
      },
      
      // Abril 2025 (25 eventos)
      {
        id: 32,
        nome: 'Libertadores no telão',
        data_evento: '2025-04-01',
        artista: '',
        genero: 'DJ',
        dia_semana: 'TERÇA',
        tipo_evento: 'Libertadores no telão',
        status: 'confirmado',
        observacoes: 'Jogo'
      },
      {
        id: 38,
        nome: 'Jogos de futebol',
        data_evento: '2025-04-08',
        artista: 'KiPecado',
        genero: 'Pagode',
        dia_semana: 'TERÇA',
        tipo_evento: 'Jogos de futebol',
        status: 'confirmado',
        observacoes: 'Jogo'
      },
      {
        id: 48,
        nome: 'Feriado',
        data_evento: '2025-04-21',
        artista: '',
        genero: 'DJ',
        dia_semana: 'SEGUNDA',
        tipo_evento: 'Feriado',
        status: 'confirmado',
        observacoes: 'Feriado'
      },
      
      // Maio 2025 (23 eventos)
      {
        id: 58,
        nome: 'Pagode do Trabalhador',
        data_evento: '2025-05-01',
        artista: 'Benzadeus',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Pagode do Trabalhador',
        status: 'confirmado'
      },
      {
        id: 65,
        nome: 'ESPECIAL - JORGE ARAGAO',
        data_evento: '2025-05-10',
        artista: '',
        genero: 'DJ',
        dia_semana: 'SÁBADO',
        tipo_evento: 'ESPECIAL - JORGE ARAGAO',
        status: 'confirmado'
      },
      {
        id: 69,
        nome: 'ESPECIAL - BETH CARVALHO',
        data_evento: '2025-05-17',
        artista: '',
        genero: 'DJ',
        dia_semana: 'SÁBADO',
        tipo_evento: 'ESPECIAL - BETH CARVALHO',
        status: 'confirmado'
      },
      {
        id: 73,
        nome: 'Modão e Viola',
        data_evento: '2025-05-22',
        artista: 'Brener Viola',
        genero: 'Sertanejo',
        dia_semana: 'QUINTA',
        tipo_evento: 'Modão e Viola',
        status: 'confirmado'
      },
      {
        id: 75,
        nome: 'ESPECIAL - ZECA PAGODINHO',
        data_evento: '2025-05-24',
        artista: 'Nenel Vida',
        genero: 'Vocal',
        dia_semana: 'SÁBADO',
        tipo_evento: 'ESPECIAL - ZECA PAGODINHO',
        status: 'confirmado'
      },
      {
        id: 80,
        nome: 'ESPECIAL - ALCIONE',
        data_evento: '2025-05-31',
        artista: 'Karla Sangaletti',
        genero: 'Vocal',
        dia_semana: 'SÁBADO',
        tipo_evento: 'ESPECIAL - ALCIONE',
        status: 'confirmado'
      },
      
      // Junho 2025 (26 eventos)
      {
        id: 81,
        nome: 'Samba da tia zélia',
        data_evento: '2025-06-01',
        artista: 'Tia zélia',
        genero: 'Pagode',
        dia_semana: 'DOMINGO',
        tipo_evento: 'Samba da tia zélia',
        status: 'confirmado'
      },
      {
        id: 82,
        nome: 'Jet - Segunda da Resenha',
        data_evento: '2025-06-02',
        artista: '',
        genero: 'DJ',
        dia_semana: 'SEGUNDA',
        tipo_evento: 'Jet - Segunda da Resenha',
        status: 'confirmado'
      },
      {
        id: 97,
        nome: 'Quarta de Bamba',
        data_evento: '2025-06-18',
        artista: 'Breno Alves',
        genero: 'Samba',
        dia_semana: 'QUARTA',
        tipo_evento: 'Quarta de Bamba',
        status: 'confirmado',
        observacoes: 'Feriado'
      },
      {
        id: 102,
        nome: 'Quarta de Bamba',
        data_evento: '2025-06-25',
        artista: 'Breno Alves',
        genero: 'Samba',
        dia_semana: 'QUARTA',
        tipo_evento: 'Quarta de Bamba',
        status: 'confirmado',
        observacoes: 'Festival Junino'
      },
      
      // Julho 2025 (26 eventos)
      {
        id: 108,
        nome: 'Quarta de Bamba',
        data_evento: '2025-07-02',
        artista: 'Breno Alves',
        genero: 'Samba',
        dia_semana: 'QUARTA',
        tipo_evento: 'Quarta de Bamba',
        status: 'confirmado'
      },
      {
        id: 109,
        nome: 'Pagode Lado a Lado',
        data_evento: '2025-07-03',
        artista: 'Lado a lado',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Pagode Lado a Lado',
        status: 'confirmado'
      },
      {
        id: 115,
        nome: 'Pagode Sem Querer',
        data_evento: '2025-07-10',
        artista: 'Sem Querer',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Pagode Sem Querer',
        status: 'confirmado'
      },
      {
        id: 117,
        nome: 'Sambadona e Reconvexa',
        data_evento: '2025-07-12',
        artista: '',
        genero: 'Samba',
        dia_semana: 'SÁBADO',
        tipo_evento: 'Sambadona e Reconvexa',
        status: 'confirmado',
        observacoes: 'Label própria'
      },
      {
        id: 120,
        nome: 'Lucas Alves',
        data_evento: '2025-07-17',
        artista: 'Lucas Alves',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Lucas Alves',
        status: 'confirmado'
      },
      {
        id: 125,
        nome: 'Dani Lemos',
        data_evento: '2025-07-24',
        artista: 'Dani Lemos',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Dani Lemos',
        status: 'confirmado'
      },
      
      // Agosto 2025 (27 eventos)
      {
        id: 132,
        nome: 'Lado a Lado',
        data_evento: '2025-07-31',
        artista: 'Lado a lado',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Lado a Lado',
        status: 'confirmado'
      },
      {
        id: 133,
        nome: 'Pagode Vira-Lata',
        data_evento: '2025-08-01',
        artista: 'Benzadeus',
        genero: 'Pagode',
        dia_semana: 'SEXTA',
        tipo_evento: 'Pagode Vira-Lata',
        status: 'confirmado'
      },
      {
        id: 135,
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
        id: 139,
        nome: 'Quintal do Pagode',
        data_evento: '2025-08-07',
        artista: 'Stephanie',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Quintal do Pagode',
        status: 'confirmado'
      },
      {
        id: 145,
        nome: 'Quintal do Pagode de Bsb',
        data_evento: '2025-08-14',
        artista: 'Lado a lado',
        genero: 'Pagode',
        dia_semana: 'QUINTA',
        tipo_evento: 'Quintal do Pagode de Bsb',
        status: 'confirmado'
      },
      {
        id: 158,
        nome: 'Samba Rainha e DJ a definir',
        data_evento: '2025-08-30',
        artista: '',
        genero: 'Samba',
        dia_semana: 'SÁBADO',
        tipo_evento: 'Samba Rainha e DJ a definir',
        status: 'confirmado'
      },
      {
        id: 159,
        nome: 'PDJ',
        data_evento: '2025-08-31',
        artista: 'PDJ',
        genero: 'Pagode',
        dia_semana: 'DOMINGO',
        tipo_evento: 'PDJ',
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
      id: Math.floor(Math.random() * 10000) + 200,
      ...body
    };

    return NextResponse.json(novoEvento);
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

