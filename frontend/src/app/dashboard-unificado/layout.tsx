import { DarkSidebarLayout } from '@/components/layouts/DarkSidebarLayout'

export default function DashboardUnificadoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DarkSidebarLayout>
      {children}
    </DarkSidebarLayout>
  )
} 
