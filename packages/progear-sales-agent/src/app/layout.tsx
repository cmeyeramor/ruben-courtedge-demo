import type { Metadata } from 'next';
import { Montserrat, Lato } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

// Montserrat drives headings/titles (medium+semibold); Lato drives body copy.
// Both exposed as CSS variables so Tailwind's font-display/font-sans utilities
// can reference them anywhere in the tree.
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-montserrat',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
});

export const metadata: Metadata = {
  title: 'AI PRO SALES',
  description: 'AI Powered Sales Equipment',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${lato.className} ${montserrat.variable} ${lato.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
