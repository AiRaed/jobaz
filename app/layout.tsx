import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from './client-providers'

const inter = Inter({ subsets: ['latin'] })

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ai-cv-pro.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'JobAZ – CV, Jobs & Interview Training',
  description: 'Create professional CVs and Cover Letters with AI in minutes.',
  keywords: ['CV generator', 'resume builder', 'AI resume', 'ATS optimization', 'cover letter', 'professional CV', 'GPT-4', 'CV maker'],
  authors: [{ name: 'JobAZ' }],
  creator: 'JobAZ',
  publisher: 'JobAZ',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: appUrl,
    siteName: 'JobAZ',
    title: 'JobAZ – CV, Jobs & Interview Training',
    description: 'Create professional CVs and Cover Letters with AI in minutes.',
    images: [
      {
        url: `${appUrl}/og-image`,
        width: 1200,
        height: 630,
        alt: 'JobAZ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JobAZ – CV, Jobs & Interview Training',
    description: 'Create professional CVs and Cover Letters with AI in minutes.',
    images: [`${appUrl}/og-image`],
    creator: '@aicvpro',
    site: '@aicvpro',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'JobAZ – CV, Jobs & Interview Training',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#7C3AED" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
                {/* Google Analytics */}
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-4C7FJMZQFJ"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4C7FJMZQFJ');
            `,
          }}
        />

      </head>
      <body className={`${inter.className} transition-colors duration-300`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
