'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function PeriodoPage() {
  return (
    <ProtectedRoute requiredModule="analise_periodo">
      <EmConstrucao 
      titulo="Aná¡lise por Perá­odo"
      descricao="Relatá³rios e aná¡lises detalhadas por perá­odos especá­ficos com comparativos histá³ricos."
      prioridade="media"
      previsao="2-3 semanas"
    />
    </ProtectedRoute>
  )
} 
