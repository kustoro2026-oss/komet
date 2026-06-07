import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/lib/query-provider";
import { ServiceWorkerRegister } from "@/components/layout/service-worker-register";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Komet — Social Media Scheduling Platform",
  description:
    "Your content blasts to every platform in a flash. A 3-in-1 social media scheduling platform for creators, teams, and developers.",
  manifest: "/manifest.json",
  other: {
    "mobile-web-app-capable": "yes",
  },
  appleWebApp: {
    capable: true,
    title: "Komet",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/komet-icon.svg",
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/komet-icon.svg",
      },
    ],
  },
  openGraph: {
    title: "Komet — Social Media Scheduling Platform",
    description:
      "Your content blasts to every platform in a flash. A 3-in-1 social media scheduling platform for creators, teams, and developers.",
    siteName: "Komet",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} font-body antialiased`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <AuthProvider>
              <QueryProvider>
                <ServiceWorkerRegister />
                {children}
              </QueryProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
