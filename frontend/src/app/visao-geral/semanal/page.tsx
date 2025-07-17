'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function DashboardSemanalPage() {
      return (
      <ProtectedRoute requiredModule="dashboard_semanal">
        <EmConstrucao 
        titulo="Dashboard Semanal"
        descricao="Aná¡lise semanal de vendas, comparativos e tendáªncias de crescimento."
        prioridade="alta"
        previsao="1-2 semanas"
      />
    </ProtectedRoute>
  )
} 
