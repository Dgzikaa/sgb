import { DarkSidebarLayout } from '@/components/layouts/DarkSidebarLayout';

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DarkSidebarLayout>{children}</DarkSidebarLayout>;
}
