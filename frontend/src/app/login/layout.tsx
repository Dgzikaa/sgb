import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - SGB',
  description: 'Sistema de GestÃ£o de Bares - Grupo Menos Ã© Mais',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
