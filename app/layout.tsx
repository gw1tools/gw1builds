import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { createClient } from '@/lib/supabase/server'
import { AuthProvider } from '@/components/providers/auth-provider'
import { AuthModalProvider } from '@/components/auth/auth-modal'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants'
import { buildWarsFont } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Guild Wars',
    'GW1',
    'builds',
    'skills',
    'character builds',
    'professions',
    'gaming',
  ],
  authors: [{ name: 'GW1 Builds Team' }],
  creator: 'GW1 Builds Team',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Fetch session on server - this is fast and uses HTTP-only cookies
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch profile if user exists
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${buildWarsFont.variable}`}
    >
      <body className="antialiased min-h-dvh bg-background font-sans dot-grid-subtle flex flex-col">
        <AuthProvider initialUser={user} initialProfile={profile}>
          <AuthModalProvider>
            <Header />
            <main className="pt-16 flex-1">{children}</main>
            <Footer />
            <Toaster
              position="bottom-right"
              theme="dark"
              toastOptions={{
                style: {
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                },
              }}
            />
          </AuthModalProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
