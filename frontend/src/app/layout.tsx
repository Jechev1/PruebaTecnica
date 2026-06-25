import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { DarkModeToggle } from '../components/DarkModeToggle';

export const metadata: Metadata = {
  title: 'Analitica para Olist',
  description: 'E-commerce sales performance dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-white transition-colors duration-200">
        <ThemeProvider>
          <header className="bg-slate-900 dark:bg-slate-950 text-white px-8 py-5 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white font-bold text-sm select-none">
                  O
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight leading-none">Olist Analytics</h1>
                  <p className="text-slate-400 text-xs mt-0.5">Brazilian E-Commerce · 2016–2018</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-mono hidden sm:block">LIVE DASHBOARD</span>
                <DarkModeToggle />
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
