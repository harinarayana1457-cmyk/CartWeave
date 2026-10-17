import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CartWeave — Alexa+ Echo Show 15 Multimodal MCP Simulator',
  description:
    'Alexa+ Multi-Brand Pantry, Meal-Plan & Grocery Arbitrage Concierge built on MCP 2025-11-25 Streamable HTTP and Amazon Bedrock',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050811] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
