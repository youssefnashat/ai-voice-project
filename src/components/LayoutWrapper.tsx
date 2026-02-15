'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import { SessionProvider } from 'next-auth/react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <SessionProvider>
      {!isHomePage && <Navbar />}
      <main className={!isHomePage ? 'pt-16' : ''}>
        {children}
      </main>
    </SessionProvider>
  );
}
