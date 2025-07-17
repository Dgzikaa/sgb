'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function NFsPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_nfs">
      <EmConstrucao 
        titulo="Notas Fiscais Eletrá´nicas"
        descricao="Emissá£o, consulta e gestá£o de notas fiscais eletrá´nicas integradas ao sistema."
        prioridade="baixa"
        previsao="2-3 meses"
      />
    </ProtectedRoute>
  )
} 
