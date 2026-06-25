import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Olist Sales Dashboard',
  description: 'E-commerce sales performance dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 text-gray-900">
        <header className="bg-blue-700 text-white px-8 py-4 shadow">
          <h1 className="text-xl font-bold tracking-tight">Olist Sales Dashboard</h1>
          <p className="text-blue-200 text-sm">Brazilian E-Commerce Performance</p>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
