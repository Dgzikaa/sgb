import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - SGB',
  description: 'Sistema de Gestá£o de Bares - Grupo Menos á© Mais',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
