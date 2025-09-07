import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WinPrep",
  description: "WinPrep – Futuristic AI mock interviews and prep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.className} antialiased pattern`}>
        <ThemeProvider>
          <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-20 backdrop-blur border-b border-border/50 bg-background/70">
              <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/logo.svg" alt="WinPrep" className="h-6" />
                  <span className="font-semibold">WinPrep</span>
                </div>
                <ThemeToggle />
              </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
