'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function PeriodoPage() {
  return (
    <ProtectedRoute requiredModule="analise_periodo">
      <EmConstrucao 
      titulo="Análise por Período"
      descricao="Relatórios e análises detalhadas por períodos específicos com comparativos históricos."
      prioridade="media"
      previsao="2-3 semanas"
    />
    </ProtectedRoute>
  )
} 
