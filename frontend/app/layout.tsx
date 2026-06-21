import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RailGuard AI — Railway Digital Twin",
  description:
    "Predicting Crowd Crises Before They Happen. National Railway Crowd Intelligence & Digital Twin Platform.",
  keywords: [
    "railway",
    "digital twin",
    "crowd intelligence",
    "AI",
    "operations",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050A12] text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
