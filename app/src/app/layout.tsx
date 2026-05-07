import type { Metadata } from 'next';
import './globals.css';
import '../styles/design-system.css';
import '../styles/landing.css';

export const metadata: Metadata = {
  title: 'Circles',
  description: 'Trustless rotating savings circles (ajo / susu / tontine) powered by Solana. Pool USDC with people you trust, onchain.',
  icons: {
    // Logo mark: solid circle with green offset dot — matches Logo.tsx
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='19' fill='%231a1a1a'/><circle cx='24' cy='20' r='9' fill='%2322C55E'/></svg>",
  },
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
        {/* Jupiter Terminal — SOL ↔ USDC swap widget */}
        <script src="https://terminal.jup.ag/main-v2.js" data-preload async />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
