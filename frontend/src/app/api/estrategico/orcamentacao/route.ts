import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false }
    });

    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || '8'; // Default agosto
    const ano = '2025';

    console.log(`🔍 Buscando dados NIBO para ${mes}/${ano}`);

    // Buscar dados do NIBO por categoria para o mês específico
    const { data: niboData, error } = await supabase
      .from('nibo_agendamentos')
      .select('categoria_nome, valor')
      .gte('data_competencia', `${ano}-${mes.padStart(2, '0')}-01`)
      .lt('data_competencia', `${ano}-${parseInt(mes) + 1 < 13 ? parseInt(mes) + 1 : 1}-01`)
      .not('categoria_nome', 'is', null);

    if (error) {
      console.error('Erro ao buscar dados NIBO:', error);
      return NextResponse.json({ error: 'Erro ao buscar dados do NIBO' }, { status: 500 });
    }

    console.log(`📊 NIBO: ${niboData?.length || 0} registros encontrados`);

    // Agrupar por categoria e somar valores
    const categoriasAgrupadas: Record<string, number> = {};
    
    niboData?.forEach(item => {
      const categoria = item.categoria_nome.toUpperCase();
      if (!categoriasAgrupadas[categoria]) {
        categoriasAgrupadas[categoria] = 0;
      }
      categoriasAgrupadas[categoria] += Math.abs(Number(item.valor) || 0);
    });

    console.log('📈 Categorias agrupadas:', categoriasAgrupadas);

    // Mapear EXATAMENTE conforme categorias da documentação
    const dadosRealizados = {
      // ===== DESPESAS VARIÁVEIS =====
      'IMPOSTO/TX MAQ/COMISSÃO': 
        (categoriasAgrupadas['IMPOSTOS'] || 0) + 
        (categoriasAgrupadas['TAXAS'] || 0) + 
        (categoriasAgrupadas['COMISSÕES'] || 0) +
        (categoriasAgrupadas['IMPOSTO/TX MAQ/COMISSÃO'] || 0),
      
      // ===== CUSTO INSUMOS (CMV) vs BP =====
      'CMV': categoriasAgrupadas['CMV'] || categoriasAgrupadas['INSUMOS'] || 0,
      
      // ===== MÃO-DE-OBRA =====
      'CUSTO-EMPRESA FUNCIONÁRIOS': categoriasAgrupadas['CUSTO-EMPRESA FUNCIONÁRIOS'] || categoriasAgrupadas['FOLHA DE PAGAMENTO'] || 0,
      'SALÁRIOS': categoriasAgrupadas['SALÁRIOS'] || 0,
      'ALIMENTAÇÃO': categoriasAgrupadas['ALIMENTAÇÃO'] || 0,
      'PROVISÃO TRABALHISTA': categoriasAgrupadas['PROVISÃO TRABALHISTA'] || 0,
      'VALE TRANSPORTE': categoriasAgrupadas['VALE TRANSPORTE'] || 0,
      'ADICIONAIS': categoriasAgrupadas['ADICIONAIS'] || 0,
      'FREELA ATENDIMENTO': categoriasAgrupadas['FREELA ATENDIMENTO'] || 0,
      'FREELA BAR': categoriasAgrupadas['FREELA BAR'] || 0,
      'FREELA COZINHA': categoriasAgrupadas['FREELA COZINHA'] || 0,
      'FREELA LIMPEZA': categoriasAgrupadas['FREELA LIMPEZA'] || 0,
      'FREELA SEGURANÇA': categoriasAgrupadas['FREELA SEGURANÇA'] || 0,
      'PRO LABORE': categoriasAgrupadas['PRO LABORE'] || 0,
      
      // ===== DESPESAS ADMINISTRATIVAS =====
      'Escritório Central': categoriasAgrupadas['ESCRITÓRIO CENTRAL'] || categoriasAgrupadas['ADMINISTRATIVO'] || 0,
      'Administrativo Ordinário': categoriasAgrupadas['ADMINISTRATIVO ORDINÁRIO'] || categoriasAgrupadas['DESPESAS ADMINISTRATIVAS'] || 0,
      
      // ===== DESPESAS COMERCIAIS =====
      'Marketing': categoriasAgrupadas['MARKETING'] || categoriasAgrupadas['PUBLICIDADE'] || 0,
      'Atrações Programação': categoriasAgrupadas['ATRAÇÕES PROGRAMAÇÃO'] || categoriasAgrupadas['ATRAÇÕES'] || categoriasAgrupadas['PROGRAMAÇÃO'] || 0,
      'Produção Eventos': categoriasAgrupadas['PRODUÇÃO EVENTOS'] || categoriasAgrupadas['PRODUÇÃO'] || categoriasAgrupadas['EVENTOS'] || 0,
      
      // ===== DESPESAS OPERACIONAIS =====
      'Estorno': categoriasAgrupadas['ESTORNO'] || categoriasAgrupadas['ESTORNOS'] || 0,
      'Materiais Operação': categoriasAgrupadas['MATERIAIS OPERAÇÃO'] || categoriasAgrupadas['MATERIAIS'] || 0,
      'Equipamentos Operação': categoriasAgrupadas['EQUIPAMENTOS OPERAÇÃO'] || categoriasAgrupadas['EQUIPAMENTOS'] || 0,
      'Materiais de Limpeza e Descartáveis': categoriasAgrupadas['MATERIAIS DE LIMPEZA E DESCARTÁVEIS'] || categoriasAgrupadas['LIMPEZA'] || categoriasAgrupadas['DESCARTÁVEIS'] || 0,
      'Utensílios': categoriasAgrupadas['UTENSÍLIOS'] || 0,
      'Outros Operação': categoriasAgrupadas['OUTROS OPERAÇÃO'] || categoriasAgrupadas['OUTROS'] || 0,
      
      // ===== DESPESAS DE OCUPAÇÃO (CONTAS) =====
      'ALUGUEL/CONDOMÍNIO/IPTU': categoriasAgrupadas['ALUGUEL/CONDOMÍNIO/IPTU'] || categoriasAgrupadas['ALUGUEL'] || categoriasAgrupadas['CONDOMÍNIO'] || categoriasAgrupadas['IPTU'] || 0,
      'ÁGUA': categoriasAgrupadas['ÁGUA'] || 0,
      'GÁS': categoriasAgrupadas['GÁS'] || 0,
      'INTERNET': categoriasAgrupadas['INTERNET'] || categoriasAgrupadas['TELEFONE'] || 0,
      'Manutenção': categoriasAgrupadas['MANUTENÇÃO'] || 0,
      'LUZ': categoriasAgrupadas['LUZ'] || categoriasAgrupadas['ENERGIA ELÉTRICA'] || categoriasAgrupadas['ENERGIA'] || 0,
      
      // ===== NÃO OPERACIONAIS =====
      'CONTRATOS': categoriasAgrupadas['CONTRATOS'] || 0
    };

    console.log('💰 Dados realizados mapeados:', dadosRealizados);

    return NextResponse.json({
      success: true,
      dados: dadosRealizados,
      totalCategorias: Object.keys(categoriasAgrupadas).length,
      mes: parseInt(mes),
      ano: parseInt(ano)
    });

  } catch (error) {
    console.error('Erro geral:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
