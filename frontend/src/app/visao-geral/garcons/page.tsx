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
      titulo="Dashboard de Gará§ons"
      descricao="Performance individual dos gará§ons, vendas por atendente e sistema de comissáµes."
      prioridade="media"
      previsao="3-4 semanas"
      />
    </ProtectedRoute>
  )
} 
