import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif'
});
const sans = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: 'The Ring Vault — Design your dream engagement ring.',
  description:
    "Design every detail of your dream engagement ring and keep it safe in the vault until they're ready to propose — so they buy exactly the right ring.",
  metadataBase: new URL('https://ringvault.co')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <nav className="nav">
          <a className="logotype" href="/">The Ring Vault</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
