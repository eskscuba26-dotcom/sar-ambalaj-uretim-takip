import React from 'react';
import MainLayout from '@/components/MainLayout';

const Dashboard = ({ user, setUser }) => {
  return (
    <MainLayout user={user} setUser={setUser}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Hoş Geldiniz
          </h2>
          <p className="text-zinc-400">
            Üretim takip sistemine giriş yaptınız. Sol menüden sayfalar arasında gezinebilirsiniz.
          </p>
        </div>

        {/* Ana sayfa içeriği gelecekte buraya eklenecek */}
        <div className="bg-zinc-900/30 border border-zinc-800 border-dashed rounded-xl p-12 flex items-center justify-center">
          <p className="text-zinc-600 text-center">
            Ana sayfa içeriği yakında eklenecek
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;