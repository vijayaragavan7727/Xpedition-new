import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XPEDITION — Adaptive Learning',
  description: 'Adaptive learning platform floating over a neon cyberpunk city backdrop.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="/art/hero-left.jpg" as="image" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Kalam:wght@400;700&family=Orbitron:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink text-text selection:bg-violet selection:text-white antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
