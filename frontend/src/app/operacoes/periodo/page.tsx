'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import EmConstrucao from '@/components/EmConstrucao';

export default function PeriodoPage() {
  return (
    <ProtectedRoute requiredModule="operacoes">
      <EmConstrucao
        titulo="Análise por Período"
        descricao="Relatórios e análises detalhadas por períodos específicos com comparativos históricos."
        prioridade="media"
        previsao="2-3 semanas"
      />
    </ProtectedRoute>
  );
}
