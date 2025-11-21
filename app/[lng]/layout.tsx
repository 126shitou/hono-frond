import type { Metadata } from "next";
import "../globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { defaultLng, languages, languagesWithFlag } from "@/i18n/setting";

import { LoginDialogProvider } from "@/lib/contexts/login-dialog-context";
import { UserProvider } from "@/lib/contexts/user-context";
import { Toaster } from "@/components/ui/sonner";

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export default async function RootLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ lng: string }>;
  children: React.ReactNode;
}>) {
  const { lng } = await params;


  return (
    <html lang={lng}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />

      </head>
      <body
        className={`antialiased bg-background`}
      >


        <UserProvider >
          <LoginDialogProvider>
            <Header />
            {children}
            {/* <Footer /> */}
          </LoginDialogProvider>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  );
}
