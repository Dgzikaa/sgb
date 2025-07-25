'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import EmConstrucao from '@/components/EmConstrucao';

export default function RecorrenciaPage() {
  return (
    <ProtectedRoute requiredModule="recorrencia">
      <EmConstrucao
        titulo="Análise de Recorrência"
        descricao="Análise de clientes recorrentes, frequência de visitas e padrões de consumo."
        prioridade="media"
        previsao="3-4 semanas"
      />
    </ProtectedRoute>
  );
}
