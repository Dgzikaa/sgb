import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

interface RegistroCliente {
  cpf: string;
  nome?: string;
  email?: string;
  data_nascimento?: string;
  telefone?: string;
  data_visita: string;
  bar_id: number;
  vd?: number;
  valor_gasto?: number;
  pessoas_na_mesa?: number;
  evento_id?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const dados: RegistroCliente = await request.json();
    
    if (!dados.cpf || !dados.data_visita || !dados.bar_id) {
      return NextResponse.json(
        { error: 'CPF, data_visita e bar_id são obrigatórios' },
        { status: 400 }
      );
    }

    // 1. Verificar se cliente já existe
    const { data: clienteExistente, error: errorBusca } = await supabase
      .from('clientes')
      .select('*')
      .eq('cpf', dados.cpf)
      .eq('bar_id', dados.bar_id)
      .single();

    let clienteId: number;

    if (clienteExistente) {
      // Cliente já existe - atualizar dados
      const novoTotal = clienteExistente.total_visitas + 1;
      const novoValorTotal = (parseFloat(clienteExistente.valor_total_gasto) || 0) + (dados.valor_gasto || 0);
      const novoValorMedio = novoValorTotal / novoTotal;

      const { data: clienteAtualizado, error: errorUpdate } = await supabase
        .from('clientes')
        .update({
          data_ultimo_visit: dados.data_visita,
          total_visitas: novoTotal,
          valor_total_gasto: novoValorTotal,
          valor_medio_ticket: novoValorMedio,
          tipo_cliente: novoTotal > 1 ? 'recorrente' : 'novo',
          // Atualizar dados pessoais se fornecidos
          ...(dados.nome && { nome: dados.nome }),
          ...(dados.email && { email: dados.email }),
          ...(dados.telefone && { telefone: dados.telefone }),
          ...(dados.data_nascimento && { data_nascimento: dados.data_nascimento }),
          updated_at: new Date().toISOString()
        })
        .eq('id', clienteExistente.id)
        .select()
        .single();

      if (errorUpdate) {
        console.error('Erro ao atualizar cliente:', errorUpdate);
        return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 });
      }

      clienteId = clienteExistente.id;
    } else {
      // Cliente novo - criar registro
      const { data: novoCliente, error: errorInsert } = await supabase
        .from('clientes')
        .insert({
          bar_id: dados.bar_id,
          cpf: dados.cpf,
          nome: dados.nome,
          email: dados.email,
          data_nascimento: dados.data_nascimento,
          telefone: dados.telefone,
          data_primeiro_visit: dados.data_visita,
          data_ultimo_visit: dados.data_visita,
          total_visitas: 1,
          valor_total_gasto: dados.valor_gasto || 0,
          valor_medio_ticket: dados.valor_gasto || 0,
          tipo_cliente: 'novo',
          origem_cadastro: 'sistema'
        })
        .select()
        .single();

      if (errorInsert) {
        console.error('Erro ao criar cliente:', errorInsert);
        return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
      }

      clienteId = novoCliente!.id;
    }

    // 2. Registrar a visita
    const { data: visita, error: errorVisita } = await supabase
      .from('cliente_visitas')
      .insert({
        cliente_id: clienteId,
        bar_id: dados.bar_id,
        data_visita: dados.data_visita,
        evento_id: dados.evento_id,
        vd: dados.vd,
        valor_gasto: dados.valor_gasto || 0,
        pessoas_na_mesa: dados.pessoas_na_mesa || 1,
        tipo_visita: dados.evento_id ? 'evento' : 'regular'
      })
      .select()
      .single();

    if (errorVisita) {
      console.error('Erro ao registrar visita:', errorVisita);
      return NextResponse.json({ error: 'Erro ao registrar visita' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      clienteId,
      visitaId: visita!.id,
      tipo: clienteExistente ? 'atualizado' : 'novo',
      message: `Cliente ${clienteExistente ? 'atualizado' : 'registrado'} com sucesso`
    });

  } catch (error) {
    console.error('Erro no registro de cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

