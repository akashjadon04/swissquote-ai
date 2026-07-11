import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { Toaster } from 'sonner';

import '@/styles/globals.css';
import '@/styles/clay.css';
import '@/styles/animations.css';
import '@/styles/pages.css';
import '@/styles/wizard.css';
import '@/styles/quotes-list.css';
import '@/styles/catalogue.css';
import '@/styles/command-palette.css';
import '@/styles/quote-detail.css';
import '@/styles/buttons.css';
import '@/styles/toggle.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SwissQuote AI — Devis Intelligents',
    template: '%s | SwissQuote AI',
  },
  description:
    'Plateforme IA de création de devis pour les entreprises de plomberie suisses. Rapide, précis, professionnel.',
  applicationName: 'SwissQuote AI',
  keywords: ['devis', 'plomberie', 'sanitaire', 'suisse', 'IA', 'swissquote'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SwissQuote AI',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F7F5' },
    { media: '(prefers-color-scheme: dark)', color: '#111110' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      translate="no"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {/* Global overlays — available everywhere */}
          <CommandPalette />
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: 'var(--font-inter, Inter, sans-serif)',
                fontSize: '14px',
                borderRadius: '12px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
