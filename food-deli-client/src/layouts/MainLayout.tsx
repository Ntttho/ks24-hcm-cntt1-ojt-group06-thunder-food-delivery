import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ShopeeStyleChatDrawer } from '@/components/chat/ShopeeStyleChatDrawer';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <Footer />
      <ShopeeStyleChatDrawer />
    </div>
  );
};

export default MainLayout;
