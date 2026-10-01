import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-state";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "Ferienhaus",
  description: "Ferienhäuser sammeln, vergleichen und gemeinsam abstimmen",
  icons: { icon: "/icon.svg" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#111518" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-dvh antialiased">
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
