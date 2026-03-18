import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Color Dash Blitz',
  description: 'A fast-paced color matching hyper-casual game.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script src="https://yandex.ru/games/sdk/v2" async></script>
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-white">{children}</body>
    </html>
  );
}
