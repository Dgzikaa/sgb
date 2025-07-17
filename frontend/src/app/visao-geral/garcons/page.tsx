'use client'

import { useState, useEffect } from 'react'
import { useBar } from '@/contexts/BarContext'
import { getSupabaseClient } from '@/lib/supabase'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function DashboardGarconsPage() {
  return (
    <ProtectedRoute requiredModule="dashboard_garcons">
      <EmConstrucao 
      titulo="Dashboard de GarÃ§ons"
      descricao="Performance individual dos garÃ§ons, vendas por atendente e sistema de comissÃµes."
      prioridade="media"
      previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
