import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// ✅ Reduced font weights from 6 to 2 (400 & 700) - saves ~60KB
// Only load what's actually used in the design
const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'O2 ERP Payroll System',
  description: 'نظام إدارة رواتب وموارد بشرية - O2 Restaurant',
  keywords: ['payroll', 'HR', 'ERP', 'O2', 'restaurant'],
}

export const viewport: Viewport = {
  themeColor: '#00AEC7',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="bg-background">
      <body className={`${cairo.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors dir="rtl" />
        </ThemeProvider>
      </body>
    </html>
  )
}
