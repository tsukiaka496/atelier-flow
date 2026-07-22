import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atelier Flow",
  description:
    "制作案件・作業・シフト・メモをまとめて管理するアトリエ向けプランナー",
};

const themeInitScript = `(function(){try{var t=JSON.parse(localStorage.getItem("atelier-flow-theme")||"{}");if(t.colorMode==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="atelier-theme-init"
          strategy="beforeInteractive"
        >
          {themeInitScript}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
