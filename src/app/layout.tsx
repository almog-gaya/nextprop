import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppStateProvider } from '@/contexts/AppStateContext';
import { NotificationProvider } from '@/components/ui/NotificationSystem';
import { ModalProvider } from '@/components/ui/ModalManager';
import Script from 'next/script';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "NextProp AI",
  description: "Real Estate CRM",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script id="prevent-class-injection" strategy="beforeInteractive">
          {`
            document.addEventListener('DOMContentLoaded', function() {
              const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                  if (mutation.attributeName === 'class') {
                    const element = mutation.target;
                    if (element.tagName === 'HTML' && element.classList.contains('entry')) {
                      element.classList.remove('entry');
                    }
                    if (element.tagName === 'BODY' && element.classList.contains('entry-content')) {
                      element.classList.remove('entry-content');
                    }
                    if (element.tagName === 'BODY' && element.hasAttribute('lang')) {
                      element.removeAttribute('lang');
                    }
                  }
                });
              });
              
              observer.observe(document.documentElement, { attributes: true });
              observer.observe(document.body, { attributes: true });
            });
          `}
        </Script>
      </head>
      <body className={inter.className + ' ' + inter.variable}>
        <AuthProvider>
          <AppStateProvider>
            <NotificationProvider>
              <ModalProvider>
                <div className="min-h-screen bg-gray-50">
                  {children}
                </div>
              </ModalProvider>
            </NotificationProvider>
          </AppStateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
