import { DarkSidebarLayout } from '@/components/layouts';

export default function RelatoriosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DarkSidebarLayout>{children}</DarkSidebarLayout>;
}
