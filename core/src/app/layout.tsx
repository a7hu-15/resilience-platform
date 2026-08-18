import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import NextAuthProvider from "../components/NextAuthProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resilience Cloud",
  description: "Enterprise Cloud Native Reliability Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
