// =====================================================
// �� SISTEMA DE SCORING DE CHECKLISTS
// =====================================================
// Funções para calcular e exibir scores de checklists

export function obterCorCategoria(categoria: string): string {
  switch (categoria) {
    case 'excelente':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
    case 'bom':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    case 'atencao':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
    case 'critico':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
}

export function obterIconeCategoria(categoria: string): string {
  switch (categoria) {
    case 'excelente':
      return '🏆';
    case 'bom':
      return '✅';
    case 'atencao':
      return '⚠️';
    case 'critico':
      return '🚨';
    default:
      return '📊';
  }
}

export function calcularScore(
  totalItens: number,
  itensOk: number,
  itensProblema: number
): number {
  if (totalItens === 0) return 0;

  const itensRespondidos = itensOk + itensProblema;
  const scoreBase = (itensOk / totalItens) * 100;

  // Penalidade por problemas
  const penalidade = (itensProblema / totalItens) * 20;

  return Math.max(0, Math.round(scoreBase - penalidade));
}

export function determinarCategoria(
  score: number
): 'excelente' | 'bom' | 'atencao' | 'critico' {
  if (score >= 90) return 'excelente';
  if (score >= 70) return 'bom';
  if (score >= 50) return 'atencao';
  return 'critico';
}

export function analisarProblemas(
  itens: Array<{
    titulo: string;
    secao: string;
    status: string;
    obrigatorio: boolean;
    impacto?: 'alto' | 'medio' | 'baixo';
  }>
): Array<{
  titulo: string;
  secao: string;
  tipo_problema: string;
  descricao: string;
  impacto: 'alto' | 'medio' | 'baixo';
  requer_acao: boolean;
}> {
  const problemas: Array<{
    titulo: string;
    secao: string;
    tipo_problema: string;
    descricao: string;
    impacto: 'alto' | 'medio' | 'baixo';
    requer_acao: boolean;
  }> = [];

  itens.forEach(item => {
    if (item.status === 'problema' || item.status === 'nao_ok') {
      const impacto = item.impacto || (item.obrigatorio ? 'alto' : 'medio');
      const requerAcao = item.obrigatorio || impacto === 'alto';

      problemas.push({
        titulo: item.titulo,
        secao: item.secao,
        tipo_problema: item.status,
        descricao: `Item com status "${item.status}"${item.obrigatorio ? ' (obrigatório)' : ''}`,
        impacto,
        requer_acao: requerAcao,
      });
    }
  });

  return problemas;
}

export function gerarRecomendacoes(
  score: number,
  problemas: Array<{ impacto: 'alto' | 'medio' | 'baixo' }>,
  categoria: string
): string[] {
  const recomendacoes: string[] = [];

  if (score < 70) {
    recomendacoes.push('Priorize a correção dos itens obrigatórios');
  }

  const problemasAltos = problemas.filter(p => p.impacto === 'alto').length;
  if (problemasAltos > 0) {
    recomendacoes.push(
      `Resolva os ${problemasAltos} problema(s) de alto impacto`
    );
  }

  if (categoria === 'critico') {
    recomendacoes.push('Revisão completa do checklist recomendada');
  }

  if (recomendacoes.length === 0) {
    recomendacoes.push('Continue mantendo os padrões atuais');
  }

  return recomendacoes;
}
