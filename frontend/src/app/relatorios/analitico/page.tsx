'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function AnaliticoPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_analitico">
      <EmConstrucao 
        titulo="Dashboard Analá­tico"
        descricao="Aná¡lises avaná§adas com grá¡ficos, má©tricas de performance e insights detalhados do seu negá³cio."
        prioridade="alta"
        previsao="2-3 semanas"
      />
    </ProtectedRoute>
  )
} 
