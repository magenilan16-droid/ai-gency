import "./globals.css";
import BottomNav from "./components/BottomNav";
import { LanguageProvider } from "./LanguageProvider";
import { AuthProvider } from "./components/AuthProvider";
import Link from "next/link";
import OfflineBanner from "./components/OfflineBanner";

export const metadata = {
  title: "AI-gency — Travel OS",
  description: "Plan trips, manage business travel, and coordinate group adventures — all with AI.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "AI-gency" },
  openGraph: {
    title: "AI-gency — Travel OS",
    description: "AI builds your perfect day-by-day travel itinerary in seconds. Plan trips, track expenses, and explore the world.",
    type: "website",
    siteName: "AI-gency",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "AI-gency Travel Planner" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-gency — Travel OS",
    description: "AI builds your perfect travel itinerary in seconds.",
    images: ["/icons/icon-512.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AI-gency" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body className="font-sans antialiased pb-24 bg-white">
        <OfflineBanner />
        <AuthProvider>
          <LanguageProvider>
            {children}
            <BottomNav />
          </LanguageProvider>
        </AuthProvider>
        <footer className="pb-24 px-6 py-6 flex items-center justify-between max-w-3xl mx-auto border-t border-gray-100">
          <span className="text-[11px] text-gray-400 tracking-wide">© 2025 AI-gency</span>
          <Link href="/legal" className="text-[11px] text-gray-400 hover:text-gray-900 transition-colors tracking-wide">Privacy &amp; Terms</Link>
        </footer>
      </body>
    </html>
  );
}
