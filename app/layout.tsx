import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Volta · Monteporzio Living · Energy OS',
  description:
    'Modello digitale e simulazione energetica di Monteporzio Living — tre villini a schiera ai Castelli Romani. Volta Design System.',
};

export const viewport: Viewport = {
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body
        className="bg-volta-black text-volta-white antialiased"
        style={{ fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
      >
        {children}
      </body>
    </html>
  );
}
