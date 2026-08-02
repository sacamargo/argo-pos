import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/modules/shared/hooks/use-theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Argo POS",
  description:
    "Registra una venta en menos de 10 segundos. Inventario en tiempo real. Decisiones con datos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="gris"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='argo-pos-theme';var t=localStorage.getItem(k);if(t==='dark')t='gris';if(t==='light')t='claro';if(t!=='gris'&&t!=='claro'&&t!=='azul')t='gris';document.documentElement.setAttribute('data-theme',t);localStorage.setItem(k,t)}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
