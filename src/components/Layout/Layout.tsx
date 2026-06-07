import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLiveStore } from '@/store/useLiveStore';

const Layout = () => {
  const { initStore } = useLiveStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  return (
    <div className="min-h-screen bg-background text-slate-200">
      <Sidebar />
      <div className="ml-60">
        <Header />
        <main className="p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
