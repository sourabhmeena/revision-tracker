import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PWARegister from "../components/PWARegister";
import Providers from "../components/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recall Smart - Spaced Repetition Learning",
  description: "Master your learning with scientifically-proven spaced repetition",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Recall Smart",
  },
};

export function generateViewport() {
  return {
    themeColor: "#0ea5e9",
    viewport: "width=device-width, initial-scale=1, maximumScale=1",
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
      <body
        className={`${inter.variable} antialiased bg-gray-50 dark:bg-gray-900`}
        suppressHydrationWarning
      >
        <Providers>
          <PWARegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
