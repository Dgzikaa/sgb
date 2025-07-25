'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import EmConstrucao from '@/components/EmConstrucao';

export default function DashboardGarconsPage() {
  return (
    <ProtectedRoute requiredModule="dashboard_garcons">
      <EmConstrucao
        titulo="Dashboard de Garçons"
        descricao="Performance individual dos garçons, vendas por atendente e sistema de comissões."
        prioridade="media"
        previsao="3-4 semanas"
      />
    </ProtectedRoute>
  );
}
