import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'NovaGuard - Smart Contract Security Auditing IDE',
  description: 'AI-powered Web3 smart contract auditing platform with real-time collaboration and multi-chain deployment.',
  keywords: ['smart contract', 'security', 'audit', 'blockchain', 'web3', 'solidity', 'ethereum'],
  authors: [{ name: 'NovaGuard Team' }],
  creator: 'NovaGuard',
  publisher: 'NovaGuard',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://novaguard.app'),
  openGraph: {
    title: 'NovaGuard - Smart Contract Security Auditing IDE',
    description: 'AI-powered Web3 smart contract auditing platform with real-time collaboration and multi-chain deployment.',
    url: 'https://novaguard.app',
    siteName: 'NovaGuard',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NovaGuard - Smart Contract Security Auditing IDE',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaGuard - Smart Contract Security Auditing IDE',
    description: 'AI-powered Web3 smart contract auditing platform with real-time collaboration and multi-chain deployment.',
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
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
