import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "COLIOO - Marketplace Ivoirienne",
  description: "Import & Livraison Domicile - Produits importés de Chine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icon-180.png" />
<meta name="theme-color" content="#FF6B00" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="COLIOO" />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: '#F2F2F7', margin: 0, padding: 0, overflowX: 'hidden' }}
      >
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var s = JSON.parse(localStorage.getItem('colioo_settings') || '{}');
                  if (s.bgColor) document.body.style.backgroundColor = s.bgColor;
                } catch(e) {}
              })();
            `
          }}
        />
        <div style={{
          maxWidth: 480,
          margin: '0 auto',
          width: '100%',
          minHeight: '100dvh',
          background: '#F2F2F7',
          position: 'relative',
          overflowX: 'hidden',
        }}>
          {children}
        </div>
      </body>
    </html>
  );
}