import "./globals.css";

export const metadata = {
  title: "BorderPay | Multi-Currency Web3 Payment Protocol",
  description: "Next-generation QR & multi-currency cross-border payment gateway powered by Ethereum Sepolia smart contracts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased bg-slate-50">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
