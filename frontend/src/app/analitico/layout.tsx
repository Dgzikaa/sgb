'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/components/layouts/MainLayout'

export default function AnaliticoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setPageTitle } = usePageTitle()

  useEffect(() => {
    setPageTitle('📊 Analítico')
    return () => setPageTitle('')
  }, [setPageTitle])

  return (
    <ProtectedRoute requiredRole="admin">
      <MainLayout>
        {children}
      </MainLayout>
    </ProtectedRoute>
  )
}
