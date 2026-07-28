import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'StellarPay Rails',
    template: '%s | StellarPay Rails',
  },
  description:
    'Infrastructure-grade payments on Stellar. Developer-first APIs, real-time settlement, and enterprise-grade compliance.',
  keywords: [
    'Stellar',
    'payments',
    'on-ramps',
    'escrow',
    'subscriptions',
    'webhooks',
    'SDKs',
    'developer APIs',
  ],
  applicationName: 'StellarPay Rails',
  authors: [{ name: 'StellarPay' }],
  creator: 'StellarPay',
  publisher: 'StellarPay',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'StellarPay Rails',
    description:
      'Infrastructure-grade payments on Stellar. Built for developers, trusted by enterprises.',
    url: siteUrl,
    siteName: 'StellarPay Rails',
    images: [
      {
        url: '/next.svg',
        width: 1200,
        height: 630,
        alt: 'StellarPay Rails',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StellarPay Rails',
    description: 'Infrastructure-grade payments on Stellar with developer-first APIs.',
    images: ['/next.svg'],
    creator: '@stellarpay',
    site: '@stellarpay',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
  category: 'technology',
  generator: 'Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
