import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Infline - Lines that connect the world',
  description: '지구 위에 선을 그리고, 그 선 위에 있는 사람들과 연결되세요. 하루 동안 서로의 일상을 공유합니다.',
  keywords: ['infline', 'global connection', 'social', 'map', 'earth', 'lines'],
  authors: [{ name: 'infline' }],
  openGraph: {
    title: 'Infline - Lines that connect the world',
    description: '지구 위에 선을 그리고, 그 선 위에 있는 사람들과 연결되세요.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
