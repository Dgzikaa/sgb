'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function DashboardSemanalPage() {
      return (
      <ProtectedRoute requiredModule="dashboard_semanal">
        <EmConstrucao 
        titulo="Dashboard Semanal"
        descricao="AnÃ¡Â¡lise semanal de vendas, comparativos e tendÃ¡Âªncias de crescimento."
        prioridade="alta"
        previsao="1-2 semanas"
      />
    </ProtectedRoute>
  )
} 

