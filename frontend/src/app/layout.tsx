import type { Metadata, Viewport } from 'next'
import './globals.css'
import '../styles/assistant.css'
import { ToastProvider, GlobalToastListener } from '@/components/ui/toast'
import { ConfirmDialogProvider, GlobalConfirmListener } from '@/components/ui/confirm-dialog'

// Using system fonts instead of Google Fonts to avoid build connectivity issues

export const metadata: Metadata = {
  title: 'SGB - Sistema de Gestão de Bares',
  description: 'Sistema de Gestão de Bares - Grupo Menos é Mais',
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SGB Dashboard'
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '48x48',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: {
      url: '/apple-touch-icon.png',
      sizes: '180x180',
      type: 'image/png',
    },
    shortcut: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SGB Dashboard" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="font-sans">
        <ToastProvider>
          <ConfirmDialogProvider>
            <div className="min-h-screen">
              {children}
              <GlobalToastListener />
              <GlobalConfirmListener />
            </div>
          </ConfirmDialogProvider>
        </ToastProvider>
{/* Service Worker desabilitado temporariamente para testes */}
        {/*
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('✅ Service Worker registered:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('❌ Service Worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
        */}
      </body>
    </html>
  )
}