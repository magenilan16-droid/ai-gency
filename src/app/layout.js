import "./globals.css";
import BottomNav from "./components/BottomNav";
import { LanguageProvider } from "./LanguageProvider";

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
  themeColor: "#f97316",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AI-gency" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#f97316" />
        {/* Travelpayouts verification */}
        <script async src="https://tp-em.com/NTA5NTA0.js?t=509504" data-noptimize="1" data-cfasync="false" />
        <script data-noptimize="1" data-cfasync="false" data-wpfc-render="false" dangerouslySetInnerHTML={{ __html: `(function(){var script=document.createElement("script");script.async=1;script.src='https://tp-em.com/NTA5NTA0.js?t=509504';document.head.appendChild(script);})();` }} />
      </head>
      <body className="font-sans antialiased pb-24" style={{ background: "#FFF8F0" }}>
        <LanguageProvider>
          {children}
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
