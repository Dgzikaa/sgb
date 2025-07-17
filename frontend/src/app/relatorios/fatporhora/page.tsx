'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function FatPorHoraPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_fatporhora">
      <EmConstrucao 
        titulo="Faturamento por Hora"
        descricao="Análise detalhada do faturamento por períodos horários e identificação de picos de movimento."
        prioridade="media"
        previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
