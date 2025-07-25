'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PageTitleContextType {
  pageTitle: string | null;
  pageDescription: string | null;
  setPageTitle: (title: string | null) => void;
  setPageDescription: (description: string | null) => void;
  setPageInfo: (title: string | null, description?: string | null) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(
  undefined
);

export function PageTitleProvider({ children }: { children: ReactNode }) {
  const [pageTitle, setPageTitle] = useState<string | null>(null);
  const [pageDescription, setPageDescription] = useState<string | null>(null);

  const setPageInfo = (title: string | null, description?: string | null) => {
    setPageTitle(title);
    setPageDescription(description || null);
  };

  return (
    <PageTitleContext.Provider
      value={{
        pageTitle,
        pageDescription,
        setPageTitle,
        setPageDescription,
        setPageInfo,
      }}
    >
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    // Durante SSG/pre-rendering, retornar funções vazias em vez de lançar erro
    return {
      pageTitle: null,
      pageDescription: null,
      setPageTitle: () => {},
      setPageDescription: () => {},
      setPageInfo: () => {},
    };
  }
  return context;
}
