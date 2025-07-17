import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - SGB',
  description: 'Sistema de GestÃ¡Â£o de Bares - Grupo Menos Ã¡Â© Mais',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 

