import { NextRequest, NextResponse } from 'next/server';

// Dados mockados baseados no print para teste do layout
const dadosMockados = [
  {
    data: '01/07',
    dia: 'TERÇA',
    obsData: '',
    label: '',
    realizado: 0,
    m1: 0,
    clientes: {
      planejado: 0,
      real: 0,
      resTotal: 0,
      resPresente: 0,
      lotMax: 0
    },
    ticketEntrada: {
      planejado: 0,
      real: 0
    },
    ticketBar: {
      planejado: 0,
      real: 0
    },
    ticketMedio: 0,
    rentabilidadeAtracoes: {
      custoArtistico: 0,
      custoProducao: 0,
      percArtFat: '0%'
    },
    cesta: {
      percBebidas: '0%',
      percDrinks: '0%',
      percCozinha: '0%'
    },
    tempo: {
      cozinha: 0,
      bar: 0
    },
    faturamentoAte19h: '0%'
  },
  {
    data: '02/07',
    dia: 'QUARTA',
    obsData: 'Quarta de Bamba',
    label: '',
    realizado: 47388.74,
    m1: 33200.17,
    clientes: {
      planejado: 346,
      real: 460,
      resTotal: 150,
      resPresente: 136,
      lotMax: 266
    },
    ticketEntrada: {
      planejado: 21.00,
      real: 21.14
    },
    ticketBar: {
      planejado: 75.00,
      real: 81.88
    },
    ticketMedio: 103.02,
    rentabilidadeAtracoes: {
      custoArtistico: 7108.31,
      custoProducao: 436.97,
      percArtFat: '16%'
    },
    cesta: {
      percBebidas: '57%',
      percDrinks: '24%',
      percCozinha: '19%'
    },
    tempo: {
      cozinha: 10.1,
      bar: 2.4
    },
    faturamentoAte19h: '7%'
  },
  {
    data: '03/07',
    dia: 'QUINTA',
    obsData: 'Pagode Lado a Lado',
    label: '',
    realizado: 20842.40,
    m1: 18971.53,
    clientes: {
      planejado: 198,
      real: 229,
      resTotal: 55,
      resPresente: 55,
      lotMax: 152
    },
    ticketEntrada: {
      planejado: 21.00,
      real: 21.62
    },
    ticketBar: {
      planejado: 75.00,
      real: 59.40
    },
    ticketMedio: 91.01,
    rentabilidadeAtracoes: {
      custoArtistico: 2501.09,
      custoProducao: 584.38,
      percArtFat: '14%'
    },
    cesta: {
      percBebidas: '54%',
      percDrinks: '20%',
      percCozinha: '26%'
    },
    tempo: {
      cozinha: 9.0,
      bar: 2.0
    },
    faturamentoAte19h: '14%'
  },
  {
    data: '04/07',
    dia: 'SEXTA',
    obsData: 'Pagode Vira-Lata: Benzadeus',
    label: '',
    realizado: 38382.58,
    m1: 58811.74,
    clientes: {
      planejado: 568,
      real: 806,
      resTotal: 365,
      resPresente: 348,
      lotMax: 437
    },
    ticketEntrada: {
      planejado: 21.00,
      real: 21.12
    },
    ticketBar: {
      planejado: 82.50,
      real: 39.14
    },
    ticketMedio: 110.26,
    rentabilidadeAtracoes: {
      custoArtistico: 6437.50,
      custoProducao: 831.99,
      percArtFat: '20%'
    },
    cesta: {
      percBebidas: '53%',
      percDrinks: '31%',
      percCozinha: '16%'
    },
    tempo: {
      cozinha: 9.0,
      bar: 2.8
    },
    faturamentoAte19h: '14%'
  },
  {
    data: '05/07',
    dia: 'SÁBADO',
    obsData: 'Samba Rainha',
    label: '',
    realizado: 61580.27,
    m1: 47428.82,
    clientes: {
      planejado: 458,
      real: 624,
      resTotal: 357,
      resPresente: 247,
      lotMax: 352
    },
    ticketEntrada: {
      planejado: 21.00,
      real: 22.52
    },
    ticketBar: {
      planejado: 82.50,
      real: 76.33
    },
    ticketMedio: 98.84,
    rentabilidadeAtracoes: {
      custoArtistico: 8800.00,
      custoProducao: 1946.00,
      percArtFat: '11%'
    },
    cesta: {
      percBebidas: '50%',
      percDrinks: '30%',
      percCozinha: '20%'
    },
    tempo: {
      cozinha: 9.5,
      bar: 3.2
    },
    faturamentoAte19h: '23%'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');

    // Simular filtro por mês/ano se fornecido
    let dadosFiltrados = dadosMockados;
    
    if (mes && ano) {
      // Filtrar dados por mês/ano (mockado para julho/2025 por enquanto)
      dadosFiltrados = dadosMockados;
    }

    // Calcular totais
    const totais = {
      realizado: dadosFiltrados.reduce((sum, item) => sum + item.realizado, 0),
      m1: dadosFiltrados.reduce((sum, item) => sum + item.m1, 0),
      clientes: {
        planejado: dadosFiltrados.reduce((sum, item) => sum + item.clientes.planejado, 0),
        real: dadosFiltrados.reduce((sum, item) => sum + item.clientes.real, 0),
        resTotal: dadosFiltrados.reduce((sum, item) => sum + item.clientes.resTotal, 0),
        resPresente: dadosFiltrados.reduce((sum, item) => sum + item.clientes.resPresente, 0),
        lotMax: dadosFiltrados.reduce((sum, item) => sum + item.clientes.lotMax, 0)
      },
      ticketMedio: dadosFiltrados.reduce((sum, item) => sum + item.ticketMedio, 0) / dadosFiltrados.length,
      rentabilidadeAtracoes: {
        custoArtistico: dadosFiltrados.reduce((sum, item) => sum + item.rentabilidadeAtracoes.custoArtistico, 0),
        custoProducao: dadosFiltrados.reduce((sum, item) => sum + item.rentabilidadeAtracoes.custoProducao, 0)
      }
    };

    return NextResponse.json({
      success: true,
      data: dadosFiltrados,
      totais,
      periodo: mes && ano ? `${mes}/${ano}` : 'Julho 2025'
    });

  } catch (error) {
    console.error('Erro ao buscar dados do planejamento comercial:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: 'Não foi possível carregar os dados do planejamento comercial'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, observacoes } = body;

    // TODO: Implementar salvamento real no Supabase
    console.log('Salvando dados do planejamento comercial:', { data, observacoes });

    return NextResponse.json({
      success: true,
      message: 'Dados salvos com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar dados do planejamento comercial:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        message: 'Não foi possível salvar os dados'
      },
      { status: 500 }
    );
  }
} 