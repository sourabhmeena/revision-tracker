import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import PWARegister from "../components/PWARegister";
import Providers from "../components/Providers";
import ReminderScheduler from "../components/ReminderScheduler";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Recall Smart — Spaced Repetition Learning",
  description: "Master your learning with scientifically-proven spaced repetition",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Recall Smart",
  },
};

export function generateViewport() {
  return {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#f5f6fc" },
      { media: "(prefers-color-scheme: dark)", color: "#080b18" },
    ],
    // `viewport-fit=cover` lets the page draw under the iOS safe areas
    // and keeps `env(safe-area-inset-*)` stable during URL-bar collapse.
    viewport: "width=device-width, initial-scale=1, maximumScale=1, viewport-fit=cover",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${jakarta.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          <PWARegister />
          <ReminderScheduler />
          <div className="bg-orbs" aria-hidden="true">
            <span className="orb-1" />
            <span className="orb-2" />
            <span className="orb-3" />
          </div>
          <div id="app-root">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
