import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapearCategoria } from '@/lib/contaazul-categoria-mapper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Adiciona index signature para evitar erro TS
const MAPEAMENTO_CATEGORIAS: Record<string, string> = {
  'Stone Crá©dito': 'Stone Crá©dito',
  'Stone Dá©bito': 'Stone Dá©bito',
  'Stone Pix': 'Stone Pix',
  'Pix Direto na Conta': 'Pix Direto na Conta',
  'Dinheiro': 'Dinheiro',
  'Receita de Eventos': 'Receita de Eventos',
  'Outras Receitas': 'Outras Receitas',
  'Ifood': 'Outras Receitas',
  'Receitas de Serviá§os': 'Outras Receitas',
  'Fretes recebidos': 'Outras Receitas',
  'PERSE': 'Outras Receitas',
  'Descontos incondicionais obtidos': 'Outras Receitas',
  'Descontos financeiros obtidos': 'Outras Receitas',
  'Emprá©stimos de Sá³cios': 'Outras Receitas',
  'Outros Sá³cios': 'Outras Receitas',
  'Dividendos': 'Outras Receitas',
  'Outros Investimentos': 'Outras Receitas',
  'Consultoria': 'Outras Receitas',
  'Produá§á£o Eventos': 'Produá§á£o Eventos',
  'Marketing': 'Marketing',
  'Atraá§áµes Programaá§á£o': 'Atraá§áµes Programaá§á£o',
  'IMPOSTO': 'IMPOSTO',
  'COMISSáƒO 10%': 'COMISSáƒO 10%',
  'TAXA MAQUININHA': 'TAXA MAQUININHA',
  'Custo Drinks': 'Custo Drinks',
  'Custo Bebidas': 'Custo Bebidas',
  'Custo Comida': 'Custo Comida',
  'Custo Outros': 'Custo Outros',
  'SALARIO FUNCIONARIOS': 'SALARIO FUNCIONARIOS',
  'VALE TRANSPORTE': 'VALE TRANSPORTE',
  'ALIMENTAá‡áƒO': 'ALIMENTAá‡áƒO',
  'ADICIONAIS': 'ADICIONAIS',
  'FREELA ATENDIMENTO': 'FREELA ATENDIMENTO',
  'FREELA BAR': 'FREELA BAR',
  'FREELA COZINHA': 'FREELA COZINHA',
  'FREELA LIMPEZA': 'FREELA LIMPEZA',
  'FREELA SEGURANá‡A': 'FREELA SEGURANá‡A',
  'PRO LABORE': 'PRO LABORE',
  'PROVISáƒO TRABALHISTA': 'PROVISáƒO TRABALHISTA',
  'Administrativo Ordiná¡rio': 'Administrativo Ordiná¡rio',
  'Escritá³rio Central': 'Escritá³rio Central',
  'Recursos Humanos': 'Recursos Humanos',
  'Materiais Operaá§á£o': 'Materiais Operaá§á£o',
  'Materiais de Limpeza e Descartá¡veis': 'Materiais de Limpeza e Descartá¡veis',
  'Utensá­lios': 'Utensá­lios',
  'Estorno': 'Estorno',
  'Outros Operaá§á£o': 'Outros Operaá§á£o',
  'ALUGUEL/CONDOMáNIO/IPTU': 'ALUGUEL/CONDOMáNIO/IPTU',
  'áGUA': 'áGUA',
  'MANUTENá‡áƒO': 'MANUTENá‡áƒO',
  'INTERNET': 'INTERNET',
  'GáS': 'GáS',
  'LUZ': 'LUZ',
  'Contratos': 'Contratos',
};

function getMonthYear(dateString: string) {
  const date = new Date(dateString);
  const mes = date.getMonth() + 1;
  const ano = date.getFullYear();
  return { mes, ano };
}

export async function GET(req: NextRequest) {
  try {
    const bar_id = 3;
    // Buscar todos os eventos financeiros do bar
    const { data: eventos, error } = await supabase
      .from('contaazul_eventos_financeiros')
      .select('*')
      .eq('bar_id', bar_id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    // Buscar categorias
    const { data: categorias, error: catError } = await supabase
      .from('contaazul_categorias')
      .select('id, nome')
      .eq('bar_id', bar_id);
    if (catError) {
      return NextResponse.json({ success: false, error: catError.message }, { status: 500 });
    }
    const categoriasDict: Record<string, string> = {};
    for (const cat of categorias || []) {
      categoriasDict[cat.id] = cat.nome;
    }
    // Agrupar por máªs e categoria
    const meses: Record<string, any> = {};
    for (const evento of eventos || []) {
      if (!evento.data_competencia) continue;
      const { mes, ano } = getMonthYear(evento.data_competencia);
      const key = `${ano}-${mes.toString().padStart(2, '0')}`;
      if (!meses[key]) {
        meses[key] = {
          mes,
          ano,
          total_receitas: 0,
          total_despesas: 0,
          resultado: 0,
          categorias: {}
        };
      }
      // Mapear categoria
      let nomeCategoria = evento.categoria_id ? categoriasDict[evento.categoria_id] : null;
      let categoriaMapeada = null;
      if (nomeCategoria) {
        categoriaMapeada = MAPEAMENTO_CATEGORIAS[nomeCategoria];
        if (!categoriaMapeada) {
          categoriaMapeada = evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros Operaá§á£o';
        }
      } else {
        const mapeado = mapearCategoria(evento.descricao, evento.tipo === 'receita' ? 'RECEITA' : 'DESPESA', evento.valor);
        categoriaMapeada = MAPEAMENTO_CATEGORIAS[mapeado.categoria_sugerida] || (evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros Operaá§á£o');
      }
      if (!meses[key].categorias[categoriaMapeada]) {
        meses[key].categorias[categoriaMapeada] = 0;
      }
      meses[key].categorias[categoriaMapeada] += Number(evento.valor) || 0;
      if ((evento.tipo || '').toLowerCase().includes('receita')) {
        meses[key].total_receitas += Number(evento.valor) || 0;
      } else {
        meses[key].total_despesas += Number(evento.valor) || 0;
      }
      meses[key].resultado = meses[key].total_receitas - meses[key].total_despesas;
    }
    // Converter para array e ordenar por ano/máªs
    const resultado = Object.values(meses).sort((a: any, b: any) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });
    return NextResponse.json({ success: true, meses: resultado }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 });
  }
} 
