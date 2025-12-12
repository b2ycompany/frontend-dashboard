import './globals.css';
import React from 'react';

export const metadata = {
  title: 'LR Monitor — Mission Control',
  description: 'Painel de controle AIOps — monitoração em escala',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased app-gradient">
        <div className="min-h-screen">
          {/* Header (sticky) */}
          <header className="header-panel sticky top-0 z-30 py-4">
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="logo-hero border-neon pulse-cyan" aria-hidden>
                  {/* Coloque logo em /public/logo_lr_monitor.jpeg */}
                  <img src="/logo_lr_monitor.jpeg" alt="LR Monitor" />
                </div>
                <div className="hidden md:block">
                  <h1 className="text-lg font-extrabold text-cyan-300">LR Monitor</h1>
                  <p className="text-xs text-gray-300/80">Plataforma de monitoração — visão executiva</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 border-neon rounded-lg px-3 py-2 bg-gray-900/40">
                  <input aria-label="Buscar" placeholder="Buscar cliente, ticket, host..." className="bg-transparent text-sm placeholder:text-gray-400 focus:outline-none" />
                </div>

                <button className="p-2 rounded-lg border-neon tooltip" data-tip="Notificações (2)" aria-label="Notificações">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#67e8f9" strokeWidth="1.6" xmlns="http://www.w3.org/2000/svg"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"></path></svg>
                </button>

                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full border border-gray-700 bg-gradient-to-br from-cyan-700 to-cyan-500 flex items-center justify-center text-white font-semibold">LA</div>
                </div>
              </div>
            </div>
          </header>

          <main className="pt-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
