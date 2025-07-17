import AuthGuard from '@/components/auth/AuthGuard'

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
} 
