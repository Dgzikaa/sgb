import { DarkSidebarLayout } from '@/components/layouts'

export default function MinhaContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <DarkSidebarLayout>
      {children}
    </DarkSidebarLayout>
  )
} 
