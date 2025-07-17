'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import EmConstrucao from '@/components/EmConstrucao'

export default function ProdutosPage() {
  return (
    <ProtectedRoute requiredModule="relatorio_produtos">
      <EmConstrucao 
      titulo="Gestá£o de Produtos"
      descricao="Cadastro, ediá§á£o e controle de produtos, receitas, custos e margem de lucro."
      prioridade="alta"
      previsao="1 semana"
    />
    </ProtectedRoute>
  )
} 
