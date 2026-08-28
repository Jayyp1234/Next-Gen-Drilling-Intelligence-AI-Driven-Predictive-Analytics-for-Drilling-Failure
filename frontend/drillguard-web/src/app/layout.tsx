import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ReplayProvider } from "@/lib/replay/ReplayProvider";
import { AlertBridge } from "@/lib/replay/AlertBridge";
import { IncidentProvider } from "@/lib/incidents/store";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DrillGuard — Drilling Safety Intelligence",
  description: "Real-time drilling data, risk scoring and operational overview",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider>
          <ReplayProvider>
            <AlertBridge />
            <IncidentProvider>{children}</IncidentProvider>
          </ReplayProvider>
        </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
