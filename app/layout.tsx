import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

export const viewport: Viewport = {
  themeColor: "#121212",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, 
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Saeshify",
  description: "Spotify for Saesha",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Saeshify",
  },
  openGraph: {
    title: "Saeshify",
    description: "Spotify for Saesha",
    images: [
      {
        url: "/saeshify-banner.png",
        width: 1200,
        height: 630,
        alt: "Saeshify",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/saeshify-banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className="font-sans antialiased bg-background text-foreground selection:bg-accent selection:text-black overflow-x-hidden">
        <ClientLayout>
          {children}
        </ClientLayout>
        <Script src="https://anipotts.com/brand/header.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
