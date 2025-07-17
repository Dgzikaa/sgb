'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function TempoPage() {
  return (
    <ProtectedRoute requiredModule="analise_tempo">
      <EmConstrucao 
      titulo="Gestá£o de Tempo"
      descricao="Aná¡lise de tempos de produá§á£o, eficiáªncia operacional e otimizaá§á£o de processos."
      prioridade="baixa"
      previsao="1-2 meses"
    />
    </ProtectedRoute>
  )
} 
