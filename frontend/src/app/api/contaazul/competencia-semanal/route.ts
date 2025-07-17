import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mapearCategoria } from '@/lib/contaazul-categoria-mapper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Adiciona index signature para evitar erro TS
const MAPEAMENTO_CATEGORIAS: Record<string, string> = {
  'Stone CrÃ¡Â©dito': 'Stone CrÃ¡Â©dito',
  'Stone DÃ¡Â©bito': 'Stone DÃ¡Â©bito',
  'Stone Pix': 'Stone Pix',
  'Pix Direto na Conta': 'Pix Direto na Conta',
  'Dinheiro': 'Dinheiro',
  'Receita de Eventos': 'Receita de Eventos',
  'Outras Receitas': 'Outras Receitas',
  'Ifood': 'Outras Receitas',
  'Receitas de ServiÃ¡Â§os': 'Outras Receitas',
  'Fretes recebidos': 'Outras Receitas',
  'PERSE': 'Outras Receitas',
  'Descontos incondicionais obtidos': 'Outras Receitas',
  'Descontos financeiros obtidos': 'Outras Receitas',
  'EmprÃ¡Â©stimos de SÃ¡Â³cios': 'Outras Receitas',
  'Outros SÃ¡Â³cios': 'Outras Receitas',
  'Dividendos': 'Outras Receitas',
  'Outros Investimentos': 'Outras Receitas',
  'Consultoria': 'Outras Receitas',
  'ProduÃ¡Â§Ã¡Â£o Eventos': 'ProduÃ¡Â§Ã¡Â£o Eventos',
  'Marketing': 'Marketing',
  'AtraÃ¡Â§Ã¡Âµes ProgramaÃ¡Â§Ã¡Â£o': 'AtraÃ¡Â§Ã¡Âµes ProgramaÃ¡Â§Ã¡Â£o',
  'IMPOSTO': 'IMPOSTO',
  'COMISSÃ¡Æ’O 10%': 'COMISSÃ¡Æ’O 10%',
  'TAXA MAQUININHA': 'TAXA MAQUININHA',
  'Custo Drinks': 'Custo Drinks',
  'Custo Bebidas': 'Custo Bebidas',
  'Custo Comida': 'Custo Comida',
  'Custo Outros': 'Custo Outros',
  'SALARIO FUNCIONARIOS': 'SALARIO FUNCIONARIOS',
  'VALE TRANSPORTE': 'VALE TRANSPORTE',
  'ALIMENTAÃ¡â€¡Ã¡Æ’O': 'ALIMENTAÃ¡â€¡Ã¡Æ’O',
  'ADICIONAIS': 'ADICIONAIS',
  'FREELA ATENDIMENTO': 'FREELA ATENDIMENTO',
  'FREELA BAR': 'FREELA BAR',
  'FREELA COZINHA': 'FREELA COZINHA',
  'FREELA LIMPEZA': 'FREELA LIMPEZA',
  'FREELA SEGURANÃ¡â€¡A': 'FREELA SEGURANÃ¡â€¡A',
  'PRO LABORE': 'PRO LABORE',
  'PROVISÃ¡Æ’O TRABALHISTA': 'PROVISÃ¡Æ’O TRABALHISTA',
  'Administrativo OrdinÃ¡Â¡rio': 'Administrativo OrdinÃ¡Â¡rio',
  'EscritÃ¡Â³rio Central': 'EscritÃ¡Â³rio Central',
  'Recursos Humanos': 'Recursos Humanos',
  'Materiais OperaÃ¡Â§Ã¡Â£o': 'Materiais OperaÃ¡Â§Ã¡Â£o',
  'Materiais de Limpeza e DescartÃ¡Â¡veis': 'Materiais de Limpeza e DescartÃ¡Â¡veis',
  'UtensÃ¡Â­lios': 'UtensÃ¡Â­lios',
  'Estorno': 'Estorno',
  'Outros OperaÃ¡Â§Ã¡Â£o': 'Outros OperaÃ¡Â§Ã¡Â£o',
  'ALUGUEL/CONDOMÃ¡ÂNIO/IPTU': 'ALUGUEL/CONDOMÃ¡ÂNIO/IPTU',
  'Ã¡ÂGUA': 'Ã¡ÂGUA',
  'MANUTENÃ¡â€¡Ã¡Æ’O': 'MANUTENÃ¡â€¡Ã¡Æ’O',
  'INTERNET': 'INTERNET',
  'GÃ¡ÂS': 'GÃ¡ÂS',
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
    // Agrupar por mÃ¡Âªs e categoria
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
      const nomeCategoria = evento.categoria_id ? categoriasDict[evento.categoria_id] : null;
      let categoriaMapeada = null;
      if (nomeCategoria) {
        categoriaMapeada = MAPEAMENTO_CATEGORIAS[nomeCategoria];
        if (!categoriaMapeada) {
          categoriaMapeada = evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros OperaÃ¡Â§Ã¡Â£o';
        }
      } else {
        const mapeado = mapearCategoria(evento.descricao, evento.tipo === 'receita' ? 'RECEITA' : 'DESPESA', evento.valor);
        categoriaMapeada = MAPEAMENTO_CATEGORIAS[mapeado.categoria_sugerida] || (evento.tipo === 'receita' ? 'Outras Receitas' : 'Outros OperaÃ¡Â§Ã¡Â£o');
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
    // Converter para array e ordenar por ano/mÃ¡Âªs
    const resultado = Object.values(meses).sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });
    return NextResponse.json({ success: true, meses: resultado }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as any).message || String(e) }, { status: 500 });
  }
} 

