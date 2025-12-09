import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EvolucaoMensal {
  mes: string; // YYYY-MM
  mesLabel: string; // "Jan/25"
  totalClientes: number;
  novosClientes: number;
  clientesRetornantes: number;
  percentualNovos: number;
  percentualRetornantes: number;
  baseAtiva: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barIdParam = searchParams.get('bar_id');
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const barId = parseInt(barIdParam);
    const meses = parseInt(searchParams.get('meses') || '12'); // Últimos 12 meses por padrão

    // Calcular data inicial (X meses atrás)
    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(hoje.getMonth() - meses);
    const dataInicioStr = dataInicio.toISOString().split('T')[0];

    console.log(`📊 Buscando evolução de ${meses} meses desde ${dataInicioStr}`);

    // Buscar todos os clientes do período no ContaHub
    const { data: clientesData, error } = await supabase
      .from('contahub_periodo')
      .select('cli_nome, cli_email, cli_fone, dt_gerencial')
      .eq('bar_id', barId)
      .gte('dt_gerencial', dataInicioStr)
      .not('cli_nome', 'is', null)
      .not('cli_nome', 'eq', '')
      .order('dt_gerencial', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
    }

    console.log(`✅ ${clientesData?.length || 0} registros de clientes encontrados`);

    // Processar dados por mês
    const evolucaoMensal: EvolucaoMensal[] = [];
    const mesesProcessados = new Set<string>();
    const clientesVistosPorMes: Map<string, Set<string>> = new Map();
    const primeiraVisitaCliente: Map<string, string> = new Map();

    // Identificar primeira visita de cada cliente
    (clientesData || []).forEach((registro) => {
      const identificador = (registro.cli_email || registro.cli_fone || registro.cli_nome).toLowerCase();
      const dataVisita = registro.dt_gerencial;

      if (!primeiraVisitaCliente.has(identificador)) {
        primeiraVisitaCliente.set(identificador, dataVisita);
      } else {
        const dataAtual = primeiraVisitaCliente.get(identificador)!;
        if (dataVisita < dataAtual) {
          primeiraVisitaCliente.set(identificador, dataVisita);
        }
      }
    });

    // Processar cada mês
    for (let i = 0; i < meses; i++) {
      const mesData = new Date();
      mesData.setMonth(hoje.getMonth() - (meses - i - 1));
      const ano = mesData.getFullYear();
      const mesNum = mesData.getMonth() + 1;
      const mesStr = `${ano}-${mesNum.toString().padStart(2, '0')}`;

      // Calcular início e fim do mês
      const inicioMes = `${mesStr}-01`;
      const fimMes = new Date(ano, mesNum, 0).toISOString().split('T')[0];

      // Filtrar clientes do mês
      const clientesMes = (clientesData || []).filter(
        (r) => r.dt_gerencial >= inicioMes && r.dt_gerencial <= fimMes
      );

      // Identificar clientes únicos do mês
      const clientesUnicosMes = new Set<string>();
      let novosClientes = 0;
      let clientesRetornantes = 0;

      clientesMes.forEach((registro) => {
        const identificador = (registro.cli_email || registro.cli_fone || registro.cli_nome).toLowerCase();
        clientesUnicosMes.add(identificador);

        const primeiraVisita = primeiraVisitaCliente.get(identificador);
        if (primeiraVisita && primeiraVisita >= inicioMes && primeiraVisita <= fimMes) {
          novosClientes++;
        } else {
          clientesRetornantes++;
        }
      });

      const totalClientes = clientesUnicosMes.size;
      const percentualNovos = totalClientes > 0 ? (novosClientes / totalClientes) * 100 : 0;
      const percentualRetornantes = totalClientes > 0 ? (clientesRetornantes / totalClientes) * 100 : 0;

      // Calcular base ativa (clientes que visitaram nos últimos 90 dias a partir do fim do mês)
      const data90diasAtras = new Date(fimMes);
      data90diasAtras.setDate(data90diasAtras.getDate() - 90);
      const data90Str = data90diasAtras.toISOString().split('T')[0];

      const clientesAtivos90d = new Set<string>();
      (clientesData || [])
        .filter((r) => r.dt_gerencial >= data90Str && r.dt_gerencial <= fimMes)
        .forEach((registro) => {
          const identificador = (registro.cli_email || registro.cli_fone || registro.cli_nome).toLowerCase();
          clientesAtivos90d.add(identificador);
        });

      // Formatar label do mês
      const mesLabel = mesData.toLocaleDateString('pt-BR', {
        month: 'short',
        year: '2-digit',
      }).replace('.', '');

      evolucaoMensal.push({
        mes: mesStr,
        mesLabel,
        totalClientes,
        novosClientes,
        clientesRetornantes,
        percentualNovos: Math.round(percentualNovos * 100) / 100, // 2 casas decimais
        percentualRetornantes: Math.round(percentualRetornantes * 100) / 100, // 2 casas decimais
        baseAtiva: clientesAtivos90d.size,
      });

      mesesProcessados.add(mesStr);
    }

    console.log(`📈 Evolução calculada para ${evolucaoMensal.length} meses`);

    return NextResponse.json({
      success: true,
      data: evolucaoMensal,
      meta: {
        meses: meses,
        dataInicio: dataInicioStr,
        totalRegistros: clientesData?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ Erro na API de evolução de clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

