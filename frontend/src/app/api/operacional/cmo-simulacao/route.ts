import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Interface para funcionário
interface Funcionario {
  nome: string;
  tipo_contratacao: 'CLT' | 'PJ';
  vt: number;
  area: string;
  salario: number;
  dias_trabalhados: number;
  adicional_bonus: number;
  aviso_previo: number;
}

// Interface para simulação
interface SimulacaoCMO {
  id?: number;
  bar_id: number;
  mes: number;
  ano: number;
  funcionarios: Funcionario[];
  total_folha?: number;
  total_encargos?: number;
  total_geral?: number;
  observacoes?: string;
  criado_por?: string;
}

// Calcular encargos de um funcionário CLT
function calcularEncargosCLT(salario: number, area: string, diasTrabalhados: number): number {
  const salarioProporcional = (salario / 30) * diasTrabalhados;
  
  // Encargos CLT (aproximados)
  const inss = salarioProporcional * 0.20; // INSS Patronal
  const fgts = salarioProporcional * 0.08; // FGTS
  const decimoTerceiro = salarioProporcional / 12; // 13º proporcional
  const ferias = salarioProporcional / 12; // Férias proporcionais
  
  // Adicional noturno para áreas específicas (20% sobre salário base)
  let adicionalNoturno = 0;
  if (area.toLowerCase().includes('salão') || area.toLowerCase().includes('bar') || area.toLowerCase().includes('cozinha')) {
    adicionalNoturno = salarioProporcional * 0.20;
  }
  
  return inss + fgts + decimoTerceiro + ferias + adicionalNoturno;
}

// Calcular totais de uma simulação
function calcularTotais(funcionarios: Funcionario[]) {
  let totalFolha = 0;
  let totalEncargos = 0;
  
  funcionarios.forEach(func => {
    const salarioProporcional = (func.salario / 30) * func.dias_trabalhados;
    const custoBase = salarioProporcional + func.vt + func.adicional_bonus + func.aviso_previo;
    
    totalFolha += custoBase;
    
    if (func.tipo_contratacao === 'CLT') {
      const encargos = calcularEncargosCLT(func.salario, func.area, func.dias_trabalhados);
      totalEncargos += encargos;
    }
  });
  
  return {
    total_folha: totalFolha,
    total_encargos: totalEncargos,
    total_geral: totalFolha + totalEncargos
  };
}

// GET - Buscar simulações
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');
    const mes = searchParams.get('mes');
    const ano = searchParams.get('ano');
    const id = searchParams.get('id');

    // Buscar simulação específica por ID
    if (id) {
      const { data, error } = await supabase
        .from('simulacoes_cmo')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data
      });
    }

    // Buscar simulações por bar_id
    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('simulacoes_cmo')
      .select('*')
      .eq('bar_id', bar_id)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false });

    if (mes) query = query.eq('mes', mes);
    if (ano) query = query.eq('ano', ano);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Erro ao buscar simulações CMO:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar simulações' },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar simulação
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bar_id, mes, ano, funcionarios, observacoes, criado_por } = body as SimulacaoCMO;

    if (!bar_id || !mes || !ano || !funcionarios) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: bar_id, mes, ano, funcionarios' },
        { status: 400 }
      );
    }

    // Calcular totais
    const totais = calcularTotais(funcionarios);

    const registro = {
      bar_id,
      mes,
      ano,
      funcionarios,
      total_folha: totais.total_folha,
      total_encargos: totais.total_encargos,
      total_geral: totais.total_geral,
      observacoes,
      criado_por,
      atualizado_em: new Date().toISOString()
    };

    // Verificar se já existe simulação para este bar/mes/ano
    const { data: existente } = await supabase
      .from('simulacoes_cmo')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('mes', mes)
      .eq('ano', ano)
      .single();

    let result;

    if (existente) {
      // Atualizar existente
      result = await supabase
        .from('simulacoes_cmo')
        .update(registro)
        .eq('id', existente.id)
        .select()
        .single();
    } else {
      // Criar novo
      result = await supabase
        .from('simulacoes_cmo')
        .insert(registro)
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json({
      success: true,
      data: result.data,
      message: existente ? 'Simulação atualizada com sucesso' : 'Simulação criada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar simulação CMO:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar simulação' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir simulação
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('simulacoes_cmo')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Simulação excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir simulação CMO:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir simulação' },
      { status: 500 }
    );
  }
}

