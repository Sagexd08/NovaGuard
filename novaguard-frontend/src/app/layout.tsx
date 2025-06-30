import type { Metadata } from 'next'
import { Inter, Fira_Code } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { WagmiProvider } from '@/components/providers/wagmi-provider'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  variable: '--font-fira-code',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'NovaGuard - Advanced Web3 Smart Contract Auditing Platform',
    template: '%s | NovaGuard',
  },
  description: 'The most advanced, production-grade Web3 smart contract auditing IDE and automation platform with AI-enhanced security analysis, real-time collaboration, and multi-chain deployment.',
  keywords: [
    'smart contract',
    'security audit',
    'blockchain',
    'web3',
    'solidity',
    'vulnerability scanner',
    'defi',
    'ethereum',
    'polygon',
    'arbitrum',
    'optimism',
    'base',
    'ai audit',
    'llm analysis',
  ],
  authors: [{ name: 'NovaGuard Team' }],
  creator: 'NovaGuard',
  publisher: 'NovaGuard',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://novaguard.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'NovaGuard - Advanced Web3 Smart Contract Auditing Platform',
    description: 'The most advanced, production-grade Web3 smart contract auditing IDE and automation platform with AI-enhanced security analysis.',
    siteName: 'NovaGuard',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NovaGuard - Smart Contract Security Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaGuard - Advanced Web3 Smart Contract Auditing Platform',
    description: 'The most advanced, production-grade Web3 smart contract auditing IDE and automation platform.',
    images: ['/og-image.png'],
    creator: '@novaguard',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--background))',
          colorInputBackground: 'hsl(var(--background))',
          colorInputText: 'hsl(var(--foreground))',
          colorText: 'hsl(var(--foreground))',
          colorTextSecondary: 'hsl(var(--muted-foreground))',
          colorSuccess: 'hsl(var(--primary))',
          colorDanger: 'hsl(var(--destructive))',
          colorWarning: 'hsl(var(--muted-foreground))',
          colorNeutral: 'hsl(var(--muted))',
          fontFamily: 'var(--font-inter)',
          borderRadius: '0.5rem',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#0ea5e9" />
          <meta name="color-scheme" content="dark light" />
        </head>
        <body
          className={cn(
            'min-h-screen bg-background font-sans antialiased',
            inter.variable,
            firaCode.variable
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <WagmiProvider>
                <div className="relative flex min-h-screen flex-col">
                  <div className="flex-1">{children}</div>
                </div>
                <Toaster />
              </WagmiProvider>
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
