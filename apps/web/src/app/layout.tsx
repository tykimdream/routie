import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const pretendard = localFont({
  src: [
    {
      path: '../fonts/PretendardVariable.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-pretendard',
  display: 'swap',
  fallback: ['Inter', 'system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: {
    default: 'Routie — 스마트 여행 경로 플래너',
    template: '%s | Routie',
  },
  description:
    '가고 싶은 곳은 많은데 어디부터 갈지 고민되시죠? Routie가 최적의 여행 경로를 찾아드립니다.',
  keywords: ['여행', '경로 최적화', '여행 플래너', 'travel', 'route planner'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF6B3D',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${pretendard.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
