'use client'

import { DarkSidebarLayout } from '@/components/layouts/DarkSidebarLayout'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DarkSidebarLayout>
      {children}
    </DarkSidebarLayout>
  )
} 