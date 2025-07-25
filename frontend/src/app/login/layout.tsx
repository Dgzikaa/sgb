import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - SGB',
  description: 'Sistema de Gestão de Bares - Grupo Menos é Mais',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
