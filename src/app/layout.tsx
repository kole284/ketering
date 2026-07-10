import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { InitialSiteLoader } from "@/components/loading/initial-site-loader";
import ThemeToggle from "@/components/theme-toggle";
import Script from "next/script";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KeteringGo | Poručivanje keteringa",
  description: "Frontend demo za poručivanje keteringa inspirisan Glovo iskustvom.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sr"
      className={`${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => {
            try {
              const storageKey = 'keteringgo-theme';
              const savedTheme = window.localStorage.getItem(storageKey);
              const theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'light';
              const root = document.documentElement;
              root.classList.toggle('theme-dark', theme === 'dark');
              root.style.colorScheme = theme;
            } catch (error) {
              document.documentElement.style.colorScheme = 'light';
            }
          })();`}
        </Script>
        <Script id="intro-init" strategy="beforeInteractive">
          {`(() => {
            try {
              if (window.sessionStorage.getItem('catering-intro-seen') === 'true') {
                document.documentElement.dataset.introSeen = 'true';
              }
            } catch (error) {}
          })();`}
        </Script>
        <noscript>
          <style>{`#initial-site-loader{display:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-full flex flex-col">
        <InitialSiteLoader />
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
