import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AccountProvider } from "@/lib/account-context";
import { AccountGate } from "@/components/layout/account-gate";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Coverstone Bank",
  description: "Digital banking with built-in fraud detection",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AccountProvider>
          <TooltipProvider>
            <AccountGate>{children}</AccountGate>
            <Toaster position="top-right" />
          </TooltipProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
