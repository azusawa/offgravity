import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TranslationProvider } from "@/hooks/useTranslation";

/**
 * Life OS Dashboard - 루트 레이아웃 (서버 컴포넌트)
 * 
 * [역할]
 * 1. 폰트(Geist, Geist Mono)를 정의하고 글로벌 CSS 파일을 로드합니다.
 * 2. SEO 최적화를 위해 메타데이터(타이틀 및 설명)를 설정합니다.
 * 3. 클라이언트 단 테마 관리를 수행하는 ThemeProvider를 감싸줍니다.
 */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "offgravity.us - Life OS",
  description: "Google Anti-Gravity 스타일의 미니멀/모던 라이프 OS 대시보드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (!saved) {
                    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <TranslationProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
