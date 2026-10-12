import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ThemeSync } from '@/lib/theme';
import './globals.css';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  weight: '45 920',
  display: 'swap',
  variable: '--font-pretendard',
});

export const metadata: Metadata = {
  title: '미니 노션',
  description: '나에게 맞춘 개인 업무 기록 공간',
};

// Applies the saved theme before first paint (no light flash). Mirrors lib/theme.ts.
const themeScript = `(function(){try{var t=localStorage.getItem("mini-notion:theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={pretendard.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeSync />
        {children}
      </body>
    </html>
  );
}
