import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapearCategoria } from '@/lib/contaazul-categoria-mapper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Adiciona index signature para evitar erro TS
const MAPEAMENTO_CATEGORIAS: Record<string, string> = {
  'Stone Cr·©dito': 'Stone Cr·©dito',
  'Stone D·©bito': 'Stone D·©bito',
  'Stone Pix': 'Stone Pix',
  'Pix Direto na Conta': 'Pix Direto na Conta',
  'Dinheiro': 'Dinheiro',
  'Receita de Eventos': 'Receita de Eventos',
  'Outras Receitas': 'Outras Receitas',
  'Ifood': 'Outras Receitas',
  'Receitas de Servi·ßos': 'Outras Receitas',
  'Fretes recebidos': 'Outras Receitas',
  'PERSE': 'Outras Receitas',
  'Descontos incondicionais obtidos': 'Outras Receitas',
  'Descontos financeiros obtidos': 'Outras Receitas',
  'Empr·©stimos de S·≥cios': 'Outras Receitas',
  'Outros S·≥cios': 'Outras Receitas',
  'Dividendos': 'Outras Receitas',
  'Outros Investimentos': 'Outras Receitas',
  'Consultoria': 'Outras Receitas',
  'Produ·ß·£o Eventos': 'Produ·ß·£o Eventos',
  'Marketing': 'Marketing',
  'Atra·ß·µes Programa·ß·£o': 'Atra·ß·µes Programa·ß·£o',
  'IMPOSTO': 'IMPOSTO',
  'COMISS·ÉO 10%': 'COMISS·ÉO 10%',
  'TAXA MAQUININHA': 'TAXA MAQUININHA',
  'Custo Drinks': 'Custo Drinks',
  'Custo Bebidas': 'Custo Bebidas',
  'Custo Comida': 'Custo Comida',
  'Custo Outros': 'Custo Outros',
  'SALARIO FUNCIONARIOS': 'SALARIO FUNCIONARIOS',
  'VALE TRANSPORTE': 'VALE TRANSPORTE',
  'ALIMENTA·á·ÉO': 'ALIMENTA·á·ÉO',
  'ADICIONAIS': 'ADICIONAIS',
  'FREELA ATENDIMENTO': 'FREELA ATENDIMENTO',
  'FREELA BAR': 'FREELA BAR',
  'FREELA COZINHA': 'FREELA COZINHA',
  'FREELA LIMPEZA': 'FREELA LIMPEZA',
  'FREELA SEGURAN·áA': 'FREELA SEGURAN·áA',
  'PRO LABORE': 'PRO LABORE',
  'PROVIS·ÉO TRABALHISTA': 'PROVIS·ÉO TRABALHISTA',
  'Administrativo Ordin·°rio': 'Administrativo Ordin·°rio',
  'Escrit·≥rio Central': 'Escrit·≥rio Central',
  'Recursos Humanos': 'Recursos Humanos',
  'Materiais Opera·ß·£o': 'Materiais Opera·ß·£o',
  'Materiais de Limpeza e Descart·°veis': 'Materiais de Limpeza e Descart·°veis',
  'Utens·≠lios': 'Utens·≠lios',
  'Estorno': 'Estorno',
  'Outros Opera·ß·£o': 'Outros Opera·ß·£o',
  'ALUGUEL/CONDOM·çNIO/IPTU': 'ALUGUEL/CONDOM·çNIO/IPTU',
  '·ÅGUA': '·ÅGUA',
  'MANUTEN·á·ÉO': 'MANUTEN·á·ÉO',
  'INTERNET': 'INTERNET',
  'G·ÅS': 'G·ÅS',
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
    // Agrupar por m·™s e categoria
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
          categoriaMapeada = evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros Opera·ß·£o';
        }
      } else {
        const mapeado = mapearCategoria(evento.descricao, evento.tipo === 'receita' ? 'RECEITA' : 'DESPESA', evento.valor);
        categoriaMapeada = MAPEAMENTO_CATEGORIAS[mapeado.categoria_sugerida] || (evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros Opera·ß·£o');
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
    // Converter para array e ordenar por ano/m·™s
    const resultado = Object.values(meses).sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });
    return NextResponse.json({ success: true, meses: resultado }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 });
  }
} 
