import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Alexandria } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Agentation } from "agentation";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const alexandria = Alexandria({
  subsets: ["latin"],
  variable: "--font-alexandria",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relie Shopify AI Assistant",
  description: "Relie AI Assistant agent for Shopify store optimization",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        alexandria.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
      {process.env.NODE_ENV === "development" && <Agentation />}
    </html>
  );
}

