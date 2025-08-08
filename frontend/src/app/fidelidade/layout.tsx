'use client';

import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

interface FidelidadeLayoutProps {
  children: React.ReactNode;
}

export default function FidelidadeLayout({ children }: FidelidadeLayoutProps) {
  return (
    <div className={`${inter.className} min-h-screen`}>
      {children}
    </div>
  );
}
