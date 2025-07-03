import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Testando API GetIN - Junho 2025');
    
    const startTime = Date.now();
    
    // Credenciais fixas
    const getinApiKey = 'gti_prod_afae08315f79e1e3129da32';
    const UNIT_ID = 'M1mAGM13'; // Ordinário Bar & Música
    
    // Focar apenas em junho 2025 para teste
    const startDate = '2025-06-01';
    const endDate = '2025-06-30';

    console.log(`📅 Testando período: ${startDate} a ${endDate}`);

    // URL correta da API GetIN
    const getinUrl = `https://api.getin.com.br/bookings?start_date=${startDate}&end_date=${endDate}&unit_id=${UNIT_ID}`;
    
    console.log('🌐 Fazendo requisição:', getinUrl);
    
    const response = await fetch(getinUrl, {
      headers: {
        'Authorization': `Bearer ${getinApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API GetIN:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `Erro na API GetIN: ${response.status}`,
        details: errorText,
        url: getinUrl
      }, { status: 500 });
    }

    const getinData = await response.json();
    const reservas = getinData.data || [];

    console.log(`✅ ${reservas.length} reservas encontradas na API GetIN`);

    if (!Array.isArray(reservas)) {
      console.error('❌ Formato inválido de dados da API');
      return NextResponse.json({
        success: false,
        error: 'Formato inválido de dados da API',
        received_data: getinData
      }, { status: 500 });
    }

    // Analisar por dia da semana
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const reservasPorDiaSemana: any = {};
    
    diasSemana.forEach(dia => {
      reservasPorDiaSemana[dia] = [];
    });

    reservas.forEach((reserva: any) => {
      const dataObj = new Date(reserva.date + 'T00:00:00');
      const diaSemana = diasSemana[dataObj.getDay()];
      
      reservasPorDiaSemana[diaSemana].push({
        data: reserva.date,
        nome: reserva.name,
        pessoas: reserva.people,
        status: reserva.status
      });
    });

    const executionTime = Date.now() - startTime;

    console.log(`✅ Teste concluído!`);
    console.log(`📊 Total de reservas: ${reservas.length}`);
    console.log(`🚫 Reservas em terças: ${reservasPorDiaSemana['Terça'].length}`);
    console.log(`⏱️ Tempo de execução: ${executionTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'API GetIN funcionando!',
      data: {
        periodo: `${startDate} a ${endDate}`,
        total_reservas: reservas.length,
        resumo_por_dia: {
          'Segunda': reservasPorDiaSemana['Segunda'].length,
          'Terça': reservasPorDiaSemana['Terça'].length,
          'Quarta': reservasPorDiaSemana['Quarta'].length,
          'Quinta': reservasPorDiaSemana['Quinta'].length,
          'Sexta': reservasPorDiaSemana['Sexta'].length,
          'Sábado': reservasPorDiaSemana['Sábado'].length,
          'Domingo': reservasPorDiaSemana['Domingo'].length
        },
        PROBLEMA_TERCAS: reservasPorDiaSemana['Terça'],
        execution_time_ms: executionTime
      }
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro no teste: ' + (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
} 