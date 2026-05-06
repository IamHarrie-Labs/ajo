import type { Metadata } from 'next';
import './globals.css';
import '../styles/design-system.css';
import '../styles/landing.css';

export const metadata: Metadata = {
  title: 'Circles — Rotating savings on Solana',
  description: 'Trustless rotating savings circles (ajo / susu / tontine) powered by Solana. Pool USDC with people you trust, onchain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
