'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function PlanejamentoPage() {
  return (
    <ProtectedRoute requiredModule="planejamento">
      <EmConstrucao 
      titulo="Planejamento e Metas"
      descricao="Definição de metas, planejamento financeiro e acompanhamento de objetivos."
      prioridade="media"
      previsao="2-3 semanas"
      />
    </ProtectedRoute>
  )
} 