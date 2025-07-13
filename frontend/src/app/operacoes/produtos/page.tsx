'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function ProdutosPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_produtos">
      <EmConstrucao 
      titulo="Gestão de Produtos"
      descricao="Cadastro, edição e controle de produtos, receitas, custos e margem de lucro."
      prioridade="alta"
      previsao="1 semana"
    />
    </ProtectedRoute>
  )
} 