'use client'

import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function TempoPage() {
  return (
    <ProtectedRoute requiredModule="relatorios">
      <EmConstrucao 
      titulo="Gestão de Tempo"
      descricao="Análise de tempos de produção, eficiência operacional e otimização de processos."
      prioridade="baixa"
      previsao="1-2 meses"
    />
    </ProtectedRoute>
  )
} 
