import { DarkSidebarLayout } from '@/components/layouts';

export default function ChecklistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DarkSidebarLayout>{children}</DarkSidebarLayout>;
}
