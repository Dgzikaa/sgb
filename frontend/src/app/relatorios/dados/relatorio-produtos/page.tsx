'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import RelatorioProdutos from '@/components/relatorios/RelatorioProdutos'

export default function RelatorioProdutosPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_produtos">
      <RelatorioProdutos />
    </ProtectedRoute>
  )
} 
