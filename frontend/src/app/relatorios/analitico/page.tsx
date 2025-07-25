'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import EmConstrucao from '@/components/EmConstrucao';

export default function AnaliticoPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_analitico">
      <EmConstrucao
        titulo="Dashboard Analítico"
        descricao="Análises avançadas com gráficos, métricas de performance e insights detalhados do seu negócio."
        prioridade="alta"
        previsao="2-3 semanas"
      />
    </ProtectedRoute>
  );
}
