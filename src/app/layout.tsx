import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import ThemeToggle from "@/components/theme-toggle";
import Script from "next/script";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
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
      className={`${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
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
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
