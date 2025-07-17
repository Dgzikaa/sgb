'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function RecorrenciaPage() {
  return (
    <ProtectedRoute requiredModule="recorrencia">
      <EmConstrucao 
      titulo="Aná¡lise de Recorráªncia"
      descricao="Aná¡lise de clientes recorrentes, frequáªncia de visitas e padráµes de consumo."
      prioridade="media"
      previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
