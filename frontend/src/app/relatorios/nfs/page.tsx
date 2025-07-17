'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function NFsPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_nfs">
      <EmConstrucao 
        titulo="Notas Fiscais Eletrônicas"
        descricao="Emissão, consulta e gestão de notas fiscais eletrônicas integradas ao sistema."
        prioridade="baixa"
        previsao="2-3 meses"
      />
    </ProtectedRoute>
  )
} 
