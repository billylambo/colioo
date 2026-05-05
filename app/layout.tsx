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
  title: "COLISMAX - Livraison depuis la Chine",
  description: "Commandez directement depuis les usines chinoises. Livraison en Côte d'Ivoire en 15-21 jours.",
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="COLISMAX" />
        <meta name="theme-color" content="#FF6B00" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <link rel="icon" href="/icon-32.png" sizes="32x32" />
        <link rel="icon" href="/icon-192.png" sizes="192x192" />

        {/* ── GA4 — non bloquant ── */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-VZHWEYHVEM"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-VZHWEYHVEM', {
                page_title: document.title,
                page_location: window.location.href,
              });
            `
          }}
        />

        {/* ── Facebook Pixel + TikTok Pixel — chargés après la page ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                // Facebook Pixel
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '1772392297075686');
                fbq('track', 'PageView');

                // TikTok Pixel
                !function (w, d, t) {
                  w.TiktokAnalyticsObject=t;
                  var ttq=w[t]=w[t]||[];
                  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
                  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                  ttq.load=function(e,n){
                    var r="https://analytics.tiktok.com/i18n/pixel/events.js";
                    ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,
                    ttq._t=ttq._t||{},ttq._t[e]=+new Date,
                    ttq._o=ttq._o||{},ttq._o[e]=n||{};
                    n=document.createElement("script");
                    n.type="text/javascript",n.async=!0,
                    n.src=r+"?sdkid="+e+"&lib="+t;
                    e=document.getElementsByTagName("script")[0];
                    e.parentNode.insertBefore(n,e)
                  };
                  ttq.load('D7RKJJJC77U9UIR3K49G');
                  ttq.page();
                }(window, document, 'ttq');
              });
            `
          }}
        />
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