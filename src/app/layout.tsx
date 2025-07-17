import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Eat Easy - Restaurant Management",
  description: "Modern restaurant management platform with AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
