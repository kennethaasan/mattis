import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/query-provider";

export const metadata: Metadata = {
  title: "Mattis Stats",
  description:
    "Modern player and fettmattis tracking for the Mattis card community with real-time leaderboards and beautiful insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn("min-h-screen bg-background font-sans text-foreground antialiased")}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.2),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.35),transparent_60%)]" />
                <SiteHeader />
                <main className="flex-1">{children}</main>
                <SiteFooter />
              </div>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
