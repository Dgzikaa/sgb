import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visão Mensal | SGB',
  description: 'Indicadores mensais detalhados do seu bar',
};

export default function VisaoMensalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
