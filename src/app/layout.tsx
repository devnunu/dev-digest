import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevDigest - 개발자 기술 뉴스 큐레이션',
  description: '안드로이드, iOS, Web, Backend 개발자를 위한 기술 뉴스를 AI로 요약하고 한국어로 제공합니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
