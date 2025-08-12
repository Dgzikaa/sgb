'use client'

import { useEffect } from 'react'
import { usePageTitle } from '@/contexts/PageTitleContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DarkSidebarLayout } from '@/components/layouts/DarkSidebarLayout'

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
      <DarkSidebarLayout>
        {children}
      </DarkSidebarLayout>
    </ProtectedRoute>
  )
}
