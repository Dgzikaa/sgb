'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function DashboardFinanceiroMensalPage() {
      return (
      <ProtectedRoute requiredModule="dashboard_financeiro_mensal">
        <EmConstrucao 
        titulo="Dashboard Financeiro Mensal"
        descricao="Análise financeira completa mensal com receitas, despesas e margem de lucro."
        prioridade="alta"
        previsao="2-3 semanas"
      />
    </ProtectedRoute>
  )
} 
