import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CartWeave — Alexa+ Echo Show 15 Multimodal MCP Simulator',
  description:
    'Alexa+ Multi-Brand Pantry, Meal-Plan & Grocery Arbitrage Concierge built on MCP 2025-11-25 Streamable HTTP and Amazon Bedrock',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050812',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen bg-canvas text-fg antialiased selection:bg-cyan-500/30 selection:text-cyan-100">
        {children}
      </body>
    </html>
  );
}
