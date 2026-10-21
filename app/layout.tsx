import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Meu Treino",
  description: "Treino pessoal com IA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meu Treino",
  },
};

export const viewport: Viewport = {
  themeColor: "#3B82F6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"}>
            {children}
          </SerwistProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
