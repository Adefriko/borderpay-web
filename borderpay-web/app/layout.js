import { ToastProvider } from "../components/ToastContext";
import "./globals.css";

export const metadata = {
  title: "BorderPay | Multi-Currency Web3 Payment Protocol",
  description:
    "Next-generation QR & multi-currency cross-border payment gateway powered by Ethereum Sepolia smart contracts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F3F7FC] text-[#0B192C] selection:bg-blue-600/20 selection:text-blue-900">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
