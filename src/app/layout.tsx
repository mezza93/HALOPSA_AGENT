import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
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
    default: 'HaloPSA AI - Intelligent IT Service Management',
    template: '%s | HaloPSA AI',
  },
  description:
    'AI-powered assistant for HaloPSA. Manage tickets, clients, and assets using natural language. Built for IT Managed Service Providers.',
  keywords: [
    'HaloPSA',
    'AI',
    'IT Service Management',
    'MSP',
    'Ticketing',
    'Automation',
    'Claude',
    'Anthropic',
  ],
  authors: [{ name: 'HaloPSA AI Team' }],
  creator: 'HaloPSA AI',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'HaloPSA AI',
    title: 'HaloPSA AI - Intelligent IT Service Management',
    description:
      'AI-powered assistant for HaloPSA. Manage tickets, clients, and assets using natural language.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HaloPSA AI - Intelligent IT Service Management',
    description:
      'AI-powered assistant for HaloPSA. Manage tickets, clients, and assets using natural language.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#fcfbf8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          {/* Grainy texture overlay */}
          <div className="grain-overlay" aria-hidden="true" />

          {/* Main content */}
          <div className="relative min-h-screen bg-gradient-mesh">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
